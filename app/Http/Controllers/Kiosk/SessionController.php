<?php

namespace App\Http\Controllers\Kiosk;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Filter;
use App\Models\Frame;
use App\Models\AppSetting;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\PricingConfig;
use App\Models\Printer;
use App\Models\SessionPhoto;
use App\Models\Voucher;
use App\Services\FrameBuilder\CompositeGenerator;
use App\Services\QrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Manage kiosk customer session: start → payment → frame → capture → done.
 * State disimpan di Laravel session via 'kiosk_session_id'.
 */
class SessionController extends Controller
{
    private const SESSION_KEY = 'kiosk_session_id';

    public function start(Request $request): RedirectResponse
    {
        $branchId = (int) ($request->integer('branch_id') ?: $this->resolveDefaultBranchId());

        if (! $branchId) {
            return back()->withErrors(['branch' => 'Tidak ada cabang aktif di sistem.']);
        }

        // STRIP paper size sebagai default kiosk (atau ambil dari config branch nanti)
        $paperSizeId = DB::table('paper_sizes')
            ->where('code', 'STRIP')
            ->value('id')
            ?? DB::table('paper_sizes')->where('is_active', true)->value('id');

        $basePrice = $this->resolveBasePrice($branchId, $paperSizeId);

        $session = PhotoSession::create([
            'session_code' => $this->generateSessionCode(),
            'branch_id' => $branchId,
            'paper_size_id' => $paperSizeId,
            'status' => SessionStatus::Started,
            'current_step' => SessionStep::Payment,
            'total_amount' => $basePrice,
            'final_amount' => $basePrice,
            'started_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $request->session()->put(self::SESSION_KEY, $session->id);

        return redirect('/kiosk/payment');
    }

    public function selectPaymentMethod(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        $method = $request->string('method')->toString();
        $methodEnum = match ($method) {
            'qris', 'qris_doku' => PaymentMethod::QrisDoku,
            'qris_manual' => PaymentMethod::QrisManual,
            'voucher' => PaymentMethod::Voucher,
            default => PaymentMethod::QrisDoku,
        };

        $session->update([
            'payment_method' => $methodEnum,
            'status' => SessionStatus::PaymentPending,
            'current_step' => SessionStep::Payment,
        ]);

        return match ($methodEnum) {
            PaymentMethod::Voucher => redirect('/kiosk/voucher'),
            default => redirect('/kiosk/qris'),
        };
    }

    /**
     * Mock pay success — auto-create successful payment record + advance.
     * (Pakai DOKU sandbox/real nanti di phase berikutnya.)
     */
    public function mockPaySuccess(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        DB::transaction(function () use ($session) {
            Payment::create([
                'session_id' => $session->id,
                'method' => $session->payment_method ?? PaymentMethod::QrisDoku,
                'amount' => $session->final_amount,
                'doku_invoice_number' => 'MOCK-'.Str::upper(Str::random(10)),
                'status' => PaymentStatus::Success,
                'paid_at' => now(),
                'raw_response' => ['source' => 'mock_pay', 'note' => 'Auto success'],
            ]);

            $session->update([
                'status' => SessionStatus::Paid,
                'current_step' => SessionStep::Frame,
                'paid_at' => now(),
            ]);
        });

        return redirect('/kiosk/validate');
    }

    public function applyVoucher(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        $request->validate([
            'code' => ['required', 'string', 'min:4', 'max:32'],
        ], [
            'code.required' => 'Masukkan kode voucher.',
        ]);

        $code = strtoupper(trim($request->string('code')->toString()));

        $voucher = Voucher::query()
            ->withoutGlobalScope('branch')
            ->with('batch')
            ->where('code', $code)
            ->where('is_active', true)
            ->first();

        if (! $voucher) {
            return back()->withErrors(['code' => 'Kode voucher tidak ditemukan atau sudah dinonaktifkan.']);
        }

        if ($voucher->used_count >= $voucher->max_uses) {
            return back()->withErrors(['code' => 'Kuota pemakaian voucher ini sudah habis.']);
        }

        $now = now();
        $validFrom = $voucher->valid_from ?? $voucher->batch?->valid_from;
        $validUntil = $voucher->valid_until ?? $voucher->batch?->valid_until;

        if ($validFrom && $now->lt($validFrom)) {
            return back()->withErrors(['code' => 'Voucher belum berlaku.']);
        }

        if ($validUntil && $now->gt($validUntil)) {
            return back()->withErrors(['code' => 'Voucher sudah kedaluwarsa.']);
        }

        if ($voucher->branch_id && $session->branch_id && $voucher->branch_id !== $session->branch_id) {
            return back()->withErrors(['code' => 'Voucher ini tidak berlaku di cabang ini.']);
        }

        DB::transaction(function () use ($session, $voucher) {
            Payment::create([
                'session_id' => $session->id,
                'method' => PaymentMethod::Voucher,
                'amount' => $session->final_amount,
                'doku_invoice_number' => 'VCH-'.$voucher->code.'-'.Str::upper(Str::random(6)),
                'status' => PaymentStatus::Success,
                'paid_at' => now(),
                'raw_response' => [
                    'source' => 'voucher',
                    'voucher_id' => $voucher->id,
                    'voucher_code' => $voucher->code,
                ],
            ]);

            $voucher->update([
                'used_count' => $voucher->used_count + 1,
                'used_at' => now(),
                'used_by_session_id' => $session->id,
            ]);

            $session->update([
                'voucher_id' => $voucher->id,
                'payment_method' => PaymentMethod::Voucher,
                'status' => SessionStatus::Paid,
                'current_step' => SessionStep::Frame,
                'discount_amount' => $session->final_amount,
                'final_amount' => 0,
                'paid_at' => now(),
            ]);
        });

        return redirect('/kiosk/validate')->with('success', 'Voucher berhasil diterapkan.');
    }

    public function selectFrame(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        $frameId = (int) $request->integer('frame_id');
        $frame = Frame::with('photoSlots')->findOrFail($frameId);

        // Kalau ganti frame ditengah sesi, foto lama jadi tidak valid (slot count beda).
        // Drop semuanya supaya tidak ada mismatch saat composite.
        if ($session->frame_id && $session->frame_id !== $frame->id) {
            $session->photos()->each(function (SessionPhoto $p) {
                if ($p->original_path && Storage::disk('public')->exists($p->original_path)) {
                    Storage::disk('public')->delete($p->original_path);
                }
                $p->delete();
            });
        }

        $session->update([
            'frame_id' => $frame->id,
            'current_step' => SessionStep::Capture,
            'status' => SessionStatus::Capturing,
        ]);

        return redirect('/kiosk/capture');
    }

    /**
     * Upload N foto (sesuai frame.photo_slots). Replace existing kalau ada.
     */
    public function uploadPhotos(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        if (! $session->frame_id) {
            return back()->withErrors(['frame' => 'Pilih frame dulu sebelum upload.']);
        }

        $session->loadMissing('frame.photoSlots');
        $expectedCount = $session->frame->photoSlots->count();

        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:'.$expectedCount],
            'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:10240'],
        ], [
            'photos.required' => 'Wajib upload minimal 1 foto.',
            'photos.max' => "Maksimal {$expectedCount} foto (sesuai jumlah slot frame).",
            'photos.*.image' => 'Setiap file harus gambar.',
            'photos.*.mimes' => 'Format harus JPG atau PNG.',
            'photos.*.max' => 'Maksimal 10MB per foto.',
        ]);

