<?php

namespace App\Models;

use App\Enums\PrintJobStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintJob extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => PrintJobStatus::class,
        'quantity' => 'integer',
        'retry_count' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(PhotoSession::class, 'session_id');
    }

    public function printer(): BelongsTo
    {
        return $this->belongsTo(Printer::class);
    }

    public function paperSize(): BelongsTo
    {
        return $this->belongsTo(PaperSize::class);
    }
}
