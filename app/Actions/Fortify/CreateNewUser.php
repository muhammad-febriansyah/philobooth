<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Services\RecaptchaService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private readonly RecaptchaService $recaptcha) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        // Verifikasi reCAPTCHA v3 sebelum proses register — gagal token = stop sebelum sentuh DB.
        if ($this->recaptcha->isEnabled()) {
            $token = (string) request()->input('recaptcha_token', '');

            if (! $this->recaptcha->verify($token)) {
                throw ValidationException::withMessages([
                    'email' => __('Verifikasi reCAPTCHA gagal. Coba muat ulang halaman.'),
                ]);
            }
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
