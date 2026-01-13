<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
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
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Safely extract quote message and author. Some quotes may not include a dash.
        $rawQuote = Inspiring::quotes()->random();
        $parts = str($rawQuote)->explode('-')->all();
        $message = trim($parts[0] ?? '');
        $author = trim($parts[1] ?? '');

        $user = $request->user();

        // Build a minimal, safe user payload for Inertia so the front-end always
        // receives predictable fields (avoids `undefined` on client-side `.trim()` calls).
        $userPayload = null;
        if ($user) {
            $userPayload = [
                'id' => $user->id,
                'first_name' => $user->first_name ?? null,
                'last_name' => $user->last_name ?? null,
                'name' => (string) ($user->name ?? ''),
                'email' => $user->email ?? null,
                // include permissions (was 'roles') and single role
                'permissions' => $user->permissions ?? null,
                'role' => $user->role ?? null,
                // include pinned footer items so the frontend sidebar can render
                // per-user quick links without relying on ad-hoc page props
                'pinned' => $user->pinned ?? [],
                // Gmail connection status fields (do NOT include refresh_token, it's encrypted and sensitive)
                'gmail_provider_id' => $user->gmail_provider_id ?? null,
                'gmail_provider_email' => $user->gmail_provider_email ?? null,
                // Computed flag: user is connected if they have a provider ID or refresh token stored
                'gmail_connected' => ! empty($user->gmail_provider_id) || ! empty($user->gmail_refresh_token),
            ];
        }

        // Fetch online users (active in last 5 mins), excluding the current user
        $onlineUsers = [];
        if ($user) {
            $onlineUsers = \App\Models\User::query()
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->where('id', '!=', $user->id)
                ->get(['id', 'first_name', 'last_name', 'email'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name, // uses accessor
                        'initials' => strtoupper(substr($u->first_name, 0, 1) . substr($u->last_name, 0, 1)),
                    ];
                });
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => $message, 'author' => $author],
            'auth' => [
                'user' => $userPayload,
            ],
            'onlineUsers' => $onlineUsers,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
