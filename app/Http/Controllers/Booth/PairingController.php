<?php

namespace App\Http\Controllers\Booth;

use App\Http\Controllers\Controller;
use App\Models\BoothDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PairingController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:14'],
            'device_uuid' => ['required', 'uuid'],
            'name' => ['nullable', 'string', 'max:120'],
            'app_version' => ['nullable', 'string', 'max:32'],
            'capabilities' => ['nullable', 'array'],
        ]);

        $codeHash = hash('sha256', strtoupper(trim($data['code'])));

        $result = DB::transaction(function () use ($codeHash, $data): array {
            $device = BoothDevice::query()
                ->with('branch:id,name,code,is_active')
                ->where('pairing_code_hash', $codeHash)
                ->lockForUpdate()
                ->first();

            abort_unless($device, 422, 'Kode pairing tidak ditemukan.');
            abort_unless(
                $device->pairing_expires_at && now()->lt($device->pairing_expires_at),
                422,
                'Kode pairing sudah kedaluwarsa.',
            );
            abort_unless(! $device->isPaired() && ! $device->isRevoked(), 409, 'Perangkat sudah dipasangkan atau dicabut.');
            abort_unless($device->branch?->is_active, 422, 'Cabang perangkat tidak aktif.');

            $uuidInUse = BoothDevice::query()
                ->where('device_uuid', $data['device_uuid'])
                ->where('id', '!=', $device->id)
                ->exists();

            abort_unless(! $uuidInUse, 409, 'Perangkat sudah terdaftar.');

            $token = 'pb_'.Str::lower(bin2hex(random_bytes(32)));

            $device->update([
                'device_uuid' => $data['device_uuid'],
                'name' => $data['name'] ?? $device->name,
                'token_hash' => hash('sha256', $token),
                'pairing_code_hash' => null,
                'pairing_expires_at' => null,
                'paired_at' => now(),
                'app_version' => $data['app_version'] ?? null,
                'capabilities' => $data['capabilities'] ?? null,
                'last_seen_at' => now(),
            ]);

            return [
                'token' => $token,
                'device' => $device->fresh('branch:id,name,code,is_active'),
            ];
        });

        $device = $result['device'];

        return response()->json([
            'token' => $result['token'],
            'device' => [
                'id' => $device->id,
                'uuid' => $device->device_uuid,
                'name' => $device->name,
                'branch' => [
                    'id' => $device->branch->id,
                    'code' => $device->branch->code,
                    'name' => $device->branch->name,
                ],
            ],
        ]);
    }
}
