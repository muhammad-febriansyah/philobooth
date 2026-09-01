<?php

namespace App\Http\Controllers\Kiosk;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PrinterLogEvent;
use App\Enums\PrinterStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Enums\SessionType;
use App\Exceptions\PaymentInProgressException;
use App\Http\Controllers\Controller;
use App\Mail\PhotoReadyMail;
use App\Models\AppSetting;
use App\Models\Branch;
use App\Models\Filter;
use App\Models\Frame;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\PricingConfig;
use App\Models\Printer;
use App\Models\PrinterLog;
use App\Models\SessionPhoto;
use App\Models\Voucher;
use App\Services\Booth\QrisPaymentService;
use App\Services\Booth\SetExtraPrintQuantityService;
use App\Services\Booth\SettlePakasirPaymentService;
use App\Services\Doku\DokuClient;
use App\Services\Doku\DokuException;
use App\Services\FrameBuilder\CompositeGenerator;
use App\Services\Pakasir\PakasirClient;
use App\Services\Pakasir\PakasirException;
use App\Services\QrCodeService;
use App\Services\StopMotionGifService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Manage kiosk customer session: start → payment → frame → capture → done.
 * State disimpan di Laravel session via 'kiosk_session_id'.
 */
class SessionController extends Controller
{
    public function __construct(
        private readonly QrisPaymentService $qrisPayments,
        private readonly SettlePakasirPaymentService $pakasirSettlements,
        private readonly SetExtraPrintQuantityService $printQuantities,
    ) {}

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

        $basePrice = $this->resolveBasePrice();

