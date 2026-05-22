<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Filter extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'filter_matrix' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(PhotoSession::class);
    }
}
