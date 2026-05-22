<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\PhotoSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'session_id' => PhotoSession::factory(),
            'method' => PaymentMethod::QrisDoku,
            'amount' => 50000,
            'doku_invoice_number' => 'DK-'.strtoupper(Str::random(10)),
            'doku_request_id' => Str::uuid()->toString(),
            'status' => PaymentStatus::Success,
            'paid_at' => now(),
            'raw_response' => ['source' => 'doku', 'mock' => true],
        ];
    }

    public function pending(): self
    {
        return $this->state(fn () => [
            'status' => PaymentStatus::Pending,
            'paid_at' => null,
            'expired_at' => now()->addMinutes(5),
        ]);
    }

    public function manualQris(): self
    {
        return $this->state(fn () => [
            'method' => PaymentMethod::QrisManual,
            'doku_invoice_number' => null,
            'doku_request_id' => null,
            'qris_image_path' => 'qris/'.Str::random(8).'.png',
        ]);
    }
}
