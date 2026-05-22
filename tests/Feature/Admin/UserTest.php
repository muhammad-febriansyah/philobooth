<?php

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(UserRole::Admin->value);

    $this->cabangUser = User::factory()->create();
    $this->cabangUser->assignRole(UserRole::Cabang->value);
});

test('guests are redirected from users index', function () {
    $this->get(route('admin.users.index'))->assertRedirect(route('login'));
});

test('cabang users cannot access user management', function () {
    $this->actingAs($this->cabangUser)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('admin can view user list', function () {
    User::factory()->count(3)->create()
        ->each(fn ($u) => $u->assignRole(UserRole::Cabang->value));

    $this->actingAs($this->admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users')
            ->has('users.data')
            ->has('stats')
            ->has('options.roles', 2)
        );
});

test('admin can create cabang user with branch', function () {
    $branch = Branch::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Cabang Tester',
            'email' => 'tester@philo.id',
            'phone' => '0812-0000-0001',
            'role' => UserRole::Cabang->value,
            'branch_id' => $branch->id,
            'password' => 'secret-pw-123',
            'password_confirmation' => 'secret-pw-123',
            'is_active' => '1',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $user = User::where('email', 'tester@philo.id')->first();
    expect($user)->not->toBeNull()
        ->branch_id->toBe($branch->id)
        ->is_active->toBeTrue();
    expect($user->hasRole(UserRole::Cabang->value))->toBeTrue();
    expect(Hash::check('secret-pw-123', $user->password))->toBeTrue();
});

test('cabang role requires a branch', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'No Branch',
            'email' => 'nobranch@philo.id',
            'role' => UserRole::Cabang->value,
            'password' => 'secret-pw-123',
            'password_confirmation' => 'secret-pw-123',
        ])
        ->assertSessionHasErrors('branch_id');
});

test('admin role ignores branch assignment', function () {
    $branch = Branch::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'New Admin',
            'email' => 'newadmin@philo.id',
            'role' => UserRole::Admin->value,
            'branch_id' => $branch->id,
            'password' => 'secret-pw-123',
            'password_confirmation' => 'secret-pw-123',
        ])
        ->assertRedirect();

    expect(User::where('email', 'newadmin@philo.id')->first())
        ->branch_id->toBeNull();
});

test('email must be unique among active users', function () {
    User::factory()->create(['email' => 'taken@philo.id']);

    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Dup',
            'email' => 'taken@philo.id',
            'role' => UserRole::Admin->value,
            'password' => 'secret-pw-123',
            'password_confirmation' => 'secret-pw-123',
        ])
        ->assertSessionHasErrors('email');
});

test('admin can update user without changing password', function () {
    $branch = Branch::factory()->create();
    $user = User::factory()->create(['name' => 'Old', 'password' => Hash::make('keep-me')]);
    $user->assignRole(UserRole::Cabang->value);

    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $user), [
            'name' => 'Updated',
            'email' => $user->email,
            'role' => UserRole::Cabang->value,
            'branch_id' => $branch->id,
            'is_active' => '1',
        ])
        ->assertRedirect();

    $user->refresh();
    expect($user->name)->toBe('Updated');
    expect($user->branch_id)->toBe($branch->id);
    expect(Hash::check('keep-me', $user->password))->toBeTrue();
});

test('admin can switch user role from cabang to admin', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Cabang->value);

    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'role' => UserRole::Admin->value,
            'is_active' => '1',
        ])
        ->assertRedirect();

    $user->refresh();
    expect($user->hasRole(UserRole::Admin->value))->toBeTrue();
    expect($user->hasRole(UserRole::Cabang->value))->toBeFalse();
    expect($user->branch_id)->toBeNull();
});

test('admin can delete other user', function () {
    $user = User::factory()->create();
    $user->assignRole(UserRole::Cabang->value);

    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $user))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(User::withoutTrashed()->find($user->id))->toBeNull();
});

test('admin cannot delete own account', function () {
    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $this->admin))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(User::withoutTrashed()->find($this->admin->id))->not->toBeNull();
});
