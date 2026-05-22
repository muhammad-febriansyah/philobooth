<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FrameOrientation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FrameRequest;
use App\Models\Frame;
use App\Models\FrameCategory;
use App\Models\FramePhotoSlot;
use App\Models\PaperSize;
use App\Services\FrameBuilder\FrameSlotDetector;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FrameController extends Controller
{
    public function __construct(
        private readonly FrameSlotDetector $detector,
    ) {}

    public function index(Request $request): Response
    {
        $frames = Frame::query()
            ->with(['category:id,name,slug', 'paperSize:id,code,name'])
            ->withCount('photoSlots')
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->when($request->string('category_id')->toString(), function ($q, $id) {
                $q->where('category_id', $id);
            })
            ->when($request->string('status')->toString(), function ($q, $status) {
                $q->where('is_active', $status === 'active');
            })
            ->latest('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('admin/frames', [
            'frames' => $frames->through(fn (Frame $f) => [
                'id' => $f->id,
                'name' => $f->name,
                'slug' => $f->slug,
                'description' => $f->description,
                'thumbnail_url' => $f->thumbnail_path && Storage::disk('public')->exists($f->thumbnail_path)
                    ? Storage::url($f->thumbnail_path)
                    : null,
                'orientation' => $f->orientation?->value,
                'photo_slots' => (int) $f->photo_slots,
                'photo_slots_count' => (int) $f->photo_slots_count,
                'category' => $f->category
                    ? ['id' => $f->category->id, 'name' => $f->category->name]
                    : null,
                'category_id' => $f->category_id,
                'paper_size' => $f->paperSize
                    ? ['id' => $f->paperSize->id, 'code' => $f->paperSize->code, 'name' => $f->paperSize->name]
                    : null,
                'paper_size_id' => $f->paper_size_id,
                'price_addon' => (float) $f->price_addon,
                'is_premium' => (bool) $f->is_premium,
                'is_active' => (bool) $f->is_active,
                'usage_count' => (int) $f->usage_count,
            ]),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'category_id' => $request->string('category_id')->toString(),
                'status' => $request->string('status')->toString(),
            ],
            'categories' => FrameCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'paper_sizes' => PaperSize::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
            'orientations' => collect(FrameOrientation::cases())->map(fn ($o) => [
                'value' => $o->value,
                'label' => ucfirst($o->value),
            ])->values(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/frame-form', $this->formProps(null));
    }

    public function edit(Frame $frame): Response
    {
        $frame->load(['photoSlots', 'category:id,name']);

        return Inertia::render('admin/frame-form', $this->formProps($frame));
    }

    /** @return array<string, mixed> */
    private function formProps(?Frame $frame): array
    {
        return [
            'frame' => $frame ? [
                'id' => $frame->id,
                'name' => $frame->name,
                'description' => $frame->description,
                'thumbnail_url' => $frame->thumbnail_path && Storage::disk('public')->exists($frame->thumbnail_path)
                    ? Storage::url($frame->thumbnail_path)
                    : null,
                'orientation' => $frame->orientation?->value,
                'type' => $frame->type?->value,
                'photo_slots' => (int) $frame->photo_slots,
                'category' => $frame->category?->name,
                'paper_size_id' => $frame->paper_size_id,
                'is_premium' => (bool) $frame->is_premium,
                'is_active' => (bool) $frame->is_active,
                'slots' => $frame->photoSlots->map(fn ($s) => [
                    'slot_number' => $s->slot_number,
                    'x' => $s->x,
                    'y' => $s->y,
                    'width' => $s->width,
                    'height' => $s->height,
                ])->values(),
            ] : null,
            'category_suggestions' => FrameCategory::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->pluck('name')
                ->values(),
            'paper_sizes' => PaperSize::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
            'orientations' => collect(FrameOrientation::cases())->map(fn ($o) => [
                'value' => $o->value,
                'label' => ucfirst($o->value),
            ])->values(),
            'types' => collect(\App\Enums\FrameType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ])->values(),
        ];
    }

    public function store(FrameRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $file = $request->file('image');

        if (! $file) {
            return back()->withErrors(['image' => 'File frame wajib diunggah.']);
        }

        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = Str::random(20).'.'.$ext;
        $path = $file->storeAs('frames', $filename, 'public');
        $absolutePath = Storage::disk('public')->path($path);

        try {
            $detectedSlots = $this->detector->detect($absolutePath);
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($path);

            return back()->withErrors(['image' => 'Gagal scan slot frame: '.$e->getMessage()]);
        }

        $frame = DB::transaction(function () use ($data, $path, $detectedSlots, $request) {
            $category = $this->resolveCategory($data['category']);

            $frame = Frame::create([
                'category_id' => $category->id,
                'paper_size_id' => $data['paper_size_id'],
                'name' => $data['name'],
                'slug' => Str::slug($data['name']).'-'.Str::random(6),
                'description' => $data['description'] ?? null,
                'thumbnail_path' => $path,
                'orientation' => $data['orientation'],
                'type' => $data['type'],
                'photo_slots' => count($detectedSlots),
                'is_premium' => $request->boolean('is_premium'),
                'is_active' => $request->boolean('is_active', true),
                'created_by' => $request->user()?->id,
            ]);

            foreach ($detectedSlots as $slot) {
                FramePhotoSlot::create([
                    'frame_id' => $frame->id,
                    'slot_number' => $slot->slotNumber,
                    'x' => $slot->x,
                    'y' => $slot->y,
                    'width' => $slot->width,
                    'height' => $slot->height,
                    'rotation' => 0,
                    'shape' => 'rectangle',
                    'border_radius' => 0,
                ]);
            }

            return $frame;
        });

        return redirect()
            ->route('admin.frames.index')
            ->with(
                'success',
                "Frame '{$frame->name}' berhasil diunggah. {$frame->photo_slots} slot foto terdeteksi otomatis.",
            );
    }

    public function update(FrameRequest $request, Frame $frame): RedirectResponse
    {
        $data = $request->validated();

        $category = $this->resolveCategory($data['category']);

        $updates = [
            'category_id' => $category->id,
            'paper_size_id' => $data['paper_size_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'orientation' => $data['orientation'],
            'type' => $data['type'],
            'is_premium' => $request->boolean('is_premium'),
            'is_active' => $request->boolean('is_active', true),
        ];

        $newFile = $request->file('image');
        $detectedCount = null;

        if ($newFile) {
            $ext = strtolower($newFile->getClientOriginalExtension() ?: 'png');
            $filename = Str::random(20).'.'.$ext;
            $path = $newFile->storeAs('frames', $filename, 'public');
            $absolutePath = Storage::disk('public')->path($path);

            try {
                $detectedSlots = $this->detector->detect($absolutePath);
            } catch (\Throwable $e) {
                Storage::disk('public')->delete($path);

                return back()->withErrors(['image' => 'Gagal scan slot frame: '.$e->getMessage()]);
            }

            DB::transaction(function () use ($frame, $updates, $path, $detectedSlots) {
                if ($frame->thumbnail_path) {
                    Storage::disk('public')->delete($frame->thumbnail_path);
                }

                $frame->update($updates + [
                    'thumbnail_path' => $path,
                    'photo_slots' => count($detectedSlots),
                ]);

                $frame->photoSlots()->delete();

                foreach ($detectedSlots as $slot) {
                    FramePhotoSlot::create([
                        'frame_id' => $frame->id,
                        'slot_number' => $slot->slotNumber,
                        'x' => $slot->x,
                        'y' => $slot->y,
                        'width' => $slot->width,
                        'height' => $slot->height,
                        'rotation' => 0,
                        'shape' => 'rectangle',
                        'border_radius' => 0,
                    ]);
                }
            });

            $detectedCount = count($detectedSlots);
        } else {
            $frame->update($updates);
        }

        $msg = "Frame '{$frame->name}' berhasil diperbarui.";

        if ($detectedCount !== null) {
            $msg .= " {$detectedCount} slot foto ter-deteksi ulang.";
        }

        return redirect()->route('admin.frames.index')->with('success', $msg);
    }

    public function destroy(Frame $frame): RedirectResponse
    {
        if ($frame->thumbnail_path) {
            Storage::disk('public')->delete($frame->thumbnail_path);
        }

        $frame->delete();

        return back()->with('success', 'Frame berhasil dihapus.');
    }

    public function preview(Frame $frame): Response
    {
        $frame->load('photoSlots', 'category:id,name', 'paperSize:id,code,name');

        return Inertia::render('admin/frame-preview', [
            'frame' => [
                'id' => $frame->id,
                'name' => $frame->name,
                'thumbnail_url' => $frame->thumbnail_path && Storage::disk('public')->exists($frame->thumbnail_path)
                    ? Storage::url($frame->thumbnail_path)
                    : null,
                'orientation' => $frame->orientation?->value,
                'photo_slots' => (int) $frame->photo_slots,
                'category' => $frame->category?->name,
                'paper_size' => $frame->paperSize?->code,
                'slots' => $frame->photoSlots->map(fn (FramePhotoSlot $s) => [
                    'slot_number' => $s->slot_number,
                    'x' => $s->x,
                    'y' => $s->y,
                    'width' => $s->width,
                    'height' => $s->height,
                ])->values(),
                'image_size' => $this->getImageSize($frame->thumbnail_path),
            ],
        ]);
    }

    /** @return array{width:int, height:int}|null */
    private function getImageSize(?string $path): ?array
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $info = @getimagesize(Storage::disk('public')->path($path));

        if (! $info) {
            return null;
        }

        return ['width' => $info[0], 'height' => $info[1]];
    }

    /**
     * Find-or-create kategori dari input text bebas. Slug otomatis.
     */
    private function resolveCategory(string $name): FrameCategory
    {
        $trimmed = trim($name);
        $slug = Str::slug($trimmed);

        return FrameCategory::firstOrCreate(
            ['slug' => $slug],
            [
                'name' => $trimmed,
                'is_active' => true,
            ],
        );
    }
}
