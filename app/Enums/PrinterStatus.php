<?php

namespace App\Enums;

enum PrinterStatus: string
{
    case Ready = 'ready';
    case Busy = 'busy';
    case Error = 'error';
    case Offline = 'offline';

    public function label(): string
    {
        return match ($this) {
            self::Ready => 'Siap',
            self::Busy => 'Sedang Cetak',
            self::Error => 'Error',
            self::Offline => 'Offline',
        };
    }
}
