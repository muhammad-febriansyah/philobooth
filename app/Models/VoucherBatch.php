<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VoucherBatch extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'max_uses_per_voucher' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'total_generated' => 'integer',
        'total_used' => 'integer',
        'is_active' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class, 'batch_id');
    }
}
