<?php

namespace App\Enums;

enum FrameType: string
{
    case Kolase = 'kolase';
    case Strip = 'strip';
    case Majalah = 'majalah';
    case Thermal = 'thermal';
    case Flipbook = 'flipbook';

    public function label(): string
    {
        return match ($this) {
            self::Kolase => 'Kolase',
            self::Strip => 'Strip',
            self::Majalah => 'Majalah',
            self::Thermal => 'Thermal',
            self::Flipbook => 'Flipbook',
        };
    }
}
