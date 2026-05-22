<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PhotoSession extends Model
{
    use BelongsToBranch, HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => SessionStatus::class,
        'current_step' => SessionStep::class,
        'payment_method' => PaymentMethod::class,
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'print_quantity' => 'integer',
        'download_count' => 'integer',
        'show_date_stamp' => 'boolean',
        'stickers' => 'array',
        'paid_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'expired_at' => 'datetime',
        'download_expires_at' => 'datetime',
    ];

    public function printer(): BelongsTo
    {
        return $this->belongsTo(Printer::class);
    }

    public function frame(): BelongsTo
    {
        return $this->belongsTo(Frame::class);
    }

    public function filter(): BelongsTo
    {
        return $this->belongsTo(Filter::class);
    }

    public function paperSize(): BelongsTo
    {
        return $this->belongsTo(PaperSize::class);
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(SessionPhoto::class, 'session_id');
    }

    public function selectedPhotos(): HasMany
    {
        return $this->photos()->where('is_selected', true);
    }

    public function stickers(): HasMany
    {
        return $this->hasMany(SessionSticker::class, 'session_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'session_id');
    }

    public function successfulPayment(): HasOne
    {
        return $this->hasOne(Payment::class, 'session_id')
            ->where('status', 'success')
            ->latestOfMany('paid_at');
    }

    public function printJobs(): HasMany
    {
        return $this->hasMany(PrintJob::class, 'session_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'session_id');
    }
}
