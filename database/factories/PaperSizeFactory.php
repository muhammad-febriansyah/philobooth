<?php

namespace Database\Factories;

use App\Models\PaperSize;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaperSize>
 */
class PaperSizeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->randomElement(['A6', 'A5', 'A4', 'A3', '4R', '5R', '6R']),
            'name' => $this->faker->randomElement(['Postcard', 'Photo Strip', 'Standard', 'Large']),
            'width_mm' => $this->faker->numberBetween(100, 300),
            'height_mm' => $this->faker->numberBetween(150, 420),
            'is_active' => true,
        ];
    }
}
