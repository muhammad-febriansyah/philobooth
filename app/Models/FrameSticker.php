<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FrameSticker extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'x' => 'integer',
        'y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'rotation' => 'integer',
        'z_index' => 'integer',
    ];

    public function frame(): BelongsTo
    {
        return $this->belongsTo(Frame::class);
    }

    public function sticker(): BelongsTo
    {
        return $this->belongsTo(Sticker::class);
    }
}
