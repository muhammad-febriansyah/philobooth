<?php

namespace Database\Factories;

use App\Models\BoothDevice;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BoothDevice>
 */
class BoothDeviceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'device_uuid' => (string) Str::uuid(),
            'name' => 'Philobooth Booth',
            'token_hash' => hash('sha256', 'pb_'.Str::random(32)),
            'paired_at' => now(),
            'last_seen_at' => now(),
            'capabilities' => ['camera' => 'mock', 'printer' => 'mock'],
        ];
    }
}
