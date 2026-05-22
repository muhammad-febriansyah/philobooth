<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrinterPaperConfig extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'price_per_print' => 'decimal:2',
        'ink_cost_estimate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function printer(): BelongsTo
    {
        return $this->belongsTo(Printer::class);
    }

    public function paperSize(): BelongsTo
    {
        return $this->belongsTo(PaperSize::class);
    }
}
