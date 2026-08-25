<?php

use App\Http\Controllers\Booth\ArtifactController;
use App\Http\Controllers\Booth\BootstrapController;
use App\Http\Controllers\Booth\HeartbeatController;
use App\Http\Controllers\Booth\PairingController;
use App\Http\Controllers\Booth\PaymentController as BoothPaymentController;
use App\Http\Controllers\Booth\PrintJobController as BoothPrintJobController;
use App\Http\Controllers\Booth\SessionController as BoothSessionController;
use App\Http\Controllers\DokuNotifyController;
use App\Http\Controllers\PakasirNotifyController;
use App\Http\Middleware\AuthenticateBoothDevice;
use Illuminate\Support\Facades\Route;

Route::prefix('booth/v1')->name('booth.v1.')->group(function () {
    Route::post('pair', PairingController::class)
        ->middleware('throttle:10,1')
        ->name('pair');

    Route::middleware([AuthenticateBoothDevice::class, 'throttle:120,1'])->group(function () {
        Route::get('bootstrap', BootstrapController::class)->name('bootstrap');
        Route::post('heartbeat', HeartbeatController::class)->name('heartbeat');
        Route::post('sessions', [BoothSessionController::class, 'store'])->name('sessions.store');
        Route::get('sessions/{photoSessionId}', [BoothSessionController::class, 'show'])
            ->whereNumber('photoSessionId')
            ->name('sessions.show');
        Route::put('sessions/{photoSessionId}/print-quantity', [BoothSessionController::class, 'updatePrintQuantity'])
            ->whereNumber('photoSessionId')
            ->name('sessions.print-quantity.update');
        Route::post('sessions/{photoSessionId}/payment', [BoothPaymentController::class, 'store'])
            ->whereNumber('photoSessionId')
            ->name('sessions.payment.store');
        Route::get('sessions/{photoSessionId}/payment', [BoothPaymentController::class, 'show'])
            ->whereNumber('photoSessionId')
            ->name('sessions.payment.show');
        Route::post('sessions/{photoSessionId}/artifacts', [ArtifactController::class, 'store'])
            ->whereNumber('photoSessionId')
            ->name('sessions.artifacts.store');
        Route::get('sessions/{photoSessionId}/artifacts/final', [ArtifactController::class, 'download'])
            ->whereNumber('photoSessionId')
            ->name('sessions.artifacts.download');
        Route::post('sessions/{photoSessionId}/print-jobs', [BoothPrintJobController::class, 'store'])
            ->whereNumber('photoSessionId')
            ->name('sessions.print-jobs.store');
        Route::get('sessions/{photoSessionId}/print-jobs/{printJobId}', [BoothPrintJobController::class, 'show'])
            ->whereNumber(['photoSessionId', 'printJobId'])
            ->name('sessions.print-jobs.show');
        Route::get('sessions/{photoSessionId}/print-jobs/{printJobId}/file', [BoothPrintJobController::class, 'download'])
            ->whereNumber(['photoSessionId', 'printJobId'])
            ->name('sessions.print-jobs.download');
        Route::patch('sessions/{photoSessionId}/print-jobs/{printJobId}', [BoothPrintJobController::class, 'update'])
            ->whereNumber(['photoSessionId', 'printJobId'])
            ->name('sessions.print-jobs.update');
    });
});

// Pakasir payment-completed webhook (unsigned; controller re-verifies via API)
// Final URL: POST /api/booth/pakasir/callback
Route::post('booth/pakasir/callback', PakasirNotifyController::class)
    ->middleware('throttle:60,1')
    ->name('pakasir.notify');

// DOKU async notification webhook (signature-verified by controller) — legacy,
// kept while Pakasir is the active QRIS gateway.
// Final URL: POST /api/booth/payment/callback
Route::post('booth/payment/callback', DokuNotifyController::class)
    ->middleware('throttle:60,1')
    ->name('doku.notify');
