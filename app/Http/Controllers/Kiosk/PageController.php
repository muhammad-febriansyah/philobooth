<?php

namespace App\Http\Controllers\Kiosk;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Frame;
use App\Models\PhotoSession;
use App\Models\PricingConfig;
use App\Services\FrameBuilder\CompositeGenerator;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Render kiosk pages dengan props dari DB.
 * Session state diambil dari Laravel session key 'kiosk_session_id'.
 */
class PageController extends Controller
{
    private const SESSION_KEY = 'kiosk_session_id';

    public function welcome(Request $request): Response
    {
        return Inertia::render('kiosk/welcome', [
            'branches' => Branch::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'has_active_session' => $this->currentSession($request) !== null,
        ]);
    }

    public function welcomeDark(Request $request): Response
    {
        return Inertia::render('kiosk/welcome-dark', [
            'branches' => Branch::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'has_active_session' => $this->currentSession($request) !== null,
        ]);
    }

    public function payment(Request $request): Response
    {
        $session = $this->requireSession($request, 'payment');

        return Inertia::render('kiosk/payment', [
            'session' => $this->sessionProps($session),
        ]);
    }

    public function qris(Request $request): Response
    {
        $session = $this->requireSession($request, 'qris');

        $payment = $session->payments()
            ->where('method', PaymentMethod::QrisDoku)
            ->where('status', PaymentStatus::Pending)
            ->latest('id')
            ->first();

        $qrisData = null;

        if ($payment && $payment->qris_string) {
            $renderer = new ImageRenderer(
                new RendererStyle(420, 1),
                new SvgImageBackEnd,
            );
            $svg = (new Writer($renderer))->writeString($payment->qris_string);

            $qrisData = [
                'string' => $payment->qris_string,
                'image_url' => $payment->qris_image_path,
                'image_data_uri' => 'data:image/svg+xml;base64,'.base64_encode($svg),
                'invoice_number' => $payment->doku_invoice_number,
                'expired_at' => $payment->expired_at?->toIso8601String(),
            ];
        }

        return Inertia::render('kiosk/qris', [
            'session' => $this->sessionProps($session),
            'qris' => $qrisData,
        ]);
    }

    public function voucher(Request $request): Response
    {
        $session = $this->requireSession($request, 'voucher');

        return Inertia::render('kiosk/voucher', [
            'session' => $this->sessionProps($session),
        ]);
    }

    public function validatePay(Request $request): Response
    {
        $session = $this->requireSession($request, 'validate');

        return Inertia::render('kiosk/validate', [
            'session' => $this->sessionProps($session),
        ]);
    }

    public function outputType(Request $request): Response
    {
        $session = $this->requireSession($request, 'output-type');

        return Inertia::render('kiosk/output-type', [
            'session' => $this->sessionProps($session),
        ]);
    }

    public function frameSelect(Request $request): Response
    {
        $session = $this->requireSession($request, 'frame-select');

        $frames = Frame::query()
            ->with(['category:id,name', 'photoSlots'])
            ->where('is_active', true)
            ->orderByDesc('is_premium')
            ->orderBy('name')
            ->get()
            ->map(fn (Frame $f) => [
                'id' => $f->id,
                'name' => $f->name,
                'category' => $f->category?->name,
                'thumbnail_url' => $f->thumbnail_path && Storage::disk('public')->exists($f->thumbnail_path)
                    ? Storage::url($f->thumbnail_path)
                    : null,
                'photo_slots' => (int) $f->photo_slots,
                'is_premium' => (bool) $f->is_premium,
                'price_addon' => (float) $f->price_addon,
            ]);

        return Inertia::render('kiosk/frame-select', [
            'session' => $this->sessionProps($session),
            'frames' => $frames,
        ]);
    }

    public function capture(Request $request): Response
    {
        $session = $this->requireSession($request, 'capture');
        $session->loadMissing(['frame.photoSlots']);

        $frame = $session->frame;
        $framePath = $frame?->thumbnail_path;
        $hasThumb = $framePath && Storage::disk('public')->exists($framePath);
        $imageSize = null;

        if ($hasThumb) {
            $info = @getimagesize(Storage::disk('public')->path($framePath));

            if ($info) {
                $imageSize = ['width' => $info[0], 'height' => $info[1]];
            }
        }

        $component = $session->session_type?->value === 'stop_motion_video'
            ? 'kiosk/capture-boomerang'
            : 'kiosk/capture';

        return Inertia::render($component, [
            'session' => $this->sessionProps($session),
            'frame' => $frame ? [
                'id' => $frame->id,
                'name' => $frame->name,
                'photo_slots' => (int) $frame->photo_slots,
                'thumbnail_url' => $hasThumb ? Storage::url($framePath) : null,
                'image_size' => $imageSize,
                'slots' => $frame->photoSlots
                    ->sortBy('slot_number')
                    ->map(fn ($s) => [
                        'slot_number' => (int) $s->slot_number,
                        'x' => (int) $s->x,
                        'y' => (int) $s->y,
                        'width' => (int) $s->width,
                        'height' => (int) $s->height,
                    ])
                    ->values(),
            ] : null,
        ]);
    }

