<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionSticker extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'x' => 'integer',
        'y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'rotation' => 'integer',
        'z_index' => 'integer',
        'created_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(PhotoSession::class, 'session_id');
    }

    public function sticker(): BelongsTo
    {
        return $this->belongsTo(Sticker::class);
    }
}
