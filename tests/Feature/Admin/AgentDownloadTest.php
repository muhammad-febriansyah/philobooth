<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AgentController;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

function fakeWindowsExecutable(string $sectionContents = 'PHILOBOOTH'): string
{
    $peOffset = 64;
    $optionalHeaderSize = 2;
    $sectionOffset = $peOffset + 24 + $optionalHeaderSize + 40;

    $dosHeader = 'MZ'.str_repeat("\0", 58).pack('V', $peOffset);
    $coffHeader = pack('vvVVVvv', 0x8664, 1, 0, 0, 0, $optionalHeaderSize, 0);
    $optionalHeader = pack('v', 0x20B);
    $sectionHeader = str_pad('.data', 16, "\0")
        .pack('VV', strlen($sectionContents), $sectionOffset)
        .str_repeat("\0", 16);

    return $dosHeader."PE\0\0".$coffHeader.$optionalHeader.$sectionHeader.$sectionContents;
}

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(UserRole::Admin->value);
});

it('downloads the installer when present', function () {
    Storage::fake('local');
    Storage::disk('local')->put(AgentController::INSTALLER_PATH, 'MZ-FAKE-INSTALLER');

    $this->actingAs($this->admin)
        ->get('/admin/agent-download')
        ->assertOk()
        ->assertDownload(AgentController::DOWNLOAD_FILENAME);
});

it('redirects back with an error when the installer is missing', function () {
    Storage::fake('local');

    $this->actingAs($this->admin)
        ->get('/admin/agent-download')
        ->assertRedirect()
        ->assertSessionHasErrors('agent');
});

it('blocks guests from downloading the installer', function () {
    $this->get('/admin/agent-download')->assertRedirect(route('login'));
});

it('serves the payload from the web root, outside the storage symlink', function () {
    expect(AgentController::payloadPath())->toBe(public_path('agent/philobooth-dslr-agent.exe'))
        ->and(AgentController::payloadUrl())->toEndWith('/agent/philobooth-dslr-agent.exe');
});

it('publishes the payload to the public disk and reports its hash', function () {
    Storage::fake('agent');

    $source = base_path('tests/tmp-agent-payload.exe');
    $executable = fakeWindowsExecutable();
    File::put($source, $executable);

    $this->artisan('agent:publish', ['--payload' => true, '--payload-file' => $source])
        ->expectsOutputToContain(hash('sha256', $executable))
        ->assertSuccessful();

    Storage::disk('agent')->assertExists(AgentController::PAYLOAD_PATH);
    expect(Storage::disk('agent')->get(AgentController::PAYLOAD_PATH))->toBe($executable);

    File::delete($source);
});

it('refuses a valid windows executable when its trusted hash does not match', function () {
    Storage::fake('agent');

    $source = base_path('tests/tmp-agent-hash-mismatch.exe');
    File::put($source, fakeWindowsExecutable().str_repeat('overlay', 20));

    $this->artisan('agent:publish', [
        '--payload' => true,
        '--payload-file' => $source,
        '--payload-sha256' => str_repeat('0', 64),
    ])->expectsOutputToContain('SHA-256 mismatch')->assertFailed();

    Storage::disk('agent')->assertMissing(AgentController::PAYLOAD_PATH);

    File::delete($source);
});

it('publishes the installer only when its trusted hash matches', function () {
    Storage::fake('local');

    $source = base_path('tests/tmp-agent-installer.exe');
    $executable = fakeWindowsExecutable().str_repeat('installer-overlay', 20);
    File::put($source, $executable);

    $this->artisan('agent:publish', [
        '--installer' => true,
        '--installer-file' => $source,
        '--installer-sha256' => hash('sha256', $executable),
    ])->assertSuccessful();

    Storage::disk('local')->assertExists(AgentController::INSTALLER_PATH);
    expect(Storage::disk('local')->get(AgentController::INSTALLER_PATH))->toBe($executable);

    File::delete($source);
});

it('refuses to publish an installer without its trusted build hash', function () {
    Storage::fake('local');

    $source = base_path('tests/tmp-agent-installer-without-hash.exe');
    File::put($source, fakeWindowsExecutable());

    $this->artisan('agent:publish', [
        '--installer' => true,
        '--installer-file' => $source,
    ])->expectsOutputToContain('--installer-sha256')->assertFailed();

    Storage::disk('local')->assertMissing(AgentController::INSTALLER_PATH);

    File::delete($source);
});

it('refuses to publish a truncated file that is not a windows executable', function () {
    Storage::fake('agent');

    $source = base_path('tests/tmp-agent-truncated.exe');
    File::put($source, 'not-a-pe-file');

    $this->artisan('agent:publish', ['--payload' => true, '--payload-file' => $source])
        ->assertFailed();

    Storage::disk('agent')->assertMissing(AgentController::PAYLOAD_PATH);

    File::delete($source);
});

it('refuses to publish a truncated file that still has valid windows headers', function () {
    Storage::fake('agent');

    $source = base_path('tests/tmp-agent-truncated-pe.exe');
    $executable = fakeWindowsExecutable(str_repeat('x', 20));
    File::put($source, substr($executable, 0, -10));

    $this->artisan('agent:publish', ['--payload' => true, '--payload-file' => $source])
        ->expectsOutputToContain('Truncated Windows executable')
        ->assertFailed();

    Storage::disk('agent')->assertMissing(AgentController::PAYLOAD_PATH);

    File::delete($source);
});

it('refuses to publish a payload that does not exist', function () {
    $this->artisan('agent:publish', ['--payload' => true, '--payload-file' => '/nope/missing.exe'])
        ->assertFailed();
});