    public function preview(Request $request, CompositeGenerator $composer): Response
    {
        $session = $this->requireSession($request, 'preview');
        $session->loadMissing(['photos', 'frame.photoSlots']);

        $frame = $session->frame;
        $framePath = $frame?->thumbnail_path;
        $hasThumb = $framePath && Storage::disk('public')->exists($framePath);
        $imageSize = null;

        if ($hasThumb) {
            $info = @getimagesize(Storage::disk('public')->path($framePath));

            if ($info) {
                $imageSize = ['width' => $info[0], 'height' => $info[1]];
            }
        }

        // Generate server-side composite preview supaya preview match hasil cetak.
        $compositeUrl = null;
        $expectedSlots = $frame?->photoSlots->count() ?? 0;

        if ($frame && $session->photos->count() === $expectedSlots && $expectedSlots > 0) {
            try {
                $compositePath = $composer->generate($session);
                $compositeUrl = Storage::url($compositePath).'?t='.time();
            } catch (\Throwable $e) {
                Log::warning('Preview composite gagal: '.$e->getMessage(), [
                    'session' => $session->session_code,
                ]);
            }
        }

        return Inertia::render('kiosk/preview', [
            'composite_url' => $compositeUrl,
            'session' => $this->sessionProps($session),
            'photos' => $session->photos
                ->sortBy('slot_number')
                ->map(fn ($p) => [
                    'slot_number' => (int) $p->slot_number,
                    'url' => Storage::url($p->original_path),
                ])->values(),
            'frame' => $frame ? [
                'id' => $frame->id,
                'name' => $frame->name,
                'photo_slots' => (int) $frame->photo_slots,
                'thumbnail_url' => $hasThumb ? Storage::url($framePath) : null,
                'image_size' => $imageSize,
                'slots' => $frame->photoSlots
                    ->sortBy('slot_number')
                    ->map(fn ($s) => [
                        'slot_number' => (int) $s->slot_number,
                        'x' => (int) $s->x,
                        'y' => (int) $s->y,
                        'width' => (int) $s->width,
                        'height' => (int) $s->height,
                    ])
                    ->values(),
            ] : null,
        ]);
    }

    public function filter(Request $request): Response
    {
        $session = $this->requireSession($request, 'filter');
        $session->loadMissing(['photos', 'frame.photoSlots']);

        $frame = $session->frame;
        $framePath = $frame?->thumbnail_path;
        $hasThumb = $framePath && Storage::disk('public')->exists($framePath);
        $imageSize = null;

        if ($hasThumb) {
            $info = @getimagesize(Storage::disk('public')->path($framePath));

            if ($info) {
                $imageSize = ['width' => $info[0], 'height' => $info[1]];
            }
        }

        return Inertia::render('kiosk/filter', [
            'session' => $this->sessionProps($session),
            'photos' => $session->photos
                ->sortBy('slot_number')
                ->map(fn ($p) => [
                    'slot_number' => (int) $p->slot_number,
                    'url' => Storage::url($p->original_path),
                ])->values(),
            'frame' => $frame ? [
                'id' => $frame->id,
                'name' => $frame->name,
                'photo_slots' => (int) $frame->photo_slots,
                'thumbnail_url' => $hasThumb ? Storage::url($framePath) : null,
                'image_size' => $imageSize,
                'slots' => $frame->photoSlots
                    ->sortBy('slot_number')
                    ->map(fn ($s) => [
                        'slot_number' => (int) $s->slot_number,
                        'x' => (int) $s->x,
                        'y' => (int) $s->y,
                        'width' => (int) $s->width,
                        'height' => (int) $s->height,
                    ])
                    ->values(),
            ] : null,
        ]);
    }

    public function qty(Request $request, CompositeGenerator $composer): Response
    {
        $session = $this->requireSession($request, 'qty');
        $session->loadMissing('paperSize');
        $branchId = $session->branch_id;
        $paperSizeId = $session->paper_size_id;
        $pricing = null;

        if ($branchId && $paperSizeId) {
            $pricing = PricingConfig::query()
                ->where('branch_id', $branchId)
                ->where('paper_size_id', $paperSizeId)
                ->where('is_active', true)
                ->first();
        }

        return Inertia::render('kiosk/qty', [
            'session' => $this->sessionProps($session),
            'composite_url' => $this->buildCompositeUrl($session, $composer),
            'frame' => $this->frameProps($session->frame),
            'pricing' => [
                'base_price' => (float) ($pricing?->base_price ?? $session->total_amount),
                'free_quantity' => 1,
                'extra_per_print' => (float) ($pricing?->base_price ?? $session->total_amount) * 0.5,
                'max_prints' => (int) ($pricing?->max_prints ?? 10),
            ],
        ]);
    }

