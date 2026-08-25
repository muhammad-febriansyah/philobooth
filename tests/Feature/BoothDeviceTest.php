<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PrintJobStatus;
use App\Enums\SessionStatus;
use App\Enums\UserRole;
use App\Models\AppSetting;
use App\Models\BoothDevice;
use App\Models\Branch;
use App\Models\Frame;
use App\Models\PaperSize;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\PrintJob;
use App\Models\User;
use App\Services\Pakasir\PakasirClient;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole(UserRole::Admin->value);
});

it('creates a one-time pairing code and pairs a booth device', function () {
    $branch = Branch::factory()->create(['is_active' => true]);

    $codeResponse = $this->actingAs($this->admin)
        ->postJson(route('admin.booth-devices.pairing-code'), [
            'branch_id' => $branch->id,
            'name' => 'Booth Jakarta 01',
        ])
        ->assertCreated()
        ->assertJsonPath('branch_id', $branch->id);

    $code = $codeResponse->json('code');
    $deviceId = $codeResponse->json('device_id');
    $uuid = (string) Str::uuid();

    $pairResponse = $this->postJson('/api/booth/v1/pair', [
        'code' => $code,
        'device_uuid' => $uuid,
        'app_version' => '1.0.0',
        'capabilities' => ['camera' => 'mock', 'printer' => 'mock'],
    ])
        ->assertSuccessful()
        ->assertJsonPath('device.uuid', $uuid)
        ->assertJsonPath('device.branch.id', $branch->id);

    $token = $pairResponse->json('token');

    expect($token)->toStartWith('pb_')
        ->and($token)->not->toBe($code);

    $device = BoothDevice::findOrFail($deviceId);

    expect($device->isPaired())->toBeTrue()
        ->and($device->pairing_code_hash)->toBeNull()
        ->and($device->token_hash)->not->toBeNull();

    $this->postJson('/api/booth/v1/pair', [
        'code' => $code,
        'device_uuid' => (string) Str::uuid(),
    ])->assertUnprocessable();
});

it('requires a valid paired device token for heartbeat', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_test-token'),
        'paired_at' => now(),
        'last_seen_at' => null,
    ]);

    $this->postJson('/api/booth/v1/heartbeat', [], [
        'Authorization' => 'Bearer invalid',
    ])->assertUnauthorized();

    $this->postJson('/api/booth/v1/heartbeat', [
        'app_version' => '1.2.3',
        'camera' => ['connected' => true],
        'printer' => ['ready' => true],
    ], [
        'Authorization' => 'Bearer pb_test-token',
    ])
        ->assertSuccessful()
        ->assertJsonPath('device.id', $device->id);

    expect($device->fresh()->last_seen_at)->not->toBeNull()
        ->and($device->fresh()->app_version)->toBe('1.2.3');
});

it('rejects a revoked device token', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_revoked'),
        'paired_at' => now(),
        'revoked_at' => now(),
    ]);

    $this->postJson('/api/booth/v1/heartbeat', [], [
        'Authorization' => 'Bearer pb_revoked',
    ])->assertUnauthorized();
});

it('bootstraps only frames and printers belonging to the device branch', function () {
    $branchA = Branch::factory()->create(['is_active' => true]);
    $branchB = Branch::factory()->create(['is_active' => true]);
    $frameA = Frame::factory()->create(['branch_id' => $branchA->id, 'is_active' => true]);
    Frame::factory()->create(['branch_id' => $branchB->id, 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branchA->id,
        'token_hash' => hash('sha256', 'pb_bootstrap'),
        'paired_at' => now(),
    ]);

    $this->getJson('/api/booth/v1/bootstrap', [
        'Authorization' => 'Bearer pb_bootstrap',
    ])
        ->assertSuccessful()
        ->assertJsonPath('device.id', $device->id)
        ->assertJsonPath('branch.id', $branchA->id)
        ->assertJsonCount(1, 'frames')
        ->assertJsonPath('frames.0.id', $frameA->id);
});

