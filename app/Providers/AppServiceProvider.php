<?php

namespace App\Providers;

use App\Contracts\PaymentGatewayInterface;
use App\Services\DevelopmentPaymentGateway;
use App\Services\SumUpPaymentGateway;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, function () {
            if (!$this->app->isProduction()) {
                return $this->app->make(DevelopmentPaymentGateway::class);
            }

            if (!config('services.sumup.webhook_secret')) {
                throw new \RuntimeException('SUMUP_WEBHOOK_SECRET must be configured in production.');
            }

            return $this->app->make(SumUpPaymentGateway::class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS scheme for all generated URLs when APP_URL is https
        // This is required for ngrok or reverse proxies to avoid mixed content errors
        if (str_starts_with(config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        // Set app.name dynamically based on which domain is being served
        if (! app()->runningInConsole()) {
            $host = request()->getHost();
            $storeDomain = env('STORE_DOMAIN', 'store.localhost');

            if ($host === $storeDomain || $host === 'store.localhost') {
                config(['app.name' => env('STORE_APP_NAME', 'Online Store')]);
            }
        }

        RateLimiter::for('checkout', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

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
