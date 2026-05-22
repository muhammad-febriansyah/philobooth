<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VoucherDummySeeder extends Seeder
{
    public function run(): void
    {
        // Wipe legacy voucher + batch (dash-prefixed codes from generator lama)
        DB::table('payments')->where('doku_invoice_number', 'like', 'VCH-%')->delete();
        DB::table('vouchers')->delete();
        DB::table('voucher_batches')->delete();

        $senayan = Branch::query()->where('code', 'SCP')->first()
            ?? Branch::query()->first();

        // Semua kode TEPAT 8 karakter (sesuai input slot kiosk)
        $dummies = [
            [
                'name' => 'Welcome Free Photo',
                'code' => 'WELCOME8',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => now()->subDays(7),
                'valid_until' => now()->addMonths(6),
            ],
            [
                'name' => 'Kupon Ulang Tahun Booth',
                'code' => 'BDAY2026',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => now()->subDay(),
                'valid_until' => now()->endOfYear(),
            ],
            [
                'name' => 'Promo Lebaran 2026',
                'code' => 'LEBARAN2',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => '2026-03-20',
                'valid_until' => '2026-04-30',
            ],
            [
                'name' => 'VIP Member Senayan',
                'code' => 'VIPSCP01',
                'branch_id' => $senayan?->id,
                'max_uses' => 1,
                'valid_from' => now()->subWeek(),
                'valid_until' => now()->addYear(),
            ],
            [
                'name' => 'Couple Photo Valentine',
                'code' => 'LOVE2026',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => '2026-02-01',
                'valid_until' => '2026-02-28',
            ],
            [
                'name' => 'Influencer Collab Day',
                'code' => 'INFLUNCR',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => now(),
                'valid_until' => now()->addMonths(3),
            ],
            [
                'name' => 'Corporate Event Pack',
                'code' => 'CORPSCP1',
                'branch_id' => $senayan?->id,
                'max_uses' => 1,
                'valid_from' => now(),
                'valid_until' => now()->addMonths(2),
            ],
            [
                'name' => 'Weekend Giveaway',
                'code' => 'WEEKEND8',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => null,
                'valid_until' => null,
            ],
            [
                'name' => 'Kupon Tester (Expired)',
                'code' => 'TESTEXPR',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => '2025-01-01',
                'valid_until' => '2025-12-31',
            ],
            [
                'name' => 'Sample Demo Kode',
                'code' => 'DEMO2026',
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => null,
                'valid_until' => null,
            ],
        ];

        foreach ($dummies as $row) {
            Voucher::create(array_merge($row, [
                'is_active' => true,
                'used_count' => 0,
            ]));
        }

        // Beberapa voucher random untuk realism
        for ($i = 0; $i < 8; $i++) {
            Voucher::create([
                'name' => 'Kupon Random #'.($i + 1),
                'code' => 'GIFT'.Str::upper(Str::random(4)),
                'branch_id' => null,
                'max_uses' => 1,
                'valid_from' => now()->subDays(random_int(0, 30)),
                'valid_until' => now()->addDays(random_int(30, 180)),
                'is_active' => true,
                'used_count' => 0,
            ]);
        }
    }
}
