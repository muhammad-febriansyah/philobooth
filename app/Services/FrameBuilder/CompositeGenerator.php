<?php

namespace App\Services\FrameBuilder;

use App\Models\Frame;
use App\Models\PhotoSession;
use App\Models\SessionPhoto;
use GdImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Composite final image: frame PNG + N foto customer ke posisi slot.
 *
 * Strategi:
 * 1. Load frame PNG sebagai canvas dasar (ukuran asli)
 * 2. Iterate FramePhotoSlot → load matching SessionPhoto (by slot_number)
 * 3. Resize + crop foto (cover-fit) ke ukuran slot
 * 4. Paste foto ke posisi (x, y) DI BELAKANG frame
 * 5. Frame PNG di-overlay terakhir supaya area transparan/hitam slot tertimpa foto
 *    (untuk frame yang slot-nya hitam solid, kita harus reverse: paste foto dulu, frame timpa)
 *
 * Implementation: kita bikin canvas baru → paste foto ke posisi slot dulu → composite frame di atas.
 * Karena slot di frame berwarna hitam solid, kita perlu mask: frame jadi semi-transparent di area slot.
 *
 * Solusi praktis: tipe frame yang kita support sekarang adalah "black-cutout" frame.
 * Workflow: canvas = white background → paste foto ke slot positions → overlay frame, tapi
 * area slot di frame harus dibuat transparent terlebih dahulu (otherwise foto tertutup).
 *
 * Untuk simplicity di phase 1: kita REMOVE pixel hitam dari frame (jadi transparent), lalu overlay.
 */
final class CompositeGenerator
{
    /**
     * Generate final composite image untuk session.
     * Return path relatif ke disk public (mis. "kiosk/{session_code}/final.png").
     */
    public function generate(PhotoSession $session): string
    {
        $session->loadMissing(['frame.photoSlots', 'photos']);

        $frame = $session->frame;

        if (! $frame) {
            throw new RuntimeException('Session belum punya frame.');
        }

        if (! $frame->thumbnail_path || ! Storage::disk('public')->exists($frame->thumbnail_path)) {
            throw new RuntimeException('Frame PNG tidak ditemukan di storage.');
        }

        $framePath = Storage::disk('public')->path($frame->thumbnail_path);

        $framePng = $this->loadImage($framePath);
        $w = imagesx($framePng);
        $h = imagesy($framePng);

        // Buat canvas baru dengan background putih
        $canvas = imagecreatetruecolor($w, $h);
        imagealphablending($canvas, true);
        imagesavealpha($canvas, true);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefilledrectangle($canvas, 0, 0, $w, $h, $white);

        // Paste tiap foto ke posisi slot
        $photosBySlot = $session->photos->keyBy('slot_number');

        foreach ($frame->photoSlots as $slot) {
            $photo = $photosBySlot->get($slot->slot_number);

            if (! $photo instanceof SessionPhoto) {
                continue; // skip slot kosong
            }

            if (! $photo->original_path || ! Storage::disk('public')->exists($photo->original_path)) {
                continue;
            }

            $photoPath = Storage::disk('public')->path($photo->original_path);
            $photoImg = $this->loadImage($photoPath);
            $coverResized = $this->coverResize($photoImg, $slot->width, $slot->height);
            imagedestroy($photoImg);

            imagecopy($canvas, $coverResized, $slot->x, $slot->y, 0, 0, $slot->width, $slot->height);
            imagedestroy($coverResized);
        }

        // Auto-pilih mode overlay:
        // - Kalau frame sudah punya area transparan (PNG cutout) → langsung overlay (slot area sudah tembus pandang)
        // - Kalau frame solid dengan slot hitam → convert hitam → transparent dulu, baru overlay
        if ($this->hasTransparency($framePng, $w, $h)) {
            imagecopy($canvas, $framePng, 0, 0, 0, 0, $w, $h);
            imagedestroy($framePng);
        } else {
            $maskedFrame = $this->makeBlackTransparent($framePng, darknessThreshold: 90);
            imagedestroy($framePng);
            imagecopy($canvas, $maskedFrame, 0, 0, 0, 0, $w, $h);
            imagedestroy($maskedFrame);
        }

        // Render stickers (di atas frame overlay)
        $this->renderStickers($canvas, $w, $h, $session);

        // Render caption + date stamp di footer strip (di atas frame overlay, ikut dipreserve)
        $this->renderCaption($canvas, $w, $h, $session);

        // Save
        $filename = 'final-'.Str::random(8).'.png';
        $relativePath = 'kiosk/'.$session->session_code.'/'.$filename;
        $absolutePath = Storage::disk('public')->path($relativePath);

        @mkdir(dirname($absolutePath), 0777, true);
        imagepng($canvas, $absolutePath, 6);
        imagedestroy($canvas);

        return $relativePath;
    }

    /**
     * Render stickers di canvas berdasarkan positions di session.stickers.
     * Tiap sticker punya: id (string), x/y (0..1), size (px), rotate (deg).
     */
    private function renderStickers(GdImage $canvas, int $w, int $h, PhotoSession $session): void
    {
        $stickers = $session->stickers;

        if (! is_array($stickers) || empty($stickers)) {
            return;
        }

        foreach ($stickers as $s) {
            $id = (string) ($s['id'] ?? '');
            $x = (float) ($s['x'] ?? 0.5);
            $y = (float) ($s['y'] ?? 0.5);
            $size = (int) ($s['size'] ?? 96);
            $rotate = (int) ($s['rotate'] ?? 0);

            // Scale ke ukuran canvas: size dari frontend adalah pixel di preview ~480px wide,
            // map ke canvas asli.
            $sizeOnCanvas = (int) ($size * ($w / 480));
            $cx = (int) ($x * $w);
            $cy = (int) ($y * $h);

            $sticker = $this->drawSticker($id, $sizeOnCanvas);

            if (! $sticker) {
                continue;
            }

            // Apply rotation
            if ($rotate !== 0) {
                $transparent = imagecolorallocatealpha($sticker, 0, 0, 0, 127);
                $rotated = imagerotate($sticker, -$rotate, $transparent);
                imagedestroy($sticker);
                $sticker = $rotated;
            }

            $sw = imagesx($sticker);
            $sh = imagesy($sticker);
            $dx = $cx - (int) ($sw / 2);
            $dy = $cy - (int) ($sh / 2);

            imagealphablending($canvas, true);
            imagecopy($canvas, $sticker, $dx, $dy, 0, 0, $sw, $sh);
            imagedestroy($sticker);
        }
    }

