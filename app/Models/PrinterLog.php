<?php

namespace App\Models;

use App\Enums\PrinterLogEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrinterLog extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'event' => PrinterLogEvent::class,
        'meta' => 'array',
        'created_at' => 'datetime',
    ];

    public function printer(): BelongsTo
    {
        return $this->belongsTo(Printer::class);
    }
}
