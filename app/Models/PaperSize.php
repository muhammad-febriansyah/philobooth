<?php

namespace App\Models;

use Database\Factories\PaperSizeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaperSize extends Model
{
    /** @use HasFactory<PaperSizeFactory> */
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'width_mm' => 'integer',
        'height_mm' => 'integer',
        'is_active' => 'boolean',
    ];

    public function pricingConfigs(): HasMany
    {
        return $this->hasMany(PricingConfig::class);
    }

    public function printerConfigs(): HasMany
    {
        return $this->hasMany(PrinterPaperConfig::class);
    }

    public function frames(): HasMany
    {
        return $this->hasMany(Frame::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PhotoSession::class);
    }
}
