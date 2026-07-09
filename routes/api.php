<?php

use App\Http\Controllers\DokuNotifyController;
use App\Http\Controllers\PakasirNotifyController;
use Illuminate\Support\Facades\Route;

// Pakasir payment-completed webhook (unsigned; controller re-verifies via API)
// Final URL: POST /api/booth/pakasir/callback
Route::post('booth/pakasir/callback', PakasirNotifyController::class)->name('pakasir.notify');

// DOKU async notification webhook (signature-verified by controller) — legacy,
// kept while Pakasir is the active QRIS gateway.
// Final URL: POST /api/booth/payment/callback
Route::post('booth/payment/callback', DokuNotifyController::class)->name('doku.notify');
