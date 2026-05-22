<?php

namespace Database\Factories;

use App\Models\Sticker;
use App\Models\StickerCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sticker>
 */
class StickerFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->randomElement([
            'Cake 🎂', 'Party 🎉', 'Balloon 🎈', 'Gift 🎁',
            'Sparkle ✨', 'Confetti 🎊', 'Heart 💛', 'Star ⭐',
        ]);

        return [
            'category_id' => StickerCategory::factory(),
            'name' => $name,
            'image_path' => 'stickers/'.Str::random(8).'.png',
            'thumbnail_path' => 'stickers/thumb/'.Str::random(8).'.png',
            'is_animated' => false,
            'tags' => $this->faker->randomElements(['party', 'birthday', 'cute', 'fun', 'celebrate'], 2),
            'is_premium' => $this->faker->boolean(15),
            'is_active' => true,
        ];
    }
}
