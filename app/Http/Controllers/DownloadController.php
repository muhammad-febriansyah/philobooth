<?php

namespace App\Http\Controllers;

use App\Models\PhotoSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class DownloadController extends Controller
{
    /**
     * Public download landing page (akses lewat QR scan dari kiosk).
     *
     * Returns a gallery of items: composite strip + stop-motion GIF + each
     * individual captured photo. Frontend renders them as a carousel.
     */
    public function show(string $token): Response|RedirectResponse
    {
        $session = $this->resolveSession($token);

        if (! $session) {
            return Inertia::render('download/invalid', [
                'reason' => 'expired',
            ]);
        }

        $session->loadMissing(['branch:id,name', 'photos']);

        $items = $this->buildItems($session);

        return Inertia::render('download/show', [
            'session' => [
                'session_code' => $session->session_code,
                'branch' => $session->branch?->name,
                'completed_at' => $session->completed_at?->toIso8601String(),
                'download_expires_at' => $session->download_expires_at?->toIso8601String(),
                'download_count' => (int) $session->download_count,
            ],
            'items' => $items,
            'download_url' => route('download.file', $token),
            'zip_url' => route('download.zip', $token),
        ]);
    }

    /**
     * Stream a single file. `?kind=composite|gif|photo` selects which one;
     * `?slot=N` picks the photo by slot_number when kind=photo.
     */
    public function file(Request $request, string $token): StreamedResponse|BinaryFileResponse|RedirectResponse
    {
        $session = $this->resolveSession($token);

        if (! $session) {
            abort(404, 'Link sudah kedaluwarsa.');
        }

        $kind = $request->string('kind', 'composite')->toString();

        $session->increment('download_count');

        return match ($kind) {
            'gif' => $this->downloadGif($session),
            'video' => $this->downloadVideo($session),
            'photo' => $this->downloadPhoto($session, (int) $request->integer('slot')),
            default => $this->downloadComposite($session),
        };
    }

    /**
     * Stream a ZIP archive containing every available file in the session.
     */
    public function zip(string $token): BinaryFileResponse|RedirectResponse
    {
        $session = $this->resolveSession($token);

        if (! $session) {
            abort(404, 'Link sudah kedaluwarsa.');
        }

        $session->loadMissing('photos');
        $disk = Storage::disk('public');

        $tmp = tempnam(sys_get_temp_dir(), 'pb-zip-');
        $zip = new ZipArchive;

        if ($zip->open($tmp, ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Gagal membuat arsip.');
        }

        $folder = $session->session_code.'/';

        if ($session->final_image_path && $disk->exists($session->final_image_path)) {
            $zip->addFile($disk->path($session->final_image_path), $folder.'composite.png');
        }

        if ($session->gif_path && $disk->exists($session->gif_path)) {
            $zip->addFile($disk->path($session->gif_path), $folder.'stop-motion.gif');
        }

        if ($session->video_path && $disk->exists($session->video_path)) {
            $ext = pathinfo($session->video_path, PATHINFO_EXTENSION) ?: 'webm';
            $zip->addFile($disk->path($session->video_path), $folder.'boomerang.'.$ext);
        }

        foreach ($session->photos->sortBy('slot_number') as $photo) {
            $path = $photo->edited_path ?: $photo->original_path;

            if ($path && $disk->exists($path)) {
                $ext = pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg';
                $zip->addFile($disk->path($path), $folder."foto-{$photo->slot_number}.{$ext}");
            }
        }

        $zip->close();

        $session->increment('download_count');

        return response()
            ->download($tmp, $session->session_code.'.zip', [
                'Content-Type' => 'application/zip',
            ])
            ->deleteFileAfterSend();
    }

    /**
     * Build the gallery item list rendered by the frontend carousel.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildItems(PhotoSession $session): array
    {
        $disk = Storage::disk('public');
        $items = [];

        if ($session->final_image_path && $disk->exists($session->final_image_path)) {
            $items[] = [
                'kind' => 'composite',
                'label' => 'Foto Strip',
                'url' => Storage::url($session->final_image_path),
                'download' => route('download.file', $session->download_token).'?kind=composite',
            ];
        }

        if ($session->video_path && $disk->exists($session->video_path)) {
            $items[] = [
                'kind' => 'video',
                'label' => 'Boomerang',
                'url' => Storage::url($session->video_path),
                'download' => route('download.file', $session->download_token).'?kind=video',
            ];
        }

        if ($session->gif_path && $disk->exists($session->gif_path)) {
            $items[] = [
                'kind' => 'gif',
                'label' => 'Stop Motion',
                'url' => Storage::url($session->gif_path),
                'download' => route('download.file', $session->download_token).'?kind=gif',
            ];
        }

        foreach ($session->photos->sortBy('slot_number') as $photo) {
            $path = $photo->edited_path ?: $photo->original_path;

            if (! $path || ! $disk->exists($path)) {
                continue;
            }

            $items[] = [
                'kind' => 'photo',
                'label' => 'Foto '.$photo->slot_number,
                'slot_number' => (int) $photo->slot_number,
                'url' => Storage::url($path),
                'download' => route('download.file', $session->download_token).'?kind=photo&slot='.$photo->slot_number,
            ];
        }

        return $items;
    }

    private function downloadComposite(PhotoSession $session): StreamedResponse
    {
        if (! $session->final_image_path || ! Storage::disk('public')->exists($session->final_image_path)) {
            abort(404, 'Foto strip belum tersedia.');
        }

        return Storage::disk('public')->download($session->final_image_path, $session->session_code.'.png');
    }

    private function downloadGif(PhotoSession $session): StreamedResponse
    {
        if (! $session->gif_path || ! Storage::disk('public')->exists($session->gif_path)) {
            abort(404, 'Video stop motion belum tersedia.');
        }

        return Storage::disk('public')->download($session->gif_path, $session->session_code.'.gif');
    }

    private function downloadVideo(PhotoSession $session): StreamedResponse
    {
        if (! $session->video_path || ! Storage::disk('public')->exists($session->video_path)) {
            abort(404, 'Video belum tersedia.');
        }

        $ext = pathinfo($session->video_path, PATHINFO_EXTENSION) ?: 'webm';

        return Storage::disk('public')->download(
            $session->video_path,
            $session->session_code.'.'.$ext,
        );
    }

    private function downloadPhoto(PhotoSession $session, int $slot): StreamedResponse
    {
        $photo = $session->photos()->where('slot_number', $slot)->first();

        if (! $photo) {
            abort(404, 'Foto tidak ditemukan.');
        }

        $path = $photo->edited_path ?: $photo->original_path;

        if (! $path || ! Storage::disk('public')->exists($path)) {
            abort(404, 'File foto tidak ditemukan.');
        }

        $ext = pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg';

        return Storage::disk('public')->download(
            $path,
            $session->session_code.'-foto-'.$slot.'.'.$ext,
        );
    }

    private function resolveSession(string $token): ?PhotoSession
    {
        // Public QR download — bypass BelongsToBranch scope in case a logged-in
        // operator from a different branch opens the link.
        $session = PhotoSession::withoutGlobalScopes()
            ->where('download_token', $token)
            ->first();

        if (! $session) {
            return null;
        }

        if ($session->download_expires_at && $session->download_expires_at->isPast()) {
            return null;
        }

        return $session;
    }
}