    /**
     * Draw a single sticker on a fresh transparent canvas, return as GdImage.
     * Supported ids: heart, star, sparkle, lightning, flower, diamond, smile, fire,
     *                lips, sun, cloud, crown.
     */
    private function drawSticker(string $id, int $size): ?GdImage
    {
        if ($size < 8) {
            return null;
        }

        $img = imagecreatetruecolor($size, $size);
        imagealphablending($img, false);
        imagesavealpha($img, true);
        $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagefilledrectangle($img, 0, 0, $size, $size, $transparent);
        imagealphablending($img, true);

        // Common colors
        $pink = imagecolorallocate($img, 251, 113, 133);
        $red = imagecolorallocate($img, 239, 68, 68);
        $yellow = imagecolorallocate($img, 245, 250, 12);
        $orange = imagecolorallocate($img, 251, 146, 60);
        $purple = imagecolorallocate($img, 167, 139, 250);
        $blue = imagecolorallocate($img, 96, 165, 250);
        $green = imagecolorallocate($img, 134, 239, 172);
        $black = imagecolorallocate($img, 10, 10, 10);
        $white = imagecolorallocate($img, 255, 255, 255);

        $center = $size / 2;

        switch ($id) {
            case 'heart':
                $this->drawHeart($img, $center, $center, $size * 0.45, $pink);
                break;
            case 'star':
                $this->drawStar($img, $center, $center, $size * 0.45, 5, $yellow, $black);
                break;
            case 'sparkle':
                $this->drawSparkle($img, $center, $center, $size * 0.5, $yellow);
                break;
            case 'lightning':
                $this->drawLightning($img, $center, $center, $size * 0.45, $yellow, $black);
                break;
            case 'flower':
                $this->drawFlower($img, $center, $center, $size * 0.42, $pink, $yellow);
                break;
            case 'diamond':
                $this->drawDiamond($img, $center, $center, $size * 0.4, $blue, $white);
                break;
            case 'smile':
                $this->drawSmile($img, $center, $center, $size * 0.45, $yellow, $black);
                break;
            case 'fire':
                $this->drawFire($img, $center, $center, $size * 0.45, $orange, $red);
                break;
            case 'kiss':
                $this->drawHeart($img, $center, $center, $size * 0.45, $red);
                $this->drawHeart($img, $center + $size * 0.18, $center - $size * 0.05, $size * 0.18, $pink);
                break;
            case 'sun':
                $this->drawSun($img, $center, $center, $size * 0.4, $yellow, $orange);
                break;
            case 'cloud':
                $this->drawCloud($img, $center, $center, $size * 0.45, $white, $black);
                break;
            case 'crown':
                $this->drawCrown($img, $center, $center, $size * 0.45, $yellow, $black);
                break;
            case 'music':
                $this->drawMusic($img, $center, $center, $size * 0.45, $black);
                break;
            case 'butterfly':
                $this->drawButterfly($img, $center, $center, $size * 0.45, $pink, $purple, $black);
                break;
            case 'rainbow':
                $this->drawRainbow($img, $center, $center, $size * 0.45);
                break;
            case 'snowflake':
                $this->drawSnowflake($img, $center, $center, $size * 0.45, $blue);
                break;
            case 'party':
                $this->drawParty($img, $center, $center, $size * 0.45, $yellow, $black);
                break;
            case 'camera':
                $this->drawCamera($img, $center, $center, $size * 0.45, $black, $yellow, $white);
                break;
            case 'balloon':
                $this->drawBalloon($img, $center, $center, $size * 0.4, $pink, $black);
                break;
            case 'peace':
                $this->drawPeace($img, $center, $center, $size * 0.42, $white, $black);
                break;
            case 'ghost':
                $this->drawGhost($img, $center, $center, $size * 0.42, $white, $black);
                break;
            case 'lollipop':
                $this->drawLollipop($img, $center, $center, $size * 0.4, $pink, $white, $black);
                break;
            case 'icecream':
                $this->drawIceCream($img, $center, $center, $size * 0.42, $pink, $orange);
                break;
            case 'moon':
                $this->drawMoon($img, $center, $center, $size * 0.4, $yellow, $black);
                break;
            case 'pin':
                $this->drawPin($img, $center, $center, $size * 0.4, $red, $white, $black);
                break;
            case 'cherry':
                $this->drawCherry($img, $center, $center, $size * 0.4, $red, $green);
                break;
            case 'leaf':
                $this->drawLeaf($img, $center, $center, $size * 0.42, $green, $black);
                break;
            case 'thumbsup':
                $this->drawThumbsUp($img, $center, $center, $size * 0.42, $yellow, $black);
                break;
            default:
                return null;
        }

        return $img;
    }

