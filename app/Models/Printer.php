<?php

namespace App\Models;

use App\Enums\PrinterConnectionType;
use App\Enums\PrinterModel;
use App\Enums\PrinterStatus;
use App\Models\Concerns\BelongsToBranch;
use Database\Factories\PrinterFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Printer extends Model
{
    /** @use HasFactory<PrinterFactory> */
    use BelongsToBranch, HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'model' => PrinterModel::class,
        'connection_type' => PrinterConnectionType::class,
        'last_status' => PrinterStatus::class,
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'port' => 'integer',
        'supported_paper_sizes' => 'array',
        'settings' => 'array',
        'last_checked_at' => 'datetime',
    ];

    public function paperConfigs(): HasMany
    {
        return $this->hasMany(PrinterPaperConfig::class);
    }

    public function printJobs(): HasMany
    {
        return $this->hasMany(PrintJob::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(PrinterLog::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PhotoSession::class);
    }
}
