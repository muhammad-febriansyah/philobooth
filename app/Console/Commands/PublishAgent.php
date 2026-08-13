<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\AgentController;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Puts a freshly built kiosk agent in place for operators to download.
 *
 * The payload (the large single-file exe) goes under `public/` so the web server
 * serves it statically, and the installer goes on the private `local` disk so
 * {@see AgentController::download()} can stream it behind the admin gate.
 *
 * The two are published in separate runs because the installer has to be
 * compiled with the payload's URL and hash baked in:
 *
 *   dotnet publish -c Release                        (in dslr-agent/)
 *   php artisan agent:publish --payload              -> prints the ISCC line
 *   ISCC installer\philobooth-agent.iss /D...        (on Windows)
 *   php artisan agent:publish --installer --installer-sha256=<trusted hash>
 */
class PublishAgent extends Command
{
    protected $signature = 'agent:publish
        {--payload : Publish the agent exe to public/ and print its URL + SHA-256}
        {--installer : Publish the compiled installer to the private disk}
        {--payload-file= : Override the built payload path}
        {--installer-file= : Override the compiled installer path}
        {--payload-sha256= : Expected SHA-256 from the trusted build manifest}
        {--installer-sha256= : Expected SHA-256 from the trusted build manifest}';

    protected $description = 'Publish the built kiosk camera agent for operators to download';

    private const DEFAULT_PAYLOAD_FILE = 'dslr-agent/bin/Release/net8.0-windows/win-x64/publish/philobooth-dslr-agent.exe';

    private const DEFAULT_INSTALLER_FILE = 'dslr-agent/installer/Output/philobooth-camera-setup.exe';