    private function drawHeart(GdImage $img, float $cx, float $cy, float $r, int $color): void
    {
        // Approximated heart via 2 circles + triangle
        imagefilledellipse($img, (int) ($cx - $r * 0.5), (int) ($cy - $r * 0.2), (int) ($r * 1.05), (int) ($r * 1.05), $color);
        imagefilledellipse($img, (int) ($cx + $r * 0.5), (int) ($cy - $r * 0.2), (int) ($r * 1.05), (int) ($r * 1.05), $color);
        imagefilledpolygon($img, [
            (int) ($cx - $r), (int) ($cy - $r * 0.1),
            (int) ($cx + $r), (int) ($cy - $r * 0.1),
            (int) $cx, (int) ($cy + $r),
        ], $color);
    }

    private function drawStar(GdImage $img, float $cx, float $cy, float $r, int $points, int $fill, int $stroke): void
    {
        $vertices = [];

        for ($i = 0; $i < $points * 2; $i++) {
            $angle = ($i * M_PI / $points) - M_PI / 2;
            $radius = $i % 2 === 0 ? $r : $r * 0.4;
            $vertices[] = (int) ($cx + cos($angle) * $radius);
            $vertices[] = (int) ($cy + sin($angle) * $radius);
        }

        imagefilledpolygon($img, $vertices, $fill);
        imagesetthickness($img, 2);
        imagepolygon($img, $vertices, $stroke);
    }

    private function drawSparkle(GdImage $img, float $cx, float $cy, float $r, int $color): void
    {
        // Diamond cross shape
        imagefilledpolygon($img, [
            (int) $cx, (int) ($cy - $r),
            (int) ($cx + $r * 0.25), (int) ($cy - $r * 0.25),
            (int) ($cx + $r), (int) $cy,
            (int) ($cx + $r * 0.25), (int) ($cy + $r * 0.25),
            (int) $cx, (int) ($cy + $r),
            (int) ($cx - $r * 0.25), (int) ($cy + $r * 0.25),
            (int) ($cx - $r), (int) $cy,
            (int) ($cx - $r * 0.25), (int) ($cy - $r * 0.25),
        ], $color);
    }

    private function drawLightning(GdImage $img, float $cx, float $cy, float $r, int $fill, int $stroke): void
    {
        $vertices = [
            (int) ($cx + $r * 0.2), (int) ($cy - $r),
            (int) ($cx - $r * 0.4), (int) ($cy + $r * 0.1),
            (int) ($cx - $r * 0.05), (int) ($cy + $r * 0.1),
            (int) ($cx - $r * 0.25), (int) ($cy + $r),
            (int) ($cx + $r * 0.5), (int) ($cy - $r * 0.1),
            (int) ($cx + $r * 0.15), (int) ($cy - $r * 0.1),
        ];
        imagefilledpolygon($img, $vertices, $fill);
        imagesetthickness($img, 2);
        imagepolygon($img, $vertices, $stroke);
    }

    private function drawFlower(GdImage $img, float $cx, float $cy, float $r, int $petal, int $center): void
    {
        for ($i = 0; $i < 5; $i++) {
            $angle = ($i * 2 * M_PI / 5) - M_PI / 2;
            $px = $cx + cos($angle) * $r * 0.55;
            $py = $cy + sin($angle) * $r * 0.55;
            imagefilledellipse($img, (int) $px, (int) $py, (int) ($r * 0.9), (int) ($r * 0.9), $petal);
        }
        imagefilledellipse($img, (int) $cx, (int) $cy, (int) ($r * 0.6), (int) ($r * 0.6), $center);
    }

    private function drawDiamond(GdImage $img, float $cx, float $cy, float $r, int $fill, int $highlight): void
    {
        imagefilledpolygon($img, [
            (int) $cx, (int) ($cy - $r),
            (int) ($cx + $r), (int) $cy,
            (int) $cx, (int) ($cy + $r),
            (int) ($cx - $r), (int) $cy,
        ], $fill);
        // shine
        imagefilledpolygon($img, [
            (int) $cx, (int) ($cy - $r * 0.7),
            (int) ($cx + $r * 0.4), (int) $cy,
            (int) ($cx - $r * 0.1), (int) ($cy + $r * 0.1),
        ], $highlight);
    }

    private function drawSmile(GdImage $img, float $cx, float $cy, float $r, int $face, int $detail): void
    {
        imagefilledellipse($img, (int) $cx, (int) $cy, (int) ($r * 2), (int) ($r * 2), $face);
        imagesetthickness($img, 2);
        imageellipse($img, (int) $cx, (int) $cy, (int) ($r * 2), (int) ($r * 2), $detail);
        imagefilledellipse($img, (int) ($cx - $r * 0.35), (int) ($cy - $r * 0.15), (int) ($r * 0.18), (int) ($r * 0.25), $detail);
        imagefilledellipse($img, (int) ($cx + $r * 0.35), (int) ($cy - $r * 0.15), (int) ($r * 0.18), (int) ($r * 0.25), $detail);
        imagesetthickness($img, max(2, (int) ($r * 0.12)));
        imagearc($img, (int) $cx, (int) ($cy + $r * 0.05), (int) ($r * 0.9), (int) ($r * 0.9), 20, 160, $detail);
    }

    private function drawFire(GdImage $img, float $cx, float $cy, float $r, int $outer, int $inner): void
    {
        // outer flame
        imagefilledpolygon($img, [
            (int) ($cx - $r * 0.6), (int) ($cy + $r),
            (int) ($cx - $r * 0.4), (int) ($cy + $r * 0.2),
            (int) ($cx - $r * 0.1), (int) ($cy + $r * 0.55),
            (int) $cx, (int) ($cy - $r),
            (int) ($cx + $r * 0.2), (int) ($cy + $r * 0.4),
            (int) ($cx + $r * 0.6), (int) $cy,
            (int) ($cx + $r * 0.6), (int) ($cy + $r),
        ], $outer);
        // inner highlight
        imagefilledpolygon($img, [
            (int) ($cx - $r * 0.2), (int) ($cy + $r * 0.85),
            (int) $cx, (int) ($cy - $r * 0.3),
            (int) ($cx + $r * 0.25), (int) ($cy + $r * 0.85),
        ], $inner);
    }

