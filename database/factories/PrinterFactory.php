<?php

namespace Database\Factories;

use App\Enums\PrinterConnectionType;
use App\Enums\PrinterModel;
use App\Enums\PrinterStatus;
use App\Models\Branch;
use App\Models\Printer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Printer>
 */
class PrinterFactory extends Factory
{
    public function definition(): array
    {
        $model = $this->faker->randomElement(PrinterModel::cases());

        return [
            'branch_id' => Branch::factory(),
            'name' => 'Printer '.$this->faker->randomElement(['Utama', 'Cadangan', 'Lt. 1', 'Lt. 2']).' '.$model->label(),
            'model' => $model,
            'connection_type' => $this->faker->randomElement(PrinterConnectionType::cases()),
            'ip_address' => $this->faker->ipv4(),
            'port' => 9100,
            'system_printer_name' => 'EPSON-'.strtoupper($this->faker->lexify('???')),
            'is_default' => false,
            'is_active' => true,
            'max_paper_size' => $model->maxPaperSize(),
            'supported_paper_sizes' => ['A4', 'A5', '4R'],
            'settings' => [
                'dpi' => 300,
                'color_mode' => 'color',
                'borderless' => true,
                'quality' => 'best',
            ],
            'last_status' => $this->faker->randomElement(PrinterStatus::cases()),
            'last_checked_at' => now(),
        ];
    }
}
