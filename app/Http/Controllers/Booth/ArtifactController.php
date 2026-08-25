<?php

namespace App\Http\Controllers\Booth;

use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Http\Controllers\Controller;
use App\Models\BoothDevice;
use App\Models\PhotoSession;
use App\Models\SessionPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class ArtifactController extends Controller
{
    public function store(Request $request, int $photoSessionId): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = $this->sessionForDevice($device, $photoSessionId);
        $this->assertMayUpload($session);

        $request->validate([
            'final_image' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:20480'],
            'photos' => ['sometimes', 'array', 'max:40'],
            'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:10240'],
            'gif' => ['sometimes', 'file', 'mimes:gif', 'mimetypes:image/gif', 'max:20480'],
            'video' => ['sometimes', 'file', 'mimes:webm,mp4', 'mimetypes:video/webm,video/mp4', 'max:51200'],
        ]);

        $diskName = 'local';
        $directory = 'booth-artifacts/'.$device->device_uuid.'/'.$session->session_code;
        $finalExtension = $request->file('final_image')->getMimeType() === 'image/png' ? 'png' : 'jpg';
        $finalPath = $request->file('final_image')->storeAs(
            $directory,
            $session->session_code.'-final-'.Str::random(12).'.'.$finalExtension,
            $diskName,
        );
        $gifPath = $request->hasFile('gif')
            ? $request->file('gif')->storeAs(
                $directory,
                $session->session_code.'-animation-'.Str::random(12).'.gif',
                $diskName,
            )
            : (($session->artifact_disk ?: 'public') === $diskName ? $session->gif_path : null);
        $videoPath = $request->hasFile('video')
            ? $request->file('video')->storeAs(
                $directory,
                $session->session_code.'-video-'.Str::random(12).'.'.($request->file('video')->getMimeType() === 'video/mp4' ? 'mp4' : 'webm'),
                $diskName,
            )
            : (($session->artifact_disk ?: 'public') === $diskName ? $session->video_path : null);

        $newPhotoPaths = [];

        foreach ($request->file('photos', []) as $index => $photo) {
            $extension = $photo->getMimeType() === 'image/png' ? 'png' : 'jpg';
            $newPhotoPaths[] = $photo->storeAs(
                $directory,
                $session->session_code.'-source-'.($index + 1).'-'.Str::random(8).'.'.$extension,
                $diskName,
            );
        }

        $uploadedPaths = array_values(array_filter([
            $finalPath,
            $request->hasFile('gif') ? $gifPath : null,
            $request->hasFile('video') ? $videoPath : null,
            ...$newPhotoPaths,
        ]));

        try {
            $oldFiles = DB::transaction(function () use (
                $session,
                $finalPath,
                $gifPath,
                $videoPath,
                $newPhotoPaths,
                $diskName,
                $request,
            ): array {
                $lockedSession = PhotoSession::withoutGlobalScopes()
                    ->lockForUpdate()
                    ->findOrFail($session->id);
                $this->assertMayUpload($lockedSession);
                $oldDisk = $lockedSession->artifact_disk ?: 'public';
                $oldPaths = $newPhotoPaths !== []
                    ? $lockedSession->photos()->pluck('original_path')->all()
                    : [];
                $oldPaths = array_merge($oldPaths, array_filter([
                    $lockedSession->final_image_path,
                    $request->hasFile('gif') ? $lockedSession->gif_path : null,
                    $request->hasFile('video') ? $lockedSession->video_path : null,
                ]));

                if ($newPhotoPaths !== []) {
                    $lockedSession->photos()->delete();

                    foreach ($newPhotoPaths as $index => $path) {
                        SessionPhoto::create([
                            'session_id' => $lockedSession->id,
                            'slot_number' => $index + 1,
                            'original_path' => $path,
                            'is_selected' => true,
                            'captured_at' => now(),
                        ]);
                    }
                }

                $lockedSession->update([
                    'final_image_path' => $finalPath,
                    'final_image_url' => route('booth.v1.sessions.artifacts.download', $lockedSession->id),
                    'artifact_disk' => $diskName,
                    'gif_path' => $gifPath,
                    'video_path' => $videoPath,
                    'download_token' => $lockedSession->download_token ?: Str::random(64),
                    'download_expires_at' => now()->addDays(7),
                    'status' => SessionStatus::Editing,
                    'current_step' => SessionStep::Print,
                ]);

                return ['disk' => $oldDisk, 'paths' => $oldPaths];
            });
        } catch (Throwable $exception) {
            Storage::disk($diskName)->delete($uploadedPaths);

            throw $exception;
        }

        Storage::disk($oldFiles['disk'])->delete($oldFiles['paths']);
        $session->refresh();

        return response()->json([
            'session_id' => $session->id,
            'status' => $session->fresh()->status?->value,
            'final_image_url' => route('booth.v1.sessions.artifacts.download', $session->id),
            'gif_available' => $gifPath !== null,
            'video_available' => $videoPath !== null,
            'photos_count' => $newPhotoPaths !== [] ? count($newPhotoPaths) : $session->photos()->count(),
            'customer_download_url' => url('/d/'.$session->download_token),
            'download_expires_at' => $session->download_expires_at?->toISOString(),
        ], 201);
    }

    public function download(Request $request, int $photoSessionId): BinaryFileResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = $this->sessionForDevice($device, $photoSessionId);
        abort_unless(
            $session->final_image_path
                && Storage::disk($session->artifact_disk)->exists($session->final_image_path),
            404,
        );

        return response()->download(
            Storage::disk($session->artifact_disk)->path($session->final_image_path),
            $session->session_code.'-final.'.pathinfo($session->final_image_path, PATHINFO_EXTENSION),
        );
    }

    private function assertMayUpload(PhotoSession $session): void
    {
        abort_unless(
            $session->payments()
                ->where('purpose', 'base')
                ->where('status', PaymentStatus::Success)
                ->exists(),
            403,
            'Pembayaran dasar belum tervalidasi.',
        );
        abort_if(
            (float) $session->extra_amount > 0
                && ! $session->payments()
                    ->where('purpose', 'extra_print')
                    ->where('billing_revision', $session->billing_revision)
                    ->where('amount', $session->extra_amount)
                    ->where('status', PaymentStatus::Success)
                    ->exists(),
            403,
            'Pembayaran tambahan belum tervalidasi.',
        );
        abort_if(
            in_array($session->status, [
                SessionStatus::Printing,
                SessionStatus::Completed,
                SessionStatus::Expired,
                SessionStatus::Cancelled,
            ], true),
            409,
            'Artefak tidak dapat diunggah pada status sesi saat ini.',
        );
    }

    private function sessionForDevice(BoothDevice $device, int $sessionId): PhotoSession
    {
        return PhotoSession::withoutGlobalScopes()
            ->where('booth_device_id', $device->id)
            ->findOrFail($sessionId);
    }
}