    private function drawSun(GdImage $img, float $cx, float $cy, float $r, int $body, int $ray): void
    {
        // rays
        imagesetthickness($img, max(2, (int) ($r * 0.18)));

        for ($i = 0; $i < 8; $i++) {
            $angle = $i * M_PI / 4;
            $x1 = $cx + cos($angle) * $r * 1.05;
            $y1 = $cy + sin($angle) * $r * 1.05;
            $x2 = $cx + cos($angle) * $r * 1.55;
            $y2 = $cy + sin($angle) * $r * 1.55;
            imageline($img, (int) $x1, (int) $y1, (int) $x2, (int) $y2, $ray);
        }
        imagefilledellipse($img, (int) $cx, (int) $cy, (int) ($r * 2), (int) ($r * 2), $body);
    }

    private function drawCloud(GdImage $img, float $cx, float $cy, float $r, int $fill, int $stroke): void
    {
        imagefilledellipse($img, (int) ($cx - $r * 0.6), (int) ($cy + $r * 0.1), (int) ($r * 1.1), (int) ($r * 1.0), $fill);
        imagefilledellipse($img, (int) ($cx + $r * 0.5), (int) ($cy + $r * 0.1), (int) ($r * 1.0), (int) ($r * 0.95), $fill);
        imagefilledellipse($img, (int) $cx, (int) ($cy - $r * 0.25), (int) ($r * 1.3), (int) ($r * 1.2), $fill);
        imagefilledrectangle($img, (int) ($cx - $r * 1.0), (int) ($cy + $r * 0.1), (int) ($cx + $r * 1.0), (int) ($cy + $r * 0.7), $fill);
    }

    private function drawCrown(GdImage $img, float $cx, float $cy, float $r, int $fill, int $accent): void
    {
        imagefilledpolygon($img, [
            (int) ($cx - $r), (int) ($cy + $r * 0.6),
            (int) ($cx - $r), (int) ($cy - $r * 0.4),
            (int) ($cx - $r * 0.5), (int) $cy,
            (int) $cx, (int) ($cy - $r * 0.8),
            (int) ($cx + $r * 0.5), (int) $cy,
            (int) ($cx + $r), (int) ($cy - $r * 0.4),
            (int) ($cx + $r), (int) ($cy + $r * 0.6),
        ], $fill);
        imagefilledrectangle($img, (int) ($cx - $r), (int) ($cy + $r * 0.4), (int) ($cx + $r), (int) ($cy + $r * 0.75), $fill);
        imagefilledellipse($img, (int) $cx, (int) ($cy + $r * 0.15), (int) ($r * 0.35), (int) ($r * 0.35), $accent);
    }

    private function drawMusic(GdImage $img, float $cx, float $cy, float $r, int $color): void
    {
        imagefilledellipse($img, (int) ($cx - $r * 0.5), (int) ($cy + $r * 0.55), (int) ($r * 0.6), (int) ($r * 0.5), $color);
        imagefilledellipse($img, (int) ($cx + $r * 0.5), (int) ($cy + $r * 0.4), (int) ($r * 0.6), (int) ($r * 0.5), $color);
        imagesetthickness($img, max(3, (int) ($r * 0.18)));
        imageline($img, (int) ($cx - $r * 0.3), (int) ($cy + $r * 0.5), (int) ($cx - $r * 0.3), (int) ($cy - $r), $color);
        imageline($img, (int) ($cx + $r * 0.7), (int) ($cy + $r * 0.35), (int) ($cx + $r * 0.7), (int) ($cy - $r * 0.85), $color);
        imageline($img, (int) ($cx - $r * 0.3), (int) ($cy - $r), (int) ($cx + $r * 0.7), (int) ($cy - $r * 0.85), $color);
    }

    private function drawButterfly(GdImage $img, float $cx, float $cy, float $r, int $top, int $bottom, int $body): void
    {
        imagefilledellipse($img, (int) ($cx - $r * 0.45), (int) ($cy - $r * 0.2), (int) ($r * 0.95), (int) ($r * 0.85), $top);
        imagefilledellipse($img, (int) ($cx + $r * 0.45), (int) ($cy - $r * 0.2), (int) ($r * 0.95), (int) ($r * 0.85), $top);
        imagefilledellipse($img, (int) ($cx - $r * 0.4), (int) ($cy + $r * 0.35), (int) ($r * 0.75), (int) ($r * 0.65), $bottom);
        imagefilledellipse($img, (int) ($cx + $r * 0.4), (int) ($cy + $r * 0.35), (int) ($r * 0.75), (int) ($r * 0.65), $bottom);
        imagefilledrectangle($img, (int) ($cx - $r * 0.06), (int) ($cy - $r * 0.7), (int) ($cx + $r * 0.06), (int) ($cy + $r * 0.7), $body);
        imagefilledellipse($img, (int) $cx, (int) ($cy - $r * 0.85), (int) ($r * 0.18), (int) ($r * 0.18), $body);
    }

    private function drawRainbow(GdImage $img, float $cx, float $cy, float $r): void
    {
        $colors = [
            imagecolorallocate($img, 239, 68, 68),
            imagecolorallocate($img, 251, 146, 60),
            imagecolorallocate($img, 245, 250, 12),
            imagecolorallocate($img, 134, 239, 172),
            imagecolorallocate($img, 96, 165, 250),
        ];

        imagesetthickness($img, max(4, (int) ($r * 0.18)));

        foreach ($colors as $i => $c) {
            $radius = (int) ($r * (1.0 - $i * 0.18));
            imagearc($img, (int) $cx, (int) ($cy + $r * 0.3), $radius * 2, $radius * 2, 180, 360, $c);
        }
        // clouds
        $white = imagecolorallocate($img, 255, 255, 255);
        imagefilledellipse($img, (int) ($cx - $r * 0.85), (int) ($cy + $r * 0.55), (int) ($r * 0.55), (int) ($r * 0.4), $white);
        imagefilledellipse($img, (int) ($cx + $r * 0.85), (int) ($cy + $r * 0.55), (int) ($r * 0.55), (int) ($r * 0.4), $white);
    }

