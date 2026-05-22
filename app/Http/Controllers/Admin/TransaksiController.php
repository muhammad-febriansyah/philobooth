<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentMethod;
use App\Enums\SessionStatus;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\PhotoSession;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransaksiController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $perPage = (int) ($request->integer('per_page') ?: 15);

        $base = $this->filteredQuery($request);

        $sessions = (clone $base)
            ->with(['branch:id,name', 'paperSize:id,name', 'frame:id,name'])
            ->latest('started_at')
            ->paginate($perPage)
            ->withQueryString();

        $stats = (clone $base)
            ->selectRaw('
                COUNT(*) as total,
                COALESCE(SUM(final_amount), 0) as revenue,
                COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) as completed,
                COALESCE(SUM(print_quantity), 0) as prints
            ', [SessionStatus::Completed->value])
            ->first();

        return Inertia::render('admin/transaksi', [
            'sessions' => $sessions->through(fn (PhotoSession $s) => $this->row($s)),
            'stats' => [
                'total' => (int) ($stats?->total ?? 0),
                'revenue' => (float) ($stats?->revenue ?? 0),
                'completed' => (int) ($stats?->completed ?? 0),
                'prints' => (int) ($stats?->prints ?? 0),
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
            'filters' => $this->filterValues($request),
            'options' => [
                'statuses' => collect(SessionStatus::cases())->map(fn ($s) => [
                    'value' => $s->value,
                    'label' => $s->label(),
                ])->values(),
                'methods' => collect(PaymentMethod::cases())->map(fn ($m) => [
                    'value' => $m->value,
                    'label' => $m->label(),
                ])->values(),
            ],
        ]);
    }

    public function exportPdf(Request $request): Response
    {
        $sessions = $this->filteredQuery($request)
            ->with(['branch:id,name', 'paperSize:id,name'])
            ->latest('started_at')
            ->limit(5000)
            ->get();

        $pdf = Pdf::loadView('exports.transaksi-pdf', [
            'sessions' => $sessions,
            'filters' => $this->filterValues($request),
            'totals' => [
                'count' => $sessions->count(),
                'revenue' => $sessions->sum('final_amount'),
                'prints' => $sessions->sum('print_quantity'),
            ],
        ])->setPaper('a4', 'landscape');

        $filename = 'transaksi-'.now()->format('Ymd-His').'.pdf';

        return $pdf->download($filename);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $filename = 'transaksi-'.now()->format('Ymd-His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $query = $this->filteredQuery($request)
            ->with(['branch:id,name', 'paperSize:id,name'])
            ->latest('started_at');

        return response()->stream(function () use ($query) {
            $out = fopen('php://output', 'w');

            // UTF-8 BOM so Excel detects encoding correctly.
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'Kode Sesi',
                'Tanggal',
                'Cabang',
                'Paper',
                'Status',
                'Metode',
                'Qty Cetak',
                'Total',
                'Diskon',
                'Final',
                'Telepon',
                'Email',
            ]);

            $query->chunk(500, function ($chunk) use ($out) {
                foreach ($chunk as $s) {
                    fputcsv($out, [
                        $s->session_code,
                        $s->started_at?->format('Y-m-d H:i'),
                        $s->branch?->name,
                        $s->paperSize?->name,
                        $s->status?->label(),
                        $s->payment_method?->label(),
                        $s->print_quantity,
                        (float) $s->total_amount,
                        (float) $s->discount_amount,
                        (float) $s->final_amount,
                        $s->customer_phone,
                        $s->customer_email,
                    ]);
                }
            });

            fclose($out);
        }, 200, $headers);
    }

    /** @return Builder<PhotoSession> */
    protected function filteredQuery(Request $request): Builder
    {
        return PhotoSession::query()
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('session_code', 'like', "%{$search}%")
                        ->orWhere('customer_phone', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                });
            })
            ->when($request->string('status')->toString(), fn ($q, $v) => $q->where('status', $v))
            ->when($request->string('method')->toString(), fn ($q, $v) => $q->where('payment_method', $v))
            ->when($request->string('branch_id')->toString(), fn ($q, $v) => $q->where('branch_id', $v))
            ->when($request->date('from'), fn ($q, $d) => $q->where('started_at', '>=', $d->startOfDay()))
            ->when($request->date('to'), fn ($q, $d) => $q->where('started_at', '<=', $d->endOfDay()));
    }

    /** @return array<string, string> */
    protected function filterValues(Request $request): array
    {
        return [
            'search' => $request->string('search')->toString(),
            'status' => $request->string('status')->toString(),
            'method' => $request->string('method')->toString(),
            'branch_id' => $request->string('branch_id')->toString(),
            'from' => $request->string('from')->toString(),
            'to' => $request->string('to')->toString(),
        ];
    }

    /** @return array<string, mixed> */
    protected function row(PhotoSession $s): array
    {
        return [
            'id' => $s->id,
            'session_code' => $s->session_code,
            'branch' => $s->branch?->name,
            'paper' => $s->paperSize?->name,
            'frame' => $s->frame?->name,
            'status' => $s->status?->value,
            'status_label' => $s->status?->label(),
            'payment_method' => $s->payment_method?->value,
            'payment_method_label' => $s->payment_method?->label(),
            'print_quantity' => (int) $s->print_quantity,
            'total_amount' => (float) $s->total_amount,
            'discount_amount' => (float) $s->discount_amount,
            'final_amount' => (float) $s->final_amount,
            'customer_phone' => $s->customer_phone,
            'customer_email' => $s->customer_email,
            'started_at' => $s->started_at?->toIso8601String(),
            'paid_at' => $s->paid_at?->toIso8601String(),
        ];
    }
}
