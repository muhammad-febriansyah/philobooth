<?php

namespace App\Services\Booth;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Exceptions\PaymentInProgressException;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Services\Pakasir\PakasirClient;
use App\Services\Pakasir\PakasirException;
use Illuminate\Contracts\Cache\Lock;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QrisPaymentService
{
    public function __construct(private readonly SettlePakasirPaymentService $settlements) {}

    /**
     * @return array{payment: Payment, created: bool}
     */
    public function create(
        PhotoSession $session,
        string $purpose,
        PakasirClient $pakasir,
        ?string $returnStatus = null,
        ?string $returnStep = null,
    ): array {
        $lock = Cache::lock("booth-billing:{$session->id}", 30);

        if (! $lock->get()) {
            throw new PaymentInProgressException('Permintaan pembayaran sedang diproses.');
        }

        try {
            return $this->createWhileLocked(
                $session,
                $purpose,
                $pakasir,
                $returnStatus,
                $returnStep,
            );
        } finally {
            $this->release($lock);
        }
    }

    /**
     * @return array{payment: Payment, created: bool}
     */
    private function createWhileLocked(
        PhotoSession $session,
        string $purpose,
        PakasirClient $pakasir,
        ?string $returnStatus,
        ?string $returnStep,
    ): array {
        $session->refresh();
        $revision = $purpose === 'base' ? 1 : $session->billing_revision;

        $successful = $this->paymentQuery($session, $purpose)
            ->where('billing_revision', $revision)
            ->where('status', PaymentStatus::Success)
            ->latest('id')
            ->first();

        if ($successful) {
            return ['payment' => $successful, 'created' => false];
        }

        $pending = $this->paymentQuery($session, $purpose)
            ->where('billing_revision', $revision)
            ->where('status', PaymentStatus::Pending)
            ->latest('id')
            ->first();

        if ($pending && $this->isStale($pending)) {
            $state = $this->reconcileStale($session, $pending, $pakasir);
            if ($state === PaymentStatus::Success) {
                return ['payment' => $pending->fresh(), 'created' => false];
            }

            $returnStatus ??= data_get($pending->raw_response, '_philobooth_return_status');
            $returnStep ??= data_get($pending->raw_response, '_philobooth_return_step');
            $pending = null;
        }

        if ($pending?->qris_string) {
            return ['payment' => $pending, 'created' => false];
        }

        abort_unless($pakasir->isConfigured(), 503, 'Payment gateway belum tersedia.');
        $created = false;

        if (! $pending) {
            $pending = $this->reserve(
                $session,
                $purpose,
                $revision,
                $returnStatus,
                $returnStep,
            );
            $created = true;
        }

        if ($pending->status === PaymentStatus::Success) {
            return ['payment' => $pending, 'created' => false];
        }

        $result = $pakasir->createQrisPayment($pending->pakasir_order_id, (int) $pending->amount);
        $pending->update([
            'qris_string' => $result['qris_string'],
            'expired_at' => $result['expired_at'],
            'raw_response' => array_merge($result['raw'], [
                '_philobooth_return_status' => data_get($pending->raw_response, '_philobooth_return_status'),
                '_philobooth_return_step' => data_get($pending->raw_response, '_philobooth_return_step'),
            ]),
        ]);

        return ['payment' => $pending->fresh(), 'created' => $created];
    }

    private function reserve(
        PhotoSession $session,
        string $purpose,
        int $revision,
        ?string $returnStatus,
        ?string $returnStep,
    ): Payment {
        return DB::transaction(function () use (
            $session,
            $purpose,
            $revision,
            $returnStatus,
            $returnStep,
        ): Payment {
            $lockedSession = PhotoSession::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($session->id);
            abort_if(
                $purpose === 'extra_print' && $lockedSession->billing_revision !== $revision,
                409,
                'Tagihan tambahan berubah. Silakan ulangi permintaan.',
            );

            $successful = $this->paymentQuery($lockedSession, $purpose)
                ->where('billing_revision', $revision)
                ->where('status', PaymentStatus::Success)
                ->latest('id')
                ->first();
            if ($successful) {
                return $successful;
            }

            $active = $this->paymentQuery($lockedSession, $purpose)
                ->where('billing_revision', $revision)
                ->where('status', PaymentStatus::Pending)
                ->latest('id')
                ->first();
            if ($active) {
                return $active;
            }

            $amount = $this->amountFor($lockedSession, $purpose);
            $attempt = (int) $this->paymentQuery($lockedSession, $purpose)
                ->where('billing_revision', $revision)
                ->max('attempt') + 1;
            $orderId = 'PB'.now()->format('ymdHis').Str::upper(Str::random(8));

            $lockedSession->update([
                'payment_method' => PaymentMethod::QrisPakasir,
                'status' => SessionStatus::PaymentPending,
                'current_step' => SessionStep::Payment,
            ]);

            return Payment::create([
                'session_id' => $lockedSession->id,
                'purpose' => $purpose,
                'billing_revision' => $revision,
                'attempt' => $attempt,
                'idempotency_key' => "bill:{$purpose}:{$revision}:{$attempt}",
                'method' => PaymentMethod::QrisPakasir,
                'amount' => $amount,
                'pakasir_order_id' => $orderId,
                'status' => PaymentStatus::Pending,
                'expired_at' => now()->addMinutes($this->expiryMinutes()),
                'raw_response' => [
                    '_philobooth_provider_state' => 'reserved',
                    '_philobooth_return_status' => $returnStatus,
                    '_philobooth_return_step' => $returnStep,
                ],
            ]);
        });
    }

    private function amountFor(PhotoSession $session, string $purpose): int
    {
        if ($purpose === 'extra_print') {
            abort_if(
                in_array($session->status, [
                    SessionStatus::Printing,
                    SessionStatus::Completed,
                    SessionStatus::Expired,
                    SessionStatus::Cancelled,
                ], true),
                409,
                'Sesi sudah melewati tahap pembayaran tambahan.',
            );
            abort_unless(
                (float) $session->extra_amount > 0
                    && $session->payments()
                        ->where('purpose', 'base')
                        ->where('status', PaymentStatus::Success)
                        ->exists(),
                422,
                'Pembayaran dasar belum tervalidasi atau tidak ada tagihan tambahan.',
            );

            return (int) $session->extra_amount;
        }

        abort_unless(
            in_array($session->status, [SessionStatus::Started, SessionStatus::PaymentPending], true),
            409,
            'Sesi sudah melewati tahap pembayaran dasar.',
        );

        $amount = max(0, (float) $session->total_amount - (float) $session->discount_amount);
        abort_unless($amount > 0, 422, 'Tidak ada tagihan yang harus dibayar.');

        return (int) $amount;
    }

    private function restoreExpiredSession(
        PhotoSession $session,
        string $purpose,
        ?string $returnStatus,
        ?string $returnStep,
    ): void {
        if ($session->status !== SessionStatus::PaymentPending) {
            return;
        }

        if ($purpose === 'extra_print') {
            $session->update([
                'status' => $returnStatus ?: SessionStatus::Editing->value,
                'current_step' => $returnStep ?: SessionStep::Generate->value,
            ]);

            return;
        }

        $session->update([
            'status' => SessionStatus::Started,
            'current_step' => SessionStep::Payment,
        ]);
    }

    private function paymentQuery(PhotoSession $session, string $purpose)
    {
        return $session->payments()
            ->where('purpose', $purpose)
            ->where('method', PaymentMethod::QrisPakasir);
    }

    private function release(Lock $lock): void
    {
        $lock->release();
    }

    public function reconcileStale(
        PhotoSession $session,
        Payment $payment,
        PakasirClient $pakasir,
    ): PaymentStatus {
        if ($payment->status !== PaymentStatus::Pending || ! $this->isStale($payment)) {
            return $payment->status;
        }

        abort_unless($pakasir->isConfigured(), 503, 'Payment gateway belum tersedia.');
        try {
            $verified = $pakasir->verifyTransaction($payment->pakasir_order_id, (int) $payment->amount);
        } catch (PakasirException $exception) {
            if ($exception->providerStatus !== 404) {
                throw $exception;
            }

            $verified = ['status' => 'not_found', 'amount' => 0];
        }
        if ($verified['status'] === 'completed') {
            abort_unless(
                $verified['amount'] === (int) $payment->amount,
                409,
                'Nominal pembayaran provider tidak sesuai.',
            );
            $this->settlements->settle($payment, $verified['raw']);

            return PaymentStatus::Success;
        }

        $returnStatus = data_get($payment->raw_response, '_philobooth_return_status');
        $returnStep = data_get($payment->raw_response, '_philobooth_return_step');

        DB::transaction(function () use ($session, $payment, $returnStatus, $returnStep): void {
            $lockedSession = PhotoSession::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($session->id);
            $lockedPayment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            if ($lockedPayment->status !== PaymentStatus::Pending || ! $this->isStale($lockedPayment)) {
                return;
            }

            $lockedPayment->update(['status' => PaymentStatus::Expired]);
            $this->restoreExpiredSession(
                $lockedSession,
                $lockedPayment->purpose,
                $returnStatus,
                $returnStep,
            );
        });

        return $payment->fresh()->status;
    }

    private function isStale(Payment $payment): bool
    {
        return $payment->expired_at
            ? $payment->expired_at->isPast()
            : $payment->created_at->lte(now()->subMinutes($this->expiryMinutes()));
    }

    private function expiryMinutes(): int
    {
        return max(1, (int) config('services.pakasir.qris_expired_minutes', 10));
    }
}