    private function drawSnowflake(GdImage $img, float $cx, float $cy, float $r, int $color): void
    {
        imagesetthickness($img, max(3, (int) ($r * 0.14)));

        for ($i = 0; $i < 6; $i++) {
            $angle = $i * M_PI / 3;
            $x2 = $cx + cos($angle) * $r;
            $y2 = $cy + sin($angle) * $r;
            imageline($img, (int) $cx, (int) $cy, (int) $x2, (int) $y2, $color);

            // branches
            $bx = $cx + cos($angle) * $r * 0.5;
            $by = $cy + sin($angle) * $r * 0.5;
            $b1x = $bx + cos($angle + M_PI / 4) * $r * 0.25;
            $b1y = $by + sin($angle + M_PI / 4) * $r * 0.25;
            $b2x = $bx + cos($angle - M_PI / 4) * $r * 0.25;
            $b2y = $by + sin($angle - M_PI / 4) * $r * 0.25;
            imageline($img, (int) $bx, (int) $by, (int) $b1x, (int) $b1y, $color);
            imageline($img, (int) $bx, (int) $by, (int) $b2x, (int) $b2y, $color);
        }
        imagefilledellipse($img, (int) $cx, (int) $cy, (int) ($r * 0.25), (int) ($r * 0.25), $color);
    }

    private function drawParty(GdImage $img, float $cx, float $cy, float $r, int $cone, int $stroke): void
    {
        imagefilledpolygon($img, [
            (int) ($cx - $r), (int) ($cy + $r),
            (int) ($cx + $r * 0.4), (int) ($cy - $r * 0.3),
            (int) ($cx + $r * 0.6), (int) ($cy - $r * 0.1),
        ], $cone);
        imagesetthickness($img, 2);
        $accents = [
            [(int) ($cx + $r * 0.7), (int) ($cy - $r * 0.6), imagecolorallocate($img, 251, 113, 133)],
            [(int) ($cx + $r * 0.95), (int) ($cy - $r * 0.2), imagecolorallocate($img, 96, 165, 250)],
            [(int) ($cx + $r * 0.85), (int) ($cy + $r * 0.4), imagecolorallocate($img, 134, 239, 172)],
            [(int) ($cx + $r * 0.5), (int) ($cy - $r * 0.85), imagecolorallocate($img, 167, 139, 250)],
        ];

        foreach ($accents as [$x, $y, $c]) {
            imagefilledellipse($img, $x, $y, (int) ($r * 0.18), (int) ($r * 0.18), $c);
        }
    }

    private function drawCamera(GdImage $img, float $cx, float $cy, float $r, int $body, int $accent, int $lens): void
    {
        imagefilledrectangle($img, (int) ($cx - $r), (int) ($cy - $r * 0.3), (int) ($cx + $r), (int) ($cy + $r * 0.7), $body);
        imagefilledrectangle($img, (int) ($cx - $r * 0.4), (int) ($cy - $r * 0.6), (int) ($cx + $r * 0.4), (int) ($cy - $r * 0.3), $body);
        imagefilledellipse($img, (int) $cx, (int) ($cy + $r * 0.18), (int) ($r * 0.85), (int) ($r * 0.85), imagecolorallocate($img, 30, 30, 30));
        imagefilledellipse($img, (int) $cx, (int) ($cy + $r * 0.18), (int) ($r * 0.5), (int) ($r * 0.5), $accent);
        imagefilledellipse($img, (int) ($cx + $r * 0.7), (int) ($cy - $r * 0.18), (int) ($r * 0.12), (int) ($r * 0.12), imagecolorallocate($img, 239, 68, 68));
    }

    private function drawBalloon(GdImage $img, float $cx, float $cy, float $r, int $color, int $stroke): void
    {
        imagefilledellipse($img, (int) $cx, (int) ($cy - $r * 0.2), (int) ($r * 1.4), (int) ($r * 1.7), $color);
        imagefilledpolygon($img, [
            (int) ($cx - $r * 0.15), (int) ($cy + $r * 0.6),
            (int) ($cx + $r * 0.15), (int) ($cy + $r * 0.6),
            (int) $cx, (int) ($cy + $r * 0.95),
        ], $color);
        imagesetthickness($img, max(2, (int) ($r * 0.06)));
        // string
        $x = $cx;
        $y0 = $cy + $r * 0.95;

        for ($t = 0; $t < 6; $t++) {
            $nx = $x + (($t % 2) ? -$r * 0.1 : $r * 0.1);
            $ny = $y0 + $r * 0.18 * ($t + 1);
            imageline($img, (int) $x, (int) ($y0 + $r * 0.18 * $t), (int) $nx, (int) $ny, $stroke);
            $x = $nx;
        }
    }

    private function drawPeace(GdImage $img, float $cx, float $cy, float $r, int $bg, int $stroke): void
    {
        imagefilledellipse($img, (int) $cx, (int) $cy, (int) ($r * 2), (int) ($r * 2), $bg);
        imagesetthickness($img, max(3, (int) ($r * 0.12)));
        imageellipse($img, (int) $cx, (int) $cy, (int) ($r * 2), (int) ($r * 2), $stroke);
        imageline($img, (int) $cx, (int) ($cy - $r * 0.9), (int) $cx, (int) ($cy + $r * 0.9), $stroke);
        imageline($img, (int) $cx, (int) $cy, (int) ($cx - $r * 0.65), (int) ($cy + $r * 0.65), $stroke);
        imageline($img, (int) $cx, (int) $cy, (int) ($cx + $r * 0.65), (int) ($cy + $r * 0.65), $stroke);
    }

