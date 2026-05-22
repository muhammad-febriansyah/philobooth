<?php

namespace Database\Factories;

use App\Models\Filter;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Filter>
 */
class FilterFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->unique()->randomElement([
            'Original', 'Warm pop', 'Film noir',
            'Pastel', 'Y2K', 'Vintage', 'Fresh',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(4),
            'thumbnail_path' => 'filters/'.Str::slug($name).'.png',
            'css_filter' => $this->faker->randomElement([
                'none',
                'sepia(0.55) contrast(0.95) brightness(1.05)',
                'grayscale(1) contrast(1.15)',
                'saturate(1.2) sepia(0.18) brightness(1.04)',
            ]),
            'filter_matrix' => null,
            'sort_order' => $this->faker->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
