<?php

namespace App\Enums;

enum PrinterModel: string
{
    case EpsonL8050 = 'epson_l8050';
    case EpsonL3210 = 'epson_l3210';
    case EpsonL1210 = 'epson_l1210';

    public function label(): string
    {
        return match ($this) {
            self::EpsonL8050 => 'Epson L8050',
            self::EpsonL3210 => 'Epson L3210',
            self::EpsonL1210 => 'Epson L1210',
        };
    }

    public function maxPaperSize(): string
    {
        return match ($this) {
            self::EpsonL8050 => 'A3',
            self::EpsonL3210, self::EpsonL1210 => 'A4',
        };
    }
}
