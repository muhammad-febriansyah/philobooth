<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves the kiosk camera agent (.exe) for operators to download and install on
 * the booth PC. The built binary is placed on the `local` disk at
 * {@see self::AGENT_PATH} during deployment — i.e.
 * storage/app/private/agent/philobooth-dslr-agent.exe (not committed to git).
 */
class AgentController extends Controller
{
    /** Path on the `local` disk where the built agent exe is placed. */
    public const AGENT_PATH = 'agent/philobooth-dslr-agent.exe';

    public function download(): BinaryFileResponse|RedirectResponse
    {
        if (! Storage::disk('local')->exists(self::AGENT_PATH)) {
            return back()->withErrors([
                'agent' => 'File aplikasi belum diunggah ke server.',
            ]);
        }

        return response()->download(
            Storage::disk('local')->path(self::AGENT_PATH),
            'philobooth-camera.exe',
            ['Content-Type' => 'application/vnd.microsoft.portable-executable'],
        );
    }
}
