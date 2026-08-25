<?php

namespace App\Http\Controllers\Booth;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\BoothDevice;
use App\Models\Frame;
use App\Models\PaperSize;
use App\Models\PricingConfig;
use App\Models\Printer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BootstrapController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');

        $frames = Frame::query()
            ->with(['category:id,name', 'photoSlots'])
            ->where('is_active', true)
            ->where(function ($query) use ($device) {
                $query->whereNull('branch_id')
                    ->orWhere('branch_id', $device->branch_id);
            })
            ->orderByDesc('is_premium')
            ->orderBy('name')
            ->get()
            ->map(fn (Frame $frame) => [
                'id' => $frame->id,
                'name' => $frame->name,
                'slug' => $frame->slug,
                'category' => $frame->category?->name,
                'thumbnail_url' => $frame->thumbnail_path
                    ? Storage::url($frame->thumbnail_path)
                    : null,
                'background_url' => $frame->background_path
                    ? Storage::url($frame->background_path)
                    : null,
                'overlay_url' => $frame->overlay_path
                    ? Storage::url($frame->overlay_path)
                    : null,
                'photo_slots' => (int) $frame->photo_slots,
                'canvas_data' => $frame->canvas_data,
                'price_addon' => (float) $frame->price_addon,
                'is_premium' => (bool) $frame->is_premium,
                'slots' => $frame->photoSlots
                    ->sortBy('slot_number')
                    ->values()
                    ->map(fn ($slot) => [
                        'slot_number' => (int) $slot->slot_number,
                        'x' => (int) $slot->x,
                        'y' => (int) $slot->y,
                        'width' => (int) $slot->width,
                        'height' => (int) $slot->height,
                    ])
                    ->all(),
            ])
            ->values();

        $printers = Printer::withoutGlobalScopes()
            ->where('branch_id', $device->branch_id)
            ->where('is_active', true)
            ->get(['id', 'name', 'model', 'connection_type', 'system_printer_name', 'is_default', 'last_status']);
        $paperSize = PaperSize::query()
            ->where('code', 'STRIP')
            ->where('is_active', true)
            ->first();
        $pricingConfig = $paperSize
            ? PricingConfig::withoutGlobalScopes()
                ->where('branch_id', $device->branch_id)
                ->where('paper_size_id', $paperSize->id)
                ->where('is_active', true)
                ->first()
            : null;

        return response()->json([
            'server_time' => now()->toIso8601String(),
            'device' => [
                'id' => $device->id,
                'name' => $device->name,
                'branch_id' => $device->branch_id,
            ],
            'branch' => [
                'id' => $device->branch->id,
                'code' => $device->branch->code,
                'name' => $device->branch->name,
            ],
            'pricing' => [
                'base_price' => (float) ($pricingConfig?->base_price ?? AppSetting::get('base_price', 25_000)),
                'extra_print_price' => (float) AppSetting::get('extra_print_price', 5_000),
                'min_prints' => (int) ($pricingConfig?->min_prints ?? AppSetting::get('min_prints', 1)),
                'max_prints' => (int) ($pricingConfig?->max_prints ?? AppSetting::get('max_prints', 10)),
            ],
            'frames' => $frames,
            'printers' => $printers,
        ]);
    }
}
