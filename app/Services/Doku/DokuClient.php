<?php

namespace App\Services\Doku;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * DOKU Jokul Direct API v2 client.
 *
 * Signature: HMAC-SHA256(base64) atas string yang disusun dari:
 *   Client-Id:<id>\n
 *   Request-Id:<uuid>\n
 *   Request-Timestamp:<iso8601 UTC>\n
 *   Request-Target:<path>\n
 *   Digest:<sha256(body) base64>
 *
 * Header format: Signature: HMACSHA256=<base64>
 *
 * @see https://jokul-docs.doku.com/jokul-direct-api/qris/qris-mpm
 */
class DokuClient
{
    private const QRIS_CREATE_PATH = '/qris-emoney/v2/payment-codes';

    private const QRIS_INQUIRY_PATH = '/orders/v1/status';

    public function __construct(
        private readonly string $clientId,
        private readonly string $secretKey,
        private readonly string $baseUrl,
        private readonly ?string $notifyUrl,
        private readonly int $qrisExpiredMinutes,
    ) {}

    public function isConfigured(): bool
    {
        return $this->clientId !== '' && $this->secretKey !== '';
    }

    /**
     * Generate dynamic QRIS payment code.
     *
     * @return array{
     *   invoice_number: string,
     *   request_id: string,
     *   qris_string: string,
     *   qris_image_url: ?string,
     *   expired_at: CarbonImmutable,
     *   raw: array<string, mixed>
     * }
     */
    public function createQrisPayment(string $invoiceNumber, int $amount): array
    {
        $expiredMinutes = $this->qrisExpiredMinutes;
        $body = [
            'order' => [
                'invoice_number' => $invoiceNumber,
                'amount' => (string) $amount,
                'currency' => 'IDR',
            ],
            'qris' => array_filter([
                'expired_time' => $expiredMinutes,
                'callback_url' => $this->notifyUrl,
                'callback_url_result' => $this->notifyUrl,
            ]),
        ];

        $response = $this->request('POST', self::QRIS_CREATE_PATH, $body);

        if (! $response->successful()) {
            throw new DokuException(
                'DOKU QRIS create failed: '.$response->status().' '.$response->body(),
            );
        }

        $data = $response->json();
        $qris = $data['qris'] ?? [];

        return [
            'invoice_number' => $invoiceNumber,
            'request_id' => $response->header('Request-Id') ?: ($data['request_id'] ?? Str::uuid()->toString()),
            'qris_string' => $qris['qris_string'] ?? $qris['qris_content'] ?? '',
            'qris_image_url' => $qris['qris_image'] ?? null,
            'expired_at' => CarbonImmutable::now()->addMinutes($expiredMinutes),
            'raw' => $data,
        ];
    }

    /**
     * Inquiry payment status by invoice_number.
     *
     * @return array{
     *   status: string,
     *   approval_code: ?string,
     *   acquirer: ?string,
     *   raw: array<string, mixed>
     * }
     */
    public function inquiryStatus(string $invoiceNumber): array
    {
        $path = self::QRIS_INQUIRY_PATH.'/'.$invoiceNumber;
        $response = $this->request('GET', $path, []);

        if (! $response->successful()) {
            throw new DokuException(
                'DOKU inquiry failed: '.$response->status().' '.$response->body(),
            );
        }

        $data = $response->json();
        $transaction = $data['transaction'] ?? [];

        return [
            'status' => strtolower((string) ($transaction['status'] ?? 'pending')),
            'approval_code' => $data['acquirer']['approval_code'] ?? null,
            'acquirer' => $data['acquirer']['id'] ?? null,
            'raw' => $data,
        ];
    }

    /**
     * Verify HMAC signature on incoming notify webhook.
     */
    public function verifyNotification(Request $req): bool
    {
        $signature = $req->header('Signature');
        $clientId = $req->header('Client-Id');
        $requestId = $req->header('Request-Id');
        $timestamp = $req->header('Request-Timestamp');
        $requestTarget = $req->header('Request-Target') ?: '/'.ltrim($req->path(), '/');

        if (! $signature || $clientId !== $this->clientId || ! $requestId || ! $timestamp) {
            return false;
        }

        $expected = $this->buildSignature($requestTarget, $req->getContent(), $requestId, $timestamp);

        return hash_equals($expected, $signature);
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function request(string $method, string $path, array $body): Response
    {
        $requestId = (string) Str::uuid();
        $timestamp = CarbonImmutable::now('UTC')->format('Y-m-d\TH:i:s\Z');
        $bodyJson = $body ? json_encode($body, JSON_UNESCAPED_SLASHES) : '';
        $signature = $this->buildSignature($path, $bodyJson, $requestId, $timestamp);

        $client = $this->httpClient($requestId, $timestamp, $signature);

        Log::debug('DOKU request', [
            'method' => $method,
            'path' => $path,
            'request_id' => $requestId,
        ]);

        return $method === 'GET'
            ? $client->get($this->baseUrl.$path)
            : $client->withBody($bodyJson, 'application/json')->send($method, $this->baseUrl.$path);
    }

    private function buildSignature(string $requestTarget, string $body, string $requestId, string $timestamp): string
    {
        $digest = $body === ''
            ? ''
            : base64_encode(hash('sha256', $body, true));

        $components = [
            'Client-Id:'.$this->clientId,
            'Request-Id:'.$requestId,
            'Request-Timestamp:'.$timestamp,
            'Request-Target:'.$requestTarget,
        ];

        if ($digest !== '') {
            $components[] = 'Digest:'.$digest;
        }

        $stringToSign = implode("\n", $components);
        $hmac = hash_hmac('sha256', $stringToSign, $this->secretKey, true);

        return 'HMACSHA256='.base64_encode($hmac);
    }

    private function httpClient(string $requestId, string $timestamp, string $signature): PendingRequest
    {
        return Http::withHeaders([
            'Client-Id' => $this->clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
            'Accept' => 'application/json',
        ])->timeout(15);
    }
}
