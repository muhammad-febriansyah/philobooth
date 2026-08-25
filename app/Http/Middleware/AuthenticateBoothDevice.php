<?php

namespace App\Http\Middleware;

use App\Models\BoothDevice;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateBoothDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $authorization = (string) $request->header('Authorization');

        if (! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return response()->json(['message' => 'Device authentication required.'], 401);
        }

        $tokenHash = hash('sha256', trim($matches[1]));
        $device = BoothDevice::query()
            ->with('branch:id,name,code,is_active')
            ->where('token_hash', $tokenHash)
            ->whereNull('revoked_at')
            ->first();

        if (! $device || ! $device->branch?->is_active) {
            return response()->json(['message' => 'Device token is invalid or revoked.'], 401);
        }

        $request->attributes->set('booth_device', $device);

        return $next($request);
    }
}
