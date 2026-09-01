<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Enums\SessionType;
use App\Models\AppSetting;
use App\Models\Branch;
use App\Models\Filter;
use App\Models\Frame;
use App\Models\FramePhotoSlot;
use App\Models\PaperSize;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\PricingConfig;
use App\Models\Printer;
use App\Models\PrinterLog;
use App\Models\SessionPhoto;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

/**
 * Build a fully-seeded environment for a kiosk session at a given step.
 * Returns the created PhotoSession; caller stores the id in the test session.
 *
 * @param  array<string, mixed>  $sessionOverrides
 */
function seedKiosk(array $sessionOverrides = []): PhotoSession
{
    $branch = Branch::factory()->create(['is_active' => true, 'name' => 'Test Branch']);
    $paper = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);

    $frame = Frame::factory()->create([
        'paper_size_id' => $paper->id,
        'photo_slots' => 2,
        'is_active' => true,
    ]);

    foreach ([1, 2] as $n) {
        FramePhotoSlot::create([
            'frame_id' => $frame->id,
            'slot_number' => $n,
            'x' => 0,
            'y' => $n * 100,
            'width' => 200,
            'height' => 100,
        ]);
    }

    return PhotoSession::factory()->create(array_merge([
        'branch_id' => $branch->id,
        'paper_size_id' => $paper->id,
        'frame_id' => $frame->id,
        'session_code' => 'PB-TEST-'.uniqid(),
        'status' => SessionStatus::Paid,
        'current_step' => SessionStep::Frame,
        'total_amount' => 35000,
        'final_amount' => 35000,
        'paid_at' => now(),
    ], $sessionOverrides));
}

// ───── GET pages ───────────────────────────────────────────────────────────

it('GET /kiosk/welcome renders (no session needed)', function () {
    Branch::factory()->create(['is_active' => true]);

    $this->get('/kiosk/welcome')
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('kiosk/welcome'));
});

it('GET /kiosk/welcome-dark renders (no session needed)', function () {
    Branch::factory()->create(['is_active' => true]);

    $this->get('/kiosk/welcome-dark')
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('kiosk/welcome-dark'));
});

it('GET pages without active session redirect to welcome', function () {
    foreach (['/kiosk/payment', '/kiosk/voucher', '/kiosk/validate', '/kiosk/frame-select',
        '/kiosk/capture', '/kiosk/preview', '/kiosk/filter', '/kiosk/qty',
        '/kiosk/confirm', '/kiosk/extra-pay', '/kiosk/printing', '/kiosk/download',
    ] as $url) {
        $this->get($url)->assertRedirect('/kiosk/welcome');
    }
});

it('GET /kiosk/thanks renders without session', function () {
    $this->get('/kiosk/thanks')
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('kiosk/thanks'));
});

it('GET /kiosk/printing exposes only the assigned local printer contract', function () {
    $session = seedKiosk([
        'status' => SessionStatus::Printing,
        'current_step' => SessionStep::Print,
        'print_quantity' => 2,
        'final_image_path' => 'kiosk/result.jpg',
    ]);
    Storage::disk('public')->put('kiosk/result.jpg', 'jpeg');
    $printer = Printer::factory()->create([
        'branch_id' => $session->branch_id,
        'name' => 'Printer Booth',
        'system_printer_name' => 'DNP DS620',
        'is_default' => true,
    ]);
    $session->update(['printer_id' => $printer->id]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->get('/kiosk/printing')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('kiosk/printing')
            ->where('printer.name', 'Printer Booth')
            ->where('printer.system_name', 'DNP DS620')
            ->where('copies', 2)
            ->where('image_url', Storage::disk('public')->url('kiosk/result.jpg'))
            ->missing('printer.ip_address'));
});

