<?php

namespace App\Services\FrameBuilder;

/**
 * Hasil deteksi 1 slot foto dari image scanner.
 * Koordinat dalam piksel relatif ke gambar asli.
 */
final readonly class DetectedSlot
{
    public function __construct(
        public int $x,
        public int $y,
        public int $width,
        public int $height,
        public int $slotNumber,
    ) {}

    /** @return array<string, int> */
    public function toArray(): array
    {
        return [
            'slot_number' => $this->slotNumber,
            'x' => $this->x,
            'y' => $this->y,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}
