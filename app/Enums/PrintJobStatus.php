<?php

namespace App\Enums;

enum PrintJobStatus: string
{
    case Queued = 'queued';
    case Printing = 'printing';
    case Success = 'success';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Queued => 'Antri',
            self::Printing => 'Sedang Cetak',
            self::Success => 'Berhasil',
            self::Failed => 'Gagal',
        };
    }
}