        $session = PhotoSession::create([
            'session_code' => $this->generateSessionCode(),
            'branch_id' => $branchId,
            'paper_size_id' => $paperSizeId,
            'status' => SessionStatus::Started,
            'current_step' => SessionStep::Payment,
            // Every session is a unified photo session: one price includes the
            // print, softcopy composite, individual photos, and an animated GIF.
            // There is no output-type choice anymore.
            'session_type' => SessionType::Photo,
            'total_amount' => $basePrice,
            'final_amount' => $basePrice,
            'started_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $request->session()->put(self::SESSION_KEY, $session->id);

        return redirect('/kiosk/payment');
    }

    public function selectPaymentMethod(Request $request, PakasirClient $pakasir): RedirectResponse
    {
        $session = $this->currentSession($request);

        if ($session->payments()
            ->where('purpose', 'base')
            ->where('status', PaymentStatus::Success)
            ->exists()) {
            return redirect('/kiosk/validate');
        }

        $method = $request->string('method')->toString();
        $methodEnum = match ($method) {
            'qris', 'qris_pakasir', 'qris_doku' => PaymentMethod::QrisPakasir,
            'qris_manual' => PaymentMethod::QrisManual,
            'voucher' => PaymentMethod::Voucher,
            default => PaymentMethod::QrisPakasir,
        };

        $session->update([
            'payment_method' => $methodEnum,
            'status' => SessionStatus::PaymentPending,
            'current_step' => SessionStep::Payment,
        ]);

        if ($methodEnum !== PaymentMethod::QrisPakasir) {
            $session->payments()
                ->where('purpose', 'base')
                ->where('status', PaymentStatus::Pending)
                ->update(['status' => PaymentStatus::Expired]);
        }

        if ($methodEnum === PaymentMethod::Voucher) {
            return redirect('/kiosk/voucher');
        }

        if ($methodEnum === PaymentMethod::QrisPakasir && $pakasir->isConfigured()) {
            try {
                $this->ensurePakasirQrisPayment($session, $pakasir);
            } catch (PakasirException|PaymentInProgressException) {
                $session->update([
                    'status' => SessionStatus::Started,
                    'current_step' => SessionStep::Payment,
                ]);

                return back()->withErrors([
                    'method' => 'QRIS sedang tidak tersedia. Silakan coba lagi.',
                ]);
            }
        }

        return redirect('/kiosk/qris');
    }

    private function ensurePakasirQrisPayment(
        PhotoSession $session,
        PakasirClient $pakasir,
        string $source = 'base',
        ?string $returnStatus = null,
        ?string $returnStep = null,
    ): void {
        $this->qrisPayments->create(
            $session,
            $source === 'extra_pay' ? 'extra_print' : 'base',
            $pakasir,
            $returnStatus,
            $returnStep,
        );
    }

    private function ensureDokuQrisPayment(PhotoSession $session, DokuClient $doku): void
    {
        $pendingPayment = $session->payments()
            ->where('method', PaymentMethod::QrisDoku)
            ->where('status', PaymentStatus::Pending)
            ->latest('id')
            ->first();

        if ($pendingPayment && $pendingPayment->expired_at && now()->lt($pendingPayment->expired_at)) {
            return;
        }

        $invoiceNumber = 'INV-'.$session->session_code.'-'.Str::upper(Str::random(4));

        try {
            $result = $doku->createQrisPayment($invoiceNumber, (int) $session->final_amount);
        } catch (DokuException $e) {
            Log::error('DOKU createQrisPayment failed', [
                'session' => $session->session_code,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        Payment::create([
            'session_id' => $session->id,
            'method' => PaymentMethod::QrisDoku,
            'amount' => $session->final_amount,
            'doku_invoice_number' => $result['invoice_number'],
            'doku_request_id' => $result['request_id'],
            'qris_string' => $result['qris_string'],
            'qris_image_path' => $result['qris_image_url'],
            'status' => PaymentStatus::Pending,
            'expired_at' => $result['expired_at'],
            'raw_response' => $result['raw'],
        ]);
    }

    /**
     * Mock pay success — auto-create successful payment record + advance.
     * (Pakai DOKU sandbox/real nanti di phase berikutnya.)
     */
    public function mockPaySuccess(Request $request): RedirectResponse
    {
        abort_if(app()->isProduction(), 403, 'Mock payment disabled in production.');

        $session = $this->currentSession($request);

        DB::transaction(function () use ($session) {
            Payment::create([
                'session_id' => $session->id,
                'method' => $session->payment_method ?? PaymentMethod::QrisPakasir,
                'amount' => $session->final_amount,
                'pakasir_order_id' => 'MOCK-'.Str::upper(Str::random(10)),
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

        $applied = DB::transaction(function () use ($session, $voucher) {
            $lockedSession = PhotoSession::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($session->id);

            if ($lockedSession->paid_at !== null) {
                return false;
            }

            $lockedVoucher = Voucher::withoutGlobalScopes()
                ->whereKey($voucher->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedVoucher || ! $lockedVoucher->is_active || $lockedVoucher->used_count >= $lockedVoucher->max_uses) {
                return false;
            }

            Payment::create([
                'session_id' => $lockedSession->id,
                'method' => PaymentMethod::Voucher,
                'amount' => $lockedSession->final_amount,
                'doku_invoice_number' => 'VCH-'.$lockedVoucher->code.'-'.Str::upper(Str::random(6)),
                'status' => PaymentStatus::Success,
                'paid_at' => now(),
                'raw_response' => [
                    'source' => 'voucher',
                    'voucher_id' => $lockedVoucher->id,
                    'voucher_code' => $lockedVoucher->code,
                ],
            ]);

            $lockedVoucher->update([
                'used_count' => $lockedVoucher->used_count + 1,
                'used_at' => now(),
                'used_by_session_id' => $lockedSession->id,
            ]);

            $lockedSession->update([
                'voucher_id' => $lockedVoucher->id,
                'payment_method' => PaymentMethod::Voucher,
                'status' => SessionStatus::Paid,
                'current_step' => SessionStep::Frame,
                'discount_amount' => $lockedSession->final_amount,
                'final_amount' => 0,
                'paid_at' => now(),
            ]);

            return true;
        });

        if (! $applied) {
            return back()->withErrors(['code' => 'Voucher sudah digunakan atau sesi sudah dibayar.']);
        }

        return redirect('/kiosk/validate')->with('success', 'Voucher berhasil diterapkan.');
    }

    public function selectFrame(Request $request): RedirectResponse
    {
        $session = $this->requirePaidSession($request);

        $frameId = (int) $request->integer('frame_id');
        $frame = Frame::with('photoSlots')
            ->where('is_active', true)
            ->where(function ($query) use ($session) {
                $query->whereNull('branch_id')
                    ->orWhere('branch_id', $session->branch_id);
            })
            ->findOrFail($frameId);

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
    /**
     * Upload a recorded WebM/MP4 video clip for stop-motion-video sessions.
     * Stored directly without transcoding; rendered via <video loop> on the
     * download page.
     */
    public function uploadVideo(Request $request): RedirectResponse|Response
    {
        $session = $this->requirePaidSession($request);

        if (! $session->frame_id) {
            return back()->withErrors(['frame' => 'Pilih frame dulu sebelum rekam.']);
        }

        $request->validate([
            'video' => ['required', 'file', 'mimetypes:video/webm,video/mp4', 'max:20480'],
        ], [
            'video.required' => 'Video belum terekam.',
            'video.mimetypes' => 'Format video harus WebM atau MP4.',
            'video.max' => 'Maksimal 20MB.',
        ]);

        $file = $request->file('video');
        $ext = $file->getClientOriginalExtension() ?: ($file->getMimeType() === 'video/mp4' ? 'mp4' : 'webm');
        $filename = $session->session_code.'-video.'.$ext;
        $path = $file->storeAs('kiosk/'.$session->session_code, $filename, 'public');

        // Hapus video lama kalau ada (re-record / re-encode)
        if ($session->video_path && Storage::disk('public')->exists($session->video_path)) {
            Storage::disk('public')->delete($session->video_path);
        }

        // Legacy stop-motion sessions record the video AS the main output and
        // advance the flow. In the unified photo flow the video is a side
        // artifact (encoded in the browser from the captured photos), so just
        // attach it and leave the photo flow's step/status untouched.
        if ($session->session_type === SessionType::StopMotionVideo) {
            $session->update([
                'video_path' => $path,
                'current_step' => SessionStep::Generate,
                'status' => SessionStatus::Editing,
                'print_quantity' => 0,
            ]);

            return redirect('/kiosk/confirm');
        }

        $session->update(['video_path' => $path]);

        return response()->noContent();
    }

    public function uploadPhotos(Request $request): RedirectResponse
    {
        $session = $this->requirePaidSession($request);

        if (! $session->frame_id) {
            return back()->withErrors(['frame' => 'Pilih frame dulu sebelum upload.']);
        }

        $session->loadMissing('frame.photoSlots');
        $isVideo = $session->session_type === SessionType::StopMotionVideo;
        // Foto: count harus match slot frame. Video boomerang: hingga 40 frame.
        $maxPhotos = $isVideo ? 40 : $session->frame->photoSlots->count();

        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:'.$maxPhotos],
            'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:10240'],
        ], [
            'photos.required' => 'Wajib upload minimal 1 foto.',
            'photos.max' => "Maksimal {$maxPhotos} frame.",
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
        $session = $this->requirePaidSession($request);

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

        $isVideo = $session->session_type === SessionType::StopMotionVideo;

        $session->update([
            'filter_id' => is_numeric($filterId) ? (int) $filterId : null,
            'caption' => $caption !== '' ? mb_substr($caption, 0, 60) : null,
            'show_date_stamp' => $request->boolean('show_date_stamp', true),
            'stickers' => $stickers ?: null,
            'current_step' => $isVideo ? SessionStep::Generate : SessionStep::Quantity,
            'print_quantity' => $isVideo ? 0 : $session->print_quantity,
        ]);

        return redirect($isVideo ? '/kiosk/confirm' : '/kiosk/qty');
    }

    public function setQuantity(Request $request): RedirectResponse
    {
        $session = $this->requirePaidSession($request);

        $maxPrints = $this->resolveMaxPrints($session);
        $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:'.$maxPrints],
        ]);

        try {
            $billing = $this->printQuantities->update(
                $session,
                (int) $request->integer('quantity'),
                SessionStep::Generate,
            );
        } catch (PaymentInProgressException $exception) {
            return back()->withErrors(['quantity' => $exception->getMessage()]);
        }

        // Additional copies require a second, separately verified payment.
        if ($billing['requires_payment']) {
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
        $session = $this->requirePaidSession($request);

        if ((float) $session->extra_amount <= 0) {
            return redirect('/kiosk/confirm');
        }

        if ($session->payments()
            ->where('purpose', 'extra_print')
            ->where('billing_revision', $session->billing_revision)
            ->where('amount', $session->extra_amount)
            ->where('status', PaymentStatus::Success)
            ->exists()) {
            return redirect('/kiosk/confirm');
        }

        $method = $request->string('method')->toString();
        $methodEnum = match ($method) {
            'qris', 'qris_pakasir', 'qris_doku' => PaymentMethod::QrisPakasir,
            'qris_manual' => PaymentMethod::QrisManual,
            'cash' => PaymentMethod::Cash,
            default => PaymentMethod::QrisPakasir,
        };

        if ($methodEnum !== PaymentMethod::QrisPakasir) {
            if (app()->isProduction()) {
                return back()->withErrors([
                    'method' => 'Pembayaran tambahan saat ini hanya tersedia melalui QRIS.',
                ]);
            }

            DB::transaction(function () use ($session, $methodEnum) {
                Payment::create([
                    'session_id' => $session->id,
                    'purpose' => 'extra_print',
                    'billing_revision' => $session->billing_revision,
                    'settlement_key' => "session:{$session->id}:extra_print:{$session->billing_revision}",
                    'method' => $methodEnum,
                    'amount' => $session->extra_amount,
                    'status' => PaymentStatus::Success,
                    'paid_at' => now(),
                    'raw_response' => ['source' => 'extra_pay_mock'],
                ]);

                $session->update([
                    'final_amount' => $this->transactionTotal($session),
                ]);
            });

            return redirect('/kiosk/confirm');
        }

        $pakasir = app(PakasirClient::class);

        if (! $pakasir->isConfigured()) {
            return back()->withErrors([
                'method' => 'Payment gateway belum tersedia. Silakan hubungi operator.',
            ]);
        }

        $returnStatus = $session->status?->value;
        $returnStep = $session->current_step?->value;

        $session->payments()
            ->where('method', PaymentMethod::QrisPakasir)
            ->where('purpose', 'base')
            ->where('status', PaymentStatus::Pending)
            ->update(['status' => PaymentStatus::Expired]);

        $session->update([
            'payment_method' => PaymentMethod::QrisPakasir,
            'status' => SessionStatus::PaymentPending,
            'current_step' => SessionStep::Payment,
        ]);

        try {
            $this->ensurePakasirQrisPayment(
                $session,
                $pakasir,
                'extra_pay',
                $returnStatus,
                $returnStep,
            );
        } catch (PakasirException|PaymentInProgressException) {
            $session->update([
                'status' => $returnStatus ?? SessionStatus::Editing->value,
                'current_step' => $returnStep ?? SessionStep::Generate->value,
            ]);

            return back()->withErrors([
                'method' => 'QRIS sedang tidak tersedia. Silakan coba lagi.',
            ]);
        }

        return redirect('/kiosk/qris');
    }

    public function complete(
        Request $request,
        CompositeGenerator $composer,
        QrCodeService $qr,
        StopMotionGifService $gif,
    ): RedirectResponse {
        $session = $this->requirePaidSession($request);

        // Validasi: frame + foto sesuai jumlah slot harus ada
        $session->loadMissing(['frame.photoSlots', 'photos']);
        $expectedCount = $session->frame?->photoSlots->count() ?? 0;
        $photoCount = $session->photos->count();
        $isVideo = $session->session_type === SessionType::StopMotionVideo;

        // Video: butuh video_path. Foto: butuh foto sesuai slot count.
        $valid = $session->frame && (
            $isVideo
                ? ($session->video_path && Storage::disk('public')->exists($session->video_path))
                : $photoCount === $expectedCount
        );

        if (! $valid) {
            $msg = $isVideo
                ? 'Video belum terekam.'
                : "Butuh {$expectedCount} foto, baru ada {$photoCount}.";

            return redirect('/kiosk/capture')->withErrors(['photos' => $msg]);
        }

        // Every paid session includes all outputs: printed strip + softcopy
        // composite, individual photos (downloaded per-slot), and an animated
        // GIF built from the same photos. The GIF is best-effort — a failure
        // (e.g. a single-slot frame) must not block completion.
        try {
            $token = Str::random(40);
            $downloadUrl = url('/d/'.$token);
            $qrPath = $qr->generateSvg($downloadUrl, 'qr/'.$session->session_code);

            if ($isVideo) {
                $finalPath = null;
            } else {
                $finalPath = $composer->generate($session);
            }

            try {
                $gifPath = $gif->generate($session);
            } catch (\Throwable $e) {
                Log::warning('GIF generate gagal: '.$e->getMessage(), [
                    'session' => $session->session_code,
                ]);
                $gifPath = null;
            }
        } catch (\Throwable $e) {
            Log::error('Generate hasil gagal: '.$e->getMessage(), ['session' => $session->session_code]);

            return redirect('/kiosk/confirm')->withErrors([
                'composite' => 'Gagal generate hasil akhir: '.$e->getMessage(),
            ]);
        }

        $activePrinter = $isVideo ? null : Printer::withoutGlobalScopes()
            ->where('branch_id', $session->branch_id)
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->first();

        $requiresPrinting = ! $isVideo && $session->print_quantity > 0;

        if ($requiresPrinting && (! $activePrinter || blank($activePrinter->system_printer_name))) {
            return redirect('/kiosk/confirm')->withErrors([
                'printer' => 'Printer booth belum dipilih atau belum terhubung ke Windows. Buka Admin > Printer, lalu pilih printer yang terdeteksi.',
            ]);
        }

        $session->update([
            'status' => $requiresPrinting ? SessionStatus::Printing : SessionStatus::Completed,
            'current_step' => $requiresPrinting ? SessionStep::Print : SessionStep::Done,
            'completed_at' => $requiresPrinting ? null : now(),
            'final_image_path' => $finalPath,
            'final_image_url' => $finalPath ? Storage::url($finalPath) : null,
            'gif_path' => $gifPath,
            'download_token' => $token,
            'download_qr_path' => $qrPath,
            'download_expires_at' => now()->addHours(48 * 7), // 7 hari
            'printer_id' => $activePrinter?->id,
        ]);

        if ($requiresPrinting) {
            return redirect('/kiosk/printing');
        }

        $this->sendPhotoReadyEmail($session);

        // JANGAN forget session — biar /kiosk/download bisa render data
        // Session di-clear setelah customer di /kiosk/thanks
        return redirect('/kiosk/download');
    }

    public function finishPrinting(Request $request): RedirectResponse
    {
        $session = $this->currentSession($request);

        if ($session->status === SessionStatus::Completed) {
            return redirect('/kiosk/download');
        }

        abort_unless(
            $session->status === SessionStatus::Printing
                && $session->current_step === SessionStep::Print
                && $session->printer_id !== null,
            409,
            'Sesi tidak sedang menunggu hasil cetak.',
        );

        DB::transaction(function () use ($session): void {
            $lockedSession = PhotoSession::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($session->id);

            if ($lockedSession->status === SessionStatus::Completed) {
                return;
            }

            $printer = Printer::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($lockedSession->printer_id);
            $settings = (array) ($printer->settings ?? []);
            $settings['paper_consumed'] = (int) ($settings['paper_consumed'] ?? 0)
                + max(1, (int) $lockedSession->print_quantity);
            $settings['paper_capacity'] ??= 200;

            $printer->update([
                'last_status' => PrinterStatus::Ready,
                'last_checked_at' => now(),
                'settings' => $settings,
            ]);

            $lockedSession->update([
                'status' => SessionStatus::Completed,
                'current_step' => SessionStep::Done,
                'completed_at' => now(),
            ]);

            PrinterLog::create([
                'printer_id' => $printer->id,
                'event' => PrinterLogEvent::PrintSuccess,
                'message' => 'Print agent lokal menyelesaikan pekerjaan cetak.',
                'meta' => [
                    'session_id' => $lockedSession->id,
                    'copies' => max(1, (int) $lockedSession->print_quantity),
                ],
                'created_at' => now(),
            ]);
        });

        $this->sendPhotoReadyEmail($session->refresh());

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
            Mail::to($email)
                ->send(new PhotoReadyMail($session));
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

    public function status(Request $request, PakasirClient $pakasir): JsonResponse
    {
        $session = $this->currentSessionOrNull($request);

        if (! $session) {
            return response()->json(['session' => null]);
        }

        $session->loadMissing(['frame:id,name,photo_slots,thumbnail_path', 'paperSize:id,code']);
        $activePurpose = $session->payments()
            ->where('method', PaymentMethod::QrisPakasir)
            ->where('status', PaymentStatus::Pending)
            ->latest('id')
            ->value('purpose');

        // Polling fallback: setiap pending QRIS aktif diverifikasi ke Pakasir.
        if ($session->payments()->where('method', PaymentMethod::QrisPakasir)
            ->where('status', PaymentStatus::Pending)->exists()
            && $pakasir->isConfigured()) {
            $this->reconcilePakasirPayment($session, $pakasir);
            $session->refresh();
        }

        $paymentPurpose = $activePurpose ?? $session->payments()->latest('id')->value('purpose');

        return response()->json([
            'session' => [
                'session_code' => $session->session_code,
                'status' => $session->status?->value,
                'current_step' => $session->current_step?->value,
                'frame' => $session->frame
                    ? ['id' => $session->frame->id, 'name' => $session->frame->name, 'slots' => (int) $session->frame->photo_slots]
                    : null,
                'paid' => $session->status !== SessionStatus::PaymentPending
                    && $session->status !== SessionStatus::Started
                    && $session->status !== SessionStatus::Expired
                    && $session->status !== SessionStatus::Cancelled
                    && $session->paid_at !== null,
                'payment_purpose' => $paymentPurpose,
                'final_amount' => (float) $session->final_amount,
            ],
        ]);
    }

    private function reconcilePakasirPayment(PhotoSession $session, PakasirClient $pakasir): void
    {
        $purpose = (float) $session->extra_amount > 0 ? 'extra_print' : 'base';
        $payment = $session->payments()
            ->where('method', PaymentMethod::QrisPakasir)
            ->where('status', PaymentStatus::Pending)
            ->where('purpose', $purpose)
            ->latest('id')
            ->first();

        if (! $payment || ! $payment->pakasir_order_id) {
            return;
        }

        try {
            $state = $this->qrisPayments->reconcileStale($session, $payment, $pakasir);
            if ($state !== PaymentStatus::Pending) {
                return;
            }
            $verified = $pakasir->verifyTransaction($payment->pakasir_order_id, (int) $payment->amount);
        } catch (PakasirException $e) {
            Log::warning('Pakasir verify failed on poll', [
                'order_id' => $payment->pakasir_order_id,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        if ($verified['status'] === 'completed' && $verified['amount'] === (int) $payment->amount) {
            $this->pakasirSettlements->settle($payment, $verified['raw']);
        }
    }

    private function reconcileDokuPayment(PhotoSession $session, DokuClient $doku): void
    {
        $payment = $session->payments()
            ->where('method', PaymentMethod::QrisDoku)
            ->where('status', PaymentStatus::Pending)
            ->latest('id')
            ->first();

        if (! $payment || ! $payment->doku_invoice_number) {
            return;
        }

        try {
            $status = $doku->inquiryStatus($payment->doku_invoice_number);
        } catch (DokuException $e) {
            Log::warning('DOKU inquiry failed', [
                'invoice' => $payment->doku_invoice_number,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        if (in_array($status['status'], ['success', 'paid', 'settlement', 'capture'], true)) {
            DB::transaction(function () use ($session, $payment, $status) {
                $payment->update([
                    'status' => PaymentStatus::Success,
                    'paid_at' => now(),
                    'doku_approval_code' => $status['approval_code'],
                    'doku_acquirer' => $status['acquirer'],
                    'raw_response' => $status['raw'],
                ]);

                $session->update([
                    'status' => SessionStatus::Paid,
                    'current_step' => SessionStep::Frame,
                    'paid_at' => now(),
                ]);
            });
        }
    }

    private function currentSession(Request $request): PhotoSession
    {
        $session = $this->currentSessionOrNull($request);

        if (! $session) {
            abort(redirect('/kiosk/welcome')->withErrors(['session' => 'Sesi tidak aktif. Mulai ulang.']));
        }

        return $session;
    }

    private function sendPhotoReadyEmail(PhotoSession $session): void
    {
        if (! $session->customer_email) {
            return;
        }

        try {
            Mail::to($session->customer_email)
                ->send(new PhotoReadyMail($session));
        } catch (\Throwable $e) {
            Log::warning('Photo ready email gagal: '.$e->getMessage(), [
                'session' => $session->session_code,
            ]);
        }
    }

    /**
     * Business actions after payment must be authorized by persisted server
     * state, never by the current page or a client-provided flag.
     */
    private function requirePaidSession(Request $request): PhotoSession
    {
        $session = $this->currentSession($request);

        abort_unless(
            $session->paid_at !== null
                && $session->status !== SessionStatus::Started
                && $session->status !== SessionStatus::PaymentPending
                && $session->status !== SessionStatus::Expired
                && $session->status !== SessionStatus::Cancelled
                && (
                    $session->status === SessionStatus::Paid
                    || $session->payments()
                        ->where('purpose', 'base')
                        ->where('status', PaymentStatus::Success)
                        ->exists()
                ),
            403,
            'Pembayaran belum tervalidasi.',
        );

        return $session;
    }

    private function transactionTotal(PhotoSession $session): float
    {
        return max(
            0,
            (float) $session->total_amount
                - (float) $session->discount_amount
                + (float) $session->extra_amount,
        );
    }

    private function resolveMaxPrints(PhotoSession $session): int
    {
        $pricing = PricingConfig::withoutGlobalScopes()
            ->where('branch_id', $session->branch_id)
            ->where('paper_size_id', $session->paper_size_id)
            ->where('is_active', true)
            ->first();

        return max(
            1,
            (int) ($pricing?->max_prints ?? AppSetting::get('max_prints', 10)),
        );
    }

    private function currentSessionOrNull(Request $request): ?PhotoSession
    {
        $id = $request->session()->get(self::SESSION_KEY);

        if (! $id) {
            return null;
        }

        // Kiosk is anonymous customer flow; bypass BelongsToBranch scope so a
        // logged-in operator from branch X can still use the booth at branch Y.
        return PhotoSession::withoutGlobalScopes()->find($id);
    }

    private function generateSessionCode(): string
    {
        return 'PB-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }

    private function resolveDefaultBranchId(): ?int
    {
        // Prefer the branch of the logged-in operator (cabang user). Public
        // kiosk without auth falls back to the first active branch.
        $user = auth()->user();

        if ($user?->branch_id) {
            $exists = Branch::query()
                ->where('id', $user->branch_id)
                ->where('is_active', true)
                ->exists();

            if ($exists) {
                return (int) $user->branch_id;
            }
        }

        return Branch::query()->where('is_active', true)->value('id');
    }

    /**
     * Harga sesi kiosk selalu mengikuti pengaturan global (app_settings.base_price).
     * Fallback 25_000 kalau belum diset.
     */
    private function resolveBasePrice(): float
    {
        $globalDefault = AppSetting::get('base_price');

        if ($globalDefault !== null) {
            return (float) $globalDefault;
        }

        return 25_000.0;
    }
}
