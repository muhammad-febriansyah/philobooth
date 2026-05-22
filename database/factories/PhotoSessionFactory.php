<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Models\Branch;
use App\Models\PaperSize;
use App\Models\PhotoSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PhotoSession>
 */
class PhotoSessionFactory extends Factory
{
    public function definition(): array
    {
        $startedAt = $this->faker->dateTimeBetween('-7 days');

        return [
            'session_code' => 'PB-'.now()->format('Ymd').'-'.strtoupper(Str::random(6)),
            'branch_id' => Branch::factory(),
            'paper_size_id' => PaperSize::factory(),
            'status' => SessionStatus::Started,
            'current_step' => SessionStep::Start,
            'payment_method' => null,
            'total_amount' => 50000,
            'discount_amount' => 0,
            'final_amount' => 50000,
            'print_quantity' => 1,
            'started_at' => $startedAt,
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }

    public function completed(): self
    {
        return $this->state(fn () => [
            'status' => SessionStatus::Completed,
            'current_step' => SessionStep::Done,
            'payment_method' => $this->faker->randomElement([
                PaymentMethod::QrisDoku,
                PaymentMethod::QrisManual,
                PaymentMethod::Voucher,
            ]),
            'paid_at' => now()->subMinutes(10),
            'completed_at' => now()->subMinutes(2),
            'download_token' => Str::random(40),
            'download_expires_at' => now()->addHours(48),
        ]);
    }

    public function paid(): self
    {
        return $this->state(fn () => [
            'status' => SessionStatus::Paid,
            'current_step' => SessionStep::Frame,
            'payment_method' => PaymentMethod::QrisDoku,
            'paid_at' => now()->subMinutes(2),
        ]);
    }
}
