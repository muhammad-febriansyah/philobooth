<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->randomElement([
            'Senayan City', 'Grand Indonesia', 'Pondok Indah Mall',
            'Kota Kasablanka', 'BSD City Mall', 'Bintaro Xchange',
            'Living World', 'Pakuwon Mall',
        ]);

        return [
            'code' => strtoupper(Str::random(3)).'-'.$this->faker->unique()->numberBetween(10, 99),
            'name' => $name,
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->randomElement(['Jakarta Pusat', 'Jakarta Selatan', 'Tangerang', 'Surabaya']),
            'province' => 'DKI Jakarta',
            'phone' => '021-'.$this->faker->numerify('########'),
            'manager_name' => $this->faker->name(),
            'timezone' => 'Asia/Jakarta',
            'is_active' => true,
            'opened_at' => $this->faker->dateTimeBetween('-3 years'),
            'settings' => ['operating_hours' => '10:00-22:00'],
        ];
    }
}
