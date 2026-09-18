<?php

namespace App\Providers;

use App\Services\SmsService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SmsService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('otp-request', function (Request $request) {
            $phone = (string) $request->input('phone', '');

            return [
                Limit::perMinutes(10, 5)->by('otp-req:'.($phone !== '' ? $phone : $request->ip())),
                Limit::perMinutes(10, 20)->by('otp-req-ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('otp-verify', function (Request $request) {
            $phone = (string) $request->input('phone', '');

            return Limit::perMinutes(5, 5)->by('otp-verify:'.($phone !== '' ? $phone : $request->ip()));
        });
    }
}
