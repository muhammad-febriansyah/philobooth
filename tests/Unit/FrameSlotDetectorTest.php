<?php

use App\Services\FrameBuilder\FrameSlotDetector;

/**
 * Bikin PNG dummy: background solid + N kotak solid vertikal (slot foto),
 * mirip layout strip 4R portrait (lihat kasus frame "Esta & Roni").
 *
 * @param  array{0:int,1:int,2:int}  $bgColor
 * @param  array{0:int,1:int,2:int}  $slotColor
 */
function makeStripFramePng(string $path, int $width, int $height, int $slotCount, array $bgColor, array $slotColor): void
{
    $image = imagecreatetruecolor($width, $height);
    $bg = imagecolorallocate($image, ...$bgColor);
    imagefill($image, 0, 0, $bg);

    $slot = imagecolorallocate($image, ...$slotColor);
    $margin = (int) ($width * 0.1);
    $gap = (int) ($height * 0.02);
    $slotWidth = $width - ($margin * 2);
    $slotHeight = (int) (($height - ($gap * ($slotCount + 1))) / $slotCount);

    for ($i = 0; $i < $slotCount; $i++) {
        $y = $gap + $i * ($slotHeight + $gap);
        imagefilledrectangle($image, $margin, $y, $margin + $slotWidth, $y + $slotHeight, $slot);
    }

    imagepng($image, $path);
    imagedestroy($image);
}

it('detects photo slots on a light background frame', function () {
    $path = tempnam(sys_get_temp_dir(), 'frame').'.png';
    makeStripFramePng($path, 600, 1800, 3, [245, 245, 245], [20, 20, 20]);

    $slots = (new FrameSlotDetector)->detect($path);

    expect($slots)->toHaveCount(3);

    unlink($path);
});

it('detects photo slots on a dark navy background frame', function () {
    // Background navy gelap (R+G+B <= darkness threshold 90), kotak slot lebih gelap lagi.
    // Kasus nyata: frame "Esta & Roni" — dulu ke-detect jadi 1 slot raksasa nutup seluruh kanvas.
    $path = tempnam(sys_get_temp_dir(), 'frame').'.png';
    makeStripFramePng($path, 600, 1800, 3, [15, 20, 55], [5, 5, 5]);

    $slots = (new FrameSlotDetector)->detect($path);

    expect($slots)->toHaveCount(3);

    foreach ($slots as $slot) {
        // Tiap slot harus lebih kecil dari kanvas penuh, bukan blob background yang ke-merge.
        expect($slot->width)->toBeLessThan(600);
        expect($slot->height)->toBeLessThan(1800);
    }

    unlink($path);
});

it('numbers dark-mode slots top to bottom', function () {
    $path = tempnam(sys_get_temp_dir(), 'frame').'.png';
    makeStripFramePng($path, 600, 1800, 3, [15, 20, 55], [5, 5, 5]);

    $slots = (new FrameSlotDetector)->detect($path);

    $ys = array_map(fn ($slot) => $slot->y, $slots);
    $sorted = $ys;
    sort($sorted);

    expect($ys)->toBe($sorted);

    unlink($path);
});
