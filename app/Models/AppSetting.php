<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AppSetting extends Model
{
    protected $guarded = ['id'];

    public const CACHE_KEY = 'app_settings:all';

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $all = self::cached();

        return array_key_exists($key, $all) ? $all[$key] : $default;
    }

    public static function set(string $key, mixed $value, string $type = 'string'): void
    {
        self::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value === null ? null : (string) $value, 'type' => $type],
        );
    }

    /** @return array<string, mixed> */
    public static function cached(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return self::query()->get()->mapWithKeys(fn (self $row) => [
                $row->key => self::cast($row->value, $row->type),
            ])->all();
        });
    }

    protected static function cast(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'int', 'integer' => (int) $value,
            'float', 'decimal' => (float) $value,
            'bool', 'boolean' => filter_var($value, FILTER_VALIDATE_BOOL),
            default => $value,
        };
    }
}
