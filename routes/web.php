<?php

use App\Http\Controllers\Admin\CabangController;
use App\Http\Controllers\Admin\FrameController;
use App\Http\Controllers\Admin\GlobalSearchController;
use App\Http\Controllers\Admin\PrinterController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\TransaksiController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VoucherController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\Kiosk\PageController as KioskPageController;
use App\Http\Controllers\Kiosk\SessionController as KioskSessionController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        // Cabang management: admin only (cabang user tidak boleh kelola cabang lain)
        Route::middleware(['role:admin'])->group(function () {
            Route::get('cabang', [CabangController::class, 'index'])->name('cabang.index');
            Route::post('cabang', [CabangController::class, 'store'])->name('cabang.store');
            Route::put('cabang/{cabang}', [CabangController::class, 'update'])->name('cabang.update');
            Route::delete('cabang/{cabang}', [CabangController::class, 'destroy'])->name('cabang.destroy');

            Route::get('settings', [SettingsController::class, 'edit'])->name('settings.edit');
            Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');

            Route::get('users', [UserController::class, 'index'])->name('users.index');
            Route::post('users', [UserController::class, 'store'])->name('users.store');
            Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        });

        // Printer & Voucher: dua role boleh; cabang user otomatis ke-scope via BelongsToBranch trait
        Route::middleware(['role:admin|cabang'])->group(function () {
            // Global search untuk topbar — kembalikan JSON multi-kategori
            Route::get('search', GlobalSearchController::class)->name('search');

            Route::get('voucher', [VoucherController::class, 'index'])->name('voucher.index');
            Route::post('voucher', [VoucherController::class, 'store'])->name('voucher.store');
            Route::get('voucher/{voucher}/pdf', [VoucherController::class, 'pdf'])->name('voucher.pdf');
            Route::put('voucher/{voucher}', [VoucherController::class, 'update'])->name('voucher.update');
            Route::delete('voucher/{voucher}', [VoucherController::class, 'destroy'])->name('voucher.destroy');

            Route::get('printer', [PrinterController::class, 'index'])->name('printer.index');
            Route::post('printer', [PrinterController::class, 'store'])->name('printer.store');
            Route::post('printer/ping-all', [PrinterController::class, 'pingAll'])->name('printer.ping-all');
            Route::post('printer/{printer}/ping', [PrinterController::class, 'ping'])->name('printer.ping');
            Route::post('printer/{printer}/activate', [PrinterController::class, 'activate'])->name('printer.activate');
            Route::post('printer/{printer}/refill', [PrinterController::class, 'refillPaper'])->name('printer.refill');
            Route::put('printer/{printer}', [PrinterController::class, 'update'])->name('printer.update');
            Route::delete('printer/{printer}', [PrinterController::class, 'destroy'])->name('printer.destroy');

            Route::get('frames', [FrameController::class, 'index'])->name('frames.index');
            Route::get('frames/create', [FrameController::class, 'create'])->name('frames.create');
            Route::post('frames', [FrameController::class, 'store'])->name('frames.store');
            Route::get('frames/{frame}/edit', [FrameController::class, 'edit'])->name('frames.edit');
            Route::post('frames/{frame}', [FrameController::class, 'update'])->name('frames.update');
            Route::delete('frames/{frame}', [FrameController::class, 'destroy'])->name('frames.destroy');
            Route::get('frames/{frame}/preview', [FrameController::class, 'preview'])->name('frames.preview');

            Route::inertia('frame-builder', 'admin/frame-builder')->name('frame-builder');

            // Transaksi: admin lihat semua, cabang user ke-scope via BelongsToBranch
            Route::get('transaksi', [TransaksiController::class, 'index'])->name('transaksi.index');
            Route::get('transaksi/export/pdf', [TransaksiController::class, 'exportPdf'])->name('transaksi.export.pdf');
            Route::get('transaksi/export/csv', [TransaksiController::class, 'exportCsv'])->name('transaksi.export.csv');
        });
    });
});

Route::prefix('kiosk')->name('kiosk.')->group(function () {
    // Pages (GET) — render via KioskPageController dengan session state
    Route::get('welcome', [KioskPageController::class, 'welcome'])->name('welcome');
    Route::get('welcome-dark', [KioskPageController::class, 'welcomeDark'])->name('welcome-dark');
    Route::get('payment', [KioskPageController::class, 'payment'])->name('payment');
    Route::get('qris', [KioskPageController::class, 'qris'])->name('qris');
    Route::get('voucher', [KioskPageController::class, 'voucher'])->name('voucher');
    Route::get('validate', [KioskPageController::class, 'validatePay'])->name('validate');
    Route::get('output-type', [KioskPageController::class, 'outputType'])->name('output-type');
    Route::get('frame-select', [KioskPageController::class, 'frameSelect'])->name('frame-select');
    Route::get('capture', [KioskPageController::class, 'capture'])->name('capture');
    Route::get('preview', [KioskPageController::class, 'preview'])->name('preview');
    Route::get('filter', [KioskPageController::class, 'filter'])->name('filter');
    Route::get('qty', [KioskPageController::class, 'qty'])->name('qty');
    Route::get('confirm', [KioskPageController::class, 'confirm'])->name('confirm');
    Route::get('extra-pay', [KioskPageController::class, 'extraPay'])->name('extra-pay');
    Route::get('printing', [KioskPageController::class, 'printing'])->name('printing');
    Route::get('download', [KioskPageController::class, 'download'])->name('download');
    Route::get('thanks', [KioskPageController::class, 'thanks'])->name('thanks');

    // Session actions (POST)
    Route::post('start', [KioskSessionController::class, 'start'])->name('start');
    Route::post('payment/method', [KioskSessionController::class, 'selectPaymentMethod'])->name('payment.method');
    Route::post('payment/mock-pay', [KioskSessionController::class, 'mockPaySuccess'])->name('payment.mock');
    Route::post('extra-pay', [KioskSessionController::class, 'payExtra'])->name('extra-pay.submit');
    Route::post('email-receipt', [KioskSessionController::class, 'emailReceipt'])->name('email-receipt');
    Route::post('voucher/apply', [KioskSessionController::class, 'applyVoucher'])->name('voucher.apply');
    Route::post('output-type', [KioskSessionController::class, 'selectOutputType'])->name('output-type.select');
    Route::post('frame', [KioskSessionController::class, 'selectFrame'])->name('frame.select');
    Route::post('photos', [KioskSessionController::class, 'uploadPhotos'])->name('photos.upload');
    Route::post('video', [KioskSessionController::class, 'uploadVideo'])->name('video.upload');
    Route::post('filter', [KioskSessionController::class, 'selectFilter'])->name('filter.select');
    Route::post('quantity', [KioskSessionController::class, 'setQuantity'])->name('quantity.set');
    Route::post('complete', [KioskSessionController::class, 'complete'])->name('complete');
    Route::post('cancel', [KioskSessionController::class, 'cancel'])->name('cancel');
    Route::get('status', [KioskSessionController::class, 'status'])->name('status');
});

// Public download landing (via QR scan dari kiosk)
Route::get('d/{token}', [DownloadController::class, 'show'])->name('download.show');
Route::get('d/{token}/file', [DownloadController::class, 'file'])->name('download.file');
Route::get('d/{token}/zip', [DownloadController::class, 'zip'])->name('download.zip');

require __DIR__.'/settings.php';
