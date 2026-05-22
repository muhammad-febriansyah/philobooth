<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    use BelongsToBranch, HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'used_count' => 'integer',
        'max_uses' => 'integer',
        'is_active' => 'boolean',
        'used_at' => 'datetime',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(VoucherBatch::class, 'batch_id');
    }

    public function usedBySession(): BelongsTo
    {
        return $this->belongsTo(PhotoSession::class, 'used_by_session_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PhotoSession::class);
    }
}
