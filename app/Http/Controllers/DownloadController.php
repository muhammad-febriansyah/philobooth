<?php

namespace App\Http\Controllers;

use App\Models\PhotoSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DownloadController extends Controller
{
    /**
     * Public download landing page (akses lewat QR scan dari kiosk).
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

        return Inertia::render('download/show', [
            'session' => [
                'session_code' => $session->session_code,
                'branch' => $session->branch?->name,
                'final_url' => $session->final_image_url ?? (
                    $session->final_image_path && Storage::disk('public')->exists($session->final_image_path)
                        ? Storage::url($session->final_image_path)
                        : null
                ),
                'photos' => $session->photos->map(fn ($p) => [
                    'slot_number' => $p->slot_number,
                    'url' => Storage::disk('public')->exists($p->original_path)
                        ? Storage::url($p->original_path)
                        : null,
                ])->values(),
                'completed_at' => $session->completed_at?->toIso8601String(),
                'download_expires_at' => $session->download_expires_at?->toIso8601String(),
                'download_count' => (int) $session->download_count,
            ],
            'download_url' => route('download.file', $token),
        ]);
    }

    /**
     * Stream final composite sebagai download file. Increment counter.
     */
    public function file(Request $request, string $token): StreamedResponse|RedirectResponse
    {
        $session = $this->resolveSession($token);

        if (! $session || ! $session->final_image_path || ! Storage::disk('public')->exists($session->final_image_path)) {
            abort(404, 'File tidak ditemukan atau link sudah kedaluwarsa.');
        }

        $session->increment('download_count');

        $filename = $session->session_code.'.png';

        return Storage::disk('public')->download($session->final_image_path, $filename);
    }

    private function resolveSession(string $token): ?PhotoSession
    {
        $session = PhotoSession::where('download_token', $token)->first();

        if (! $session) {
            return null;
        }

        if ($session->download_expires_at && $session->download_expires_at->isPast()) {
            return null;
        }

        return $session;
    }
}
