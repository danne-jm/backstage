<?php

namespace App\Providers;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Event;
use App\Models\Product;
use App\Observers\EventObserver;
use App\Observers\ProductObserver;
use App\Services\PaymentGateways\DevelopmentPaymentGateway;
use App\Services\PaymentGateways\SumUpPaymentGateway;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind the appropriate PaymentGateway implementation based on environment
        $this->app->singleton(PaymentGatewayInterface::class, function ($app) {
            $environment = config('app.env', 'production');

            // Use development gateway for non-production environments
            if (in_array($environment, ['local', 'development', 'testing'])) {
                return new DevelopmentPaymentGateway;
            }

            // Use SumUp gateway for production
            return new SumUpPaymentGateway;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS scheme when APP_URL is configured with https. This
        // ensures helpers (route(), asset(), generated Wayfinder helpers)
        // produce https:// URLs when running behind an ngrok TLS tunnel.
        if (str_starts_with(config('app.url', ''), 'https://')) {
            URL::forceScheme('https');
        }

        // Dynamically set APP_NAME based on request host
        // We use request() helper safely here; if running in console (e.g. queue worker),
        // request()->getHost() might not return what we expect, but for web requests it works.
        // For console commands, the default config('app.name') (Backstage) usually suffices or
        // one can force it if needed.
        if (! app()->runningInConsole()) {
            $host = request()->getHost();
            $storeDomain = env('STORE_DOMAIN', 'store.danieljm.dpdns.org');

            // Simple check: if host matches the store domain, use Store name.
            // Otherwise default to Backstage name.
            if ($host === $storeDomain || $host === 'store.localhost') {
                config(['app.name' => env('STORE_APP_NAME', 'ESN Leuven')]);
            } else {
                config(['app.name' => env('BACKSTAGE_APP_NAME', 'Leuven Backstage')]);
            }
        }

        // Register observers to propagate non-price updates into saved sales snapshots
        Product::observe(ProductObserver::class);
        Event::observe(EventObserver::class);

        // Explicit Model Binding for 'office' param mapping to OfficeShift model
        \Illuminate\Support\Facades\Route::model('office', \App\Models\OfficeShift::class);

        // EIM: Audit Logging for Authentication
        \Illuminate\Support\Facades\Event::listen(\Illuminate\Auth\Events\Login::class, function ($event) {
            activity('auth')
                ->causedBy($event->user)
                ->event('login')
                ->log('User logged in');
        });

        \Illuminate\Support\Facades\Event::listen(\Illuminate\Auth\Events\Logout::class, function ($event) {
            if ($event->user) {
                activity('auth')
                    ->causedBy($event->user)
                    ->event('logout')
                    ->log('User logged out');
            }
        });
    }
}