        DB::transaction(function () use ($session, $request) {
            // Reset existing (re-upload allowed)
            $session->photos()->each(function (SessionPhoto $p) {
                if ($p->original_path && Storage::disk('public')->exists($p->original_path)) {
                    Storage::disk('public')->delete($p->original_path);
                }
                $p->delete();
            });

            $files = $request->file('photos', []);

            foreach ($files as $index => $file) {
                $slotNumber = $index + 1;
                $filename = $session->session_code.'-'.$slotNumber.'-'.Str::random(8).'.'.$file->getClientOriginalExtension();
                $path = $file->storeAs('kiosk/'.$session->session_code, $filename, 'public');

                SessionPhoto::create([
                    'session_id' => $session->id,
                    'slot_number' => $slotNumber,
                    'original_path' => $path,
                    'is_selected' => true,
                    'captured_at' => now(),
                ]);
            }

            $session->update([
                'current_step' => SessionStep::Preview,
                'status' => SessionStatus::Editing,
            ]);
        });

        return redirect('/kiosk/preview');
    }

    public function selectFilter(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        // filter_id bisa null (Original) atau string slug (vivid, warm, dst.) — disimpan as-is.
        // Filter aktualnya diterapkan via CSS di client; nanti bisa di-extend ke server-side.
        $filterId = $request->input('filter_id');

        if ($filterId !== null && is_numeric($filterId)) {
            Filter::findOrFail((int) $filterId);
        }

        $caption = trim((string) $request->input('caption', ''));

        // Stickers: array of {id, x, y, size, rotate} — x/y are 0..1 fractional positions.
        $stickersRaw = $request->input('stickers');
        $stickers = null;

        if (is_array($stickersRaw)) {
            $stickers = collect($stickersRaw)
                ->take(20) // safety cap
                ->map(fn ($s) => [
                    'id' => (string) ($s['id'] ?? ''),
                    'x' => max(0.0, min(1.0, (float) ($s['x'] ?? 0.5))),
                    'y' => max(0.0, min(1.0, (float) ($s['y'] ?? 0.5))),
                    'size' => max(20, min(400, (int) ($s['size'] ?? 96))),
                    'rotate' => (int) ($s['rotate'] ?? 0),
                ])
                ->filter(fn ($s) => $s['id'] !== '')
                ->values()
                ->all();
        }

        $session->update([
            'filter_id' => is_numeric($filterId) ? (int) $filterId : null,
            'caption' => $caption !== '' ? mb_substr($caption, 0, 60) : null,
            'show_date_stamp' => $request->boolean('show_date_stamp', true),
            'stickers' => $stickers ?: null,
            'current_step' => SessionStep::Quantity,
        ]);

        return redirect('/kiosk/qty');
    }

    public function setQuantity(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        $qty = max(1, (int) $request->integer('quantity'));
        $freeQty = 1;
        $extras = max(0, $qty - $freeQty);

        $basePrice = (float) $session->total_amount;
        $extraPerPrint = $basePrice * 0.5;
        $extraTotal = $extras * $extraPerPrint;

        // Kalau voucher sudah lunasi base (final_amount=0), customer cuma bayar lembar tambahan.
        $voucherCoversBase = (float) $session->discount_amount >= $basePrice;
        $newFinal = $voucherCoversBase
            ? $extraTotal
            : $basePrice + $extraTotal;

        $session->update([
            'print_quantity' => $qty,
            'final_amount' => $newFinal,
            'current_step' => SessionStep::Generate,
        ]);

        // Kalau ada selisih (extra lembar di luar voucher cover), customer harus bayar dulu.
        if ($newFinal > 0 && $voucherCoversBase) {
            return redirect('/kiosk/extra-pay');
        }

        return redirect('/kiosk/confirm');
    }

    /**
     * Mini payment step untuk extra lembar saat customer pakai voucher
     * tapi ambil >1 lembar. Mock pay sukses untuk QRIS, langsung lanjut konfirmasi.
     */
    public function payExtra(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        $method = $request->string('method')->toString();
        $methodEnum = match ($method) {
            'qris', 'qris_doku' => PaymentMethod::QrisDoku,
            'qris_manual' => PaymentMethod::QrisManual,
            'cash' => PaymentMethod::Cash,
            default => PaymentMethod::QrisDoku,
        };

        DB::transaction(function () use ($session, $methodEnum) {
            Payment::create([
                'session_id' => $session->id,
                'method' => $methodEnum,
                'amount' => $session->final_amount,
                'doku_invoice_number' => 'EXT-'.Str::upper(Str::random(10)),
                'status' => PaymentStatus::Success,
                'paid_at' => now(),
                'raw_response' => [
                    'source' => 'extra_pay',
                    'reason' => 'additional prints beyond voucher cover',
                ],
            ]);

            // Setelah dibayar, final_amount jadi 0 (semua paid)
            $session->update([
                'final_amount' => 0,
            ]);
        });

        return redirect('/kiosk/confirm');
    }

    public function complete(
        Request $request,
        CompositeGenerator $composer,
        QrCodeService $qr,
    ): RedirectResponse {
        $session = $this->currentSession($request);

        // Validasi: frame + foto sesuai jumlah slot harus ada
        $session->loadMissing(['frame.photoSlots', 'photos']);
        $expectedCount = $session->frame?->photoSlots->count() ?? 0;
        $photoCount = $session->photos->count();

        if (! $session->frame || $photoCount !== $expectedCount) {
            return redirect('/kiosk/capture')->withErrors([
                'photos' => "Butuh {$expectedCount} foto, baru ada {$photoCount}.",
            ]);
        }

        // Generate composite + QR
        try {
            $finalPath = $composer->generate($session);
            $token = Str::random(40);
            $downloadUrl = url('/d/'.$token);
            $qrPath = $qr->generateSvg($downloadUrl, 'qr/'.$session->session_code);
        } catch (\Throwable $e) {
            Log::error('Composite/QR gagal: '.$e->getMessage(), ['session' => $session->session_code]);

            return redirect('/kiosk/confirm')->withErrors([
                'composite' => 'Gagal generate hasil akhir: '.$e->getMessage(),
            ]);
        }

        $activePrinter = Printer::withoutGlobalScopes()
            ->where('branch_id', $session->branch_id)
            ->where('is_active', true)
            ->where('is_default', true)
            ->first();

        $session->update([
            'status' => SessionStatus::Completed,
            'current_step' => SessionStep::Done,
            'completed_at' => now(),
            'final_image_path' => $finalPath,
            'final_image_url' => Storage::url($finalPath),
            'download_token' => $token,
            'download_qr_path' => $qrPath,
            'download_expires_at' => now()->addHours(48 * 7), // 7 hari
            'printer_id' => $activePrinter?->id,
        ]);

        // Auto-count paper terpakai pada printer aktif
        if ($activePrinter && $session->print_quantity > 0) {
            $settings = (array) ($activePrinter->settings ?? []);
            $settings['paper_consumed'] = (int) ($settings['paper_consumed'] ?? 0) + (int) $session->print_quantity;

            if (! isset($settings['paper_capacity'])) {
                $settings['paper_capacity'] = 200;
            }

            $activePrinter->update(['settings' => $settings]);
        }

        // Kirim email notif kalau customer mengisi email
        if ($session->customer_email) {
            try {
                \Illuminate\Support\Facades\Mail::to($session->customer_email)
                    ->send(new \App\Mail\PhotoReadyMail($session));
            } catch (\Throwable $e) {
                Log::warning('Photo ready email gagal: '.$e->getMessage(), [
                    'session' => $session->session_code,
                ]);
            }
        }

        // JANGAN forget session — biar /kiosk/download bisa render data
        // Session di-clear setelah customer di /kiosk/thanks
        return redirect('/kiosk/download');
    }

    /**
     * Customer minta dikirim ke email — simpan + trigger PhotoReadyMail.
     */
    public function emailReceipt(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        $email = trim((string) $request->input('email'));

        $session->update(['customer_email' => $email]);

        try {
            \Illuminate\Support\Facades\Mail::to($email)
                ->send(new \App\Mail\PhotoReadyMail($session));
        } catch (\Throwable $e) {
            Log::warning('Email receipt gagal: '.$e->getMessage(), [
                'session' => $session->session_code,
            ]);

            return back()->withErrors([
                'email' => 'Gagal kirim email. Coba lagi nanti.',
            ]);
        }

        return back()->with('success', 'Email terkirim ke '.$email);
    }

    public function cancel(Request $request): RedirectResponse
    {
        $session = $this->currentSessionOrNull($request);

        if ($session) {
            $session->update([
                'status' => SessionStatus::Cancelled,
                'expired_at' => now(),
            ]);
        }

        $request->session()->forget(self::SESSION_KEY);

        return redirect('/kiosk/welcome');
    }

    public function status(Request $request): JsonResponse
    {
        $session = $this->currentSessionOrNull($request);

        if (! $session) {
            return response()->json(['session' => null]);
        }

        $session->loadMissing(['frame:id,name,photo_slots,thumbnail_path', 'paperSize:id,code']);

        return response()->json([
            'session' => [
                'session_code' => $session->session_code,
                'status' => $session->status?->value,
                'current_step' => $session->current_step?->value,
                'frame' => $session->frame
                    ? ['id' => $session->frame->id, 'name' => $session->frame->name, 'slots' => (int) $session->frame->photo_slots]
                    : null,
                'paid' => $session->status === SessionStatus::Paid || $session->paid_at !== null,
                'final_amount' => (float) $session->final_amount,
            ],
        ]);
    }

    private function currentSession(Request $request): PhotoSession
    {
        $session = $this->currentSessionOrNull($request);

        if (! $session) {
            abort(redirect('/kiosk/welcome')->withErrors(['session' => 'Sesi tidak aktif. Mulai ulang.']));
        }

        return $session;
    }

    private function currentSessionOrNull(Request $request): ?PhotoSession
    {
        $id = $request->session()->get(self::SESSION_KEY);

        if (! $id) {
            return null;
        }

        return PhotoSession::find($id);
    }

    private function generateSessionCode(): string
    {
        return 'PB-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }

    private function resolveDefaultBranchId(): ?int
    {
        return Branch::query()->where('is_active', true)->value('id');
    }

    /**
     * Sumber harga (urut prioritas):
     * 1. pricing_configs (branch + paper_size + active)
     * 2. app_settings.base_price (fallback global)
     * 3. 25_000 (default akhir)
     */
    private function resolveBasePrice(int $branchId, ?int $paperSizeId): float
    {
        if ($paperSizeId) {
            $pricing = PricingConfig::query()
                ->where('branch_id', $branchId)
                ->where('paper_size_id', $paperSizeId)
                ->where('is_active', true)
                ->value('base_price');

            if ($pricing !== null) {
                return (float) $pricing;
            }
        }

        $globalDefault = AppSetting::get('base_price');

        if ($globalDefault !== null) {
            return (float) $globalDefault;
        }

        return 25_000.0;
    }
}
