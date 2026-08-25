<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\BoothDevice;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BoothDeviceController extends Controller
{
    public function createPairingCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'name' => ['nullable', 'string', 'max:120'],
        ]);

        $user = $request->user();
        $branchId = $user?->hasRole(UserRole::Admin->value)
            ? ($data['branch_id'] ?? Branch::query()->where('is_active', true)->value('id'))
            : $user?->branch_id;

        abort_unless($branchId, 422, 'Cabang perangkat wajib dipilih.');
        abort_unless(
            Branch::query()->whereKey($branchId)->where('is_active', true)->exists(),
            422,
            'Cabang tidak aktif.',
        );

        $code = null;

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $candidate = 'PHILO-'.strtoupper(Str::random(8));

            if (! BoothDevice::query()->where('pairing_code_hash', hash('sha256', $candidate))->exists()) {
                $code = $candidate;
                break;
            }
        }

        abort_unless($code, 500, 'Gagal membuat kode pairing.');

        $device = BoothDevice::create([
            'branch_id' => $branchId,
            'name' => $data['name'] ?? 'Philobooth Booth',
            'pairing_code_hash' => hash('sha256', $code),
            'pairing_expires_at' => now()->addMinutes(10),
        ]);

        return response()->json([
            'device_id' => $device->id,
            'branch_id' => $device->branch_id,
            'name' => $device->name,
            'code' => $code,
            'expires_at' => $device->pairing_expires_at?->toIso8601String(),
        ], 201);
    }

    public function revoke(Request $request, BoothDevice $boothDevice): JsonResponse|RedirectResponse
    {
        $this->assertCanManage($request, $boothDevice);

        $boothDevice->update([
            'revoked_at' => now(),
            'token_hash' => null,
        ]);

        if ($request->expectsJson()) {
            return response()->json(['ok' => true]);
        }

        return back()->with('success', 'Perangkat booth berhasil dicabut.');
    }

    private function assertCanManage(Request $request, BoothDevice $device): void
    {
        $user = $request->user();

        abort_unless(
            $user?->hasRole(UserRole::Admin->value)
                || $user?->branch_id === $device->branch_id,
            403,
        );
    }
}
