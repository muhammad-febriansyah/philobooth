<?php

namespace Database\Factories;

use App\Models\StickerCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<StickerCategory>
 */
class StickerCategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->unique()->randomElement([
            'Emoji', 'Hearts', 'Birthday', 'Wedding',
            'Cute', 'Doodle', 'K-pop', 'Confetti',
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
