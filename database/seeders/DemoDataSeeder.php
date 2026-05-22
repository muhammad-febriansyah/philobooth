<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PrinterModel;
use App\Enums\PrinterStatus;
use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Filter;
use App\Models\Frame;
use App\Models\FrameCategory;
use App\Models\PaperSize;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\PrinterPaperConfig;
use App\Models\PricingConfig;
use App\Models\SessionPhoto;
use App\Models\Sticker;
use App\Models\StickerCategory;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $paperSizes = $this->seedPaperSizes();
        $branches = $this->seedBranches();
        $this->seedUsers($branches);
        $printers = $this->seedPrinters($branches, $paperSizes);
        $this->seedPricing($branches, $paperSizes);
        $this->seedPrinterPaperConfigs($printers, $paperSizes);
        $frames = $this->seedFramesAndCategories($paperSizes);
        $stickers = $this->seedStickersAndCategories();
        $filters = $this->seedFilters();
        $vouchers = $this->seedVouchers($branches);
        $this->seedSessions($branches, $printers, $frames, $filters, $paperSizes, $vouchers);
    }

    /** @return array<string, PaperSize> */
    private function seedPaperSizes(): array
    {
        $data = [
            ['code' => '4R', 'name' => '4R Photo', 'width_mm' => 102, 'height_mm' => 152],
            ['code' => '5R', 'name' => '5R Photo', 'width_mm' => 127, 'height_mm' => 178],
            ['code' => 'A4', 'name' => 'A4', 'width_mm' => 210, 'height_mm' => 297],
            ['code' => 'A5', 'name' => 'A5', 'width_mm' => 148, 'height_mm' => 210],
            ['code' => 'STRIP', 'name' => 'Photo Strip 2x6', 'width_mm' => 51, 'height_mm' => 152],
        ];

        $result = [];

        foreach ($data as $row) {
            $result[$row['code']] = PaperSize::firstOrCreate(
                ['code' => $row['code']],
                ['name' => $row['name'], 'width_mm' => $row['width_mm'], 'height_mm' => $row['height_mm'], 'is_active' => true],
            );
        }

        return $result;
    }

    /** @return array<int, Branch> */
    private function seedBranches(): array
    {
        $data = [
            ['code' => 'SC-01', 'name' => 'Senayan City', 'city' => 'Jakarta Pusat', 'manager' => 'Dimas P.'],
            ['code' => 'GI-01', 'name' => 'Grand Indonesia', 'city' => 'Jakarta Pusat', 'manager' => 'Sari W.'],
            ['code' => 'PIM-01', 'name' => 'Pondok Indah Mall', 'city' => 'Jakarta Selatan', 'manager' => 'Yoga A.'],
            ['code' => 'KK-01', 'name' => 'Kota Kasablanka', 'city' => 'Jakarta Selatan', 'manager' => 'Niken S.'],
            ['code' => 'BSD-01', 'name' => 'BSD City Mall', 'city' => 'Tangerang', 'manager' => 'Rio H.'],
        ];

        $branches = [];

        foreach ($data as $row) {
            $branches[] = Branch::firstOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'city' => $row['city'],
                    'province' => 'DKI Jakarta',
                    'manager_name' => $row['manager'],
                    'phone' => '021-'.fake()->numerify('########'),
                    'address' => fake()->streetAddress(),
                    'is_active' => true,
                    'opened_at' => now()->subYears(2),
                    'settings' => ['operating_hours' => '10:00-22:00'],
                ],
            );
        }

        return $branches;
    }

    /** @param  array<int, Branch>  $branches */
    private function seedUsers(array $branches): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@philobooth.id'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'phone' => '081234567890',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $admin->assignRole(UserRole::Admin->value);

        foreach ($branches as $branch) {
            $email = 'cabang.'.Str::lower(str_replace('-', '', $branch->code)).'@philobooth.id';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'Admin '.$branch->name,
                    'branch_id' => $branch->id,
                    'password' => Hash::make('password'),
                    'phone' => '081'.fake()->numerify('#########'),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ],
            );

            $user->assignRole(UserRole::Cabang->value);
        }
    }

    /**
     * @param  array<int, Branch>  $branches
     * @param  array<string, PaperSize>  $paperSizes
     * @return array<int, Printer>
     */
    private function seedPrinters(array $branches, array $paperSizes): array
    {
        $printers = [];

        foreach ($branches as $branch) {
            $count = fake()->numberBetween(1, 2);

            for ($i = 1; $i <= $count; $i++) {
                $model = fake()->randomElement(PrinterModel::cases());

                $printers[] = Printer::create([
                    'branch_id' => $branch->id,
                    'name' => "Printer {$i} {$model->label()}",
                    'model' => $model,
                    'connection_type' => 'usb',
                    'system_printer_name' => 'EPSON-'.Str::upper(Str::random(4)),
                    'is_default' => $i === 1,
                    'is_active' => true,
                    'max_paper_size' => $model->maxPaperSize(),
                    'supported_paper_sizes' => ['4R', 'A5', 'A4'],
                    'settings' => ['dpi' => 300, 'borderless' => true, 'quality' => 'best'],
                    'last_status' => PrinterStatus::Ready,
                    'last_checked_at' => now(),
                ]);
            }
        }

        return $printers;
    }

    /**
     * @param  array<int, Branch>  $branches
     * @param  array<string, PaperSize>  $paperSizes
     */
    private function seedPricing(array $branches, array $paperSizes): void
    {
        $priceMap = ['4R' => 25000, '5R' => 35000, 'A4' => 40000, 'A5' => 30000, 'STRIP' => 35000];

        foreach ($branches as $branch) {
            foreach ($paperSizes as $code => $paperSize) {
                PricingConfig::firstOrCreate(
                    ['branch_id' => $branch->id, 'paper_size_id' => $paperSize->id],
                    [
                        'base_price' => $priceMap[$code] ?? 25000,
                        'min_prints' => 1,
                        'max_prints' => 10,
                        'is_active' => true,
                    ],
                );
            }
        }
    }

    /**
     * @param  array<int, Printer>  $printers
     * @param  array<string, PaperSize>  $paperSizes
     */
    private function seedPrinterPaperConfigs(array $printers, array $paperSizes): void
    {
        foreach ($printers as $printer) {
            foreach (['4R', 'A5', 'A4'] as $code) {
                if (! isset($paperSizes[$code])) {
                    continue;
                }

                PrinterPaperConfig::firstOrCreate(
                    ['printer_id' => $printer->id, 'paper_size_id' => $paperSizes[$code]->id],
                    [
                        'price_per_print' => fake()->randomElement([2500, 3500, 5000]),
                        'ink_cost_estimate' => 800,
                        'is_active' => true,
                    ],
                );
            }
        }
    }

    /**
     * @param  array<string, PaperSize>  $paperSizes
     * @return array<int, Frame>
     */
    private function seedFramesAndCategories(array $paperSizes): array
    {
        $catNames = ['Birthday', 'Wedding', 'Anniversary', 'K-pop', 'Cute', 'Minimalist'];
        $categories = [];

        foreach ($catNames as $name) {
            $categories[$name] = FrameCategory::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'icon' => Str::lower($name), 'is_active' => true],
            );
        }

        $frames = [];
        $names = [
            'Confetti Pop' => 'Birthday',
            'Sunny Strip' => 'Cute',
            'Pastel Heart' => 'Anniversary',
            'Bold Yellow' => 'Minimalist',
            'K-pop Stars' => 'K-pop',
            'Wedding Lace' => 'Wedding',
            'Cake & Candles' => 'Birthday',
            'Polaroid Frame' => 'Minimalist',
        ];

        foreach ($names as $name => $cat) {
            $frames[] = Frame::firstOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'category_id' => $categories[$cat]->id,
                    'paper_size_id' => $paperSizes['STRIP']->id,
                    'name' => $name,
                    'description' => "Frame {$name} untuk kategori {$cat}",
                    'thumbnail_path' => 'frames/'.Str::slug($name).'.png',
                    'orientation' => 'portrait',
                    'photo_slots' => 4,
                    'canvas_data' => ['version' => '5.3.0', 'objects' => []],
                    'price_addon' => 0,
                    'is_premium' => false,
                    'is_active' => true,
                ],
            );
        }

        return $frames;
    }

    /** @return array<int, Sticker> */
    private function seedStickersAndCategories(): array
    {
        $catNames = ['Birthday', 'Wedding', 'Cute', 'Doodle', 'K-pop'];
        $categories = [];

        foreach ($catNames as $name) {
            $categories[$name] = StickerCategory::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'icon' => Str::lower($name), 'is_active' => true],
            );
        }

        $items = [
            'Cake 🎂' => 'Birthday', 'Party 🎉' => 'Birthday', 'Balloon 🎈' => 'Birthday',
            'Gift 🎁' => 'Birthday', 'Sparkle ✨' => 'Cute', 'Heart 💛' => 'Cute',
            'Star ⭐' => 'Cute', 'Wedding Ring 💍' => 'Wedding',
        ];

        $stickers = [];

        foreach ($items as $name => $cat) {
            $stickers[] = Sticker::firstOrCreate(
                ['name' => $name],
                [
                    'category_id' => $categories[$cat]->id,
                    'image_path' => 'stickers/'.Str::slug($name).'.png',
                    'thumbnail_path' => 'stickers/thumb/'.Str::slug($name).'.png',
                    'is_animated' => false,
                    'tags' => [Str::lower($cat)],
                    'is_active' => true,
                ],
            );
        }

        return $stickers;
    }

    /** @return array<int, Filter> */
    private function seedFilters(): array
    {
        $data = [
            ['Original', 'none'],
            ['Vintage', 'sepia(0.55) contrast(0.95) brightness(1.05)'],
            ['Film Noir', 'grayscale(1) contrast(1.15)'],
            ['Warm Pop', 'saturate(1.2) sepia(0.18) brightness(1.04)'],
            ['Pastel', 'saturate(0.78) brightness(1.08) contrast(0.96)'],
            ['Y2K', 'saturate(1.6) hue-rotate(-15deg) contrast(1.05)'],
            ['Fresh', 'saturate(1.15) brightness(1.08) hue-rotate(5deg)'],
        ];

        $filters = [];

        foreach ($data as $i => [$name, $css]) {
            $filters[] = Filter::firstOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'css_filter' => $css,
                    'sort_order' => $i,
                    'is_active' => true,
                    'thumbnail_path' => 'filters/'.Str::slug($name).'.png',
                ],
            );
        }

        return $filters;
    }

    /**
     * @param  array<int, Branch>  $branches
     * @return array<int, Voucher>
     */
    private function seedVouchers(array $branches): array
    {
        $batch = VoucherBatch::firstOrCreate(
            ['code_prefix' => 'BDAY26'],
            [
                'branch_id' => null,
                'name' => 'Birthday Bash 2026',
                'max_uses_per_voucher' => 1,
                'valid_from' => now()->subMonth(),
                'valid_until' => now()->addMonths(6),
                'total_generated' => 5,
                'is_active' => true,
            ],
        );

        $vouchers = [];

        for ($i = 1; $i <= 5; $i++) {
            $vouchers[] = Voucher::firstOrCreate(
                ['code' => 'BDAY26-'.Str::upper(Str::random(6))],
                [
                    'batch_id' => $batch->id,
                    'used_count' => 0,
                    'max_uses' => 1,
                    'is_active' => true,
                ],
            );
        }

        return $vouchers;
    }

    /**
     * @param  array<int, Branch>  $branches
     * @param  array<int, Printer>  $printers
     * @param  array<int, Frame>  $frames
     * @param  array<int, Filter>  $filters
     * @param  array<string, PaperSize>  $paperSizes
     * @param  array<int, Voucher>  $vouchers
     */
    private function seedSessions(
        array $branches,
        array $printers,
        array $frames,
        array $filters,
        array $paperSizes,
        array $vouchers,
    ): void {
        $now = now();

        for ($i = 0; $i < 25; $i++) {
            $branch = fake()->randomElement($branches);
            $branchPrinter = collect($printers)->firstWhere('branch_id', $branch->id);

            $session = PhotoSession::create([
                'session_code' => 'PB-'.$now->format('Ymd').'-'.Str::upper(Str::random(6)),
                'branch_id' => $branch->id,
                'printer_id' => $branchPrinter?->id,
                'frame_id' => fake()->randomElement($frames)->id,
                'filter_id' => fake()->randomElement($filters)->id,
                'paper_size_id' => $paperSizes['STRIP']->id,
                'status' => 'completed',
                'current_step' => 'done',
                'payment_method' => fake()->randomElement([
                    PaymentMethod::QrisDoku->value,
                    PaymentMethod::QrisManual->value,
                    PaymentMethod::Voucher->value,
                ]),
                'total_amount' => 50000,
                'discount_amount' => 0,
                'final_amount' => 50000,
                'print_quantity' => fake()->numberBetween(1, 2),
                'paid_at' => $now->copy()->subMinutes(fake()->numberBetween(10, 600)),
                'started_at' => $now->copy()->subMinutes(fake()->numberBetween(15, 700)),
                'completed_at' => $now->copy()->subMinutes(fake()->numberBetween(5, 500)),
                'download_token' => Str::random(40),
                'download_expires_at' => $now->copy()->addHours(48),
                'ip_address' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
            ]);

            for ($p = 1; $p <= 4; $p++) {
                SessionPhoto::create([
                    'session_id' => $session->id,
                    'slot_number' => $p,
                    'original_path' => 'photos/sess-'.$session->id.'-'.$p.'.jpg',
                    'is_selected' => true,
                    'captured_at' => $session->started_at,
                ]);
            }

            Payment::create([
                'session_id' => $session->id,
                'method' => $session->payment_method,
                'amount' => $session->final_amount,
                'doku_invoice_number' => $session->payment_method === PaymentMethod::QrisDoku
                    ? 'DK-'.Str::upper(Str::random(10))
                    : null,
                'status' => PaymentStatus::Success,
                'paid_at' => $session->paid_at,
            ]);
        }
    }
}
