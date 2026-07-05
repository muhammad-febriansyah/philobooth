<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AgentController;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(UserRole::Admin->value);
});

it('downloads the agent exe when present', function () {
    Storage::fake('local');
    Storage::disk('local')->put(AgentController::AGENT_PATH, 'FAKE-EXE-BYTES');

    $this->actingAs($this->admin)
        ->get('/admin/agent-download')
        ->assertOk()
        ->assertDownload('philobooth-camera.exe');
});

it('redirects back with an error when the agent exe is missing', function () {
    Storage::fake('local');

    $this->actingAs($this->admin)
        ->get('/admin/agent-download')
        ->assertRedirect()
        ->assertSessionHasErrors('agent');
});

it('blocks guests from downloading the agent', function () {
    $this->get('/admin/agent-download')->assertRedirect(route('login'));
});
