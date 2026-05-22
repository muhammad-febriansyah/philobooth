<?php

namespace App\Services;

use App\Enums\PrinterStatus;
use App\Models\Printer;
use Illuminate\Support\Facades\Process;

class PrinterStatusService
{
    public function __construct(
        private float $tcpTimeout = 1.5,
        private int $shellTimeout = 4,
    ) {}

    public function check(Printer $printer): PrinterStatus
    {
        $status = $this->detect($printer);

        $printer->forceFill([
            'last_status' => $status,
            'last_checked_at' => now(),
        ])->saveQuietly();

        return $status;
    }

    private function detect(Printer $printer): PrinterStatus
    {
        if ($printer->system_printer_name) {
            $result = $this->checkSystemPrinter($printer->system_printer_name);

            if ($result !== null) {
                return $result;
            }
        }

        if ($printer->ip_address && $printer->port) {
            return $this->checkTcp($printer->ip_address, (int) $printer->port);
        }

        return PrinterStatus::Offline;
    }

    private function checkSystemPrinter(string $name): ?PrinterStatus
    {
        return PHP_OS_FAMILY === 'Windows'
            ? $this->checkWindowsPrinter($name)
            : $this->checkCupsPrinter($name);
    }

    private function checkCupsPrinter(string $name): ?PrinterStatus
    {
        $result = Process::timeout($this->shellTimeout)
            ->run(['lpstat', '-p', $name]);

        if (! $result->successful() && $result->exitCode() !== 1) {
            return null;
        }

        $output = strtolower($result->output().$result->errorOutput());

        if ($output === '') {
            return null;
        }

        if (str_contains($output, 'does not exist') || str_contains($output, 'no such')) {
            return PrinterStatus::Offline;
        }

        if (str_contains($output, 'disabled') || str_contains($output, 'rejecting')) {
            return PrinterStatus::Error;
        }

        if (str_contains($output, 'now printing') || str_contains($output, 'printing ')) {
            return PrinterStatus::Busy;
        }

        if (str_contains($output, 'idle') || str_contains($output, 'is ready') || str_contains($output, 'enabled since')) {
            return PrinterStatus::Ready;
        }

        return PrinterStatus::Offline;
    }

    private function checkWindowsPrinter(string $name): ?PrinterStatus
    {
        $escaped = str_replace("'", "''", $name);
        $script = "(Get-Printer -Name '{$escaped}' -ErrorAction SilentlyContinue).PrinterStatus";

        $result = Process::timeout($this->shellTimeout)
            ->run(['powershell', '-NoProfile', '-NonInteractive', '-Command', $script]);

        if (! $result->successful()) {
            return null;
        }

        $value = strtolower(trim($result->output()));

        if ($value === '') {
            return PrinterStatus::Offline;
        }

        return match ($value) {
            'normal' => PrinterStatus::Ready,
            'printing' => PrinterStatus::Busy,
            'paused', 'stopped', 'error' => PrinterStatus::Error,
            default => PrinterStatus::Offline,
        };
    }

    private function checkTcp(string $ip, int $port): PrinterStatus
    {
        $errno = 0;
        $errstr = '';
        $socket = @fsockopen($ip, $port, $errno, $errstr, $this->tcpTimeout);

        if ($socket === false) {
            return PrinterStatus::Offline;
        }

        fclose($socket);

        return PrinterStatus::Ready;
    }
}
