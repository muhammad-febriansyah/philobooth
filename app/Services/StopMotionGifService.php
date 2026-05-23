<?php

namespace App\Services;

use App\Models\PhotoSession;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Build an animated stop-motion GIF from the photos of a PhotoSession.
 *
 * Reads each selected photo, resizes to a uniform canvas size, converts
 * the GD canvas to a per-frame GIF, then hands the frames to
 * AnimatedGifEncoder which assembles the final animated GIF.
 *
 * Output is stored on the `public` disk under `sessions/{id}/stop-motion.gif`
 * and the relative path is persisted to `photo_sessions.gif_path`.
 */
class StopMotionGifService
{
    private const TARGET_WIDTH = 720;

    private const TARGET_HEIGHT = 720;

    private const DEFAULT_DELAY_CS = 25;

    private const BOOMERANG_DELAY_CS = 8;

    public function __construct(private readonly AnimatedGifEncoder $encoder) {}

    public function generate(PhotoSession $session): string
    {
        $photos = $session->photos()
            ->orderBy('slot_number')
            ->get();

        if ($photos->count() < 2) {
            throw new RuntimeException('Sesi memerlukan minimal 2 foto untuk stop motion GIF.');
        }

        $frames = [];

        foreach ($photos as $photo) {
            $relative = $photo->edited_path ?: $photo->original_path;

            if (! $relative || ! Storage::disk('public')->exists($relative)) {
                continue;
            }

            $absolute = Storage::disk('public')->path($relative);
            $frame = $this->buildFrame($absolute);

            if ($frame !== null) {
                $frames[] = $frame;
            }
        }

        if (count($frames) < 2) {
            throw new RuntimeException('Tidak cukup foto valid untuk membuat GIF.');
        }

        // Boomerang effect: forward frames + reversed middle frames (no
        // duplicate endpoints) so playback bounces seamlessly back and forth.
        // Applied when frame count suggests a rapid burst (>= 8 frames).
        $isBoomerang = count($frames) >= 8;

        if ($isBoomerang) {
            $reversed = array_reverse(array_slice($frames, 1, -1));
            $playback = array_merge($frames, $reversed);
            $delay = self::BOOMERANG_DELAY_CS;
        } else {
            $playback = $frames;
            $delay = self::DEFAULT_DELAY_CS;
        }

        $gifBytes = $this->encoder->encode($playback, $delay);

        $relativePath = "sessions/{$session->id}/stop-motion.gif";
        Storage::disk('public')->put($relativePath, $gifBytes);

        return $relativePath;
    }

    private function buildFrame(string $absolutePath): ?string
    {
        $info = @getimagesize($absolutePath);

        if ($info === false) {
            return null;
        }

        $source = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($absolutePath),
            IMAGETYPE_PNG => @imagecreatefrompng($absolutePath),
            IMAGETYPE_GIF => @imagecreatefromgif($absolutePath),
            IMAGETYPE_WEBP => @imagecreatefromwebp($absolutePath),
            default => false,
        };

        if (! $source) {
            return null;
        }

        $canvas = imagecreatetruecolor(self::TARGET_WIDTH, self::TARGET_HEIGHT);
        $bg = imagecolorallocate($canvas, 0, 0, 0);
        imagefill($canvas, 0, 0, $bg);

        [$sw, $sh] = [imagesx($source), imagesy($source)];
        $scale = min(self::TARGET_WIDTH / $sw, self::TARGET_HEIGHT / $sh);
        $dw = (int) round($sw * $scale);
        $dh = (int) round($sh * $scale);
        $dx = (int) (((self::TARGET_WIDTH - $dw) / 2));
        $dy = (int) (((self::TARGET_HEIGHT - $dh) / 2));

        imagecopyresampled($canvas, $source, $dx, $dy, 0, 0, $dw, $dh, $sw, $sh);
        imagedestroy($source);

        ob_start();
        imagegif($canvas);
        $bytes = ob_get_clean();
        imagedestroy($canvas);

        return $bytes ?: null;
    }
}
