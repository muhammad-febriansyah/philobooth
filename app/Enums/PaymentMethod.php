<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case QrisDoku = 'qris_doku';
    case QrisManual = 'qris_manual';
    case Voucher = 'voucher';
    case Cash = 'cash';
    case Mixed = 'mixed';

    public function label(): string
    {
        return match ($this) {
            self::QrisDoku => 'QRIS (DOKU)',
            self::QrisManual => 'QRIS Manual',
            self::Voucher => 'Voucher',
            self::Cash => 'Tunai',
            self::Mixed => 'Campuran',
        };
    }
}
