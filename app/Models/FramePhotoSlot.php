<?php

namespace App\Models;

use App\Enums\PhotoSlotShape;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FramePhotoSlot extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'slot_number' => 'integer',
        'x' => 'integer',
        'y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'rotation' => 'integer',
        'border_radius' => 'integer',
        'shape' => PhotoSlotShape::class,
    ];

    public function frame(): BelongsTo
    {
        return $this->belongsTo(Frame::class);
    }
}
