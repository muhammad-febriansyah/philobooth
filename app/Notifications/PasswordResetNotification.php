<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Branded reset-password email — pakai template Philobooth.
 */
class PasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage)
            ->subject('Reset password Philobooth')
            ->view('emails.password-reset', [
                'name' => $notifiable->name ?? '',
                'reset_url' => $resetUrl,
                'expires_minutes' => config('auth.passwords.users.expire', 60),
            ]);
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
