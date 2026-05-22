<?php

namespace Database\Factories;

use App\Models\PhotoSession;
use App\Models\SessionPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SessionPhoto>
 */
class SessionPhotoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'session_id' => PhotoSession::factory(),
            'slot_number' => $this->faker->numberBetween(1, 6),
            'original_path' => 'photos/'.Str::random(8).'.jpg',
            'processed_path' => null,
            'is_selected' => true,
            'retake_count' => 0,
            'captured_at' => now(),
        ];
    }
}
