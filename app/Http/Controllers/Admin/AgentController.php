<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves the kiosk camera agent for operators to install on the booth PC.
 *
 * The download is split in two so a booth's flaky connection can't produce a
 * half-written exe (Windows reports a truncated PE as "This app can't run on
 * your PC", which reads to an operator as a broken app):
 *
 * - The **installer** is a few MB and is streamed through PHP from the private
 *   `local` disk, so the admin-only gate on the route still applies. See
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
    public const INSTALLER_PATH = 'agent/philobooth-camera-setup.exe';

    /** Filename of the large agent payload on the public `agent` disk. */
    public const PAYLOAD_PATH = 'philobooth-dslr-agent.exe';

    /** Filename the operator sees in their browser's download list. */
    public const DOWNLOAD_FILENAME = 'philobooth-camera-setup.exe';

    public function download(): BinaryFileResponse|RedirectResponse
    {
        if (! Storage::disk('local')->exists(self::INSTALLER_PATH)) {
            return back()->withErrors([
                'agent' => 'File aplikasi belum diunggah ke server.',
            ]);
        }

        return response()->download(
            Storage::disk('local')->path(self::INSTALLER_PATH),
            self::DOWNLOAD_FILENAME,
            ['Content-Type' => 'application/vnd.microsoft.portable-executable'],
        );
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
