<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AgentController;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

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
    File::put($source, 'MZ-FAKE-PAYLOAD');

    $this->artisan('agent:publish', ['--payload' => true, '--payload-file' => $source])
        ->expectsOutputToContain(hash('sha256', 'MZ-FAKE-PAYLOAD'))
        ->assertSuccessful();

    Storage::disk('agent')->assertExists(AgentController::PAYLOAD_PATH);
    expect(Storage::disk('agent')->get(AgentController::PAYLOAD_PATH))->toBe('MZ-FAKE-PAYLOAD');

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

it('refuses to publish a payload that does not exist', function () {
    $this->artisan('agent:publish', ['--payload' => true, '--payload-file' => '/nope/missing.exe'])
        ->assertFailed();
});