it('GET /kiosk/* pages render when session is active', function () {
    $session = seedKiosk();

    foreach ([
        '/kiosk/payment' => 'kiosk/payment',
        '/kiosk/qris' => 'kiosk/qris',
        '/kiosk/voucher' => 'kiosk/voucher',
        '/kiosk/validate' => 'kiosk/validate',
        '/kiosk/frame-select' => 'kiosk/frame-select',
        '/kiosk/capture' => 'kiosk/capture',
        '/kiosk/preview' => 'kiosk/preview',
        '/kiosk/filter' => 'kiosk/filter',
        '/kiosk/qty' => 'kiosk/qty',
        '/kiosk/confirm' => 'kiosk/confirm',
        '/kiosk/extra-pay' => 'kiosk/extra-pay',
        '/kiosk/printing' => 'kiosk/printing',
        '/kiosk/download' => 'kiosk/download',
    ] as $url => $component) {
        $this->withSession(['kiosk_session_id' => $session->id])
            ->get($url)
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component($component));
    }
});

// ───── POST actions ────────────────────────────────────────────────────────

it('POST /kiosk/start creates a session and redirects to payment', function () {
    Branch::factory()->create(['is_active' => true]);
    PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);

    $this->post('/kiosk/start')->assertRedirect('/kiosk/payment');

    expect(PhotoSession::count())->toBe(1)
        ->and(PhotoSession::first()->current_step)->toBe(SessionStep::Payment);
});

it('POST /kiosk/start prices the session from global base_price, ignoring branch pricing', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $paper = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);

    // Branch-level override that used to win — must now be ignored.
    PricingConfig::query()->create([
        'branch_id' => $branch->id,
        'paper_size_id' => $paper->id,
        'base_price' => 35000,
        'is_active' => true,
    ]);

    AppSetting::set('base_price', 1, 'float');

    $this->post('/kiosk/start')->assertRedirect('/kiosk/payment');

    $session = PhotoSession::first();

    expect((float) $session->total_amount)->toBe(1.0)
        ->and((float) $session->final_amount)->toBe(1.0);
});

