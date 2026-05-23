<?php

use App\Models\PhotoSession;
use App\Models\SessionPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

function makeCompletedSessionWithFiles(): PhotoSession
{
    $compositePath = UploadedFile::fake()
        ->image('composite.png', 600, 800)
        ->storeAs('sessions/test', 'composite.png', 'public');
    $gifPath = 'sessions/test/stop-motion.gif';
    Storage::disk('public')->put($gifPath, 'GIF89a-fake-bytes');

    $session = PhotoSession::factory()->completed()->create([
        'session_code' => 'PB-TEST-001',
        'download_token' => 'tok-abc-123',
        'download_expires_at' => now()->addDays(7),
        'final_image_path' => $compositePath,
        'gif_path' => $gifPath,
    ]);

    foreach ([1, 2, 3] as $slot) {
        $path = UploadedFile::fake()
            ->image("photo-{$slot}.jpg", 400, 600)
            ->storeAs('photos', "photo-{$slot}.jpg", 'public');
        SessionPhoto::factory()->create([
            'session_id' => $session->id,
            'slot_number' => $slot,
            'original_path' => $path,
        ]);
    }

    return $session->fresh();
}

it('renders gallery with composite, gif, and individual photos', function () {
    $session = makeCompletedSessionWithFiles();

    $this->get('/d/'.$session->download_token)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('download/show')
            ->has('items', 5) // composite + gif + 3 photos
            ->where('items.0.kind', 'composite')
            ->where('items.1.kind', 'gif')
            ->where('items.2.kind', 'photo')
        );
});

it('streams composite file when kind=composite', function () {
    $session = makeCompletedSessionWithFiles();

    $this->get('/d/'.$session->download_token.'/file?kind=composite')
        ->assertOk()
        ->assertHeader('content-disposition', 'attachment; filename='.$session->session_code.'.png');
});

it('streams gif file when kind=gif', function () {
    $session = makeCompletedSessionWithFiles();

    $this->get('/d/'.$session->download_token.'/file?kind=gif')
        ->assertOk()
        ->assertHeader('content-disposition', 'attachment; filename='.$session->session_code.'.gif');
});

it('streams individual photo by slot', function () {
    $session = makeCompletedSessionWithFiles();

    $this->get('/d/'.$session->download_token.'/file?kind=photo&slot=2')
        ->assertOk()
        ->assertHeader(
            'content-disposition',
            'attachment; filename='.$session->session_code.'-foto-2.jpg',
        );
});

it('builds a ZIP archive of all files', function () {
    $session = makeCompletedSessionWithFiles();

    $response = $this->get('/d/'.$session->download_token.'/zip');

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/zip');
});

it('rejects access with expired token', function () {
    $session = makeCompletedSessionWithFiles();
    $session->update(['download_expires_at' => now()->subDay()]);

    $this->get('/d/'.$session->download_token)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('download/invalid'));
});
