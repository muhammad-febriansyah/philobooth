<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Services\Pakasir\PakasirClient;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.pakasir.base_url', 'https://app.pakasir.com');
    config()->set('services.pakasir.slug', 'philobooth');
    config()->set('services.pakasir.api_key', 'testkey');

    // Rebuild the singleton so it picks up the test config above.
    app()->forgetInstance(PakasirClient::class);
});

/**
 * @return array{0: PhotoSession, 1: Payment}
 */
function pendingPakasirPayment(string $orderId, int $amount = 25000): array
{
    $session = PhotoSession::factory()->create([
        'status' => SessionStatus::PaymentPending,
        'final_amount' => $amount,
    ]);

    $payment = Payment::factory()->pending()->create([
        'session_id' => $session->id,
        'method' => PaymentMethod::QrisPakasir,
        'amount' => $amount,
        'pakasir_order_id' => $orderId,
        'doku_invoice_number' => null,
    ]);

    return [$session, $payment];
}

it('marks payment and session paid when pakasir verifies completed', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => ['amount' => 25000, 'order_id' => 'ORD-OK', 'status' => 'completed', 'payment_method' => 'qris'],
        ]),
    ]);

    [$session, $payment] = pendingPakasirPayment('ORD-OK');

    $this->postJson('/api/booth/pakasir/callback', [
        'amount' => 25000,
        'order_id' => 'ORD-OK',
        'project' => 'philobooth',
        'status' => 'completed',
        'payment_method' => 'qris',
    ])->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Success)
        ->and($payment->fresh()->paid_at)->not->toBeNull()
        ->and($session->fresh()->status)->toBe(SessionStatus::Paid);
});

it('rejects a spoofed completed webhook when pakasir still reports pending', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => ['amount' => 25000, 'order_id' => 'ORD-SPOOF', 'status' => 'pending'],
        ]),
    ]);

    [$session, $payment] = pendingPakasirPayment('ORD-SPOOF');

    $this->postJson('/api/booth/pakasir/callback', [
        'amount' => 25000,
        'order_id' => 'ORD-SPOOF',
        'status' => 'completed',
    ])->assertStatus(409);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending)
        ->and($session->fresh()->status)->not->toBe(SessionStatus::Paid);
});

it('rejects when the verified amount does not match the stored amount', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => ['amount' => 10000, 'order_id' => 'ORD-AMT', 'status' => 'completed'],
        ]),
    ]);

    [$session, $payment] = pendingPakasirPayment('ORD-AMT', 25000);

    $this->postJson('/api/booth/pakasir/callback', [
        'amount' => 10000,
        'order_id' => 'ORD-AMT',
        'status' => 'completed',
    ])->assertStatus(409);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('returns 404 for an unknown order', function () {
    Http::fake();

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'DOES-NOT-EXIST',
        'status' => 'completed',
    ])->assertStatus(404);

    Http::assertNothingSent();
});

it('returns 422 when order_id is missing', function () {
    $this->postJson('/api/booth/pakasir/callback', [
        'status' => 'completed',
    ])->assertStatus(422);
});

it('is idempotent for an already-paid order and does not re-verify', function () {
    Http::fake();

    $session = PhotoSession::factory()->create(['status' => SessionStatus::Paid, 'final_amount' => 25000]);
    Payment::factory()->create([
        'session_id' => $session->id,
        'method' => PaymentMethod::QrisPakasir,
        'amount' => 25000,
        'pakasir_order_id' => 'ORD-DONE',
        'doku_invoice_number' => null,
        'status' => PaymentStatus::Success,
    ]);

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'ORD-DONE',
        'status' => 'completed',
    ])->assertOk();

    Http::assertNothingSent();
});

it('rejects an expired order without asking pakasir to revive it', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => ['amount' => 25000, 'order_id' => 'ORD-EXPIRED', 'status' => 'pending'],
        ]),
    ]);
    [$session, $payment] = pendingPakasirPayment('ORD-EXPIRED');
    $payment->update(['expired_at' => now()->subSecond()]);

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'ORD-EXPIRED',
        'status' => 'completed',
    ])->assertConflict();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Expired)
        ->and($session->fresh()->status)->toBe(SessionStatus::Started);
    Http::assertSentCount(1);
});

it('accepts a delayed webhook if an expired local order later verifies completed', function () {
    Http::fakeSequence('app.pakasir.com/api/transactiondetail*')
        ->push(['transaction' => ['amount' => 25000, 'order_id' => 'ORD-LATE', 'status' => 'pending']])
        ->push(['transaction' => ['amount' => 25000, 'order_id' => 'ORD-LATE', 'status' => 'completed']]);
    [$session, $payment] = pendingPakasirPayment('ORD-LATE');
    $payment->update(['expired_at' => now()->subSecond()]);

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'ORD-LATE',
    ])->assertConflict();
    expect($payment->fresh()->status)->toBe(PaymentStatus::Expired);

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'ORD-LATE',
    ])->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Success)
        ->and($session->fresh()->status)->toBe(SessionStatus::Paid);
    Http::assertSentCount(2);
});

