<?php

use App\Enums\UserRole;
use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(UserRole::Admin->value);

    $this->cabangUser = User::factory()->create();
    $this->cabangUser->assignRole(UserRole::Cabang->value);
});

test('guests are redirected from admin settings', function () {
    $this->get(route('admin.settings.edit'))->assertRedirect(route('login'));
});

test('cabang users cannot access admin settings', function () {
    $this->actingAs($this->cabangUser)
        ->get(route('admin.settings.edit'))
        ->assertForbidden();
});

test('admin can view settings page with defaults', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings')
            ->where('settings.app_name', config('app.name'))
            ->where('settings.currency', 'IDR')
            ->where('settings.base_price', 25000)
        );
});

test('admin can update text settings and prices', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'app_name' => 'Philobooth Studio',
            'app_tagline' => 'Self service photobooth',
            'support_email' => 'hi@philo.id',
            'support_phone' => '+62 812 3456 7890',
            'base_price' => 35000,
            'tax_percent' => 11,
            'service_fee' => 2000,
            'extra_print_price' => 7500,
            'min_prints' => 1,
            'max_prints' => 8,
            'currency' => 'IDR',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(AppSetting::get('app_name'))->toBe('Philobooth Studio');
    expect(AppSetting::get('app_tagline'))->toBe('Self service photobooth');
    expect(AppSetting::get('base_price'))->toBe(35000.0);
    expect(AppSetting::get('tax_percent'))->toBe(11.0);
    expect(AppSetting::get('max_prints'))->toBe(8);
});

test('admin can upload and replace logo', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'app_name' => 'Philobooth',
            'logo' => UploadedFile::fake()->image('logo.png', 200, 200),
            'base_price' => 25000,
            'tax_percent' => 0,
            'service_fee' => 0,
            'extra_print_price' => 5000,
            'min_prints' => 1,
            'max_prints' => 10,
            'currency' => 'IDR',
        ])
        ->assertRedirect();

    $path = AppSetting::get('logo_path');
    expect($path)->not->toBeNull();
    Storage::disk('public')->assertExists($path);
});

test('admin can remove existing favicon', function () {
    Storage::fake('public');

    AppSetting::set('favicon_path', 'app-settings/old-fav.png');
    Storage::disk('public')->put('app-settings/old-fav.png', 'fake');

    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'app_name' => 'Philobooth',
            'remove_favicon' => '1',
            'base_price' => 25000,
            'tax_percent' => 0,
            'service_fee' => 0,
            'extra_print_price' => 5000,
            'min_prints' => 1,
            'max_prints' => 10,
            'currency' => 'IDR',
        ])
        ->assertRedirect();

    expect(AppSetting::get('favicon_path'))->toBeNull();
    Storage::disk('public')->assertMissing('app-settings/old-fav.png');
});

test('settings update validates required fields', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'app_name' => '',
            'max_prints' => 1,
            'min_prints' => 5,
            'currency' => 'INDONESIAN',
        ])
        ->assertSessionHasErrors(['app_name', 'max_prints', 'currency']);
});
