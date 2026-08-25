<?php

namespace App\Http\Controllers\Booth;

use App\Enums\PaymentStatus;
use App\Enums\PrinterLogEvent;
use App\Enums\PrintJobStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Http\Controllers\Controller;
use App\Models\BoothDevice;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\PrinterLog;
use App\Models\PrintJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PrintJobController extends Controller
{
    public function store(Request $request, int $photoSessionId): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = $this->sessionForDevice($device, $photoSessionId);
        $validated = $request->validate([
            'request_id' => ['required', 'string', 'min:8', 'max:100'],
            'printer_id' => ['sometimes', 'integer'],
        ]);

        $existing = PrintJob::query()
            ->where('session_id', $session->id)
            ->where('booth_request_id', $validated['request_id'])
            ->first();

        if ($existing) {
            return response()->json($this->payload($existing), 200);
        }

        $this->assertMayPrint($session);
        $printer = Printer::withoutGlobalScopes()
            ->where('branch_id', $device->branch_id)
            ->where('is_active', true)
            ->when(
                isset($validated['printer_id']),
                fn ($query) => $query->whereKey($validated['printer_id']),
                fn ($query) => $query->orderByDesc('is_default')->orderBy('id'),
            )
            ->first();
        abort_unless($printer, 422, 'Printer aktif untuk cabang ini belum tersedia.');

        $job = DB::transaction(function () use ($session, $printer, $validated): PrintJob {
            $lockedSession = PhotoSession::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($session->id);
            $existing = PrintJob::query()
                ->where('session_id', $lockedSession->id)
                ->where('booth_request_id', $validated['request_id'])
                ->first();

            if ($existing) {
                return $existing;
            }

            $this->assertMayPrint($lockedSession);
            abort_if(
                PrintJob::query()
                    ->where('session_id', $lockedSession->id)
                    ->whereIn('status', [PrintJobStatus::Queued, PrintJobStatus::Printing])
                    ->exists(),
                409,
                'Sesi ini sudah memiliki print job aktif.',
            );

            $job = PrintJob::create([
                'booth_request_id' => $validated['request_id'],
                'session_id' => $lockedSession->id,
                'printer_id' => $printer->id,
                'paper_size_id' => $lockedSession->paper_size_id,
                'quantity' => $lockedSession->print_quantity,
                'file_path' => $lockedSession->final_image_path,
                'artifact_disk' => $lockedSession->artifact_disk,
                'status' => PrintJobStatus::Queued,
            ]);

            $lockedSession->update([
                'printer_id' => $printer->id,
                'status' => SessionStatus::Printing,
                'current_step' => SessionStep::Print,
            ]);

            return $job;
        });

        return response()->json($this->payload($job), $job->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Request $request, int $photoSessionId, int $printJobId): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = $this->sessionForDevice($device, $photoSessionId);
        $job = PrintJob::query()->where('session_id', $session->id)->findOrFail($printJobId);

        return response()->json($this->payload($job));
    }

    public function download(Request $request, int $photoSessionId, int $printJobId): BinaryFileResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = $this->sessionForDevice($device, $photoSessionId);
        $job = PrintJob::query()->where('session_id', $session->id)->findOrFail($printJobId);
        abort_unless(Storage::disk($job->artifact_disk)->exists($job->file_path), 404);

        return response()->download(
            Storage::disk($job->artifact_disk)->path($job->file_path),
            $session->session_code.'-print.'.pathinfo($job->file_path, PATHINFO_EXTENSION),
        );
    }

    public function update(Request $request, int $photoSessionId, int $printJobId): JsonResponse
    {
        /** @var BoothDevice $device */
        $device = $request->attributes->get('booth_device');
        $session = $this->sessionForDevice($device, $photoSessionId);
        $job = PrintJob::query()->where('session_id', $session->id)->findOrFail($printJobId);
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:printing,success,failed'],
            'error_message' => ['nullable', 'string', 'max:2000'],
        ]);
        $next = PrintJobStatus::from($validated['status']);

        $this->assertTransition($job, $next);
        if ($job->status === $next) {
            return response()->json($this->payload($job));
        }

        DB::transaction(function () use ($job, $session, $next, $validated): void {
            $lockedJob = PrintJob::query()->lockForUpdate()->findOrFail($job->id);
            $lockedSession = PhotoSession::withoutGlobalScopes()
                ->lockForUpdate()
                ->findOrFail($session->id);
            $this->assertTransition($lockedJob, $next);

            if ($lockedJob->status === $next) {
                return;
            }

            $updates = [
                'status' => $next,
                'error_message' => $next === PrintJobStatus::Failed
                    ? ($validated['error_message'] ?? 'Printer melaporkan kegagalan.')
                    : null,
            ];
            if ($next === PrintJobStatus::Printing) {
                $updates['started_at'] = now();
            }
            if (in_array($next, [PrintJobStatus::Success, PrintJobStatus::Failed], true)) {
                $updates['completed_at'] = now();
            }
            $lockedJob->update($updates);

            if ($next === PrintJobStatus::Success) {
                $lockedSession->update([
                    'status' => SessionStatus::Completed,
                    'current_step' => SessionStep::Done,
                    'completed_at' => now(),
                ]);
                $this->recordPaperUsage($lockedJob);
            } elseif ($next === PrintJobStatus::Failed) {
                $lockedSession->update([
                    'status' => SessionStatus::Editing,
                    'current_step' => SessionStep::Print,
                ]);
            }

            PrinterLog::create([
                'printer_id' => $lockedJob->printer_id,
                'event' => match ($next) {
                    PrintJobStatus::Printing => PrinterLogEvent::PrintStart,
                    PrintJobStatus::Success => PrinterLogEvent::PrintSuccess,
                    PrintJobStatus::Failed => PrinterLogEvent::PrintError,
                    default => PrinterLogEvent::StatusCheck,
                },
                'message' => $validated['error_message'] ?? null,
                'meta' => ['print_job_id' => $lockedJob->id, 'session_id' => $lockedSession->id],
                'created_at' => now(),
            ]);
        });

        return response()->json($this->payload($job->fresh()));
    }

    private function assertMayPrint(PhotoSession $session): void
    {
        abort_unless(
            $session->payments()->where('purpose', 'base')->where('status', PaymentStatus::Success)->exists(),
            403,
            'Pembayaran dasar belum tervalidasi.',
        );
        abort_if(
            (float) $session->extra_amount > 0
                && ! $session->payments()
                    ->where('purpose', 'extra_print')
                    ->where('billing_revision', $session->billing_revision)
                    ->where('amount', $session->extra_amount)
                    ->where('status', PaymentStatus::Success)
                    ->exists(),
            403,
            'Pembayaran tambahan belum tervalidasi.',
        );
        abort_unless(
            $session->final_image_path
                && Storage::disk($session->artifact_disk)->exists($session->final_image_path),
            422,
            'File hasil akhir belum tersedia.',
        );
        abort_unless((int) $session->print_quantity > 0, 422, 'Jumlah cetak harus lebih dari nol.');
        abort_if(
            in_array($session->status, [
                SessionStatus::Printing,
                SessionStatus::Completed,
                SessionStatus::Expired,
                SessionStatus::Cancelled,
            ], true),
            409,
            'Print job tidak dapat dibuat pada status sesi saat ini.',
        );
    }

    private function assertTransition(PrintJob $job, PrintJobStatus $next): void
    {
        $allowed = match ($job->status) {
            PrintJobStatus::Queued => [PrintJobStatus::Printing, PrintJobStatus::Failed],
            PrintJobStatus::Printing => [PrintJobStatus::Success, PrintJobStatus::Failed],
            PrintJobStatus::Success => [PrintJobStatus::Success],
            PrintJobStatus::Failed => [PrintJobStatus::Failed],
        };

        abort_unless(in_array($next, $allowed, true), 409, 'Transisi status print job tidak valid.');
    }

    private function recordPaperUsage(PrintJob $job): void
    {
        $printer = Printer::withoutGlobalScopes()->lockForUpdate()->findOrFail($job->printer_id);
        $settings = (array) ($printer->settings ?? []);
        $settings['paper_consumed'] = (int) ($settings['paper_consumed'] ?? 0) + $job->quantity;
        $settings['paper_capacity'] ??= 200;
        $printer->update(['settings' => $settings]);
    }

    private function sessionForDevice(BoothDevice $device, int $sessionId): PhotoSession
    {
        return PhotoSession::withoutGlobalScopes()
            ->where('booth_device_id', $device->id)
            ->findOrFail($sessionId);
    }

    /** @return array<string, mixed> */
    private function payload(PrintJob $job): array
    {
        return [
            'id' => $job->id,
            'request_id' => $job->booth_request_id,
            'session_id' => $job->session_id,
            'printer_id' => $job->printer_id,
            'paper_size_id' => $job->paper_size_id,
            'quantity' => $job->quantity,
            'status' => $job->status?->value,
            'download_url' => route('booth.v1.sessions.print-jobs.download', [
                'photoSessionId' => $job->session_id,
                'printJobId' => $job->id,
            ]),
            'error_message' => $job->error_message,
            'started_at' => $job->started_at?->toISOString(),
            'completed_at' => $job->completed_at?->toISOString(),
        ];
    }
}
