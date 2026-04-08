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
        $storeDomain = config('services.store.domain');
        $host = $request->getHost();

        if ($host === $storeDomain || $host === 'store.localhost') {
            return 'store';
        }

        return 'backstage';
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
        $storeDomain = config('services.store.domain');
        $host = $request->getHost();
        $isStoreDomain = $host === $storeDomain || $host === 'store.localhost';

        if ($isStoreDomain) {
            $footer = config('app.footer');
            return [
                ...parent::share($request),
                'name' => config('app.name'),
                'flash' => [
                    'success' => $request->session()->get('success'),
                    'error' => $request->session()->get('error'),
                ],
                'footer' => [
                    'linktree_url' => $footer['linktree_url'] ?? null,
                    'instagram_url' => $footer['instagram_url'] ?? null,
                    'facebook_url' => $footer['facebook_url'] ?? null,
                    'website_url' => $footer['website_url'] ?? null,
                    'tiktok_url' => $footer['tiktok_url'] ?? null,
                    'copyright' => $footer['copyright'] ?? config('app.name'),
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
