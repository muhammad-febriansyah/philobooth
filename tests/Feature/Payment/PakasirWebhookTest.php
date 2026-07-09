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
