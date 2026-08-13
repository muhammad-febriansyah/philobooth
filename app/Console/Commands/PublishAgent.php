<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\AgentController;
use Illuminate\Console\Command;
use Illuminate\Http\File as UploadableFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

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
 *   php artisan agent:publish --installer
 */
class PublishAgent extends Command
{
    protected $signature = 'agent:publish
        {--payload : Publish the agent exe to public/ and print its URL + SHA-256}
        {--installer : Publish the compiled installer to the private disk}
        {--payload-file= : Override the built payload path}
        {--installer-file= : Override the compiled installer path}';

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

        if (! $this->isWindowsExecutable($source)) {
            return self::FAILURE;
        }

        Storage::disk('agent')->putFileAs('', new UploadableFile($source), AgentController::PAYLOAD_PATH);

        $hash = hash_file('sha256', $source);
        $url = AgentController::payloadUrl();

        $this->components->info(sprintf(
            'Payload published (%s MB).',
            number_format(filesize($source) / 1048576, 1)
        ));
        $this->components->twoColumnDetail('URL', $url);
        $this->components->twoColumnDetail('SHA-256', $hash);
        $this->newLine();
        $this->line('Compile the installer with:');
        $this->line(sprintf(
            '  ISCC installer\philobooth-agent.iss /DPayloadUrl="%s" /DPayloadSha256="%s"',
            $url,
            $hash
        ));
        $this->newLine();

        return self::SUCCESS;
    }

    private function publishInstaller(): int
    {
        $source = $this->option('installer-file') ?: base_path(self::DEFAULT_INSTALLER_FILE);

        if (! $this->isWindowsExecutable($source)) {
            return self::FAILURE;
        }

        $destination = Storage::disk('local')->path(AgentController::INSTALLER_PATH);
        File::ensureDirectoryExists(dirname($destination));
        File::copy($source, $destination);

        $this->components->info(sprintf(
            'Installer published (%s MB). Operators can download it from the dashboard.',
            number_format(filesize($source) / 1048576, 1)
        ));

        return self::SUCCESS;
    }

    /**
     * Guards against publishing a file that Windows would reject — a truncated
     * or non-PE file installs without complaint and only fails on the booth PC.
     */
    private function isWindowsExecutable(string $path): bool
    {
        if (! File::exists($path)) {
            $this->components->error("File not found: {$path}");

            return false;
        }

        if (file_get_contents($path, length: 2) !== 'MZ') {
            $this->components->error("Not a Windows executable: {$path}");

            return false;
        }

        return true;
    }
}
