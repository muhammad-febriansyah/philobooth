<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Cabang = 'cabang';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Cabang => 'Cabang',
        };
    }

    /** @return array<int, string> */
    public static function names(): array
    {
        return array_map(fn (self $r) => $r->value, self::cases());
    }
}
