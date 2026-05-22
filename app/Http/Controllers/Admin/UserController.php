<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) ($request->integer('per_page') ?: 10);

        $users = User::query()
            ->with(['branch:id,name', 'roles:id,name'])
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->string('role')->toString(), function ($q, $role) {
                $q->whereHas('roles', fn ($qq) => $qq->where('name', $role));
            })
            ->when($request->string('branch_id')->toString(), fn ($q, $id) => $q->where('branch_id', $id))
            ->when($request->string('status')->toString(), function ($q, $status) {
                $q->where('is_active', $status === 'active');
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/users', [
            'users' => $users->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'branch_id' => $u->branch_id,
                'branch' => $u->branch?->name,
                'role' => $u->roles->first()?->name,
                'is_active' => (bool) $u->is_active,
                'last_login_at' => $u->last_login_at?->toIso8601String(),
                'avatar' => $u->avatar,
            ]),
            'stats' => [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'admins' => User::role(UserRole::Admin->value)->count(),
                'cabang' => User::role(UserRole::Cabang->value)->count(),
            ],
            'branches' => Branch::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'role' => $request->string('role')->toString(),
                'branch_id' => $request->string('branch_id')->toString(),
                'status' => $request->string('status')->toString(),
            ],
            'options' => [
                'roles' => collect(UserRole::cases())->map(fn ($r) => [
                    'value' => $r->value,
                    'label' => $r->label(),
                ])->values(),
            ],
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'branch_id' => $data['role'] === UserRole::Cabang->value ? ($data['branch_id'] ?? null) : null,
            'is_active' => $request->boolean('is_active', true),
            'email_verified_at' => now(),
        ]);

        $user->syncRoles([$data['role']]);

        // Kirim welcome email — gak block kalau gagal
        try {
            \Illuminate\Support\Facades\Mail::to($user->email)
                ->send(new \App\Mail\WelcomeUserMail($user, $data['password']));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Welcome email gagal: '.$e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }

        return back()->with('success', 'User berhasil ditambahkan. Welcome email dikirim ke '.$user->email);
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'branch_id' => $data['role'] === UserRole::Cabang->value ? ($data['branch_id'] ?? null) : null,
            'is_active' => $request->boolean('is_active', true),
            ...(! empty($data['password']) ? ['password' => Hash::make($data['password'])] : []),
        ]);

        $user->syncRoles([$data['role']]);

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()?->id) {
            return back()->with('error', 'Tidak bisa menghapus akun sendiri.');
        }

        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }
}
