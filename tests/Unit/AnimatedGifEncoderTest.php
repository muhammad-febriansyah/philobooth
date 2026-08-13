<?php

use App\Services\AnimatedGifEncoder;

/** Build a solid-color single-frame GIF, like GD produces for one StopMotion frame. */
function solidColorGif(int $r, int $g, int $b): string
{
    $image = imagecreatetruecolor(4, 4);
    imagefill($image, 0, 0, imagecolorallocate($image, $r, $g, $b));

    ob_start();
    imagegif($image);
    $bytes = ob_get_clean();
    imagedestroy($image);

    return $bytes;
}

/** Read the Global Color Table bytes straight out of a single-frame GIF. */
function globalColorTable(string $gif): string
{
    $colorFlag = ord($gif[10]);
    $size = 3 * (2 << ($colorFlag & 0x07));

    return substr($gif, 13, $size);
}

/**
 * Walk the composite GIF's blocks and return the Image Descriptor's packed
 * flag byte plus whatever color table bytes immediately follow it, for the
 * given 0-indexed frame.
 */
function frameLocalColorTable(string $composite, int $frameIndex): array
{
    $cursor = 13;
    $colorFlag = ord($composite[10]);

    if (($colorFlag & 0x80) !== 0) {
        $cursor += 3 * (2 << ($colorFlag & 0x07));
    }

    $seen = -1;

    while ($cursor < strlen($composite)) {
        $marker = ord($composite[$cursor]);

        if ($marker === 0x21) {
            // Extension block: label byte, then sub-blocks terminated by 0x00.
            $cursor += 2;

            while (ord($composite[$cursor]) !== 0) {
                $cursor += ord($composite[$cursor]) + 1;
            }
            $cursor++;

            continue;
        }

        if ($marker === 0x2C) {
            $seen++;
            $flag = ord($composite[$cursor + 9]);
            $hasLocal = ($flag & 0x80) !== 0;
            $localSize = $hasLocal ? 3 * (2 << ($flag & 0x07)) : 0;
            $tableStart = $cursor + 10;

            if ($seen === $frameIndex) {
                return [
                    'hasLocal' => $hasLocal,
                    'table' => substr($composite, $tableStart, $localSize),
                ];
            }

            $cursor = $tableStart + $localSize + 1; // +1 for LZW min code size byte

            while (ord($composite[$cursor]) !== 0) {
                $cursor += ord($composite[$cursor]) + 1;
            }
            $cursor++;

            continue;
        }

        break;
    }

    throw new RuntimeException("Frame #{$frameIndex} not found.");
}

test('preserves each frame\'s own palette as a local color table', function () {
    // Distinct solid colors so GD quantizes each frame to its own
    // single-entry global palette, matching what StopMotionGifService feeds
    // the encoder for real photos.
    $red = solidColorGif(220, 20, 20);
    $blue = solidColorGif(20, 20, 220);

    $composite = (new AnimatedGifEncoder)->encode([$red, $blue], delayCs: 10, loops: 0);

    expect(substr($composite, 0, 6))->toBe('GIF89a');
    expect(substr($composite, -1))->toBe("\x3B");

    $secondFramePalette = frameLocalColorTable($composite, 1);

    // Before the fix, frame 2 carried no local color table at all, so its
    // color indices were decoded against frame 1's (red) palette instead.
    expect($secondFramePalette['hasLocal'])->toBeTrue();
    expect($secondFramePalette['table'])->toBe(globalColorTable($blue));
});

test('throws when fewer than two frames are given', function () {
    (new AnimatedGifEncoder)->encode([solidColorGif(0, 0, 0)]);
})->throws(RuntimeException::class);