    private function buildCompositeUrl(PhotoSession $session, CompositeGenerator $composer): ?string
    {
        $session->loadMissing(['frame.photoSlots', 'photos']);
        $frame = $session->frame;

        if (! $frame) {
            return null;
        }

        $expected = $frame->photoSlots->count();

        if ($expected === 0 || $session->photos->count() !== $expected) {
            return null;
        }

        try {
            $path = $composer->generate($session);

            return Storage::url($path).'?t='.time();
        } catch (\Throwable $e) {
            Log::warning('Composite gagal: '.$e->getMessage(), [
                'session' => $session->session_code,
            ]);

            return null;
        }
    }

    /** @return array<string, mixed>|null */
    private function frameProps(?Frame $frame): ?array
    {
        if (! $frame) {
            return null;
        }

        $framePath = $frame->thumbnail_path;
        $hasThumb = $framePath && Storage::disk('public')->exists($framePath);
        $imageSize = null;

        if ($hasThumb) {
            $info = @getimagesize(Storage::disk('public')->path($framePath));

            if ($info) {
                $imageSize = ['width' => $info[0], 'height' => $info[1]];
            }
        }

        return [
            'id' => $frame->id,
            'name' => $frame->name,
            'photo_slots' => (int) $frame->photo_slots,
            'thumbnail_url' => $hasThumb ? Storage::url($framePath) : null,
            'image_size' => $imageSize,
        ];
    }

    public function extraPay(Request $request, CompositeGenerator $composer): Response
    {
        $session = $this->requireSession($request, 'extra-pay');
        $session->loadMissing('frame');

        return Inertia::render('kiosk/extra-pay', [
            'session' => $this->sessionProps($session),
            'composite_url' => $this->buildCompositeUrl($session, $composer),
            'frame' => $this->frameProps($session->frame),
        ]);
    }

    public function confirm(Request $request, CompositeGenerator $composer): Response
    {
        $session = $this->requireSession($request, 'confirm');
        $session->loadMissing(['paperSize', 'frame.category']);

        return Inertia::render('kiosk/confirm', [
            'session' => $this->sessionProps($session),
            'composite_url' => $this->buildCompositeUrl($session, $composer),
            'video_url' => $session->video_path && Storage::disk('public')->exists($session->video_path)
                ? Storage::url($session->video_path)
                : null,
            'frame' => $this->frameProps($session->frame),
            'frame_category' => $session->frame?->category?->name,
            'paper' => $session->paperSize
                ? [
                    'code' => $session->paperSize->code,
                    'name' => $session->paperSize->name,
                ]
                : null,
            'filter_label' => $session->filter_id ? 'Aktif' : 'Tidak ada',
        ]);
    }

    public function printing(Request $request): Response
    {
        $session = $this->requireSession($request, 'printing');

        return Inertia::render('kiosk/printing', [
            'session' => $this->sessionProps($session),
        ]);
    }

    public function download(Request $request): Response
    {
        $session = $this->requireSession($request, 'download');

        return Inertia::render('kiosk/download', [
            'session' => $this->sessionProps($session),
            'download_url' => $session->download_token
                ? url('/d/'.$session->download_token)
                : null,
            'final_url' => $session->final_image_path && Storage::disk('public')->exists($session->final_image_path)
                ? Storage::url($session->final_image_path)
                : null,
            'gif_url' => $session->gif_path && Storage::disk('public')->exists($session->gif_path)
                ? Storage::url($session->gif_path)
                : null,
            'video_url' => $session->video_path && Storage::disk('public')->exists($session->video_path)
                ? Storage::url($session->video_path)
                : null,
            'qr_url' => $session->download_qr_path && Storage::disk('public')->exists($session->download_qr_path)
                ? Storage::url($session->download_qr_path)
                : null,
        ]);
    }

    public function thanks(Request $request): Response
    {
        return Inertia::render('kiosk/thanks');
    }

    private function currentSession(Request $request): ?PhotoSession
    {
        $id = $request->session()->get(self::SESSION_KEY);

        if (! $id) {
            return null;
        }

        // Kiosk is anonymous customer flow; bypass BelongsToBranch scope so a
        // logged-in operator from branch X can still use the booth at branch Y.
        return PhotoSession::withoutGlobalScopes()->find($id);
    }

    /**
     * Redirect ke welcome jika tidak ada session aktif (kecuali untuk welcome page sendiri).
     */
    private function requireSession(Request $request, string $pageHint): PhotoSession
    {
        $session = $this->currentSession($request);

        if (! $session) {
            abort(redirect('/kiosk/welcome'));
        }

        return $session;
    }

    /** @return array<string, mixed> */
    private function sessionProps(PhotoSession $session): array
    {
        return [
            'session_code' => $session->session_code,
            'status' => $session->status?->value,
            'current_step' => $session->current_step?->value,
            'frame_id' => $session->frame_id,
            'filter_id' => $session->filter_id,
            'payment_method' => $session->payment_method?->value,
            'paid' => $session->paid_at !== null,
            'total_amount' => (float) $session->total_amount,
            'discount_amount' => (float) $session->discount_amount,
            'final_amount' => (float) $session->final_amount,
            'print_quantity' => (int) $session->print_quantity,
            'session_type' => $session->session_type?->value,
        ];
    }
}
