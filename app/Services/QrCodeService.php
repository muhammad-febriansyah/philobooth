<?php

namespace App\Services;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generate QR code SVG via bacon-qr-code.
 * Pakai SVG karena tidak butuh imagick (vector, render bagus di semua resolusi).
 */
final class QrCodeService
{
    /**
     * Generate QR SVG untuk text, simpan ke disk public, return path relatif.
     */
    public function generateSvg(string $text, string $directory = 'qr', int $size = 400): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size),
            new SvgImageBackEnd,
        );

        $writer = new Writer($renderer);
        $svgContent = $writer->writeString($text);

        $filename = Str::random(16).'.svg';
        $path = trim($directory, '/').'/'.$filename;

        Storage::disk('public')->put($path, $svgContent);

        return $path;
    }
}
