<?php

namespace App\Enums;

enum SessionType: string
{
    case Photo = 'photo';
    case StopMotionVideo = 'stop_motion_video';

    public function label(): string
    {
        return match ($this) {
            self::Photo => 'Foto Cetak',
            self::StopMotionVideo => 'Stop Motion GIF',
        };
    }

    public function isVideo(): bool
    {
        return $this === self::StopMotionVideo;
    }
}