    private function drawGhost(GdImage $img, float $cx, float $cy, float $r, int $body, int $detail): void
    {
        // body shape via filled ellipse + bottom waves
        imagefilledellipse($img, (int) $cx, (int) ($cy - $r * 0.2), (int) ($r * 1.7), (int) ($r * 1.5), $body);
        imagefilledrectangle($img, (int) ($cx - $r * 0.85), (int) ($cy - $r * 0.2), (int) ($cx + $r * 0.85), (int) ($cy + $r * 0.8), $body);

        // bottom wavy ellipses for "tail"
        for ($i = -2; $i <= 2; $i++) {
            imagefilledellipse($img, (int) ($cx + $i * $r * 0.36), (int) ($cy + $r * 0.85), (int) ($r * 0.38), (int) ($r * 0.3), $body);
        }
        // eyes
        imagefilledellipse($img, (int) ($cx - $r * 0.3), (int) ($cy - $r * 0.2), (int) ($r * 0.18), (int) ($r * 0.28), $detail);
        imagefilledellipse($img, (int) ($cx + $r * 0.3), (int) ($cy - $r * 0.2), (int) ($r * 0.18), (int) ($r * 0.28), $detail);
        imagefilledellipse($img, (int) $cx, (int) ($cy + $r * 0.18), (int) ($r * 0.2), (int) ($r * 0.14), $detail);
    }

    private function drawLollipop(GdImage $img, float $cx, float $cy, float $r, int $candy, int $swirl, int $stroke): void
    {
        imagefilledellipse($img, (int) $cx, (int) ($cy - $r * 0.3), (int) ($r * 1.4), (int) ($r * 1.4), $candy);
        imagesetthickness($img, max(2, (int) ($r * 0.12)));
        imagearc($img, (int) $cx, (int) ($cy - $r * 0.3), (int) ($r * 0.8), (int) ($r * 0.8), 0, 360, $swirl);
        imagearc($img, (int) $cx, (int) ($cy - $r * 0.3), (int) ($r * 1.4), (int) ($r * 1.4), 0, 360, $swirl);
        // stick
        imagefilledrectangle($img, (int) ($cx - $r * 0.1), (int) ($cy + $r * 0.4), (int) ($cx + $r * 0.1), (int) ($cy + $r * 1.2), $swirl);
        imagesetthickness($img, 2);
        imagerectangle($img, (int) ($cx - $r * 0.1), (int) ($cy + $r * 0.4), (int) ($cx + $r * 0.1), (int) ($cy + $r * 1.2), $stroke);
    }

    private function drawIceCream(GdImage $img, float $cx, float $cy, float $r, int $scoop1, int $scoop2): void
    {
        $stroke = imagecolorallocate($img, 10, 10, 10);
        $white = imagecolorallocate($img, 255, 255, 255);
        // top scoops
        imagefilledellipse($img, (int) $cx, (int) ($cy - $r * 0.45), (int) ($r * 1.0), (int) ($r * 1.0), $scoop1);
        imagefilledellipse($img, (int) ($cx - $r * 0.4), (int) ($cy - $r * 0.15), (int) ($r * 0.7), (int) ($r * 0.7), $white);
        imagefilledellipse($img, (int) ($cx + $r * 0.4), (int) ($cy - $r * 0.1), (int) ($r * 0.7), (int) ($r * 0.7), $scoop2);
        // cone
        imagefilledpolygon($img, [
            (int) ($cx - $r), (int) ($cy + $r * 0.15),
            (int) ($cx + $r), (int) ($cy + $r * 0.15),
            (int) $cx, (int) ($cy + $r * 1.3),
        ], imagecolorallocate($img, 251, 146, 60));
        imagesetthickness($img, 2);
        imageline($img, (int) ($cx - $r * 0.6), (int) ($cy + $r * 0.4), (int) ($cx + $r * 0.3), (int) ($cy + $r * 1.1), $stroke);
        imageline($img, (int) ($cx - $r * 0.3), (int) ($cy + $r * 0.4), (int) ($cx + $r * 0.6), (int) ($cy + $r * 1.1), $stroke);
    }

    private function drawMoon(GdImage $img, float $cx, float $cy, float $r, int $fill, int $stroke): void
    {
        // crescent: filled large circle, subtracted by smaller offset circle
        imagefilledellipse($img, (int) $cx, (int) $cy, (int) ($r * 2), (int) ($r * 2), $fill);
        // mask with bg-like color (use the alpha transparent)
        $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagealphablending($img, false);
        imagefilledellipse($img, (int) ($cx + $r * 0.4), (int) $cy, (int) ($r * 1.7), (int) ($r * 1.7), $transparent);
        imagealphablending($img, true);
        imagesetthickness($img, max(2, (int) ($r * 0.08)));
        // outline approximation
        for ($a = 90; $a <= 270; $a += 4) {
            $rad = $a * M_PI / 180;
            imagefilledellipse($img, (int) ($cx + cos($rad) * $r), (int) ($cy + sin($rad) * $r), 3, 3, $stroke);
        }
    }

