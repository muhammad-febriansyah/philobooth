<?php

namespace App\Services\Booth;

use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Models\Payment;
use App\Models\PhotoSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SettlePakasirPaymentService
{
    /** @param array<string, mixed> $raw */
    public function settle(Payment $payment, array $raw): bool
    {
        return DB::transaction(function () use ($payment, $raw): bool {
            $session = PhotoSession::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($payment->session_id);
            $lockedPayment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            if (! in_array($lockedPayment->status, [PaymentStatus::Pending, PaymentStatus::Expired], true)) {
                return false;
            }

            $isExtra = $lockedPayment->purpose === 'extra_print';
            if ($isExtra && $lockedPayment->billing_revision !== $session->billing_revision) {
                $this->markForReconciliation(
                    $lockedPayment,
                    $raw,
                    'stale_billing_revision',
                    [
                        '_philobooth_payment_billing_revision' => $lockedPayment->billing_revision,
                        '_philobooth_active_billing_revision' => $session->billing_revision,
                    ],
                );

                return false;
            }
            if ($isExtra && (float) $lockedPayment->amount !== (float) $session->extra_amount) {
                $this->markForReconciliation(
                    $lockedPayment,
                    $raw,
                    'amount_mismatch',
                    [
                        '_philobooth_payment_amount' => (float) $lockedPayment->amount,
                        '_philobooth_active_extra_amount' => (float) $session->extra_amount,
                    ],
                );

                return false;
            }
            $existingSettlement = $session->payments()
                ->where('purpose', $lockedPayment->purpose)
                ->where('billing_revision', $lockedPayment->billing_revision)
                ->where('status', PaymentStatus::Success)
                ->where('id', '!=', $lockedPayment->id)
                ->first();
            if ($existingSettlement) {
                // Keep the logical bill settled by the first successful attempt,
                // but never hide a second charge confirmed by the provider. The
                // expired status avoids violating the unique settlement key while
                // these fields make the duplicate visible for refund/reconciliation.
                $this->markForReconciliation(
                    $lockedPayment,
                    $raw,
                    'duplicate_provider_settlement',
                    [
                        '_philobooth_winning_payment_id' => $existingSettlement->id,
                        '_philobooth_winning_order_id' => $existingSettlement->pakasir_order_id,
                    ],
                );

                return false;
            }

            $returnStatus = data_get($lockedPayment->raw_response, '_philobooth_return_status');
            $returnStep = data_get($lockedPayment->raw_response, '_philobooth_return_step');
            $terminalSession = in_array($session->status, [
                SessionStatus::Cancelled,
                SessionStatus::Expired,
                SessionStatus::Completed,
            ], true);

            $lockedPayment->update([
                'status' => PaymentStatus::Success,
                'settlement_key' => "session:{$session->id}:{$lockedPayment->purpose}:{$lockedPayment->billing_revision}",
                'paid_at' => now(),
                'requires_reconciliation' => $terminalSession,
                'reconciliation_reason' => $terminalSession ? 'terminal_session_settlement' : null,
                'raw_response' => $terminalSession
                    ? array_merge($raw, [
                        '_philobooth_requires_reconciliation' => true,
                        '_philobooth_reconciliation_reason' => 'terminal_session_settlement',
                        '_philobooth_provider_paid_at' => $this->providerPaidAt($raw),
                        '_philobooth_terminal_session_status' => $session->status?->value,
                    ])
                    : $raw,
            ]);

            if ($terminalSession) {
                $this->logReconciliation($lockedPayment, 'terminal_session_settlement', [
                    'terminal_session_status' => $session->status?->value,
                ]);
            }

            if (! $terminalSession) {
                $session->update([
                    'status' => $isExtra
                        ? ($returnStatus ?: SessionStatus::Editing->value)
                        : SessionStatus::Paid,
                    'current_step' => $isExtra
                        ? ($returnStep ?: SessionStep::Generate->value)
                        : SessionStep::Frame,
                    'final_amount' => max(
                        0,
                        (float) $session->total_amount
                            - (float) $session->discount_amount
                            + (float) $session->extra_amount,
                    ),
                    'paid_at' => now(),
                ]);
            }

            $session->payments()
                ->where('purpose', $lockedPayment->purpose)
                ->where('billing_revision', $lockedPayment->billing_revision)
                ->where('status', PaymentStatus::Pending)
                ->where('id', '!=', $lockedPayment->id)
                ->update(['status' => PaymentStatus::Expired]);

            return true;
        });
    }

    /**
     * @param  array<string, mixed>  $raw
     * @param  array<string, mixed>  $context
     */
    private function markForReconciliation(
        Payment $payment,
        array $raw,
        string $reason,
        array $context = [],
    ): void {
        $payment->update([
            // Non-winning settlements cannot use Success because settlement_key
            // is unique per logical bill. The explicit reconciliation metadata
            // is the operational state that drives a refund/manual review.
            'status' => PaymentStatus::Expired,
            'paid_at' => now(),
            'requires_reconciliation' => true,
            'reconciliation_reason' => $reason,
            'raw_response' => array_merge($raw, [
                '_philobooth_requires_reconciliation' => true,
                '_philobooth_reconciliation_reason' => $reason,
                '_philobooth_provider_paid_at' => $this->providerPaidAt($raw),
            ], $context),
        ]);

        $this->logReconciliation($payment, $reason, $context);
    }

    /** @param array<string, mixed> $raw */
    private function providerPaidAt(array $raw): string
    {
        return (string) (data_get($raw, 'transaction.completed_at')
            ?? data_get($raw, 'transaction.paid_at')
            ?? data_get($raw, 'completed_at')
            ?? data_get($raw, 'paid_at')
            ?? now()->toIso8601String());
    }

    /** @param array<string, mixed> $context */
    private function logReconciliation(Payment $payment, string $reason, array $context = []): void
    {
        Log::critical('Payment requires reconciliation or refund review.', array_merge([
            'payment_id' => $payment->id,
            'session_id' => $payment->session_id,
            'order_id' => $payment->pakasir_order_id,
            'purpose' => $payment->purpose,
            'billing_revision' => $payment->billing_revision,
            'amount' => (float) $payment->amount,
            'reason' => $reason,
            'provider_paid_at' => data_get($payment->raw_response, '_philobooth_provider_paid_at'),
        ], $context));
    }
}
