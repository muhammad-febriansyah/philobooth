<?php

use App\Enums\PrinterConnectionType;
use App\Enums\PrinterModel;
use App\Enums\UserRole;
use App\Models\Branch;
use App\Models\Printer;
use App\Models\User;

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleSeeder::class);

    $this->branch = Branch::factory()->create();

    $this->admin = User::factory()->create(['branch_id' => $this->branch->id]);
    $this->admin->assignRole(UserRole::Admin->value);
});

function printerPayload(Branch $branch, array $overrides = []): array
{
    return array_merge([
        'branch_id' => $branch->id,
        'name' => 'Printer Test',
        'model' => PrinterModel::EpsonL8050->value,
        'connection_type' => PrinterConnectionType::Network->value,
        'ip_address' => '192.168.1.10',
        'port' => 9100,
        'system_printer_name' => 'EPSON-TEST',
        'is_default' => false,
        'is_active' => true,
    ], $overrides);
}

test('printer pertama di cabang otomatis jadi default walau tidak dicentang', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.printer.store'), printerPayload($this->branch, [
            'name' => 'Printer Pertama',
            'is_default' => false,
        ]))
        ->assertRedirect();

    $printer = Printer::where('branch_id', $this->branch->id)->first();

    expect($printer)->not->toBeNull();
    expect($printer->is_default)->toBeTrue();
});

test('printer kedua yang ditandai default copot status default dari printer lama', function () {
    $old = Printer::factory()->create([
        'branch_id' => $this->branch->id,
        'name' => 'Printer Lama',
        'is_default' => true,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.printer.store'), printerPayload($this->branch, [
            'name' => 'Printer Baru',
            'is_default' => true,
        ]))
        ->assertRedirect();

    $defaults = Printer::where('branch_id', $this->branch->id)
        ->where('is_default', true)
        ->get();

    expect($defaults)->toHaveCount(1);
    expect($defaults->first()->name)->toBe('Printer Baru');
    expect($old->fresh()->is_default)->toBeFalse();
});

test('printer baru tanpa centang default tidak mengganggu printer default yang sudah ada', function () {
    $existing = Printer::factory()->create([
        'branch_id' => $this->branch->id,
        'name' => 'Printer Lama',
        'is_default' => true,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.printer.store'), printerPayload($this->branch, [
            'name' => 'Printer Cadangan',
            'is_default' => false,
        ]))
        ->assertRedirect();

    expect($existing->fresh()->is_default)->toBeTrue();
    expect(Printer::where('branch_id', $this->branch->id)->where('is_default', true)->count())
        ->toBe(1);
});

test('update centang default copot default dari printer lain di cabang yang sama', function () {
    $a = Printer::factory()->create([
        'branch_id' => $this->branch->id,
        'name' => 'A',
        'is_default' => true,
    ]);

    $b = Printer::factory()->create([
        'branch_id' => $this->branch->id,
        'name' => 'B',
        'is_default' => false,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.printer.update', $b), printerPayload($this->branch, [
            'name' => 'B',
            'is_default' => true,
        ]))
        ->assertRedirect();

    expect($a->fresh()->is_default)->toBeFalse();
    expect($b->fresh()->is_default)->toBeTrue();
});

test('uncheck default pada satu-satunya printer akan otomatis dipulihkan', function () {
    $only = Printer::factory()->create([
        'branch_id' => $this->branch->id,
        'name' => 'Solo',
        'is_default' => true,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.printer.update', $only), printerPayload($this->branch, [
            'name' => 'Solo',
            'is_default' => false,
        ]))
        ->assertRedirect();

    expect($only->fresh()->is_default)->toBeTrue();
});
