<?php

namespace App\Http\Middleware;

use App\Services\RecaptchaService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verify reCAPTCHA v3 token untuk Fortify guest-auth route yang gak punya hook resmi.
 *
 * Middleware ini auto-gating berdasar nama route — register & password.email
 * udah Fortify default tapi gak ada slot Fortify::xxxUsing untuk verify token,
 * jadi kita intersep di middleware level.
 *
 * NOTE: register sebenarnya verify token di CreateNewUser action; nama 'register'
 * di list ini sebagai sabuk pengaman aja kalau ada path register lain di masa
 * depan yang tidak via action tsb.
 */
class VerifyRecaptchaForGuestAuth
{
    private const PROTECTED_ROUTES = [
        'password.email', // POST /forgot-password — Fortify request password reset link
    ];

    public function __construct(private readonly RecaptchaService $recaptcha) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethod('POST')) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if (! in_array($routeName, self::PROTECTED_ROUTES, true)) {
            return $next($request);
        }

        if (! $this->recaptcha->isEnabled()) {
            return $next($request);
        }

        $token = (string) $request->input('recaptcha_token', '');

        if (! $this->recaptcha->verify($token)) {
            throw ValidationException::withMessages([
                'email' => __('Verifikasi reCAPTCHA gagal. Coba muat ulang halaman dan kirim ulang.'),
            ]);
        }

        return $next($request);
    }
}
