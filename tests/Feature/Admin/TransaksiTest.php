<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(UserRole::Admin->value);

    $this->branch = Branch::factory()->create();
    $this->cabangUser = User::factory()->create(['branch_id' => $this->branch->id]);
    $this->cabangUser->assignRole(UserRole::Cabang->value);
});

test('guests are redirected from transaksi index', function () {
    $this->get(route('admin.transaksi.index'))->assertRedirect(route('login'));
});

test('admin can view transaksi list with stats', function () {
    PhotoSession::factory()->count(3)->create([
        'status' => SessionStatus::Completed,
        'final_amount' => 50000,
        'print_quantity' => 2,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.transaksi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/transaksi')
            ->has('sessions.data', 3)
            ->where('stats.total', 3)
            ->where('stats.completed', 3)
            ->where('stats.prints', 6)
            ->where('stats.revenue', 150000)
        );
});

test('filter by status narrows results', function () {
    PhotoSession::factory()->count(2)->create(['status' => SessionStatus::Completed]);
    PhotoSession::factory()->count(3)->create(['status' => SessionStatus::Cancelled]);

    $this->actingAs($this->admin)
        ->get(route('admin.transaksi.index', ['status' => 'completed']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.total', 2)
        );
});

test('cabang user only sees own branch sessions', function () {
    $otherBranch = Branch::factory()->create();
    PhotoSession::factory()->count(3)->create(['branch_id' => $this->branch->id]);
    PhotoSession::factory()->count(2)->create(['branch_id' => $otherBranch->id]);

    $this->actingAs($this->cabangUser)
        ->get(route('admin.transaksi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.total', 3)
            ->where('can_pick_branch', false)
        );
});

test('admin can export csv', function () {
    PhotoSession::factory()->create([
        'session_code' => 'PB-TEST-001',
        'status' => SessionStatus::Completed,
        'payment_method' => PaymentMethod::QrisDoku,
        'final_amount' => 75000,
    ]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.transaksi.export.csv'));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

    $content = $response->streamedContent();
    expect($content)->toContain('Kode Sesi');
    expect($content)->toContain('PB-TEST-001');
    expect($content)->toContain('75000');
});

test('csv export respects filters', function () {
    PhotoSession::factory()->create([
        'session_code' => 'PB-INCLUDE-A',
        'status' => SessionStatus::Completed,
    ]);
    PhotoSession::factory()->create([
        'session_code' => 'PB-EXCLUDE-B',
        'status' => SessionStatus::Cancelled,
    ]);

    $content = $this->actingAs($this->admin)
        ->get(route('admin.transaksi.export.csv', ['status' => 'completed']))
        ->streamedContent();

    expect($content)->toContain('PB-INCLUDE-A');
    expect($content)->not->toContain('PB-EXCLUDE-B');
});

test('admin can export pdf', function () {
    PhotoSession::factory()->count(2)->create([
        'status' => SessionStatus::Completed,
    ]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.transaksi.export.pdf'));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');

    expect($response->getContent())->toStartWith('%PDF-');
});

test('admin sees unresolved payment reconciliation details', function () {
    $session = PhotoSession::factory()->create([
        'branch_id' => $this->branch->id,
        'session_code' => 'PB-RECON-001',
    ]);
    Payment::factory()->create([
        'session_id' => $session->id,
        'status' => PaymentStatus::Expired,
        'amount' => 25000,
        'pakasir_order_id' => 'ORDER-RECON-001',
        'requires_reconciliation' => true,
        'reconciliation_reason' => 'duplicate_provider_settlement',
        'raw_response' => [
            '_philobooth_provider_paid_at' => '2026-08-25T19:30:00+07:00',
        ],
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.transaksi.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('reconciliations', 1)
            ->where('reconciliations.0.session_code', 'PB-RECON-001')
            ->where('reconciliations.0.order_id', 'ORDER-RECON-001')
            ->where('reconciliations.0.reason', 'duplicate_provider_settlement')
            ->where('reconciliations.0.amount', 25000)
        );
});

test('operator can resolve reconciliation only for their own branch', function () {
    $ownPayment = Payment::factory()->create([
        'session_id' => PhotoSession::factory()->create(['branch_id' => $this->branch->id]),
        'requires_reconciliation' => true,
        'reconciliation_reason' => 'stale_billing_revision',
    ]);
    $otherPayment = Payment::factory()->create([
        'session_id' => PhotoSession::factory()->create(['branch_id' => Branch::factory()]),
        'requires_reconciliation' => true,
        'reconciliation_reason' => 'terminal_session_settlement',
    ]);

    $this->actingAs($this->cabangUser)
        ->patch(route('admin.transaksi.reconciliations.resolve', $otherPayment))
        ->assertForbidden();

    $this->actingAs($this->cabangUser)
        ->patch(route('admin.transaksi.reconciliations.resolve', $ownPayment))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($ownPayment->fresh()->reconciliation_resolved_at)->not->toBeNull()
        ->and($ownPayment->fresh()->reconciliation_resolved_by)->toBe($this->cabangUser->id)
        ->and($otherPayment->fresh()->reconciliation_resolved_at)->toBeNull();

    $this->actingAs($this->cabangUser)
        ->get(route('admin.transaksi.index'))
        ->assertInertia(fn ($page) => $page->has('reconciliations', 0));
});