    private function drawPin(GdImage $img, float $cx, float $cy, float $r, int $body, int $dot, int $stroke): void
    {
        // teardrop pin shape via polygon
        imagefilledpolygon($img, [
            (int) $cx, (int) ($cy + $r),
            (int) ($cx + $r * 0.85), (int) ($cy - $r * 0.2),
            (int) ($cx + $r * 0.6), (int) ($cy - $r * 0.7),
            (int) $cx, (int) ($cy - $r * 0.85),
            (int) ($cx - $r * 0.6), (int) ($cy - $r * 0.7),
            (int) ($cx - $r * 0.85), (int) ($cy - $r * 0.2),
        ], $body);
        imagefilledellipse($img, (int) $cx, (int) ($cy - $r * 0.3), (int) ($r * 0.5), (int) ($r * 0.5), $dot);
        imagesetthickness($img, 2);
        imagepolygon($img, [
            (int) $cx, (int) ($cy + $r),
            (int) ($cx + $r * 0.85), (int) ($cy - $r * 0.2),
            (int) ($cx + $r * 0.6), (int) ($cy - $r * 0.7),
            (int) $cx, (int) ($cy - $r * 0.85),
            (int) ($cx - $r * 0.6), (int) ($cy - $r * 0.7),
            (int) ($cx - $r * 0.85), (int) ($cy - $r * 0.2),
        ], $stroke);
    }

    private function drawCherry(GdImage $img, float $cx, float $cy, float $r, int $fruit, int $stem): void
    {
        $stroke = imagecolorallocate($img, 10, 10, 10);
        imagefilledellipse($img, (int) ($cx - $r * 0.35), (int) ($cy + $r * 0.45), (int) ($r * 0.85), (int) ($r * 0.85), $fruit);
        imagefilledellipse($img, (int) ($cx + $r * 0.4), (int) ($cy + $r * 0.55), (int) ($r * 0.8), (int) ($r * 0.8), $fruit);
        imagesetthickness($img, max(3, (int) ($r * 0.16)));
        // stems
        for ($t = 0; $t < 20; $t++) {
            $sx = $cx - $r * 0.35 + ($t * ($r * 1.2 / 20));
            $sy = $cy + $r * 0.45 - sin($t * 0.3) * $r * 0.6;
            imagesetpixel($img, (int) $sx, (int) $sy, $stem);
        }
        // arc stems
        imagearc($img, (int) $cx, (int) ($cy - $r * 0.45), (int) ($r * 1.4), (int) ($r * 1.4), 200, 340, $stem);
    }

    private function drawLeaf(GdImage $img, float $cx, float $cy, float $r, int $fill, int $vein): void
    {
        // leaf shape via polygon
        imagefilledpolygon($img, [
            (int) ($cx - $r * 0.9), (int) ($cy + $r * 0.9),
            (int) ($cx - $r * 0.4), (int) ($cy - $r * 0.5),
            (int) ($cx + $r * 0.3), (int) ($cy - $r * 0.9),
            (int) ($cx + $r * 0.9), (int) ($cy - $r * 0.5),
            (int) ($cx + $r * 0.5), (int) ($cy + $r * 0.3),
            (int) ($cx - $r * 0.1), (int) ($cy + $r * 0.9),
        ], $fill);
        imagesetthickness($img, max(2, (int) ($r * 0.06)));
        imageline($img, (int) ($cx - $r * 0.85), (int) ($cy + $r * 0.85), (int) ($cx + $r * 0.85), (int) ($cy - $r * 0.5), $vein);
    }

    private function drawThumbsUp(GdImage $img, float $cx, float $cy, float $r, int $fill, int $stroke): void
    {
        // hand body
        imagefilledpolygon($img, [
            (int) ($cx - $r * 0.2), (int) ($cy + $r),
            (int) ($cx - $r * 0.2), (int) ($cy - $r * 0.1),
            (int) ($cx + $r * 0.1), (int) ($cy - $r * 0.4),
            (int) ($cx + $r * 0.3), (int) ($cy - $r * 0.9),
            (int) ($cx + $r * 0.5), (int) ($cy - $r * 0.9),
            (int) ($cx + $r * 0.4), (int) ($cy - $r * 0.3),
            (int) ($cx + $r * 0.85), (int) ($cy - $r * 0.3),
            (int) ($cx + $r * 0.95), (int) ($cy + $r * 0.1),
            (int) ($cx + $r * 0.85), (int) ($cy + $r),
        ], $fill);
        imagesetthickness($img, max(2, (int) ($r * 0.08)));
        imagepolygon($img, [
            (int) ($cx - $r * 0.2), (int) ($cy + $r),
            (int) ($cx - $r * 0.2), (int) ($cy - $r * 0.1),
            (int) ($cx + $r * 0.1), (int) ($cy - $r * 0.4),
            (int) ($cx + $r * 0.3), (int) ($cy - $r * 0.9),
            (int) ($cx + $r * 0.5), (int) ($cy - $r * 0.9),
            (int) ($cx + $r * 0.4), (int) ($cy - $r * 0.3),
            (int) ($cx + $r * 0.85), (int) ($cy - $r * 0.3),
            (int) ($cx + $r * 0.95), (int) ($cy + $r * 0.1),
            (int) ($cx + $r * 0.85), (int) ($cy + $r),
        ], $stroke);
        // wrist
        imagefilledrectangle($img, (int) ($cx - $r * 0.65), (int) ($cy - $r * 0.1), (int) ($cx - $r * 0.2), (int) ($cy + $r), $fill);
        imagerectangle($img, (int) ($cx - $r * 0.65), (int) ($cy - $r * 0.1), (int) ($cx - $r * 0.2), (int) ($cy + $r), $stroke);
    }

