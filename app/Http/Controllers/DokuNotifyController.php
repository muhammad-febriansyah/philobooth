<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Models\Payment;
use App\Services\Doku\DokuClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Receive DOKU async notification on payment status change.
 *
 * Endpoint: POST /api/doku/notify (no auth, signature-verified)
 */
class DokuNotifyController extends Controller
{
    public function __invoke(Request $request, DokuClient $doku): JsonResponse
    {
        if (! $doku->isConfigured()) {
            Log::warning('DOKU notify hit but client not configured');

            return response()->json(['message' => 'service disabled'], 503);
        }

        if (! $doku->verifyNotification($request)) {
            Log::warning('DOKU notify signature mismatch', [
                'headers' => $request->headers->all(),
            ]);

            return response()->json(['message' => 'invalid signature'], 401);
        }

        $payload = $request->json()->all();
        $invoiceNumber = $payload['order']['invoice_number']
            ?? $payload['transaction']['original_request_id']
            ?? null;
        $statusRaw = strtolower((string) ($payload['transaction']['status'] ?? ''));

        if (! $invoiceNumber) {
            return response()->json(['message' => 'missing invoice'], 422);
        }

        $payment = Payment::query()
            ->where('doku_invoice_number', $invoiceNumber)
            ->where('method', PaymentMethod::QrisDoku)
            ->first();

        if (! $payment) {
            Log::warning('DOKU notify for unknown invoice', ['invoice' => $invoiceNumber]);

            return response()->json(['message' => 'not found'], 404);
        }

        $isSuccess = in_array($statusRaw, ['success', 'paid', 'settlement', 'capture'], true);
        $isFailed = in_array($statusRaw, ['failed', 'expired', 'voided', 'cancelled'], true);

        DB::transaction(function () use ($payment, $payload, $isSuccess, $isFailed, $statusRaw) {
            if ($isSuccess && $payment->status !== PaymentStatus::Success) {
                $payment->update([
                    'status' => PaymentStatus::Success,
                    'paid_at' => now(),
                    'doku_approval_code' => $payload['acquirer']['approval_code'] ?? null,
                    'doku_acquirer' => $payload['acquirer']['id'] ?? null,
                    'raw_response' => $payload,
                ]);

                $session = $payment->session;

                if ($session && $session->status !== SessionStatus::Paid) {
                    $session->update([
                        'status' => SessionStatus::Paid,
                        'current_step' => SessionStep::Frame,
                        'paid_at' => now(),
                    ]);
                }

                return;
            }

            if ($isFailed && $payment->status === PaymentStatus::Pending) {
                $payment->update([
                    'status' => $statusRaw === 'expired' ? PaymentStatus::Expired : PaymentStatus::Failed,
                    'raw_response' => $payload,
                ]);
            }
        });

        return response()->json(['message' => 'ok']);
    }
}