    public function handle(): int
    {
        $payload = (bool) $this->option('payload');
        $installer = (bool) $this->option('installer');

        if (! $payload && ! $installer) {
            $payload = true;
            $installer = true;
        }

        if ($payload && $this->publishPayload() !== self::SUCCESS) {
            return self::FAILURE;
        }

        if ($installer && $this->publishInstaller() !== self::SUCCESS) {
            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function publishPayload(): int
    {
        $source = $this->option('payload-file') ?: base_path(self::DEFAULT_PAYLOAD_FILE);

        $sourceHash = $this->validatedExecutableHash($source, $this->option('payload-sha256'));

        if ($sourceHash === null) {
            return self::FAILURE;
        }

        $destination = AgentController::payloadPath();

        if (! $this->publishAtomically($source, $destination, $sourceHash)) {
            return self::FAILURE;
        }

        $url = AgentController::payloadUrl();

        $this->components->info(sprintf(
            'Payload published (%s MB).',
            number_format(filesize($source) / 1048576, 1)
        ));
        $this->components->twoColumnDetail('URL', $url);
        $this->components->twoColumnDetail('SHA-256', $sourceHash);
        $this->newLine();
        $this->line('Compile the installer with:');
        $this->line(sprintf(
            '  ISCC installer\philobooth-agent.iss /DPayloadUrl="%s" /DPayloadSha256="%s"',
            $url,
            $sourceHash
        ));
        $this->newLine();

        return self::SUCCESS;
    }

    private function publishInstaller(): int
    {
        $source = $this->option('installer-file') ?: base_path(self::DEFAULT_INSTALLER_FILE);
        $expectedHash = $this->option('installer-sha256');

        if ($expectedHash === null) {
            $this->components->error(
                'The --installer-sha256 value from philobooth-camera-checksums.txt is required.'
            );

            return self::FAILURE;
        }

        $sourceHash = $this->validatedExecutableHash($source, $expectedHash);

        if ($sourceHash === null) {
            return self::FAILURE;
        }

        $destination = Storage::disk('local')->path(AgentController::INSTALLER_PATH);

        if (! $this->publishAtomically($source, $destination, $sourceHash)) {
            return self::FAILURE;
        }

        $this->components->info(sprintf(
            'Installer published (%s MB). Operators can download it from the dashboard.',
            number_format(filesize($source) / 1048576, 1)
        ));

        return self::SUCCESS;
    }

    private function validatedExecutableHash(string $path, mixed $expectedHash): ?string
    {
        if (! $this->isWindowsExecutable($path)) {
            return null;
        }

        $actualHash = hash_file('sha256', $path);

        if ($actualHash === false) {
            $this->components->error("Unable to hash Windows executable: {$path}");

            return null;
        }

        if ($expectedHash === null) {
            return $actualHash;
        }

        $normalizedExpectedHash = strtolower(trim((string) $expectedHash));

        if (! preg_match('/\A[a-f0-9]{64}\z/', $normalizedExpectedHash)) {
            $this->components->error('Expected SHA-256 must contain exactly 64 hexadecimal characters.');

            return null;
        }

        if (! hash_equals($normalizedExpectedHash, $actualHash)) {
            $this->components->error("SHA-256 mismatch for Windows executable: {$path}");

            return null;
        }

        return $actualHash;
    }

    /**
     * Copies beside the destination, verifies the complete file, then renames
     * it so a concurrent download can only see the old or the new full file.
     */
    private function publishAtomically(string $source, string $destination, string $expectedHash): bool
    {
        File::ensureDirectoryExists(dirname($destination));

        $temporaryPath = $destination.'.'.Str::uuid().'.tmp';

        try {
            if (! File::copy($source, $temporaryPath)
                || File::size($temporaryPath) !== File::size($source)
                || ! hash_equals($expectedHash, hash_file('sha256', $temporaryPath) ?: '')) {
                $this->components->error("Failed to copy the complete Windows executable to: {$destination}");

                return false;
            }

            if (! rename($temporaryPath, $destination)) {
                $this->components->error("Failed to activate Windows executable at: {$destination}");

                return false;
            }
        } catch (\Throwable $exception) {
            report($exception);
            $this->components->error("Failed to publish Windows executable to: {$destination}");

            return false;
        } finally {
            File::delete($temporaryPath);
        }

        return true;
    }

    /**
     * Guards against publishing a file that Windows would reject. Checking only
     * the leading "MZ" bytes is not enough: an interrupted download keeps those
     * bytes and still produces "This app can't run on your PC" on Windows.
     */
    private function isWindowsExecutable(string $path): bool
    {
        if (! File::exists($path)) {
            $this->components->error("File not found: {$path}");

            return false;
        }

        $size = File::size($path);
        $handle = fopen($path, 'rb');

        if ($handle === false || $size < 64) {
            $this->components->error("Not a Windows executable: {$path}");

            return false;
        }

        try {
            $dosHeader = fread($handle, 64);

            if ($dosHeader === false || strlen($dosHeader) !== 64 || ! str_starts_with($dosHeader, 'MZ')) {
                $this->components->error("Not a Windows executable: {$path}");

                return false;
            }

            $peOffset = unpack('Voffset', substr($dosHeader, 60, 4))['offset'];

            if ($peOffset < 64 || $peOffset > $size - 24 || fseek($handle, $peOffset) !== 0) {
                $this->components->error("Invalid Windows executable header: {$path}");

                return false;
            }

            $peHeader = fread($handle, 24);

            if ($peHeader === false || strlen($peHeader) !== 24 || ! str_starts_with($peHeader, "PE\0\0")) {
                $this->components->error("Invalid Windows executable header: {$path}");

                return false;
            }

            $coff = unpack('@4/vmachine/vsections/@20/voptional_size', $peHeader);
            $supportedMachines = [0x014C, 0x8664]; // x86 and x64

            if (! in_array($coff['machine'], $supportedMachines, true)
                || $coff['sections'] < 1
                || $coff['sections'] > 96
                || $coff['optional_size'] < 2) {
                $this->components->error("Unsupported Windows executable: {$path}");

                return false;
            }

            $sectionTableOffset = $peOffset + 24 + $coff['optional_size'];
            $sectionTableSize = $coff['sections'] * 40;

            if ($sectionTableOffset > $size - $sectionTableSize
                || fseek($handle, $sectionTableOffset) !== 0) {
                $this->components->error("Truncated Windows executable: {$path}");

                return false;
            }

            $sectionTable = fread($handle, $sectionTableSize);

            if ($sectionTable === false || strlen($sectionTable) !== $sectionTableSize) {
                $this->components->error("Truncated Windows executable: {$path}");

                return false;
            }

            for ($index = 0; $index < $coff['sections']; $index++) {
                $section = substr($sectionTable, $index * 40, 40);
                $raw = unpack('@16/Vsize/@20/Voffset', $section);

                if ($raw['size'] > 0
                    && ($raw['offset'] > $size || $raw['size'] > $size - $raw['offset'])) {
                    $this->components->error("Truncated Windows executable: {$path}");

                    return false;
                }
            }
        } finally {
            fclose($handle);
        }

        return true;
    }
}
