<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VoucherRequest;
use App\Models\AppSetting;
use App\Models\Branch;
use App\Models\Voucher;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) ($request->integer('per_page') ?: 12);

        $vouchers = Voucher::query()
            ->with('branch:id,name')
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->string('branch_id')->toString(), fn ($q, $id) => $q->where('branch_id', $id))
            ->when($request->string('status')->toString(), function ($q, $status) {
                $q->where('is_active', $status === 'active');
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/voucher', [
            'vouchers' => $vouchers->through(fn (Voucher $v) => [
                'id' => $v->id,
                'name' => $v->name,
                'code' => $v->code,
                'branch_id' => $v->branch_id,
                'branch' => $v->branch?->name,
                'max_uses' => (int) $v->max_uses,
                'used_count' => (int) $v->used_count,
                'valid_from' => $v->valid_from?->toIso8601String(),
                'valid_until' => $v->valid_until?->toIso8601String(),
                'is_active' => (bool) $v->is_active,
                'used_at' => $v->used_at?->toIso8601String(),
            ]),
            'stats' => [
                'total' => Voucher::count(),
                'active' => Voucher::where('is_active', true)->count(),
                'used' => Voucher::where('used_count', '>', 0)->count(),
                'available' => Voucher::where('is_active', true)
                    ->whereColumn('used_count', '<', 'max_uses')
                    ->count(),
            ],
            'branches' => Branch::query()
                ->when(
                    $request->user() && ! $request->user()->hasRole('admin'),
                    fn ($q) => $q->where('id', $request->user()->branch_id),
                )
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'can_pick_branch' => (bool) $request->user()?->hasRole('admin'),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'branch_id' => $request->string('branch_id')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function store(VoucherRequest $request): RedirectResponse
    {
        Voucher::create($this->payload($request));

        return back()->with('success', 'Voucher berhasil ditambahkan.');
    }

    public function update(VoucherRequest $request, Voucher $voucher): RedirectResponse
    {
        $voucher->update($this->payload($request, $voucher));

        return back()->with('success', 'Voucher berhasil diperbarui.');
    }

    public function destroy(Voucher $voucher): RedirectResponse
    {
        $voucher->delete();

        return back()->with('success', 'Voucher berhasil dihapus.');
    }

    public function pdf(Voucher $voucher): HttpResponse
    {
        $voucher->loadMissing('branch:id,name,code,city');

        $renderer = new ImageRenderer(
            new RendererStyle(280, 1),
            new SvgImageBackEnd,
        );

        $qrSvg = (new Writer($renderer))->writeString($voucher->code);
        $qrDataUri = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);

        $pdf = Pdf::loadView('exports.voucher-pdf', [
            'voucher' => $voucher,
            'qrDataUri' => $qrDataUri,
            'logoDataUri' => $this->logoDataUri(),
        ])->setPaper('a6', 'portrait');

        $filename = 'voucher-'.$voucher->code.'.pdf';

        return $pdf->stream($filename);
    }

    private function logoDataUri(): ?string
    {
        $path = AppSetting::get('logo_path');

        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $contents = Storage::disk('public')->get($path);
        $mime = Storage::disk('public')->mimeType($path) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode($contents);
    }

    /** @return array<string, mixed> */
    private function payload(VoucherRequest $request, ?Voucher $voucher = null): array
    {
        $validated = $request->validated();
        $user = $request->user();

        // Cabang user: force branch_id ke branch sendiri (mencegah create/edit di cabang lain)
        $branchId = $validated['branch_id'] ?? $voucher?->branch_id;
        if ($user && ! $user->hasRole('admin') && $user->branch_id) {
            $branchId = $user->branch_id;
        }

        return [
            'branch_id' => $branchId,
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'max_uses' => 1, // Voucher selalu sekali pakai.
            'valid_from' => $validated['valid_from'] ?? null,
            'valid_until' => $validated['valid_until'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ];
    }
}
