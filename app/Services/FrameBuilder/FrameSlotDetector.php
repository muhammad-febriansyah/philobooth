<?php

namespace App\Services\FrameBuilder;

use GdImage;
use RuntimeException;

/**
 * Scan PNG frame untuk menemukan kotak hitam (slot foto) secara otomatis.
 *
 * Strategi:
 * 1. Load PNG, downsample ke max 600px sisi terpanjang biar cepat
 * 2. Konversi tiap piksel ke binary mask: "dark" (RGB total ≤ darkness threshold) atau bukan
 * 3. Flood-fill connected components → tiap region punya bounding box
 * 4. Filter region terlalu kecil (noise) — minimal X% dari total area
 * 5. Sort top-to-bottom, lalu left-to-right (urutan baca natural)
 * 6. Scale balik bounding box ke koordinat asli PNG
 */
final class FrameSlotDetector
{
    /**
     * @param  int  $darknessThreshold  R+G+B max value untuk dianggap "dark" (0-765)
     * @param  float  $minAreaPercent  Minimum area cluster vs total image (0-100), filter noise
     * @param  int  $scanMaxDimension  Resize image ke max sisi ini sebelum scan (performa)
     * @param  int  $minClusterRows  Minimum tinggi cluster dalam piksel (downsampled)
     */
    public function __construct(
        private int $darknessThreshold = 90,
        private float $minAreaPercent = 0.5,
        private int $scanMaxDimension = 600,
        private int $minClusterRows = 10,
    ) {}

    /**
     * @return array<int, DetectedSlot>
     */
    public function detect(string $imagePath): array
    {
        if (! is_file($imagePath)) {
            throw new RuntimeException("Frame file tidak ditemukan: {$imagePath}");
        }

        $image = $this->loadImage($imagePath);

        $origWidth = imagesx($image);
        $origHeight = imagesy($image);

        // Downsample untuk performa
        [$scanImage, $scale] = $this->downsample($image, $origWidth, $origHeight);
        imagedestroy($image);

        $scanWidth = imagesx($scanImage);
        $scanHeight = imagesy($scanImage);

        $mask = $this->buildSlotMask($scanImage, $scanWidth, $scanHeight);
        imagedestroy($scanImage);

        $boxes = $this->findBoundingBoxes($mask, $scanWidth, $scanHeight);

        // Convert ke koordinat asli & filter ukuran minimal
        $minArea = ($origWidth * $origHeight) * ($this->minAreaPercent / 100);
        $slots = [];

        foreach ($boxes as $box) {
            $x = (int) round($box['minX'] / $scale);
            $y = (int) round($box['minY'] / $scale);
            $w = (int) round(($box['maxX'] - $box['minX'] + 1) / $scale);
            $h = (int) round(($box['maxY'] - $box['minY'] + 1) / $scale);

            if ($w * $h < $minArea) {
                continue;
            }

            $slots[] = [
                'x' => $x,
                'y' => $y,
                'width' => $w,
                'height' => $h,
            ];
        }

        return $this->sortAndNumber($slots);
    }

    /**
     * Load image (PNG / JPG / WEBP) ke GD resource.
     * PNG/WEBP preserve alpha; JPG selalu opaque.
     */
    private function loadImage(string $path): GdImage
    {
        $info = @getimagesize($path);

        if (! $info) {
            throw new RuntimeException("Gagal baca image: {$path}");
        }

        $image = match ($info[2]) {
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_WEBP => @imagecreatefromwebp($path),
            default => null,
        };

        if (! $image) {
            throw new RuntimeException("Format tidak didukung atau gagal load: {$path}");
        }

        if ($info[2] === IMAGETYPE_PNG || $info[2] === IMAGETYPE_WEBP) {
            imagealphablending($image, true);
            imagesavealpha($image, true);
        }

        return $image;
    }

    /**
     * @return array{0: GdImage, 1: float}
     */
    private function downsample(GdImage $image, int $w, int $h): array
    {
        $largest = max($w, $h);

        if ($largest <= $this->scanMaxDimension) {
            return [$image, 1.0];
        }

        $scale = $this->scanMaxDimension / $largest;
        $newW = (int) round($w * $scale);
        $newH = (int) round($h * $scale);

        $resized = imagecreatetruecolor($newW, $newH);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
        imagefilledrectangle($resized, 0, 0, $newW, $newH, $transparent);
        imagealphablending($resized, true);

        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newW, $newH, $w, $h);