it('records a late settlement without reviving a cancelled session', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => ['amount' => 25000, 'order_id' => 'ORD-CANCELLED', 'status' => 'completed'],
        ]),
    ]);
    [$session, $payment] = pendingPakasirPayment('ORD-CANCELLED');
    $session->update(['status' => SessionStatus::Cancelled]);

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'ORD-CANCELLED',
    ])->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Success)
        ->and($payment->fresh()->requires_reconciliation)->toBeTrue()
        ->and($payment->fresh()->reconciliation_reason)->toBe('terminal_session_settlement')
        ->and(data_get($payment->fresh()->raw_response, '_philobooth_requires_reconciliation'))->toBeTrue()
        ->and($session->fresh()->status)->toBe(SessionStatus::Cancelled);
});

it('flags a late duplicate provider settlement for reconciliation', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => [
                'amount' => 25000,
                'order_id' => 'ORD-OLD-LATE',
                'status' => 'completed',
                'completed_at' => '2026-08-25T19:30:00+07:00',
            ],
        ]),
    ]);

    $session = PhotoSession::factory()->create([
        'status' => SessionStatus::Paid,
        'final_amount' => 25000,
        'billing_revision' => 0,
    ]);
    $latePayment = Payment::factory()->create([
        'session_id' => $session->id,
        'method' => PaymentMethod::QrisPakasir,
        'purpose' => 'base',
        'billing_revision' => 0,
        'attempt' => 1,
        'amount' => 25000,
        'pakasir_order_id' => 'ORD-OLD-LATE',
        'doku_invoice_number' => null,
        'status' => PaymentStatus::Expired,
    ]);
    $winningPayment = Payment::factory()->create([
        'session_id' => $session->id,
        'method' => PaymentMethod::QrisPakasir,
        'purpose' => 'base',
        'billing_revision' => 0,
        'attempt' => 2,
        'amount' => 25000,
        'pakasir_order_id' => 'ORD-NEW-PAID',
        'doku_invoice_number' => null,
        'status' => PaymentStatus::Success,
        'settlement_key' => "session:{$session->id}:base:0",
        'paid_at' => now()->subMinute(),
    ]);

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'ORD-OLD-LATE',
    ])->assertOk();

    $latePayment->refresh();
    expect($winningPayment->fresh()->status)->toBe(PaymentStatus::Success)
        ->and($latePayment->status)->toBe(PaymentStatus::Expired)
        ->and($latePayment->paid_at)->not->toBeNull()
        ->and($latePayment->requires_reconciliation)->toBeTrue()
        ->and($latePayment->reconciliation_reason)->toBe('duplicate_provider_settlement')
        ->and(data_get($latePayment->raw_response, '_philobooth_requires_reconciliation'))->toBeTrue()
        ->and(data_get($latePayment->raw_response, '_philobooth_reconciliation_reason'))->toBe('duplicate_provider_settlement')
        ->and(data_get($latePayment->raw_response, '_philobooth_provider_paid_at'))->toBe('2026-08-25T19:30:00+07:00')
        ->and(data_get($latePayment->raw_response, '_philobooth_winning_payment_id'))->toBe($winningPayment->id)
        ->and($session->fresh()->status)->toBe(SessionStatus::Paid);
});

it('flags a paid extra from an old billing revision without changing the active bill', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => [
                'amount' => 5000,
                'order_id' => 'ORD-EXTRA-REV-1',
                'status' => 'completed',
                'completed_at' => '2026-08-25T19:40:00+07:00',
            ],
        ]),
    ]);

    $session = PhotoSession::factory()->create([
        'status' => SessionStatus::Editing,
        'billing_revision' => 2,
        'extra_amount' => 10000,
        'final_amount' => 35000,
    ]);
    $latePayment = Payment::factory()->create([
        'session_id' => $session->id,
        'method' => PaymentMethod::QrisPakasir,
        'purpose' => 'extra_print',
        'billing_revision' => 1,
        'attempt' => 1,
        'amount' => 5000,
        'pakasir_order_id' => 'ORD-EXTRA-REV-1',
        'doku_invoice_number' => null,
        'status' => PaymentStatus::Expired,
    ]);

    $this->postJson('/api/booth/pakasir/callback', [
        'order_id' => 'ORD-EXTRA-REV-1',
    ])->assertOk();

    $latePayment->refresh();
    $session->refresh();
    expect($latePayment->status)->toBe(PaymentStatus::Expired)
        ->and($latePayment->paid_at)->not->toBeNull()
        ->and($latePayment->requires_reconciliation)->toBeTrue()
        ->and($latePayment->reconciliation_reason)->toBe('stale_billing_revision')
        ->and(data_get($latePayment->raw_response, '_philobooth_requires_reconciliation'))->toBeTrue()
        ->and(data_get($latePayment->raw_response, '_philobooth_reconciliation_reason'))->toBe('stale_billing_revision')
        ->and(data_get($latePayment->raw_response, '_philobooth_payment_billing_revision'))->toBe(1)
        ->and(data_get($latePayment->raw_response, '_philobooth_active_billing_revision'))->toBe(2)
        ->and($session->billing_revision)->toBe(2)
        ->and((float) $session->extra_amount)->toBe(10000.0)
        ->and((float) $session->final_amount)->toBe(35000.0)
        ->and($session->status)->toBe(SessionStatus::Editing);
});
