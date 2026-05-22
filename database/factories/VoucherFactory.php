<?php

namespace Database\Factories;

use App\Models\Voucher;
use App\Models\VoucherBatch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Voucher>
 */
class VoucherFactory extends Factory
{
    public function definition(): array
    {
        return [
            'batch_id' => VoucherBatch::factory(),
            'code' => strtoupper(Str::random(8)),
            'used_count' => 0,
            'max_uses' => 1,
            'is_active' => true,
            'used_at' => null,
            'used_by_session_id' => null,
        ];
    }
}
