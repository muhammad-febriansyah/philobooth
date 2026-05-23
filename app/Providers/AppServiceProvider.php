<?php

namespace App\Providers;

use App\Services\Doku\DokuClient;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(DokuClient::class, fn () => new DokuClient(
            clientId: (string) config('services.doku.client_id', ''),
            secretKey: (string) config('services.doku.secret_key', ''),
            baseUrl: rtrim((string) config('services.doku.base_url', ''), '/'),
            notifyUrl: config('services.doku.notify_url'),
            qrisExpiredMinutes: (int) config('services.doku.qris_expired_minutes', 10),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
