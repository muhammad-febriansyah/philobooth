<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Enums\PrinterStatus;
use App\Enums\SessionStatus;
use App\Models\PhotoSession;
use App\Models\Printer;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        return Inertia::render('dashboard', [
            'stats' => $this->stats($today, $yesterday),
            'chart' => $this->revenueChart(),
            'topBranches' => $this->topBranches($today),
            'printers' => $this->printerStatuses(),
            'recentTx' => $this->recentTransactions(),
            'todayLabel' => $today->locale('id')->isoFormat('dddd, D MMMM YYYY'),
        ]);
    }

    /** @return array<string, mixed> */
    private function stats(Carbon $today, Carbon $yesterday): array
    {
        $todayQuery = PhotoSession::whereDate('completed_at', $today)
            ->where('status', SessionStatus::Completed);

        $yesterdayQuery = PhotoSession::whereDate('completed_at', $yesterday)
            ->where('status', SessionStatus::Completed);

        $todayRevenue = (float) $todayQuery->clone()->sum('final_amount');
        $yesterdayRevenue = (float) $yesterdayQuery->clone()->sum('final_amount');

        $todayPrints = (int) $todayQuery->clone()->sum('print_quantity');
        $yesterdayPrints = (int) $yesterdayQuery->clone()->sum('print_quantity');

        $todayTx = $todayQuery->clone()->count();
        $yesterdayTx = $yesterdayQuery->clone()->count();

        $todayAvg = $todayTx > 0 ? $todayRevenue / $todayTx : 0;
        $yesterdayAvg = $yesterdayTx > 0 ? $yesterdayRevenue / $yesterdayTx : 0;

        return [
            'revenue' => [
                'value' => $todayRevenue,
                'delta' => $this->percentDelta($todayRevenue, $yesterdayRevenue),
            ],
            'prints' => [
                'value' => $todayPrints,
                'delta' => $this->percentDelta($todayPrints, $yesterdayPrints),
            ],
            'transactions' => [
                'value' => $todayTx,
                'delta' => $this->percentDelta($todayTx, $yesterdayTx),
            ],
            'avg_basket' => [
                'value' => $todayAvg,
                'delta' => $this->percentDelta($todayAvg, $yesterdayAvg),
            ],
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function revenueChart(): array
    {
        $start = Carbon::today()->subDays(13);
        $end = Carbon::today();

        $rows = PhotoSession::query()
            ->where('status', SessionStatus::Completed)
            ->whereBetween('completed_at', [$start, $end->copy()->endOfDay()])
            ->selectRaw('DATE(completed_at) as day, SUM(final_amount) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $out = [];

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $key = $d->toDateString();
            $out[] = [
                'date' => $key,
                'label' => $d->format('j/n'),
                'value' => (float) ($rows[$key] ?? 0),
            ];
        }

        return $out;
    }

    /** @return array<int, array<string, mixed>> */
    private function topBranches(Carbon $today): array
    {
        $rows = PhotoSession::query()
            ->whereDate('completed_at', $today)
            ->where('status', SessionStatus::Completed)
            ->selectRaw('branch_id, SUM(final_amount) as revenue, COUNT(*) as tx')
            ->groupBy('branch_id')
            ->orderByDesc('revenue')
            ->with('branch:id,name')
            ->limit(5)
            ->get();

        $max = max(1.0, (float) $rows->max('revenue'));

        return $rows->map(fn ($row) => [
            'name' => $row->branch?->name ?? '—',
            'revenue' => (float) $row->revenue,
            'percent' => (int) round(((float) $row->revenue / $max) * 100),
            'tx' => (int) $row->tx,
        ])->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function printerStatuses(): array
    {
        return Printer::query()
            ->with('branch:id,name')
            ->withCount(['printJobs as jobs_today_count' => fn ($q) => $q->whereDate('started_at', today())])
            ->orderByDesc('jobs_today_count')
            ->limit(5)
            ->get()
            ->map(fn (Printer $p) => [
                'id' => $p->id,
                'code' => $p->name,
                'branch' => $p->branch?->name ?? '—',
                'status' => $this->normalizePrinterStatus($p->last_status),
                'jobs' => (int) $p->jobs_today_count,
                'paper' => (int) ($p->settings['paper_pct'] ?? 75),
            ])->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function recentTransactions(): array
    {
        return PhotoSession::query()
            ->with(['branch:id,name', 'paperSize:id,code', 'successfulPayment'])
            ->whereIn('status', [SessionStatus::Completed, SessionStatus::Printing, SessionStatus::Paid])
            ->latest('paid_at')
            ->limit(5)
            ->get()
            ->map(fn (PhotoSession $s) => [
                'id' => $s->session_code,
                'branch' => $s->branch?->name ?? '—',
                'item' => ($s->paperSize?->code ?? '—').' · '.$s->print_quantity.' lembar',
                'method' => $s->successfulPayment?->method?->label() ?? '—',
                'amount' => (float) $s->final_amount,
                'time' => $s->paid_at?->diffForHumans() ?? '—',
                'status' => $s->successfulPayment?->status === PaymentStatus::Success ? 'paid' : 'pending',
            ])->all();
    }

    private function normalizePrinterStatus(?PrinterStatus $status): string
    {
        return match ($status) {
            PrinterStatus::Ready, PrinterStatus::Busy => 'online',
            PrinterStatus::Error => 'warn',
            PrinterStatus::Offline, null => 'offline',
        };
    }

    private function percentDelta(float $current, float $previous): float
    {
        if ($previous === 0.0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}
