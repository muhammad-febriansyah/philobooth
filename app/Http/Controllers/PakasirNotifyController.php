<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\Booth\QrisPaymentService;
use App\Services\Booth\SettlePakasirPaymentService;
use App\Services\Pakasir\PakasirClient;
use App\Services\Pakasir\PakasirException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Receive Pakasir payment-completed webhook.
 *
 * Endpoint: POST /api/booth/pakasir/callback (no auth).
 *
 * SECURITY: Pakasir webhooks are UNSIGNED — anyone who guesses an order_id could
 * POST a fake "completed". So we never trust the webhook body. We look the
 * payment up by order_id, then re-query Pakasir's authenticated transaction
 * detail API (with our own stored amount) and only mark paid when THAT reports
 * "completed" and the amount matches.
 */
class PakasirNotifyController extends Controller
{
    public function __invoke(
        Request $request,
        PakasirClient $pakasir,
        QrisPaymentService $payments,
        SettlePakasirPaymentService $settlements,
    ): JsonResponse {
        if (! $pakasir->isConfigured()) {
            Log::warning('Pakasir notify hit but client not configured');

            return response()->json(['message' => 'service disabled'], 503);
        }

        $payload = $request->json()->all();
        $orderId = $payload['order_id'] ?? null;

        if (! is_string($orderId) || $orderId === '' || strlen($orderId) > 64) {
            return response()->json(['message' => 'missing order_id'], 422);
        }

        $payment = Payment::query()
            ->where('pakasir_order_id', $orderId)
            ->where('method', PaymentMethod::QrisPakasir)
            ->first();

        if (! $payment) {
            Log::warning('Pakasir notify for unknown order', ['order_id' => $orderId]);

            return response()->json(['message' => 'not found'], 404);
        }

        // Idempotent — a duplicate webhook for an already-paid order is a no-op.
        if ($payment->status === PaymentStatus::Success) {
            return response()->json(['message' => 'ok']);
        }

        if (! in_array($payment->status, [PaymentStatus::Pending, PaymentStatus::Expired], true)) {
            return response()->json(['message' => 'payment is no longer pending'], 409);
        }

        if ($payment->status === PaymentStatus::Pending) {
            try {
                $localState = $payments->reconcileStale($payment->session, $payment, $pakasir);
            } catch (PakasirException $exception) {
                Log::error('Pakasir stale payment inquiry failed', [
                    'order_id' => $orderId,
                    'error' => $exception->getMessage(),
                ]);

                return response()->json(['message' => 'verify failed'], 502);
            }
            if ($localState === PaymentStatus::Success) {
                return response()->json(['message' => 'ok']);
            }
            if ($localState === PaymentStatus::Expired) {
                return response()->json(['message' => 'payment is expired'], 409);
            }
        }

        // Verify against the authenticated API using OUR amount, not the body's.
        try {
            $verified = $pakasir->verifyTransaction($orderId, (int) $payment->amount);
        } catch (PakasirException $e) {
            Log::error('Pakasir verify failed on notify', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'verify failed'], 502);
        }

        if ($verified['status'] !== 'completed' || $verified['amount'] !== (int) $payment->amount) {
            Log::warning('Pakasir notify rejected: status/amount mismatch', [
                'order_id' => $orderId,
                'verified_status' => $verified['status'],
                'verified_amount' => $verified['amount'],
                'expected_amount' => (int) $payment->amount,
            ]);

            return response()->json(['message' => 'not completed'], 409);
        }

        $settlements->settle($payment, $verified['raw']);

        return response()->json(['message' => 'ok']);
    }
}
