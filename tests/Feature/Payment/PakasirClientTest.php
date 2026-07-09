<?php

use App\Enums\PaymentMethod;
use App\Models\Payment;
use App\Services\Pakasir\PakasirClient;
use App\Services\Pakasir\PakasirException;
use Illuminate\Support\Facades\Http;

function pakasirTestClient(): PakasirClient
{
    return new PakasirClient('https://app.pakasir.com', 'philobooth', 'testkey', 10);
}

it('creates a qris payment and returns the qris string', function () {
    Http::fake([
        'app.pakasir.com/api/transactioncreate/qris' => Http::response([
            'payment' => [
                'payment_number' => '00020101021226610016ID.CO.SHOPEE',
                'expired_at' => '2026-07-10T01:18:49.678622564Z',
            ],
        ]),
    ]);

    $result = pakasirTestClient()->createQrisPayment('ORDER123', 25000);

    expect($result['order_id'])->toBe('ORDER123')
        ->and($result['qris_string'])->toBe('00020101021226610016ID.CO.SHOPEE');

    Http::assertSent(fn ($request) => $request->url() === 'https://app.pakasir.com/api/transactioncreate/qris'
        && $request['project'] === 'philobooth'
        && $request['order_id'] === 'ORDER123'
        && $request['amount'] === 25000
        && $request['api_key'] === 'testkey');
});

it('throws when qris create response has no payment_number', function () {
    Http::fake([
        'app.pakasir.com/api/transactioncreate/qris' => Http::response(['payment' => []]),
    ]);

    pakasirTestClient()->createQrisPayment('ORDER123', 25000);
})->throws(PakasirException::class);

it('throws when qris create returns an error status', function () {
    Http::fake([
        'app.pakasir.com/api/transactioncreate/qris' => Http::response('server error', 500),
    ]);

    pakasirTestClient()->createQrisPayment('ORDER123', 25000);
})->throws(PakasirException::class);

it('verifies a completed transaction', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response([
            'transaction' => [
                'amount' => 25000,
                'order_id' => 'ORDER123',
                'status' => 'completed',
                'payment_method' => 'qris',
                'completed_at' => '2026-07-10T08:07:02.819+07:00',
            ],
        ]),
    ]);

    $result = pakasirTestClient()->verifyTransaction('ORDER123', 25000);

    expect($result['status'])->toBe('completed')
        ->and($result['amount'])->toBe(25000)
        ->and($result['payment_method'])->toBe('qris');
});

it('returns expiry in app tz so it survives the datetime cast round-trip', function () {
    // Pakasir sends UTC ("Z") with nanosecond precision.
    Http::fake([
        'app.pakasir.com/api/transactioncreate/qris' => Http::response([
            'payment' => [
                'payment_number' => '00020101',
                'expired_at' => '2026-07-09T19:22:22.488171261Z',
            ],
        ]),
    ]);

    $expiredAt = pakasirTestClient()->createQrisPayment('ORDER-TZ', 25000)['expired_at'];

    // Same instant as the UTC input, but expressed in the app timezone.
    expect($expiredAt->utc()->format('Y-m-d H:i:s'))->toBe('2026-07-09 19:22:22')
        ->and($expiredAt->getTimezone()->getName())->toBe(config('app.timezone'));

    // The symptom guard: after a save/read cycle the instant must not shift
    // (a raw-UTC Carbon would re-read 7h earlier and read as already expired).
    $payment = Payment::factory()->create([
        'method' => PaymentMethod::QrisPakasir,
        'pakasir_order_id' => 'ORDER-TZ',
        'doku_invoice_number' => null,
        'expired_at' => $expiredAt,
    ]);

    expect($payment->fresh()->expired_at->utc()->format('Y-m-d H:i:s'))->toBe('2026-07-09 19:22:22');
});

it('reports pending when the transaction detail is empty', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response(['transaction' => []]),
    ]);

    expect(pakasirTestClient()->verifyTransaction('ORDER123', 25000)['status'])->toBe('pending');
});
