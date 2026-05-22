<?php

namespace App\Mail;

use App\Models\PhotoSession;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Notif ke customer: foto sudah selesai diproses & link digital siap diunduh.
 * Dipakai saat session.complete (kalau customer ngisi email).
 */
class PhotoReadyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PhotoSession $session,
        public ?string $customerName = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Foto kamu udah jadi! · '.$this->session->session_code,
        );
    }

    public function content(): Content
    {
        $session = $this->session;
        $session->loadMissing('branch');

        return new Content(
            view: 'emails.photo-ready',
            with: [
                'name' => $this->customerName,
                'session_code' => $session->session_code,
                'branch_name' => $session->branch?->name,
                'print_quantity' => $session->print_quantity,
                'download_url' => $session->download_token
                    ? url('/d/'.$session->download_token)
                    : url('/'),
                'expires_at' => $session->download_expires_at?->isoFormat('D MMM YYYY'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
