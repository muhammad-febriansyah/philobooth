<?php

namespace App\Services\Pakasir;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Pakasir payment gateway client (QRIS).
 *
 * Two calls matter:
 *   - createQrisPayment(): POST /api/transactioncreate/qris → returns the QRIS
 *     payload string to render on the kiosk.
 *   - verifyTransaction(): GET /api/transactiondetail → the SOURCE OF TRUTH for
 *     whether a payment completed. Pakasir webhooks carry NO signature, so we
 *     must re-query this authenticated endpoint before ever marking a payment
 *     paid — both from the webhook and from kiosk status polling.
 *
 * @see https://pakasir.com/p/docs
 */
class PakasirClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $slug,
        private readonly string $apiKey,
        private readonly int $qrisExpiredMinutes,
    ) {}

    public function isConfigured(): bool
    {
        return $this->slug !== '' && $this->apiKey !== '';
    }

    /**
     * Create a dynamic QRIS transaction.
     *
     * @return array{
     *   order_id: string,
     *   qris_string: string,
     *   expired_at: CarbonImmutable,
     *   raw: array<string, mixed>
     * }
     *
     * @throws PakasirException
     */
    public function createQrisPayment(string $orderId, int $amount): array
    {
        $response = Http::acceptJson()
            ->timeout(15)
            ->post($this->baseUrl.'/api/transactioncreate/qris', [
                'project' => $this->slug,
                'order_id' => $orderId,
                'amount' => $amount,
                'api_key' => $this->apiKey,
            ]);

        if (! $response->successful()) {
            throw new PakasirException(
                'Pakasir QRIS create failed: '.$response->status().' '.$response->body(),
            );
        }

        $data = $response->json();
        $payment = $data['payment'] ?? [];
        $qrisString = (string) ($payment['payment_number'] ?? '');

        if ($qrisString === '') {
            throw new PakasirException(
                'Pakasir QRIS create returned no payment_number: '.$response->body(),
            );
        }

        // Pakasir returns expired_at in UTC (e.g. "...Z"). Convert to the app
        // timezone before it round-trips through the datetime cast — Eloquent
        // stores/reads the wall-clock in the app tz, so a raw-UTC Carbon would
        // be re-read 7h off (Asia/Jakarta) and show as already expired.
        $expiredAt = isset($payment['expired_at'])
            ? CarbonImmutable::parse($payment['expired_at'])->setTimezone(config('app.timezone'))
            : CarbonImmutable::now()->addMinutes($this->qrisExpiredMinutes);

        return [
            'order_id' => $orderId,
            'qris_string' => $qrisString,
            'expired_at' => $expiredAt,
            'raw' => $data,
        ];
    }

    /**
     * Verify a transaction's real status server-side (authenticated by api_key).
     * Always pass the amount stored in our own DB — never the amount from an
     * unsigned webhook — so a tampered webhook cannot steer the lookup.
     *
     * @return array{
     *   status: string,
     *   amount: int,
     *   payment_method: ?string,
     *   completed_at: ?string,
     *   raw: array<string, mixed>
     * }
     *
     * @throws PakasirException
     */
    public function verifyTransaction(string $orderId, int $amount): array
    {
        $response = Http::acceptJson()
            ->timeout(15)
            ->get($this->baseUrl.'/api/transactiondetail', [
                'project' => $this->slug,
                'amount' => $amount,
                'order_id' => $orderId,
                'api_key' => $this->apiKey,
            ]);

        if (! $response->successful()) {
            throw new PakasirException(
                'Pakasir transaction detail failed: '.$response->status().' '.$response->body(),
            );
        }

        $data = $response->json();
        $transaction = $data['transaction'] ?? [];

        Log::debug('Pakasir verifyTransaction', [
            'order_id' => $orderId,
            'status' => $transaction['status'] ?? null,
        ]);

        return [
            'status' => strtolower((string) ($transaction['status'] ?? 'pending')),
            'amount' => (int) ($transaction['amount'] ?? 0),
            'payment_method' => $transaction['payment_method'] ?? null,
            'completed_at' => $transaction['completed_at'] ?? null,
            'raw' => $data,
        ];
    }
}