it('creates an idempotent booth session and keeps it scoped to the device', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_session'),
        'paired_at' => now(),
    ]);

    $payload = ['request_id' => 'desktop-request-001', 'session_type' => 'photo'];
    $headers = ['Authorization' => 'Bearer pb_session'];

    $first = $this->postJson('/api/booth/v1/sessions', $payload, $headers)
        ->assertCreated()
        ->assertJsonPath('status', 'started')
        ->assertJsonPath('current_step', 'payment');
    $sessionId = $first->json('id');

    $this->postJson('/api/booth/v1/sessions', $payload, $headers)
        ->assertOk()
        ->assertJsonPath('id', $sessionId);

    $this->getJson("/api/booth/v1/sessions/{$sessionId}", $headers)
        ->assertOk()
        ->assertJsonPath('session_code', $first->json('session_code'));

    expect(PhotoSession::findOrFail($sessionId)->booth_device_id)->toBe($device->id);
});

it('does not expose another device session by id', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $otherDevice = BoothDevice::factory()->create(['branch_id' => $branch->id]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $otherDevice->id,
        'paper_size_id' => $paperSize->id,
    ]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_other'),
        'paired_at' => now(),
    ]);

    $this->getJson("/api/booth/v1/sessions/{$session->id}", [
        'Authorization' => 'Bearer pb_other',
    ])->assertNotFound();
});

it('creates and verifies a booth QRIS payment without trusting the client amount', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_payment'),
        'paired_at' => now(),
    ]);

    $headers = ['Authorization' => 'Bearer pb_payment'];
    $session = $this->postJson('/api/booth/v1/sessions', [
        'request_id' => 'payment-request-001',
    ], $headers)->assertCreated()->json();

    app()->instance(PakasirClient::class, new PakasirClient(
        baseUrl: 'https://app.pakasir.test',
        slug: 'philobooth',
        apiKey: 'secret',
        qrisExpiredMinutes: 10,
    ));

    Http::fake([
        'https://app.pakasir.test/api/transactioncreate/qris' => Http::response([
            'payment' => [
                'payment_number' => '000201010212',
                'expired_at' => now()->addMinutes(10)->toIso8601String(),
            ],
        ]),
        'https://app.pakasir.test/api/transactiondetail*' => Http::response([
            'transaction' => [
                'status' => 'completed',
                'amount' => (int) $session['final_amount'],
            ],
        ]),
    ]);

    $payment = $this->postJson(
        "/api/booth/v1/sessions/{$session['id']}/payment",
        ['purpose' => 'base'],
        $headers,
    )
        ->assertCreated()
        ->assertJsonPath('purpose', 'base')
        ->assertJsonPath('amount', $session['final_amount']);

    $this->getJson(
        "/api/booth/v1/sessions/{$session['id']}/payment",
        $headers,
    )
        ->assertOk()
        ->assertJsonPath('paid', true)
        ->assertJsonPath('status', 'paid');

    expect(PhotoSession::findOrFail($session['id'])->status)->toBe(SessionStatus::Paid)
        ->and($payment->json('qris_string'))->toBe('000201010212');

    $this->postJson(
        "/api/booth/v1/sessions/{$session['id']}/payment",
        ['purpose' => 'base'],
        $headers,
    )
        ->assertOk()
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('id', $payment->json('id'));

    expect(Payment::query()->where('session_id', $session['id'])->count())->toBe(1);
    Http::assertSentCount(2);
});

it('expires a stale payment before returning a newly created QRIS', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_expired_payment'),
        'paired_at' => now(),
    ]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $device->id,
        'paper_size_id' => $paperSize->id,
        'status' => SessionStatus::PaymentPending,
        'total_amount' => 25000,
        'final_amount' => 25000,
    ]);
    $expired = Payment::factory()->pending()->create([
        'session_id' => $session->id,
        'purpose' => 'base',
        'method' => PaymentMethod::QrisPakasir,
        'pakasir_order_id' => 'OLDORDER',
        'qris_string' => 'OLDQR',
        'expired_at' => now()->subMinute(),
    ]);

    app()->instance(PakasirClient::class, new PakasirClient(
        baseUrl: 'https://app.pakasir.test', slug: 'philobooth', apiKey: 'secret', qrisExpiredMinutes: 10,
    ));
    Http::fake([
        'https://app.pakasir.test/api/transactioncreate/qris' => Http::response([
            'payment' => ['payment_number' => 'NEWQR', 'expired_at' => now()->addMinutes(10)->toIso8601String()],
        ]),
        'https://app.pakasir.test/api/transactiondetail*' => Http::response([
            'transaction' => ['status' => 'pending', 'amount' => 25000],
        ]),
    ]);

    $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/payment",
        ['purpose' => 'base'],
        ['Authorization' => 'Bearer pb_expired_payment'],
    )->assertCreated()->assertJsonPath('qris_string', 'NEWQR');

    expect($expired->fresh()->status)->toBe(PaymentStatus::Expired)
        ->and($session->payments()->where('status', PaymentStatus::Pending)->count())->toBe(1);
});

