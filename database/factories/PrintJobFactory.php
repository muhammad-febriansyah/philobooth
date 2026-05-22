<?php

namespace Database\Factories;

use App\Enums\PrintJobStatus;
use App\Models\PaperSize;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\PrintJob;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PrintJob>
 */
class PrintJobFactory extends Factory
{
    public function definition(): array
    {
        return [
            'session_id' => PhotoSession::factory(),
            'printer_id' => Printer::factory(),
            'paper_size_id' => PaperSize::factory(),
            'quantity' => $this->faker->numberBetween(1, 3),
            'file_path' => 'prints/'.Str::random(8).'.pdf',
            'status' => PrintJobStatus::Success,
            'started_at' => now()->subMinutes(2),
            'completed_at' => now()->subMinutes(1),
            'retry_count' => 0,
        ];
    }
}
