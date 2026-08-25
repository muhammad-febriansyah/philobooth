<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoothDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'device_uuid',
        'name',
        'token_hash',
        'pairing_code_hash',
        'pairing_expires_at',
        'paired_at',
        'revoked_at',
        'last_seen_at',
        'app_version',
        'capabilities',
        'settings',
    ];

    protected $hidden = [
        'token_hash',
        'pairing_code_hash',
    ];

    protected function casts(): array
    {
        return [
            'pairing_expires_at' => 'datetime',
            'paired_at' => 'datetime',
            'revoked_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'capabilities' => 'array',
            'settings' => 'array',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function isPaired(): bool
    {
        return $this->paired_at !== null && $this->token_hash !== null;
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }
}