        return [$resized, $scale];
    }

    /**
     * Bangun mask slot. Auto-pilih mode:
     * - Kalau gambar punya area transparan signifikan (>2%) → mode TRANSPARENT
     *   (slot = pixel transparan, biasanya frame PNG dengan cutout window)
     * - Kalau tidak ada transparency → mode DARK
     *   (slot = pixel hitam pekat, biasanya frame solid color dengan kotak hitam)
     *
     * @return array<int, array<int, bool>>
     */
    private function buildSlotMask(GdImage $image, int $w, int $h): array
    {
        // Pre-scan: hitung pixel transparan
        $totalPixels = $w * $h;
        $transparentCount = 0;
        $alphaSampleStep = max(1, (int) (min($w, $h) / 100)); // sample tiap N pixel utk speed

        for ($y = 0; $y < $h; $y += $alphaSampleStep) {
            for ($x = 0; $x < $w; $x += $alphaSampleStep) {
                $rgba = imagecolorat($image, $x, $y);
                $alpha = ($rgba >> 24) & 0x7F;

                if ($alpha > 60) {
                    $transparentCount++;
                }
            }
        }

        $sampledTotal = (int) ceil($w / $alphaSampleStep) * (int) ceil($h / $alphaSampleStep);
        $transparentRatio = $sampledTotal > 0 ? $transparentCount / $sampledTotal : 0;
        $useTransparentMode = $transparentRatio > 0.02; // >2%

        $mask = [];

        for ($y = 0; $y < $h; $y++) {
            $row = [];

            for ($x = 0; $x < $w; $x++) {
                $rgba = imagecolorat($image, $x, $y);
                $alpha = ($rgba >> 24) & 0x7F;

                if ($useTransparentMode) {
                    // Slot = pixel transparan
                    $row[] = $alpha > 60;
                } else {
                    // Slot = pixel gelap (skip transparent — biar tidak salah)
                    if ($alpha > 100) {
                        $row[] = false;

                        continue;
                    }

                    $r = ($rgba >> 16) & 0xFF;
                    $g = ($rgba >> 8) & 0xFF;
                    $b = $rgba & 0xFF;
                    $row[] = ($r + $g + $b) <= $this->darknessThreshold;
                }
            }

            $mask[] = $row;
        }

        return $mask;
    }

    /**
     * Iterative flood-fill (BFS) untuk find connected components.
     *
     * @param  array<int, array<int, bool>>  $mask
     * @return array<int, array{minX:int, minY:int, maxX:int, maxY:int, count:int}>
     */
    private function findBoundingBoxes(array $mask, int $w, int $h): array
    {
        $visited = array_fill(0, $h, array_fill(0, $w, false));
        $boxes = [];

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                if (! $mask[$y][$x] || $visited[$y][$x]) {
                    continue;
                }

                $minX = $x;
                $minY = $y;
                $maxX = $x;
                $maxY = $y;
                $count = 0;

                // BFS queue
                $queue = [[$x, $y]];
                $visited[$y][$x] = true;

                while (! empty($queue)) {
                    [$cx, $cy] = array_pop($queue);
                    $count++;

                    if ($cx < $minX) {
                        $minX = $cx;
                    }
                    if ($cy < $minY) {
                        $minY = $cy;
                    }
                    if ($cx > $maxX) {
                        $maxX = $cx;
                    }
                    if ($cy > $maxY) {
                        $maxY = $cy;
                    }

                    // 4-neighbor
                    foreach ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [$dx, $dy]) {
                        $nx = $cx + $dx;
                        $ny = $cy + $dy;

                        if ($nx < 0 || $ny < 0 || $nx >= $w || $ny >= $h) {
                            continue;
                        }
                        if ($visited[$ny][$nx] || ! $mask[$ny][$nx]) {
                            continue;
                        }

                        $visited[$ny][$nx] = true;
                        $queue[] = [$nx, $ny];
                    }
                }

                // Filter minimum height supaya line tipis (border) tidak ke-detect
                if ($maxY - $minY + 1 < $this->minClusterRows) {
                    continue;
                }

                $boxes[] = [
                    'minX' => $minX,
                    'minY' => $minY,
                    'maxX' => $maxX,
                    'maxY' => $maxY,
                    'count' => $count,
                ];
            }
        }

        return $boxes;
    }

    /**
     * Sort top→bottom (Y), lalu left→right (X) per baris.
     *
     * @param  array<int, array{x:int, y:int, width:int, height:int}>  $slots
     * @return array<int, DetectedSlot>
     */
    private function sortAndNumber(array $slots): array
    {
        if (empty($slots)) {
            return [];
        }

        // Group ke baris berdasarkan overlap Y center
        $avgHeight = array_sum(array_column($slots, 'height')) / count($slots);
        $rowThreshold = $avgHeight * 0.5;

        // Sort by Y asc dulu
        usort($slots, fn ($a, $b) => $a['y'] <=> $b['y']);

        $rows = [];
        $currentRow = [];
        $currentRowY = null;

        foreach ($slots as $slot) {
            if ($currentRowY === null || abs($slot['y'] - $currentRowY) <= $rowThreshold) {
                $currentRow[] = $slot;
                $currentRowY = $currentRowY ?? $slot['y'];
            } else {
                // Flush row, urutkan X
                usort($currentRow, fn ($a, $b) => $a['x'] <=> $b['x']);
                $rows[] = $currentRow;
                $currentRow = [$slot];
                $currentRowY = $slot['y'];
            }
        }

        if ($currentRow) {
            usort($currentRow, fn ($a, $b) => $a['x'] <=> $b['x']);
            $rows[] = $currentRow;
        }

        $result = [];
        $slotNumber = 1;

        foreach ($rows as $row) {
            foreach ($row as $slot) {
                $result[] = new DetectedSlot(
                    x: $slot['x'],
                    y: $slot['y'],
                    width: $slot['width'],
                    height: $slot['height'],
                    slotNumber: $slotNumber++,
                );
            }
        }

        return $result;
    }
}
