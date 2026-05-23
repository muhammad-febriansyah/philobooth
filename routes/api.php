<?php

use App\Http\Controllers\DokuNotifyController;
use Illuminate\Support\Facades\Route;

// DOKU async notification webhook (signature-verified by controller)
// Final URL: POST /api/booth/payment/callback
Route::post('booth/payment/callback', DokuNotifyController::class)->name('doku.notify');
