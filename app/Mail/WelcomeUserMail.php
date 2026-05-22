<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Dikirim saat admin tambah user baru — kasih login URL + password sementara.
 */
class WelcomeUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $plainPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Selamat datang di Philobooth · Akun kamu siap',
        );
    }

    public function content(): Content
    {
        $this->user->loadMissing(['branch', 'roles']);
        $role = $this->user->roles->pluck('name')->first();

        return new Content(
            view: 'emails.welcome-user',
            with: [
                'name' => $this->user->name,
                'email' => $this->user->email,
                'temp_password' => $this->plainPassword,
                'role' => $role,
                'role_label' => $role === 'admin' ? 'Super Admin' : 'User Cabang',
                'branch_name' => $this->user->branch?->name,
                'login_url' => url('/login'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