    /**
     * Render text caption + optional date stamp di area footer frame.
     * Pakai TrueType font (DejaVu Sans dari vendor dompdf — already shipped).
     */
    private function renderCaption(GdImage $canvas, int $w, int $h, PhotoSession $session): void
    {
        $caption = trim((string) $session->caption);
        $showDate = (bool) $session->show_date_stamp;

        if ($caption === '' && ! $showDate) {
            return;
        }

        $fontBold = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans-Bold.ttf');
        $fontReg = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf');

        if (! file_exists($fontBold) || ! function_exists('imagettftext')) {
            return; // graceful fallback — gak render text kalau font/FT2 tidak ada
        }

        // Footer area: 6% dari tinggi paling bawah (centered area untuk text)
        $footerH = (int) ($h * 0.06);
        $footerCenterY = $h - (int) ($footerH * 0.5);
        $textColor = imagecolorallocate($canvas, 10, 10, 10);
        $accentColor = imagecolorallocatealpha($canvas, 245, 250, 12, 0);

        // Caption font size proporsional ke lebar canvas
        $captionFontSize = (int) max(18, $w * 0.022);
        $dateFontSize = (int) max(11, $w * 0.012);

        if ($caption !== '') {
            $captionUpper = mb_strtoupper($caption, 'UTF-8');

            // Measure text bbox
            $bbox = imagettfbbox($captionFontSize, 0, $fontBold, $captionUpper);
            $textW = $bbox[2] - $bbox[0];
            $textH = $bbox[1] - $bbox[7];

            $x = (int) (($w - $textW) / 2);
            $y = $showDate
                ? $footerCenterY - (int) ($textH * 0.15)
                : $footerCenterY + (int) ($textH * 0.35);

            // Yellow highlight bar di belakang caption
            $padX = (int) ($captionFontSize * 0.6);
            $padY = (int) ($captionFontSize * 0.32);
            imagefilledrectangle(
                $canvas,
                $x - $padX,
                $y - $textH - $padY,
                $x + $textW + $padX,
                $y + $padY,
                $accentColor,
            );

            imagettftext($canvas, $captionFontSize, 0, $x, $y, $textColor, $fontBold, $captionUpper);
        }

        if ($showDate) {
            $date = ($session->completed_at ?? now())->format('d M Y');
            $dateUpper = '·  '.mb_strtoupper($date, 'UTF-8').'  ·';

            $bbox = imagettfbbox($dateFontSize, 0, $fontReg, $dateUpper);
            $textW = $bbox[2] - $bbox[0];

            $x = (int) (($w - $textW) / 2);
            $y = $caption !== ''
                ? $footerCenterY + (int) ($dateFontSize * 2.4)
                : $footerCenterY + (int) ($dateFontSize * 0.4);

            imagettftext($canvas, $dateFontSize, 0, $x, $y, $textColor, $fontReg, $dateUpper);
        }
    }

    private function loadImage(string $path): GdImage
    {
        $info = @getimagesize($path);

        if (! $info) {
            throw new RuntimeException("Gagal getimagesize: {$path}");
        }

        $img = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => @imagecreatefromwebp($path),
            default => null,
        };

        if (! $img) {
            throw new RuntimeException("Gagal load image: {$path}");
        }

        if ($info[2] === IMAGETYPE_PNG || $info[2] === IMAGETYPE_WEBP) {
            imagealphablending($img, true);
            imagesavealpha($img, true);
        }

        return $img;
    }

    /**
     * Resize+crop image jadi tepat $targetW × $targetH (cover-fit, no distortion).
     */
    private function coverResize(GdImage $src, int $targetW, int $targetH): GdImage
    {
        $srcW = imagesx($src);
        $srcH = imagesy($src);
        $srcRatio = $srcW / $srcH;
        $targetRatio = $targetW / $targetH;

        if ($srcRatio > $targetRatio) {
            // src lebih lebar → crop kiri/kanan
            $cropH = $srcH;
            $cropW = (int) round($srcH * $targetRatio);
            $cropX = (int) round(($srcW - $cropW) / 2);
            $cropY = 0;
        } else {
            // src lebih tinggi → crop atas/bawah
            $cropW = $srcW;
            $cropH = (int) round($srcW / $targetRatio);
            $cropX = 0;
            $cropY = (int) round(($srcH - $cropH) / 2);
        }

        $dst = imagecreatetruecolor($targetW, $targetH);
        imagealphablending($dst, true);
        imagesavealpha($dst, true);

        imagecopyresampled(
            $dst, $src,
            0, 0, $cropX, $cropY,
            $targetW, $targetH, $cropW, $cropH,
        );

        return $dst;
    }

    /**
     * Bikin copy dari frame PNG dengan pixel hitam dijadikan transparent.
     * Pixel "hitam" = R+G+B ≤ $darknessThreshold dan tidak sudah transparent.
     */
    private function makeBlackTransparent(GdImage $src, int $darknessThreshold = 90): GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);

        $dst = imagecreatetruecolor($w, $h);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $w, $h, $transparent);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgba = imagecolorat($src, $x, $y);
                $alpha = ($rgba >> 24) & 0x7F;

                // Sudah transparent → biarkan transparent
                if ($alpha > 100) {
                    continue;
                }

                $r = ($rgba >> 16) & 0xFF;
                $g = ($rgba >> 8) & 0xFF;
                $b = $rgba & 0xFF;

                // Hitam → transparent
                if (($r + $g + $b) <= $darknessThreshold) {
                    continue;
                }

                // Selain itu → preserve
                $color = imagecolorallocatealpha($dst, $r, $g, $b, $alpha);
                imagesetpixel($dst, $x, $y, $color);
            }
        }

        return $dst;
    }

    /**
     * Sample-scan: cek apakah image punya area transparan signifikan (>2%).
     */
    private function hasTransparency(GdImage $img, int $w, int $h): bool
    {
        $step = max(1, (int) (min($w, $h) / 100));
        $transparent = 0;
        $sampled = 0;

        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $alpha = (imagecolorat($img, $x, $y) >> 24) & 0x7F;
                $sampled++;

                if ($alpha > 60) {
                    $transparent++;
                }
            }
        }

        return $sampled > 0 && ($transparent / $sampled) > 0.02;
    }
}
