<?php

namespace App\Services\Booth;

use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Exceptions\PaymentInProgressException;
use App\Models\AppSetting;
use App\Models\PhotoSession;
use App\Models\PricingConfig;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SetExtraPrintQuantityService
{
    /** @return array<string, int|float|bool> */
    public function update(
        PhotoSession $session,
        int $quantity,
        ?SessionStep $nextStep = null,
    ): array {
        $lock = Cache::lock("booth-billing:{$session->id}", 30);
        if (! $lock->get()) {
            throw new PaymentInProgressException('Tagihan sesi sedang diproses.');
        }

        try {
            return DB::transaction(function () use ($session, $quantity, $nextStep): array {
                $lockedSession = PhotoSession::withoutGlobalScopes()
                    ->lockForUpdate()
                    ->findOrFail($session->id);
                $this->assertMayChange($lockedSession);

                $pricing = PricingConfig::withoutGlobalScopes()
                    ->where('branch_id', $lockedSession->branch_id)
                    ->where('paper_size_id', $lockedSession->paper_size_id)
                    ->where('is_active', true)
                    ->first();
                $maxPrints = max(1, (int) ($pricing?->max_prints ?? AppSetting::get('max_prints', 10)));
                abort_unless($quantity >= 1 && $quantity <= $maxPrints, 422, "Jumlah cetak harus antara 1 dan {$maxPrints}.");

                $baseAmount = max(
                    0,
                    (float) $lockedSession->total_amount - (float) $lockedSession->discount_amount,
                );
                $extraPerPrint = (float) AppSetting::get(
                    'extra_print_price',
                    (float) $lockedSession->total_amount * 0.5,
                );
                $extraAmount = max(0, $quantity - 1) * $extraPerPrint;
                $changed = $quantity !== (int) $lockedSession->print_quantity
                    || $extraAmount !== (float) $lockedSession->extra_amount;

                $updates = [
                    'print_quantity' => $quantity,
                    'extra_amount' => $extraAmount,
                    'final_amount' => $baseAmount + $extraAmount,
                    'billing_revision' => $changed
                        ? $lockedSession->billing_revision + 1
                        : $lockedSession->billing_revision,
                ];
                if ($nextStep) {
                    $updates['current_step'] = $nextStep;
                }
                $lockedSession->update($updates);

                return [
                    'session_id' => $lockedSession->id,
                    'quantity' => $quantity,
                    'base_amount' => $baseAmount,
                    'extra_amount' => $extraAmount,
                    'final_amount' => $baseAmount + $extraAmount,
                    'amount_due' => $extraAmount,
                    'requires_payment' => $extraAmount > 0,
                    'billing_revision' => $lockedSession->billing_revision,
                ];
            });
        } finally {
            $lock->release();
        }
    }

    private function assertMayChange(PhotoSession $session): void
    {
        abort_unless(
            $session->payments()
                ->where('purpose', 'base')
                ->where('status', PaymentStatus::Success)
                ->exists(),
            409,
            'Pembayaran dasar belum berhasil.',
        );
        abort_if(
            in_array($session->status, [
                SessionStatus::Printing,
                SessionStatus::Completed,
                SessionStatus::Cancelled,
                SessionStatus::Expired,
            ], true),
            409,
            'Jumlah cetak tidak dapat diubah pada status sesi saat ini.',
        );
        abort_if(
            $session->payments()
                ->where('purpose', 'extra_print')
                ->where('status', PaymentStatus::Success)
                ->exists(),
            409,
            'Jumlah cetak tidak dapat diubah setelah pembayaran tambahan berhasil.',
        );
        abort_if(
            $session->payments()
                ->where('purpose', 'extra_print')
                ->where('billing_revision', $session->billing_revision)
                ->where('status', PaymentStatus::Pending)
                ->where(function ($query): void {
                    $query->whereNull('expired_at')->orWhere('expired_at', '>', now());
                })
                ->exists(),
            409,
            'Selesaikan pembayaran tambahan aktif sebelum mengubah jumlah cetak.',
        );
    }
}
