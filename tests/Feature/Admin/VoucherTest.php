<?php

use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherBatch;

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(UserRole::Admin->value);

    $this->cabangUser = User::factory()->create();
    $this->cabangUser->assignRole(UserRole::Cabang->value);
});

test('guests are redirected from voucher index', function () {
    $this->get(route('admin.voucher.index'))->assertRedirect(route('login'));
});

test('cabang users can access voucher management scoped to their branch', function () {
    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();
    $this->cabangUser->update(['branch_id' => $branchA->id]);

    Voucher::factory()->create(['branch_id' => $branchA->id]);
    Voucher::factory()->create(['branch_id' => $branchB->id]);

    $this->actingAs($this->cabangUser)
        ->get(route('admin.voucher.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/voucher')
            ->where('can_pick_branch', false)
            ->has('vouchers.data', 1)
        );
});

test('admin can view voucher batch list', function () {
    VoucherBatch::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.voucher.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/voucher')
            ->has('batches.data', 3)
            ->has('stats')
        );
});

test('admin can create voucher batch', function () {
    $branch = Branch::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.voucher.store'), [
            'branch_id' => $branch->id,
            'name' => 'Promo Test',
            'code_prefix' => 'test',
            'max_uses_per_voucher' => 1,
            'valid_from' => now()->toDateString(),
            'valid_until' => now()->addMonth()->toDateString(),
            'is_active' => '1',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(VoucherBatch::where('name', 'Promo Test')->first())
        ->not->toBeNull()
        ->code_prefix->toBe('TEST')
        ->is_active->toBeTrue();
});

test('voucher batch requires valid date range', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.voucher.store'), [
            'name' => 'Invalid',
            'code_prefix' => 'INV',
            'max_uses_per_voucher' => 1,
            'valid_from' => now()->addMonth()->toDateString(),
            'valid_until' => now()->toDateString(),
        ])
        ->assertSessionHasErrors('valid_until');
});

test('admin can update voucher batch', function () {
    $batch = VoucherBatch::factory()->create(['name' => 'Old Name']);

    $this->actingAs($this->admin)
        ->put(route('admin.voucher.update', $batch), [
            'name' => 'New Name',
            'code_prefix' => 'NEW',
            'max_uses_per_voucher' => 2,
            'valid_from' => now()->toDateString(),
            'valid_until' => now()->addMonths(2)->toDateString(),
            'is_active' => '1',
        ])
        ->assertRedirect();

    expect($batch->fresh())
        ->name->toBe('New Name')
        ->code_prefix->toBe('NEW')
        ->max_uses_per_voucher->toBe(2);
});

test('admin can delete voucher batch with codes', function () {
    $batch = VoucherBatch::factory()->create();
    Voucher::factory()->count(5)->create(['batch_id' => $batch->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.voucher.destroy', $batch))
        ->assertRedirect();

    expect(VoucherBatch::find($batch->id))->toBeNull();
    expect(Voucher::where('batch_id', $batch->id)->count())->toBe(0);
});

test('admin can generate batch of voucher codes', function () {
    $batch = VoucherBatch::factory()->create([
        'code_prefix' => 'GEN',
        'max_uses_per_voucher' => 2,
        'total_generated' => 0,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.voucher.generate', $batch), ['quantity' => 25])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($batch->fresh()->total_generated)->toBe(25);

    $codes = Voucher::where('batch_id', $batch->id)->get();

    expect($codes)->toHaveCount(25);

    foreach ($codes as $voucher) {
        expect($voucher->code)->toStartWith('GEN-');
        expect($voucher->max_uses)->toBe(2);
        expect($voucher->is_active)->toBeTrue();
    }

    expect($codes->pluck('code')->unique())->toHaveCount(25);
});

test('generate voucher rejects invalid quantity', function () {
    $batch = VoucherBatch::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.voucher.generate', $batch), ['quantity' => 0])
        ->assertSessionHasErrors('quantity');

    $this->actingAs($this->admin)
        ->post(route('admin.voucher.generate', $batch), ['quantity' => 5000])
        ->assertSessionHasErrors('quantity');
});

test('admin can view batch codes detail page', function () {
    $batch = VoucherBatch::factory()->create();
    Voucher::factory()->count(4)->create(['batch_id' => $batch->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.voucher.codes', $batch))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/voucher-detail')
            ->where('batch.id', $batch->id)
            ->has('vouchers.data', 4)
        );
});