it('rejects a concurrent payment request while its server lock is held', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_locked_payment'),
        'paired_at' => now(),
    ]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $device->id,
        'paper_size_id' => $paperSize->id,
        'status' => SessionStatus::Started,
    ]);
    app()->instance(PakasirClient::class, new PakasirClient(
        baseUrl: 'https://app.pakasir.test', slug: 'philobooth', apiKey: 'secret', qrisExpiredMinutes: 10,
    ));
    Http::fake();
    $lock = Cache::lock("booth-billing:{$session->id}", 30);
    expect($lock->get())->toBeTrue();

    try {
        $this->postJson(
            "/api/booth/v1/sessions/{$session->id}/payment",
            ['purpose' => 'base'],
            ['Authorization' => 'Bearer pb_locked_payment'],
        )->assertConflict();
    } finally {
        $lock->release();
    }

    Http::assertNothingSent();
    expect($session->payments()->count())->toBe(0);
});

it('reserves a payment before a provider outage and safely resumes the same order', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_resume_payment'),
        'paired_at' => now(),
    ]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $device->id,
        'paper_size_id' => $paperSize->id,
        'status' => SessionStatus::Started,
        'total_amount' => 25000,
        'final_amount' => 25000,
    ]);
    app()->instance(PakasirClient::class, new PakasirClient(
        baseUrl: 'https://app.pakasir.test', slug: 'philobooth', apiKey: 'secret', qrisExpiredMinutes: 10,
    ));
    $headers = ['Authorization' => 'Bearer pb_resume_payment'];
    Http::fakeSequence('https://app.pakasir.test/api/transactioncreate/qris')
        ->pushFailedConnection()
        ->push([
            'payment' => [
                'payment_number' => 'RESUMEDQR',
                'expired_at' => now()->addMinutes(10)->toIso8601String(),
            ],
        ]);

    $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/payment",
        ['purpose' => 'base'],
        $headers,
    )->assertStatus(502);

    $reservation = $session->payments()->sole();
    expect($reservation->status)->toBe(PaymentStatus::Pending)
        ->and($reservation->qris_string)->toBeNull()
        ->and($reservation->pakasir_order_id)->not->toBeNull();

    $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/payment",
        ['purpose' => 'base'],
        $headers,
    )->assertOk()->assertJsonPath('id', $reservation->id)->assertJsonPath('qris_string', 'RESUMEDQR');

    expect($session->payments()->count())->toBe(1);
});

it('settles a locally stale payment when the provider already completed it', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_late_settlement'),
        'paired_at' => now(),
    ]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $device->id,
        'paper_size_id' => $paperSize->id,
        'status' => SessionStatus::PaymentPending,
        'total_amount' => 25000,
        'final_amount' => 25000,
    ]);
    $payment = Payment::factory()->pending()->create([
        'session_id' => $session->id,
        'purpose' => 'base',
        'method' => PaymentMethod::QrisPakasir,
        'amount' => 25000,
        'pakasir_order_id' => 'LATEORDER',
        'expired_at' => now()->subSecond(),
    ]);
    app()->instance(PakasirClient::class, new PakasirClient(
        baseUrl: 'https://app.pakasir.test', slug: 'philobooth', apiKey: 'secret', qrisExpiredMinutes: 10,
    ));
    Http::fake([
        'https://app.pakasir.test/api/transactiondetail*' => Http::response([
            'transaction' => ['status' => 'completed', 'amount' => 25000],
        ]),
    ]);

    $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/payment",
        ['purpose' => 'base'],
        ['Authorization' => 'Bearer pb_late_settlement'],
    )->assertOk()->assertJsonPath('status', 'success');

    expect($payment->fresh()->status)->toBe(PaymentStatus::Success)
        ->and($session->fresh()->status)->toBe(SessionStatus::Paid)
        ->and($session->payments()->count())->toBe(1);
});