it('POST /kiosk/payment/method routes by method', function () {
    $session = seedKiosk([
        'status' => SessionStatus::Started,
        'current_step' => SessionStep::Payment,
        'paid_at' => null,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/payment/method', ['method' => 'voucher'])
        ->assertRedirect('/kiosk/voucher');

    expect($session->fresh()->payment_method)->toBe(PaymentMethod::Voucher);
});

it('POST /kiosk/payment/mock-pay completes payment and advances', function () {
    $session = seedKiosk([
        'status' => SessionStatus::Started,
        'current_step' => SessionStep::Payment,
        'paid_at' => null,
        'payment_method' => PaymentMethod::QrisDoku,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/payment/mock-pay')
        ->assertRedirect('/kiosk/validate');

    expect($session->fresh())
        ->status->toBe(SessionStatus::Paid)
        ->current_step->toBe(SessionStep::Frame)
        ->and(Payment::where('session_id', $session->id)->where('status', PaymentStatus::Success)->count())
        ->toBe(1);
});

it('POST /kiosk/payment/mock-pay is blocked in production', function () {
    $session = seedKiosk([
        'status' => SessionStatus::Started,
        'current_step' => SessionStep::Payment,
        'paid_at' => null,
        'payment_method' => PaymentMethod::QrisPakasir,
    ]);
    $this->app->detectEnvironment(fn () => 'production');

    $this->withoutMiddleware()
        ->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/payment/mock-pay')
        ->assertForbidden();

    expect($session->fresh()->status)->not->toBe(SessionStatus::Paid);
    expect(Payment::where('session_id', $session->id)->count())->toBe(0);
});

it('GET /kiosk/qris hides mock button in production', function () {
    $session = seedKiosk();
    $this->app->detectEnvironment(fn () => 'production');

    $this->withSession(['kiosk_session_id' => $session->id])
        ->get('/kiosk/qris')
        ->assertInertia(fn ($page) => $page->where('allowMock', false));
});

it('POST /kiosk/start defaults to a unified photo session', function () {
    Branch::factory()->create(['is_active' => true]);
    PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);

    $this->post('/kiosk/start')->assertRedirect('/kiosk/payment');

    expect(PhotoSession::first()->session_type)->toBe(SessionType::Photo);
});

it('GET /kiosk/output-type is removed (no output-type choice anymore)', function () {
    $session = seedKiosk();

    $this->withSession(['kiosk_session_id' => $session->id])
        ->get('/kiosk/output-type')
        ->assertNotFound();
});

it('POST /kiosk/voucher/apply with valid code applies voucher', function () {
    $session = seedKiosk([
        'status' => SessionStatus::Started,
        'current_step' => SessionStep::Payment,
        'paid_at' => null,
        'payment_method' => PaymentMethod::Voucher,
    ]);

    $batch = VoucherBatch::factory()->create([
        'is_active' => true,
        'valid_from' => now()->subDay(),
        'valid_until' => now()->addDays(30),
    ]);

    $voucher = Voucher::factory()->create([
        'batch_id' => $batch->id,
        'branch_id' => $session->branch_id,
        'code' => 'TESTV001',
        'is_active' => true,
        'max_uses' => 1,
        'used_count' => 0,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/voucher/apply', ['code' => 'TESTV001'])
        ->assertRedirect('/kiosk/validate');

    expect($session->fresh()->voucher_id)->toBe($voucher->id);
});

it('POST /kiosk/voucher/apply with branch mismatch is rejected', function () {
    $session = seedKiosk([
        'status' => SessionStatus::Started,
        'current_step' => SessionStep::Payment,
        'paid_at' => null,
    ]);
    $otherBranch = Branch::factory()->create(['is_active' => true, 'name' => 'Other']);

    $batch = VoucherBatch::factory()->create([
        'is_active' => true,
        'valid_from' => now()->subDay(),
        'valid_until' => now()->addDays(30),
    ]);

    Voucher::factory()->create([
        'batch_id' => $batch->id,
        'branch_id' => $otherBranch->id,
        'code' => 'OTHERVCH',
        'is_active' => true,
        'max_uses' => 1,
        'used_count' => 0,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/voucher/apply', ['code' => 'OTHERVCH'])
        ->assertSessionHasErrors('code');
});

it('POST /kiosk/frame stores frame and advances to capture', function () {
    $session = seedKiosk(['current_step' => SessionStep::Frame, 'frame_id' => null]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/frame', ['frame_id' => $session->branch->frames()->value('id') ?? Frame::value('id')])
        ->assertRedirect('/kiosk/capture');

    expect($session->fresh())
        ->current_step->toBe(SessionStep::Capture)
        ->status->toBe(SessionStatus::Capturing);
});

it('allows the paid session to continue after frame selection', function () {
    $session = seedKiosk(['current_step' => SessionStep::Frame, 'frame_id' => null]);
    Payment::factory()->create([
        'session_id' => $session->id,
        'purpose' => 'base',
        'status' => PaymentStatus::Success,
        'paid_at' => now(),
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/frame', ['frame_id' => $session->branch->frames()->value('id') ?? Frame::value('id')])
        ->assertRedirect('/kiosk/capture');

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/photos', [
            'photos' => [
                UploadedFile::fake()->image('after-frame-a.jpg', 400, 600),
                UploadedFile::fake()->image('after-frame-b.jpg', 400, 600),
            ],
        ])
        ->assertRedirect('/kiosk/preview');
});

it('does not report the base payment as paid while an extra payment is pending', function () {
    $session = seedKiosk([
        'status' => SessionStatus::PaymentPending,
        'paid_at' => now(),
        'extra_amount' => 5000,
        'final_amount' => 5000,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->getJson('/kiosk/status')
        ->assertOk()
        ->assertJsonPath('session.paid', false);
});

it('rejects a frame belonging to another branch', function () {
    $session = seedKiosk(['current_step' => SessionStep::Frame]);
    $otherBranch = Branch::factory()->create(['is_active' => true]);
    $otherFrame = Frame::factory()->create([
        'branch_id' => $otherBranch->id,
        'is_active' => true,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/frame', ['frame_id' => $otherFrame->id])
        ->assertNotFound();
});

it('rejects capture flow actions before a verified payment', function () {
    $session = seedKiosk([
        'status' => SessionStatus::Started,
        'current_step' => SessionStep::Frame,
        'paid_at' => null,
        'frame_id' => null,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/frame', ['frame_id' => Frame::value('id')])
        ->assertForbidden();

    expect($session->fresh()->status)->toBe(SessionStatus::Started);
});

it('POST /kiosk/photos uploads, advances to preview', function () {
    $session = seedKiosk(['current_step' => SessionStep::Capture]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/photos', [
            'photos' => [
                UploadedFile::fake()->image('a.jpg', 400, 600),
                UploadedFile::fake()->image('b.jpg', 400, 600),
            ],
        ])
        ->assertRedirect('/kiosk/preview');

    expect($session->fresh())
        ->current_step->toBe(SessionStep::Preview)
        ->and($session->photos()->count())->toBe(2);
});

it('POST /kiosk/video attaches a browser-encoded clip without advancing the photo flow', function () {
    $session = seedKiosk([
        'current_step' => SessionStep::Capture,
        'session_type' => SessionType::Photo,
    ]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/video', [
            'video' => UploadedFile::fake()->create('clip.webm', 200, 'video/webm'),
        ])
        ->assertNoContent();

    expect($session->fresh())
        ->video_path->not->toBeNull()
        ->current_step->toBe(SessionStep::Capture);
});

it('POST /kiosk/filter stores filter and advances to qty', function () {
    $session = seedKiosk(['current_step' => SessionStep::Preview]);
    $filter = Filter::factory()->create();

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/filter', ['filter_id' => $filter->id])
        ->assertRedirect('/kiosk/qty');

    expect($session->fresh())
        ->filter_id->toBe($filter->id)
        ->current_step->toBe(SessionStep::Quantity);
});

it('POST /kiosk/quantity updates qty and routes to confirm', function () {
    $session = seedKiosk(['current_step' => SessionStep::Quantity]);
    Payment::factory()->create(['session_id' => $session->id, 'purpose' => 'base']);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/quantity', ['quantity' => 2])
        ->assertRedirect('/kiosk/extra-pay');

    expect($session->fresh())
        ->print_quantity->toBe(2)
        ->current_step->toBe(SessionStep::Generate)
        ->final_amount->toBe('52500.00');
});

it('keeps the base transaction amount when quantity is one', function () {
    $session = seedKiosk(['current_step' => SessionStep::Quantity]);
    Payment::factory()->create(['session_id' => $session->id, 'purpose' => 'base']);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/quantity', ['quantity' => 1])
        ->assertRedirect('/kiosk/confirm');

    expect($session->fresh())
        ->final_amount->toBe('35000.00')
        ->extra_amount->toBe('0.00');
});

it('POST /kiosk/complete generates composite + GIF for a paid photo session', function () {
    $session = seedKiosk(['current_step' => SessionStep::Generate, 'print_quantity' => 1]);
    $printer = Printer::factory()->create([
        'branch_id' => $session->branch_id,
        'system_printer_name' => 'DNP DS620',
        'is_default' => true,
        'settings' => ['paper_capacity' => 200, 'paper_consumed' => 4],
    ]);

    // Real frame PNG thumbnail large enough to cover both slots.
    ob_start();
    imagepng(imagecreatetruecolor(600, 300));
    $frameBytes = ob_get_clean();
    Storage::disk('public')->put('frames/test-frame.png', $frameBytes);
    $session->frame->update(['thumbnail_path' => 'frames/test-frame.png']);

    // Two real captured photos, one per slot.
    foreach ([1, 2] as $n) {
        ob_start();
        imagejpeg(imagecreatetruecolor(200, 100));
        $bytes = ob_get_clean();
        $path = "kiosk/{$session->session_code}/photo-{$n}.jpg";
        Storage::disk('public')->put($path, $bytes);

        SessionPhoto::create([
            'session_id' => $session->id,
            'slot_number' => $n,
            'original_path' => $path,
            'is_selected' => true,
            'captured_at' => now(),
        ]);
    }

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/complete')
        ->assertRedirect('/kiosk/printing');

    $fresh = $session->fresh();

    expect($fresh->status)->toBe(SessionStatus::Printing)
        ->and($fresh->current_step)->toBe(SessionStep::Print)
        ->and($fresh->completed_at)->toBeNull()
        ->and($fresh->printer_id)->toBe($printer->id)
        ->and($fresh->final_image_path)->not->toBeNull()
        ->and($fresh->gif_path)->not->toBeNull();

    expect(Storage::disk('public')->exists($fresh->gif_path))->toBeTrue()
        ->and($printer->fresh()->settings['paper_consumed'])->toBe(4);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/printing/complete')
        ->assertRedirect('/kiosk/download');

    expect($session->fresh()->status)->toBe(SessionStatus::Completed)
        ->and($session->fresh()->current_step)->toBe(SessionStep::Done)
        ->and($session->fresh()->completed_at)->not->toBeNull()
        ->and($printer->fresh()->settings['paper_consumed'])->toBe(5)
        ->and(PrinterLog::where('printer_id', $printer->id)->count())->toBe(1);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/printing/complete')
        ->assertRedirect('/kiosk/download');

    expect($printer->fresh()->settings['paper_consumed'])->toBe(5)
        ->and(PrinterLog::where('printer_id', $printer->id)->count())->toBe(1);
});

it('POST /kiosk/complete stops before rendering when no Windows printer is configured', function () {
    $session = seedKiosk(['current_step' => SessionStep::Generate, 'print_quantity' => 1]);

    ob_start();
    imagepng(imagecreatetruecolor(600, 300));
    Storage::disk('public')->put('frames/test-frame.png', ob_get_clean());
    $session->frame->update(['thumbnail_path' => 'frames/test-frame.png']);

    foreach ([1, 2] as $slot) {
        ob_start();
        imagejpeg(imagecreatetruecolor(200, 100));
        $path = "kiosk/{$session->session_code}/photo-{$slot}.jpg";
        Storage::disk('public')->put($path, ob_get_clean());
        SessionPhoto::create([
            'session_id' => $session->id,
            'slot_number' => $slot,
            'original_path' => $path,
            'is_selected' => true,
            'captured_at' => now(),
        ]);
    }

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/complete')
        ->assertRedirect('/kiosk/confirm')
        ->assertSessionHasErrors('printer');

    expect($session->fresh()->status)->not->toBe(SessionStatus::Completed);
});

it('POST /kiosk/cancel marks session cancelled and clears state', function () {
    $session = seedKiosk();

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/cancel')
        ->assertRedirect('/kiosk/welcome');

    expect($session->fresh()->status)->toBe(SessionStatus::Cancelled);
});

it('POST /kiosk/email-receipt validates email', function () {
    $session = seedKiosk();

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/email-receipt', ['email' => 'not-an-email'])
        ->assertSessionHasErrors('email');
});

it('GET /kiosk/status returns json with session payload', function () {
    $session = seedKiosk();

    $this->withSession(['kiosk_session_id' => $session->id])
        ->get('/kiosk/status')
        ->assertOk()
        ->assertJson(['session' => ['session_code' => $session->session_code]]);
});

it('GET /kiosk/status returns null when no session', function () {
    $this->get('/kiosk/status')
        ->assertOk()
        ->assertExactJson(['session' => null]);
});
