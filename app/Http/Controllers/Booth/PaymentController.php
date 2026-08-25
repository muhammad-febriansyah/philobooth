<?php

namespace App\Http\Controllers\Booth;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Exceptions\PaymentInProgressException;
use App\Http\Controllers\Controller;
use App\Models\BoothDevice;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Services\Booth\QrisPaymentService;
use App\Services\Booth\SettlePakasirPaymentService;
use App\Services\Pakasir\PakasirClient;
use App\Services\Pakasir\PakasirException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function store(
        Request $request,
        int $photoSessionId,
        PakasirClient $pakasir,
        QrisPaymentService $payments,
    ): JsonResponse {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $data = $request->validate([
            'purpose' => ['sometimes', 'string', 'in:base,extra_print'],
        ]);
        $purpose = $data['purpose'] ?? 'base';
        $session = $this->sessionForDevice($device, $photoSessionId);

        $returnStatus = $purpose === 'extra_print' ? $session->status?->value : null;
        $returnStep = $purpose === 'extra_print' ? $session->current_step?->value : null;

        try {
            $result = $payments->create(
                $session,
                $purpose,
                $pakasir,
                $returnStatus,
                $returnStep,
            );
        } catch (PaymentInProgressException) {
            return response()->json([
                'message' => 'Permintaan pembayaran sedang diproses. Silakan ulangi.',
            ], 409);
        } catch (PakasirException $exception) {
            report($exception);

            return response()->json(['message' => 'QRIS gagal dibuat, silakan coba lagi.'], 502);
        }

        return response()->json(
            $this->paymentPayload($result['payment']),
            $result['created'] ? 201 : 200,
        );
    }

    public function show(
        Request $request,
        int $photoSessionId,
        PakasirClient $pakasir,
        QrisPaymentService $payments,
        SettlePakasirPaymentService $settlements,
    ): JsonResponse {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = $this->sessionForDevice($device, $photoSessionId);
        $payment = $session->payments()
            ->where('method', PaymentMethod::QrisPakasir)
            ->where('status', PaymentStatus::Pending)
            ->latest('id')
            ->first();

        if ($payment?->status === PaymentStatus::Pending
            && $payment->pakasir_order_id
            && $pakasir->isConfigured()) {
            try {
                $state = $payments->reconcileStale($session, $payment, $pakasir);
                if ($state === PaymentStatus::Pending) {
                    $verified = $pakasir->verifyTransaction($payment->pakasir_order_id, (int) $payment->amount);
                    if ($verified['status'] === 'completed' && $verified['amount'] === (int) $payment->amount) {
                        $settlements->settle($payment, $verified['raw']);
                    }
                }

                if ($state !== PaymentStatus::Pending || isset($verified)) {
                    $payment->refresh();
                    $session->refresh();
                }
            } catch (PakasirException) {
                // The EXE can retry this status endpoint without losing its session.
            }
        }

        $latestPayment = $payment?->fresh() ?? $session->payments()
            ->where('method', PaymentMethod::QrisPakasir)
            ->latest('id')
            ->first();

        return response()->json([
            'session_id' => $session->id,
            'status' => $session->status?->value,
            'paid' => $latestPayment?->status === PaymentStatus::Success
                || $session->status === SessionStatus::Paid,
            'payment' => $latestPayment ? $this->paymentPayload($latestPayment) : null,
        ]);
    }

    private function sessionForDevice(BoothDevice $device, int $sessionId): PhotoSession
    {
        return PhotoSession::withoutGlobalScopes()
            ->where('booth_device_id', $device->id)
            ->findOrFail($sessionId);
    }

    /** @return array<string, mixed> */
    private function paymentPayload(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'purpose' => $payment->purpose,
            'billing_revision' => $payment->billing_revision,
            'attempt' => $payment->attempt,
            'method' => $payment->method?->value,
            'status' => $payment->status?->value,
            'amount' => (float) $payment->amount,
            'order_id' => $payment->pakasir_order_id,
            'qris_string' => $payment->qris_string,
            'expired_at' => $payment->expired_at?->toISOString(),
            'paid_at' => $payment->paid_at?->toISOString(),
        ];
    }
}
