<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate every backstage route behind one or more permission keys.
 *
 * Usage on a route:
 *   ->middleware('permission:view_inventory')
 *
 * OR logic (any one of the listed keys grants access):
 *   ->middleware('permission:view_dashboard,view_store_manager')
 */
class RequirePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = Auth::user();

        // Should never reach here without auth middleware already passing,
        // but guard defensively.
        if (!$user) {
            abort(403, 'Unauthenticated.');
        }

        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) {
                return $next($request);
            }
        }

        if ($request->expectsJson() || $request->header('X-Inertia')) {
            abort(403, 'Insufficient permissions.');
        }

        abort(403, 'Insufficient permissions.');
    }
}
