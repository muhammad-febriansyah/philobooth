<?php

namespace App\Models;

use Database\Factories\BranchFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    /** @use HasFactory<BranchFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'opened_at' => 'date',
        'settings' => 'array',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function printers(): HasMany
    {
        return $this->hasMany(Printer::class);
    }

    public function frames(): HasMany
    {
        return $this->hasMany(Frame::class);
    }

    public function pricingConfigs(): HasMany
    {
        return $this->hasMany(PricingConfig::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PhotoSession::class);
    }

    public function voucherBatches(): HasMany
    {
        return $this->hasMany(VoucherBatch::class);
    }
}
