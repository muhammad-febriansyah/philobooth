<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionStep;
use App\Models\Branch;
use App\Models\Filter;
use App\Models\Frame;
use App\Models\FramePhotoSlot;
use App\Models\PaperSize;
use App\Models\Payment;
use App\Models\PhotoSession;
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
        'status' => SessionStatus::Started,
        'current_step' => SessionStep::Payment,
        'total_amount' => 35000,
        'final_amount' => 35000,
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

it('POST /kiosk/payment/method routes by method', function () {
    $session = seedKiosk();

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/payment/method', ['method' => 'voucher'])
        ->assertRedirect('/kiosk/voucher');

    expect($session->fresh()->payment_method)->toBe(PaymentMethod::Voucher);
});

it('POST /kiosk/payment/mock-pay completes payment and advances', function () {
    $session = seedKiosk(['payment_method' => PaymentMethod::QrisDoku]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/payment/mock-pay')
        ->assertRedirect('/kiosk/validate');

    expect($session->fresh())
        ->status->toBe(SessionStatus::Paid)
        ->current_step->toBe(SessionStep::OutputType)
        ->and(Payment::where('session_id', $session->id)->where('status', PaymentStatus::Success)->count())
        ->toBe(1);
});

it('POST /kiosk/output-type persists choice and advances to frame', function () {
    $session = seedKiosk(['current_step' => SessionStep::OutputType]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/output-type', ['session_type' => 'stop_motion_video'])
        ->assertRedirect('/kiosk/frame-select');

    expect($session->fresh())
        ->session_type->value->toBe('stop_motion_video')
        ->current_step->toBe(SessionStep::Frame);
});

it('GET /kiosk/output-type renders selector page', function () {
    $session = seedKiosk(['current_step' => SessionStep::OutputType]);

    $this->withSession(['kiosk_session_id' => $session->id])
        ->get('/kiosk/output-type')
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('kiosk/output-type'));
});

it('POST /kiosk/voucher/apply with valid code applies voucher', function () {
    $session = seedKiosk(['payment_method' => PaymentMethod::Voucher]);

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
    $session = seedKiosk();
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

    $this->withSession(['kiosk_session_id' => $session->id])
        ->post('/kiosk/quantity', ['quantity' => 2])
        ->assertRedirect('/kiosk/confirm');

    expect($session->fresh())
        ->print_quantity->toBe(2)
        ->current_step->toBe(SessionStep::Generate);
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
