<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FrameCategory extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function frames(): HasMany
    {
        return $this->hasMany(Frame::class, 'category_id');
    }
}