it('closes a missing provider reservation and creates the next durable attempt', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_missing_order'),
        'paired_at' => now(),
    ]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $device->id,
        'paper_size_id' => $paperSize->id,
        'status' => SessionStatus::PaymentPending,
        'total_amount' => 25000,
        'final_amount' => 25000,
    ]);
    $missing = Payment::factory()->pending()->create([
        'session_id' => $session->id,
        'purpose' => 'base',
        'method' => PaymentMethod::QrisPakasir,
        'amount' => 25000,
        'attempt' => 1,
        'pakasir_order_id' => 'MISSINGORDER',
        'qris_string' => null,
        'expired_at' => now()->subSecond(),
    ]);
    app()->instance(PakasirClient::class, new PakasirClient(
        baseUrl: 'https://app.pakasir.test', slug: 'philobooth', apiKey: 'secret', qrisExpiredMinutes: 10,
    ));
    Http::fake([
        'https://app.pakasir.test/api/transactiondetail*' => Http::response([], 404),
        'https://app.pakasir.test/api/transactioncreate/qris' => Http::response([
            'payment' => ['payment_number' => 'SECONDQR', 'expired_at' => now()->addMinutes(10)->toIso8601String()],
        ]),
    ]);

    $response = $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/payment",
        ['purpose' => 'base'],
        ['Authorization' => 'Bearer pb_missing_order'],
    )->assertCreated()->assertJsonPath('attempt', 2)->assertJsonPath('qris_string', 'SECONDQR');

    expect($missing->fresh()->status)->toBe(PaymentStatus::Expired)
        ->and($session->payments()->count())->toBe(2)
        ->and($response->json('id'))->not->toBe($missing->id);
});

it('calculates extra print pricing on the server and prevents a second extra charge', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_extra_print'),
        'paired_at' => now(),
    ]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $device->id,
        'paper_size_id' => $paperSize->id,
        'status' => SessionStatus::Paid,
        'total_amount' => 30000,
        'final_amount' => 30000,
        'paid_at' => now(),
    ]);
    Payment::factory()->create([
        'session_id' => $session->id,
        'purpose' => 'base',
        'method' => PaymentMethod::QrisPakasir,
        'amount' => 30000,
    ]);
    AppSetting::set('extra_print_price', 7000, 'integer');

    $headers = ['Authorization' => 'Bearer pb_extra_print'];
    $billingLock = Cache::lock("booth-billing:{$session->id}", 30);
    expect($billingLock->get())->toBeTrue();
    try {
        $this->putJson(
            "/api/booth/v1/sessions/{$session->id}/print-quantity",
            ['quantity' => 3],
            $headers,
        )->assertConflict();
    } finally {
        $billingLock->release();
    }

    $this->putJson(
        "/api/booth/v1/sessions/{$session->id}/print-quantity",
        ['quantity' => 3, 'amount' => 1],
        $headers,
    )
        ->assertOk()
        ->assertJsonPath('extra_amount', 14000)
        ->assertJsonPath('final_amount', 44000)
        ->assertJsonPath('amount_due', 14000);

    app()->instance(PakasirClient::class, new PakasirClient(
        baseUrl: 'https://app.pakasir.test', slug: 'philobooth', apiKey: 'secret', qrisExpiredMinutes: 10,
    ));
    Http::fake([
        'https://app.pakasir.test/api/transactioncreate/qris' => Http::response([
            'payment' => ['payment_number' => 'EXTRAQR', 'expired_at' => now()->addMinutes(10)->toIso8601String()],
        ]),
        'https://app.pakasir.test/api/transactiondetail*' => Http::response([
            'transaction' => ['status' => 'completed', 'amount' => 14000],
        ]),
    ]);

    $extra = $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/payment",
        ['purpose' => 'extra_print'],
        $headers,
    )->assertCreated()->assertJsonPath('amount', 14000);

    $this->getJson("/api/booth/v1/sessions/{$session->id}/payment", $headers)
        ->assertOk()->assertJsonPath('paid', true);
    $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/payment",
        ['purpose' => 'extra_print'],
        $headers,
    )->assertOk()->assertJsonPath('id', $extra->json('id'));
    $this->putJson(
        "/api/booth/v1/sessions/{$session->id}/print-quantity",
        ['quantity' => 4],
        $headers,
    )->assertConflict();

    expect($session->payments()->where('purpose', 'extra_print')->count())->toBe(1);
    Http::assertSentCount(2);
});

