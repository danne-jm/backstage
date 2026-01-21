<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (\Illuminate\Support\Facades\Auth::check()) {
            $user = \Illuminate\Support\Facades\Auth::user();
            $key = 'user-is-online-'.$user->id;

            if (! \Illuminate\Support\Facades\Cache::has($key)) {
                $user->updateQuietly([
                    'last_seen_at' => now(),
                ]);
                // Expires in 2 minutes
                \Illuminate\Support\Facades\Cache::put($key, true, now()->addMinutes(2));
            }
        }

        return $next($request);
    }
}
