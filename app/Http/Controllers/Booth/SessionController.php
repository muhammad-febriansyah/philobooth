<?php

namespace App\Http\Controllers\Booth;

use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Enums\SessionType;
use App\Exceptions\PaymentInProgressException;
use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\BoothDevice;
use App\Models\PaperSize;
use App\Models\PhotoSession;
use App\Models\PricingConfig;
use App\Services\Booth\SetExtraPrintQuantityService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $validated = $request->validate([
            'request_id' => ['required', 'string', 'max:100'],
            'session_type' => ['sometimes', 'string', 'in:photo,stop_motion_video'],
        ]);

        $requestId = $validated['request_id'];
        $existing = PhotoSession::withoutGlobalScopes()
            ->where('booth_device_id', $device->id)
            ->where('booth_request_id', $requestId)
            ->first();

        if ($existing) {
            return response()->json($this->sessionPayload($existing), 200);
        }

        $paperSize = PaperSize::query()
            ->where('code', 'STRIP')
            ->where('is_active', true)
            ->first()
            ?? PaperSize::query()->where('is_active', true)->first();

        if (! $paperSize) {
            return response()->json(['message' => 'Ukuran kertas aktif belum tersedia.'], 422);
        }

        $pricing = PricingConfig::query()
            ->where('branch_id', $device->branch_id)
            ->where('paper_size_id', $paperSize->id)
            ->where('is_active', true)
            ->first();
        $basePrice = $pricing?->base_price ?? AppSetting::get('base_price', 25_000);
        $sessionType = $validated['session_type'] ?? SessionType::Photo->value;

        try {
            $session = DB::transaction(function () use ($device, $request, $requestId, $paperSize, $basePrice, $sessionType) {
                $existing = PhotoSession::withoutGlobalScopes()
                    ->lockForUpdate()
                    ->where('booth_device_id', $device->id)
                    ->where('booth_request_id', $requestId)
                    ->first();

                if ($existing) {
                    return $existing;
                }

                return PhotoSession::create([
                    'session_code' => $this->sessionCode(),
                    'branch_id' => $device->branch_id,
                    'booth_device_id' => $device->id,
                    'booth_request_id' => $requestId,
                    'paper_size_id' => $paperSize->id,
                    'session_type' => $sessionType,
                    'status' => SessionStatus::Started,
                    'current_step' => SessionStep::Payment,
                    'total_amount' => $basePrice,
                    'final_amount' => $basePrice,
                    'started_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            });
        } catch (QueryException $exception) {
            $session = PhotoSession::withoutGlobalScopes()
                ->where('booth_device_id', $device->id)
                ->where('booth_request_id', $requestId)
                ->first();

            if (! $session) {
                throw $exception;
            }
        }

        return response()->json($this->sessionPayload($session), $session->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Request $request, int $photoSessionId): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = PhotoSession::withoutGlobalScopes()
            ->where('booth_device_id', $device->id)
            ->findOrFail($photoSessionId);

        return response()->json($this->sessionPayload($session));
    }

    public function updatePrintQuantity(
        Request $request,
        int $photoSessionId,
        SetExtraPrintQuantityService $quantities,
    ): JsonResponse {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = PhotoSession::withoutGlobalScopes()
            ->where('booth_device_id', $device->id)
            ->findOrFail($photoSessionId);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        try {
            return response()->json($quantities->update($session, (int) $validated['quantity']));
        } catch (PaymentInProgressException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        }
    }

    /** @return array<string, mixed> */
    private function sessionPayload(PhotoSession $session): array
    {
        return [
            'id' => $session->id,
            'session_code' => $session->session_code,
            'session_type' => $session->session_type?->value,
            'status' => $session->status?->value,
            'current_step' => $session->current_step?->value,
            'total_amount' => (float) $session->total_amount,
            'discount_amount' => (float) $session->discount_amount,
            'final_amount' => (float) $session->final_amount,
            'extra_amount' => (float) $session->extra_amount,
            'print_quantity' => (int) $session->print_quantity,
            'billing_revision' => (int) $session->billing_revision,
            'payment_method' => $session->payment_method?->value,
            'paid_at' => $session->paid_at?->toISOString(),
        ];
    }

    private function sessionCode(): string
    {
        do {
            $code = 'PB-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
        } while (PhotoSession::withoutGlobalScopes()->where('session_code', $code)->exists());

        return $code;
    }
}
