<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the root view based on the request domain.
     * Store domain → shop.blade.php, Backstage domain → app.blade.php.
     */
    public function rootView(Request $request): string
    {
        $storeDomain = env('STORE_DOMAIN', 'store.localhost');
        $host = $request->getHost();

        if ($host === $storeDomain || $host === 'store.localhost') {
            return 'shop';
        }

        return 'app';
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * Store domain gets a minimal, public-safe payload (no auth data).
     * Backstage domain gets the full admin payload.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $storeDomain = env('STORE_DOMAIN', 'store.localhost');
        $host = $request->getHost();
        $isStoreDomain = $host === $storeDomain || $host === 'store.localhost';

        if ($isStoreDomain) {
            return [
                ...parent::share($request),
                'name' => config('app.name'),
                'flash' => [
                    'success' => $request->session()->get('success'),
                    'error' => $request->session()->get('error'),
                ],
                'footer' => [
                    'linktree_url' => env('LINKTREE_URL'),
                    'instagram_url' => env('INSTAGRAM_URL'),
                    'facebook_url' => env('FACEBOOK_URL'),
                    'website_url' => env('WEBSITE_URL'),
                    'tiktok_url' => env('TIKTOK_URL'),
                    'copyright' => env('COPYRIGHT', config('app.name')),
                ],
            ];
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
