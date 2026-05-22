<?php

namespace App\Models;

use App\Enums\FrameOrientation;
use App\Enums\FrameType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Frame extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'orientation' => FrameOrientation::class,
        'type' => FrameType::class,
        'canvas_data' => 'array',
        'price_addon' => 'decimal:2',
        'is_premium' => 'boolean',
        'is_active' => 'boolean',
        'photo_slots' => 'integer',
        'usage_count' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FrameCategory::class);
    }

    public function paperSize(): BelongsTo
    {
        return $this->belongsTo(PaperSize::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function photoSlots(): HasMany
    {
        return $this->hasMany(FramePhotoSlot::class);
    }

    public function frameStickers(): HasMany
    {
        return $this->hasMany(FrameSticker::class);
    }

    public function stickers(): BelongsToMany
    {
        return $this->belongsToMany(Sticker::class, 'frame_stickers')
            ->withPivot(['x', 'y', 'width', 'height', 'rotation', 'z_index'])
            ->withTimestamps();
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PhotoSession::class);
    }
}
