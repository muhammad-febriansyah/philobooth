<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Verify reCAPTCHA v3 tokens against Google API.
 *
 * Config dibaca dari env:
 *   RECAPTCHA_ENABLED=true|false
 *   RECAPTCHA_SITE_KEY=...
 *   RECAPTCHA_SECRET_KEY=...
 *   RECAPTCHA_MIN_SCORE=0.5  (optional)
 *
 * Local/testing env auto-bypass (return true tanpa hit Google).
 */
class RecaptchaService
{
    public function verify(string $token, ?float $minScore = null): bool
    {
        if ($this->shouldBypass()) {
            return true;
        }

        $secret = (string) config('services.recaptcha.secret', '');

        if ($token === '' || $secret === '') {
            return false;
        }

        $minScore ??= (float) config('services.recaptcha.min_score', 0.5);

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => request()->ip(),
                ]);

            if (! $response->successful()) {
                Log::warning('reCAPTCHA verification request failed', [
                    'status' => $response->status(),
                ]);

                return false;
            }

            $data = $response->json();
            $ok = ($data['success'] ?? false) === true
                && isset($data['score'])
                && $data['score'] >= $minScore;

            if (! $ok) {
                Log::info('reCAPTCHA rejected', [
                    'score' => $data['score'] ?? null,
                    'errors' => $data['error-codes'] ?? [],
                ]);
            }

            return $ok;
        } catch (\Throwable $e) {
            Log::error('reCAPTCHA verification error', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function isEnabled(): bool
    {
        if ($this->shouldBypass()) {
            return false;
        }

        return (bool) config('services.recaptcha.enabled', false);
    }

    public function siteKey(): ?string
    {
        $key = (string) config('services.recaptcha.site_key', '');

        return $key !== '' ? $key : null;
    }

    private function shouldBypass(): bool
    {
        if (app()->environment(['local', 'testing'])) {
            return true;
        }

        $host = request()->getHost();

        return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }
}
