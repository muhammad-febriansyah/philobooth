<?php

namespace App\Http\Controllers\Booth;

use App\Http\Controllers\Controller;
use App\Models\BoothDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HeartbeatController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');

        $data = $request->validate([
            'app_version' => ['nullable', 'string', 'max:32'],
            'capabilities' => ['nullable', 'array'],
            'camera' => ['nullable', 'array'],
            'printer' => ['nullable', 'array'],
        ]);

        $device->update([
            'last_seen_at' => now(),
            'app_version' => $data['app_version'] ?? $device->app_version,
            'capabilities' => $data['capabilities'] ?? $device->capabilities,
            'settings' => array_replace(
                $device->settings ?? [],
                array_filter([
                    'camera' => $data['camera'] ?? null,
                    'printer' => $data['printer'] ?? null,
                ]),
            ),
        ]);

        return response()->json([
            'ok' => true,
            'server_time' => now()->toIso8601String(),
            'device' => [
                'id' => $device->id,
                'uuid' => $device->device_uuid,
                'name' => $device->name,
                'branch_id' => $device->branch_id,
                'revoked' => false,
            ],
        ]);
    }
}
