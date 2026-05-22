<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CabangRequest;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CabangController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) ($request->integer('per_page') ?: 10);

        $branches = Branch::query()
            ->withCount(['printers', 'sessions'])
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->when($request->string('status')->toString(), function ($q, $status) {
                $q->where('is_active', $status === 'active');
            })
            ->when($request->string('city')->toString(), function ($q, $city) {
                $q->where('city', $city);
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/cabang', [
            'branches' => $branches->through(fn (Branch $b) => [
                'id' => $b->id,
                'code' => $b->code,
                'name' => $b->name,
                'city' => $b->city,
                'province' => $b->province,
                'phone' => $b->phone,
                'address' => $b->address,
                'manager_name' => $b->manager_name,
                'is_active' => (bool) $b->is_active,
                'printers_count' => $b->printers_count,
                'sessions_count' => $b->sessions_count,
            ]),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'city' => $request->string('city')->toString(),
            ],
            'cities' => Branch::query()
                ->whereNotNull('city')
                ->distinct()
                ->orderBy('city')
                ->pluck('city')
                ->values(),
        ]);
    }

    public function store(CabangRequest $request): RedirectResponse
    {
        Branch::create($request->validated() + ['is_active' => $request->boolean('is_active', true)]);

        return back()->with('success', 'Cabang berhasil ditambahkan.');
    }

    public function update(CabangRequest $request, Branch $cabang): RedirectResponse
    {
        $cabang->update($request->validated() + ['is_active' => $request->boolean('is_active', true)]);

        return back()->with('success', 'Cabang berhasil diperbarui.');
    }

    public function destroy(Branch $cabang): RedirectResponse
    {
        $cabang->delete();

        return back()->with('success', 'Cabang berhasil dihapus.');
    }
}
