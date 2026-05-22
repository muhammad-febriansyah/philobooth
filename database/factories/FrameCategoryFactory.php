<?php

namespace Database\Factories;

use App\Models\FrameCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FrameCategory>
 */
class FrameCategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->unique()->randomElement([
            'Birthday', 'Wedding', 'Anniversary',
            'K-pop', 'Cute', 'Doodle', 'Minimalist', 'Casual',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(4),
            'icon' => Str::lower($name),
            'sort_order' => $this->faker->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
