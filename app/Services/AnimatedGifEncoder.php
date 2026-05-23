<?php

namespace App\Services;

use RuntimeException;

/**
 * Pure-PHP animated GIF encoder. Consumes per-frame GIF byte streams
 * (each produced from a GD truecolor canvas) and stitches them into
 * a single animated GIF with timing + loop control.
 *
 * Works on shared hosting where only GD is available (no FFmpeg/Imagick).
 */
class AnimatedGifEncoder
{
    /**
     * @param  array<int, string>  $gifFrames  Raw GIF bytes for each frame.
     * @param  int  $delayCs  Frame delay in centiseconds (10cs = 100ms).
     * @param  int  $loops  0 = infinite.
     */
    public function encode(array $gifFrames, int $delayCs = 20, int $loops = 0): string
    {
        if (count($gifFrames) < 2) {
            throw new RuntimeException('Need at least 2 frames to build an animated GIF.');
        }

        foreach ($gifFrames as $i => $frame) {
            if (substr($frame, 0, 6) !== 'GIF87a' && substr($frame, 0, 6) !== 'GIF89a') {
                throw new RuntimeException("Frame #{$i} is not a valid GIF.");
            }
        }

        $out = 'GIF89a';

        $first = $gifFrames[0];
        $out .= substr($first, 6, 7);

        $colorFlag = ord($first[10]);
        $hasGlobal = ($colorFlag & 0x80) !== 0;

        if ($hasGlobal) {
            $size = 3 * (2 << ($colorFlag & 0x07));
            $out .= substr($first, 13, $size);
        }

        $out .= "\x21\xFF\x0BNETSCAPE2.0\x03\x01"
            .chr($loops & 0xFF)
            .chr(($loops >> 8) & 0xFF)
            ."\x00";

        foreach ($gifFrames as $frame) {
            $out .= $this->buildFrameBlock($frame, $delayCs);
        }

        $out .= "\x3B";

        return $out;
    }

    private function buildFrameBlock(string $frame, int $delayCs): string
    {
        $colorFlag = ord($frame[10]);
        $hasGlobal = ($colorFlag & 0x80) !== 0;
        $globalSize = $hasGlobal ? 3 * (2 << ($colorFlag & 0x07)) : 0;

        $cursor = 13 + $globalSize;
        $len = strlen($frame);

        $gce = "\x21\xF9\x04\x04"
            .chr($delayCs & 0xFF).chr(($delayCs >> 8) & 0xFF)
            ."\x00\x00";

        $out = $gce;

        while ($cursor < $len) {
            $marker = ord($frame[$cursor]);

            if ($marker === 0x21) {
                $label = ord($frame[$cursor + 1]);
                $blockStart = $cursor;
                $cursor += 2;
                $cursor = $this->skipSubBlocks($frame, $cursor);

                if ($label !== 0xF9) {
                    $out .= substr($frame, $blockStart, $cursor - $blockStart);
                }

                continue;
            }

            if ($marker === 0x2C) {
                $imageDesc = substr($frame, $cursor, 10);
                $flag = ord($frame[$cursor + 9]);
                $hasLocal = ($flag & 0x80) !== 0;
                $localSize = $hasLocal ? 3 * (2 << ($flag & 0x07)) : 0;
                $tableStart = $cursor + 10;
                $tableEnd = $tableStart + $localSize;

                $out .= $imageDesc;
                $out .= substr($frame, $tableStart, $localSize);

                $cursor = $tableEnd + 1;
                $out .= substr($frame, $tableEnd, 1);

                $cursor = $this->copySubBlocks($frame, $cursor, $out);

                continue;
            }

            if ($marker === 0x3B) {
                break;
            }

            $cursor++;
        }

        return $out;
    }

    private function skipSubBlocks(string $data, int $cursor): int
    {
        while (true) {
            $size = ord($data[$cursor]);
            $cursor++;

            if ($size === 0) {
                return $cursor;
            }

            $cursor += $size;
        }
    }

    private function copySubBlocks(string $data, int $cursor, string &$out): int
    {
        while (true) {
            $size = ord($data[$cursor]);
            $out .= $data[$cursor];
            $cursor++;

            if ($size === 0) {
                return $cursor;
            }

            $out .= substr($data, $cursor, $size);
            $cursor += $size;
        }
    }
}
