<?php

namespace Database\Factories;

use App\Enums\FrameOrientation;
use App\Models\Frame;
use App\Models\FrameCategory;
use App\Models\PaperSize;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Frame>
 */
class FrameFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->randomElement([
            'Confetti Pop', 'Sunny Strip', 'Pastel Heart', 'Bold Yellow',
            'K-pop Stars', 'Wedding Lace', 'Doodle Friends', 'Polaroid Frame',
            'Cake & Candles', 'Love Confetti', 'Wedding Gold', 'Hi! Sticker',
        ]);

        return [
            'category_id' => FrameCategory::factory(),
            'paper_size_id' => PaperSize::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(6),
            'description' => $this->faker->sentence(),
            'thumbnail_path' => 'frames/'.Str::random(8).'.png',
            'orientation' => $this->faker->randomElement(FrameOrientation::cases()),
            'photo_slots' => $this->faker->randomElement([1, 2, 4, 6]),
            'canvas_data' => ['version' => '5.3.0', 'objects' => []],
            'price_addon' => $this->faker->randomElement([0, 0, 0, 5000, 10000]),
            'is_premium' => $this->faker->boolean(20),
            'is_active' => true,
        ];
    }
}
