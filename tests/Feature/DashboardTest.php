<?php

use App\Http\Controllers\Admin\AgentController;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard only advertises an installer with valid trusted metadata', function () {
    Storage::fake('local');
    $installer = 'trusted-installer';
    Storage::disk('local')->put(AgentController::INSTALLER_PATH, $installer);
    Storage::disk('local')->put(AgentController::INSTALLER_MANIFEST_PATH, json_encode([
        'size' => strlen($installer),
        'sha256' => hash('sha256', $installer),
    ], JSON_THROW_ON_ERROR));

    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('agent.available', true)
            ->where('agent.size_mb', 0));

    Storage::disk('local')->put(AgentController::INSTALLER_PATH, $installer.'tampered');

    $this->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('agent.available', false)
            ->where('agent.size_mb', null));
});
