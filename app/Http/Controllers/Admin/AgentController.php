<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves the complete kiosk app for operators to install on the booth PC.
 *
 * The download is split in two so a booth's flaky connection can't produce a
 * half-written exe (Windows reports a truncated PE as "This app can't run on
 * your PC", which reads to an operator as a broken app):
 *
 * - The **installer** is a few MB and is streamed through PHP from the private
 *   `local` disk, so the admin/cabang gate on the route still applies. See
 *   {@see self::INSTALLER_PATH}.
 * - The **payload** is the ~180 MB single-file agent exe, which PHP never
 *   touches. The installer downloads it itself, with a progress bar, its own
 *   retries, and a SHA-256 check so a truncated payload is never installed. The
 *   `agent-installer` workflow publishes it as a GitHub Release asset and bakes
 *   that URL into the installer. To serve it from this app instead once it has a
 *   real domain, `php artisan agent:publish --payload` puts it on the public
 *   `agent` disk — under the web root, so the web server streams it with
 *   byte-range support. See {@see self::PAYLOAD_PATH}.
 *
 * Neither file is committed to git; `php artisan agent:publish` puts a built one
 * in place.
 */
class AgentController extends Controller
{
    /** Path on the private `local` disk where the built installer is placed. */
    public const INSTALLER_PATH = 'agent/philobooth-booth-setup.exe';

    /** Trusted size and SHA-256 written by `agent:publish`. */
    public const INSTALLER_MANIFEST_PATH = 'agent/philobooth-booth-setup.json';

    /** Filename of the large agent payload on the public `agent` disk. */
    public const PAYLOAD_PATH = 'philobooth-booth.exe';

    /** Filename the operator sees in their browser's download list. */
    public const DOWNLOAD_FILENAME = 'philobooth-booth-setup.exe';

    public function download(): BinaryFileResponse|RedirectResponse
    {
        $installer = self::installerInfo();

        if (! $installer['available']) {
            return back()->withErrors([
                'agent' => 'File aplikasi belum siap atau pemeriksaan integritasnya gagal. Hubungi administrator.',
            ]);
        }

        $response = response()->download(
            Storage::disk('local')->path(self::INSTALLER_PATH),
            self::DOWNLOAD_FILENAME,
            [
                'Content-Type' => 'application/vnd.microsoft.portable-executable',
                'X-Checksum-SHA256' => $installer['sha256'],
            ],
        );

        $response->setPrivate();
        $response->setMaxAge(0);
        $response->headers->addCacheControlDirective('no-store');

        return $response;
    }

    /**
     * Validate the currently published installer against trusted metadata.
     * Merely finding a file is insufficient: interrupted/manual copies retain
     * an .exe name and can make Windows report "This app can't run on your PC".
     *
     * @return array{available: bool, size_mb: float|null, sha256: string|null}
     */
    public static function installerInfo(): array
    {
        $disk = Storage::disk('local');

        if (! $disk->exists(self::INSTALLER_PATH)
            || ! $disk->exists(self::INSTALLER_MANIFEST_PATH)) {
            return self::unavailableInstaller();
        }

        try {
            $manifest = json_decode(
                $disk->get(self::INSTALLER_MANIFEST_PATH),
                true,
                flags: JSON_THROW_ON_ERROR,
            );

            $expectedSize = $manifest['size'] ?? null;
            $expectedHash = strtolower((string) ($manifest['sha256'] ?? ''));

            if (! is_int($expectedSize)
                || $expectedSize < 1
                || ! preg_match('/\A[a-f0-9]{64}\z/', $expectedHash)
                || $disk->size(self::INSTALLER_PATH) !== $expectedSize) {
                return self::unavailableInstaller();
            }

            $actualHash = hash_file('sha256', $disk->path(self::INSTALLER_PATH));

            if ($actualHash === false || ! hash_equals($expectedHash, $actualHash)) {
                return self::unavailableInstaller();
            }

            return [
                'available' => true,
                'size_mb' => round($expectedSize / 1048576, 1),
                'sha256' => $expectedHash,
            ];
        } catch (\Throwable $exception) {
            report($exception);

            return self::unavailableInstaller();
        }
    }

    /** @return array{available: false, size_mb: null, sha256: null} */
    private static function unavailableInstaller(): array
    {
        return ['available' => false, 'size_mb' => null, 'sha256' => null];
    }

    /** Absolute filesystem path of the statically served payload. */
    public static function payloadPath(): string
    {
        return Storage::disk('agent')->path(self::PAYLOAD_PATH);
    }

    /**
     * Public URL the installer downloads the payload from. Baked into the
     * installer at compile time via ISCC's `/DPayloadUrl=...`.
     */
    public static function payloadUrl(): string
    {
        return Storage::disk('agent')->url(self::PAYLOAD_PATH);
    }
}