it('uploads final artifacts and acknowledges an idempotent print job', function () {
    Storage::fake('local');
    $branch = Branch::factory()->create(['is_active' => true]);
    $paperSize = PaperSize::factory()->create(['code' => 'STRIP', 'is_active' => true]);
    $device = BoothDevice::factory()->create([
        'branch_id' => $branch->id,
        'token_hash' => hash('sha256', 'pb_artifacts'),
        'paired_at' => now(),
    ]);
    $printer = Printer::factory()->create([
        'branch_id' => $branch->id,
        'is_default' => true,
        'is_active' => true,
    ]);
    $session = PhotoSession::factory()->create([
        'branch_id' => $branch->id,
        'booth_device_id' => $device->id,
        'paper_size_id' => $paperSize->id,
        'status' => SessionStatus::Paid,
        'paid_at' => now(),
        'print_quantity' => 2,
    ]);
    Payment::factory()->create(['session_id' => $session->id, 'purpose' => 'base']);
    $headers = ['Authorization' => 'Bearer pb_artifacts'];

    $artifact = $this->post(
        "/api/booth/v1/sessions/{$session->id}/artifacts",
        [
            'final_image' => UploadedFile::fake()->image('final.png', 1200, 1800),
            'photos' => [
                UploadedFile::fake()->image('one.jpg', 1200, 1800),
                UploadedFile::fake()->image('two.jpg', 1200, 1800),
            ],
        ],
        $headers,
    )->assertCreated()->assertJsonPath('photos_count', 2);

    $freshSession = $session->fresh();
    Storage::disk('local')->assertExists($freshSession->final_image_path);

    $first = $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/print-jobs",
        ['request_id' => 'print-request-001', 'printer_id' => $printer->id],
        $headers,
    )->assertCreated()->assertJsonPath('status', 'queued')->assertJsonPath('quantity', 2);
    $jobId = $first->json('id');
    $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/print-jobs",
        ['request_id' => 'print-request-001', 'printer_id' => $printer->id],
        $headers,
    )->assertOk()->assertJsonPath('id', $jobId);
    $this->postJson(
        "/api/booth/v1/sessions/{$session->id}/print-jobs",
        ['request_id' => 'print-request-002', 'printer_id' => $printer->id],
        $headers,
    )->assertConflict();

    $this->get("/api/booth/v1/sessions/{$session->id}/artifacts/final")
        ->assertUnauthorized();
    $this->get(
        "/api/booth/v1/sessions/{$session->id}/artifacts/final",
        $headers,
    )->assertOk();
    $this->get($artifact->json('customer_download_url'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('download/show')->has('items', 3));
    $this->get($artifact->json('customer_download_url').'/file?kind=composite&inline=1')
        ->assertOk();
    $this->get("/api/booth/v1/sessions/{$session->id}/print-jobs/{$jobId}/file")
        ->assertUnauthorized();
    $this->get(
        "/api/booth/v1/sessions/{$session->id}/print-jobs/{$jobId}/file",
        $headers,
    )->assertOk();
    $this->patchJson(
        "/api/booth/v1/sessions/{$session->id}/print-jobs/{$jobId}",
        ['status' => 'printing'],
        $headers,
    )->assertOk()->assertJsonPath('status', 'printing');
    $this->patchJson(
        "/api/booth/v1/sessions/{$session->id}/print-jobs/{$jobId}",
        ['status' => 'success'],
        $headers,
    )->assertOk()->assertJsonPath('status', 'success');

    expect(PrintJob::query()->count())->toBe(1)
        ->and(PrintJob::findOrFail($jobId)->status)->toBe(PrintJobStatus::Success)
        ->and($session->fresh()->status)->toBe(SessionStatus::Completed)
        ->and((int) data_get($printer->fresh()->settings, 'paper_consumed'))->toBe(2);
});
