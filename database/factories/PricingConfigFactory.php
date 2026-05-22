<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\PaperSize;
use App\Models\PricingConfig;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PricingConfig>
 */
class PricingConfigFactory extends Factory
{
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'paper_size_id' => PaperSize::factory(),
            'base_price' => $this->faker->randomElement([15000, 20000, 25000, 35000, 50000]),
            'min_prints' => 1,
            'max_prints' => 10,
            'is_active' => true,
        ];
    }
}
