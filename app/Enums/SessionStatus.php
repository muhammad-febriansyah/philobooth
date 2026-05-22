<?php

namespace App\Enums;

enum SessionStatus: string
{
    case Started = 'started';
    case PaymentPending = 'payment_pending';
    case Paid = 'paid';
    case Capturing = 'capturing';
    case Editing = 'editing';
    case Printing = 'printing';
    case Completed = 'completed';
    case Expired = 'expired';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Started => 'Dimulai',
            self::PaymentPending => 'Menunggu Pembayaran',
            self::Paid => 'Lunas',
            self::Capturing => 'Sedang Foto',
            self::Editing => 'Sedang Edit',
            self::Printing => 'Sedang Cetak',
            self::Completed => 'Selesai',
            self::Expired => 'Kedaluwarsa',
            self::Cancelled => 'Dibatalkan',
        };
    }
}
