<?php

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

it('reports pending when the transaction detail is empty', function () {
    Http::fake([
        'app.pakasir.com/api/transactiondetail*' => Http::response(['transaction' => []]),
    ]);

    expect(pakasirTestClient()->verifyTransaction('ORDER123', 25000)['status'])->toBe('pending');
});
