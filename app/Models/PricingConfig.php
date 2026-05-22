<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PricingConfig extends Model
{
    use BelongsToBranch, HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'base_price' => 'decimal:2',
        'min_prints' => 'integer',
        'max_prints' => 'integer',
        'is_active' => 'boolean',
    ];

    public function paperSize(): BelongsTo
    {
        return $this->belongsTo(PaperSize::class);
    }
}
