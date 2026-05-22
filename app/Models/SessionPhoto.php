<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionPhoto extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'slot_number' => 'integer',
        'is_selected' => 'boolean',
        'retake_count' => 'integer',
        'captured_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(PhotoSession::class, 'session_id');
    }
}
