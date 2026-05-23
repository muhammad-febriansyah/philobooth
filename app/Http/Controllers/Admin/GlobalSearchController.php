<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Global search untuk admin topbar — kembalikan max 5 hasil per kategori
 * (transaksi, voucher, cabang, printer). Branch-scoping otomatis via
 * BelongsToBranch trait di model masing-masing; cabang user gak akan lihat
 * data cabang lain.
 */
class GlobalSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = trim((string) $request->string('q'));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'transactions' => [],
                'vouchers' => [],
                'branches' => [],
                'printers' => [],
                'query' => $query,
            ]);
        }

        $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $query).'%';
        $user = $request->user();
        $isAdmin = (bool) $user?->hasRole('admin');

        $transactions = PhotoSession::query()
            ->with('branch:id,name')
            ->where(function ($q) use ($like) {
                $q->where('session_code', 'like', $like)
                    ->orWhere('doku_invoice_number', 'like', $like);
            })
            ->latest('id')
            ->limit(5)
            ->get(['id', 'session_code', 'branch_id', 'status', 'final_amount', 'paid_at'])
            ->map(fn (PhotoSession $s) => [
                'id' => $s->id,
                'code' => $s->session_code,
                'status' => $s->status?->value,
                'amount' => (float) $s->final_amount,
                'paid_at' => $s->paid_at?->toIso8601String(),
                'branch' => $s->branch?->name,
            ]);

        $vouchers = Voucher::query()
            ->with('branch:id,name')
            ->where(function ($q) use ($like) {
                $q->where('code', 'like', $like)
                    ->orWhere('name', 'like', $like);
            })
            ->latest('id')
            ->limit(5)
            ->get(['id', 'name', 'code', 'branch_id', 'is_active', 'used_at'])
            ->map(fn (Voucher $v) => [
                'id' => $v->id,
                'name' => $v->name,
                'code' => $v->code,
                'is_active' => (bool) $v->is_active,
                'used' => $v->used_at !== null,
                'branch' => $v->branch?->name,
            ]);

        $branches = Branch::query()
            ->when(! $isAdmin && $user?->branch_id, fn ($q) => $q->where('id', $user->branch_id))
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('code', 'like', $like)
                    ->orWhere('city', 'like', $like);
            })
            ->limit(5)
            ->get(['id', 'name', 'code', 'city', 'is_active'])
            ->map(fn (Branch $b) => [
                'id' => $b->id,
                'name' => $b->name,
                'code' => $b->code,
                'city' => $b->city,
                'is_active' => (bool) $b->is_active,
            ]);

        $printers = Printer::query()
            ->with('branch:id,name')
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('system_printer_name', 'like', $like);
            })
            ->limit(5)
            ->get(['id', 'name', 'branch_id', 'is_default', 'is_active', 'last_status'])
            ->map(fn (Printer $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'branch' => $p->branch?->name,
                'is_default' => (bool) $p->is_default,
                'is_active' => (bool) $p->is_active,
                'status' => $p->last_status?->value,
            ]);

        return response()->json([
            'transactions' => $transactions,
            'vouchers' => $vouchers,
            'branches' => $branches,
            'printers' => $printers,
            'query' => $query,
        ]);
    }
}
