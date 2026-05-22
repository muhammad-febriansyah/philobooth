<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Sticker extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'tags' => 'array',
        'is_animated' => 'boolean',
        'is_premium' => 'boolean',
        'is_active' => 'boolean',
        'usage_count' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(StickerCategory::class);
    }

    public function frames(): BelongsToMany
    {
        return $this->belongsToMany(Frame::class, 'frame_stickers')
            ->withPivot(['x', 'y', 'width', 'height', 'rotation', 'z_index'])
            ->withTimestamps();
    }
}
