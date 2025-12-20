<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use App\Models\Product;
use App\Models\Event;
use App\Observers\ProductObserver;
use App\Observers\EventObserver;

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
    }
}
