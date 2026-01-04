<?php

namespace App\Providers;

use App\Models\Event;
use App\Models\Product;
use App\Observers\EventObserver;
use App\Observers\ProductObserver;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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

        // Register observers to propagate non-price updates into saved sales snapshots
        Product::observe(ProductObserver::class);
        Event::observe(EventObserver::class);

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
