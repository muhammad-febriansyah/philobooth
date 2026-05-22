<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    /** @return array<string, mixed>|null */
    private function shareAuth(Request $request): ?array
    {
        $user = $request->user();

        if (! $user) {
            return ['user' => null];
        }

        $user->load('branch:id,code,name');

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar
                    ? Storage::disk('public')->url($user->avatar)
                    : null,
                'branch_id' => $user->branch_id,
                'branch' => $user->branch
                    ? ['id' => $user->branch->id, 'code' => $user->branch->code, 'name' => $user->branch->name]
                    : null,
                'roles' => $user->getRoleNames()->all(),
                'is_admin' => $user->hasRole('admin'),
            ],
        ];
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => fn () => $this->shareAuth($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
