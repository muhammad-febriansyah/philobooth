<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PrinterConnectionType;
use App\Enums\PrinterModel;
use App\Enums\PrinterStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PrinterRequest;
use App\Models\Branch;
use App\Models\Printer;
use App\Services\PrinterStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PrinterController extends Controller
{
    public function index(Request $request): Response
    {
        $printers = Printer::query()
            ->with('branch:id,name')
            ->withCount(['printJobs as jobs_today_count' => fn ($q) => $q->whereDate('started_at', today())])
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('system_printer_name', 'like', "%{$search}%");
                });
            })
            ->when($request->string('branch_id')->toString(), fn ($q, $id) => $q->where('branch_id', $id))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('last_status', $status))
            ->latest('id')
            ->get();

        $stats = [
            'online' => $printers->whereIn('last_status', [PrinterStatus::Ready, PrinterStatus::Busy])->count(),
            'error' => $printers->where('last_status', PrinterStatus::Error)->count(),
            'offline' => $printers->where('last_status', PrinterStatus::Offline)->count(),
            'jobs_today' => (int) $printers->sum('jobs_today_count'),
        ];

        return Inertia::render('admin/printer', [
            'printers' => $printers->map(fn (Printer $p) => [
                'id' => $p->id,
                'branch_id' => $p->branch_id,
                'branch' => $p->branch?->name ?? '—',
                'name' => $p->name,
                'model' => $p->model?->value,
                'model_label' => $p->model?->label(),
                'connection_type' => $p->connection_type?->value,
                'ip_address' => $p->ip_address,
                'port' => $p->port,
                'system_printer_name' => $p->system_printer_name,
                'is_default' => (bool) $p->is_default,
                'is_active' => (bool) $p->is_active,
                'last_status' => $p->last_status?->value,
                'last_checked_at' => $p->last_checked_at?->toIso8601String(),
                'jobs_today_count' => (int) $p->jobs_today_count,
                'paper_consumed' => (int) ($p->settings['paper_consumed'] ?? 0),
            ]),
            'stats' => $stats,
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
            'options' => [
                'models' => collect(PrinterModel::cases())->map(fn ($m) => [
                    'value' => $m->value,
                    'label' => $m->label(),
                ])->values(),
                'connections' => collect(PrinterConnectionType::cases())->map(fn ($c) => [
                    'value' => $c->value,
                    'label' => ucfirst($c->value),
                ])->values(),
                'statuses' => collect(PrinterStatus::cases())->map(fn ($s) => [
                    'value' => $s->value,
                    'label' => $s->label(),
                ])->values(),
            ],
        ]);
    }

    public function store(PrinterRequest $request): RedirectResponse
    {
        $data = $request->validated() + [
            'is_default' => $request->boolean('is_default'),
            'is_active' => $request->boolean('is_active', true),
            'last_status' => PrinterStatus::Offline,
        ];

        // Cabang user: force branch_id ke branch sendiri (mencegah create di cabang lain)
        $user = $request->user();
        if ($user && ! $user->hasRole('admin') && $user->branch_id) {
            $data['branch_id'] = $user->branch_id;
        }

        // Printer pertama di cabang otomatis jadi default — supaya kiosk selalu punya printer aktif.
        $branchHasDefault = Printer::query()
            ->where('branch_id', $data['branch_id'])
            ->where('is_default', true)
            ->exists();

        if (! $branchHasDefault) {
            $data['is_default'] = true;
        }

        DB::transaction(function () use ($data) {
            // Single-active rule: kalau ditandai default, copot status default dari printer lain di cabang
            if (! empty($data['is_default'])) {
                Printer::query()
                    ->where('branch_id', $data['branch_id'])
                    ->update(['is_default' => false]);
            }

            Printer::create($data);
        });

        $message = ! $branchHasDefault
            ? 'Printer berhasil ditambahkan & langsung dijadikan printer aktif cabang.'
            : (! empty($data['is_default'])
                ? 'Printer berhasil ditambahkan — printer aktif cabang dipindah ke printer baru.'
                : 'Printer berhasil ditambahkan.');

        return back()->with('success', $message);
    }

    public function update(PrinterRequest $request, Printer $printer): RedirectResponse
    {
        $data = $request->validated() + [
            'is_default' => $request->boolean('is_default'),
            'is_active' => $request->boolean('is_active', true),
        ];

        // Cabang user: lock branch_id ke branch sendiri saat update juga
        $user = $request->user();
        if ($user && ! $user->hasRole('admin') && $user->branch_id) {
            $data['branch_id'] = $user->branch_id;
        }

        DB::transaction(function () use ($data, $printer) {
            // Single-active rule: kalau ditandai default, copot dulu default printer lain di cabang
            if (! empty($data['is_default'])) {
                Printer::query()
                    ->where('branch_id', $data['branch_id'])
                    ->where('id', '!=', $printer->id)
                    ->update(['is_default' => false]);
            }

            $printer->update($data);

            // Cabang harus selalu punya minimal satu default — kalau printer ini di-uncheck dan jadi tidak ada default lagi, pulihkan.
            $stillHasDefault = Printer::query()
                ->where('branch_id', $data['branch_id'])
                ->where('is_default', true)
                ->exists();

            if (! $stillHasDefault) {
                $printer->forceFill(['is_default' => true])->save();
            }
        });

        return back()->with('success', 'Printer berhasil diperbarui.');
    }

    public function destroy(Printer $printer): RedirectResponse
    {
        $printer->delete();

        return back()->with('success', 'Printer berhasil dihapus.');
    }

    public function ping(Printer $printer, PrinterStatusService $service): RedirectResponse
    {
        $status = $service->check($printer);

        return back()->with('success', "Status {$printer->name}: {$status->label()}");
    }

    public function activate(Printer $printer): RedirectResponse
    {
        DB::transaction(function () use ($printer) {
            Printer::query()
                ->where('branch_id', $printer->branch_id)
                ->where('id', '!=', $printer->id)
                ->update(['is_default' => false]);

            $printer->forceFill(['is_default' => true])->save();
        });

        return back()->with('success', "{$printer->name} sekarang jadi printer aktif.");
    }

    public function pingAll(PrinterStatusService $service): RedirectResponse
    {
        Printer::query()
            ->where('is_active', true)
            ->get()
            ->each(fn (Printer $printer) => $service->check($printer));

        return back();
    }

    /**
     * Reset counter kertas — operator klik setelah refill paper roll.
     */
    public function refillPaper(Printer $printer): RedirectResponse
    {
        $settings = (array) ($printer->settings ?? []);
        $settings['paper_consumed'] = 0;
        $settings['paper_refilled_at'] = now()->toIso8601String();

        $printer->update(['settings' => $settings]);

        return back()->with('success', "{$printer->name} di-reset — counter kertas mulai dari 0.");
    }
}
