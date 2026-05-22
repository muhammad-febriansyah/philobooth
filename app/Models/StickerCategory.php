<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StickerCategory extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function stickers(): HasMany
    {
        return $this->hasMany(Sticker::class, 'category_id');
    }
}
