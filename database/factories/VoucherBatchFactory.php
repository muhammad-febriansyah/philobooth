<?php

namespace Database\Factories;

use App\Models\VoucherBatch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VoucherBatch>
 */
class VoucherBatchFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->randomElement([
            'Promo Lebaran 2026', 'Birthday Bash 2026',
            'Anniversary Bonus', 'New Year Special',
        ]);

        return [
            'branch_id' => null,
            'name' => $name,
            'code_prefix' => strtoupper($this->faker->lexify('?????')),
            'max_uses_per_voucher' => 1,
            'valid_from' => now()->subMonth(),
            'valid_until' => now()->addMonths(3),
            'total_generated' => 0,
            'total_used' => 0,
            'is_active' => true,
        ];
    }
}
