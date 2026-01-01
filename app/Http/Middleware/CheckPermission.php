<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthorized');
        }

        $userPermissions = $user->permissions ?? [];

        // Admin override
        if (in_array('admin', $userPermissions)) {
            return $next($request);
        }

        // Specific permission check
        if (in_array($permission, $userPermissions)) {
            return $next($request);
        }

        abort(403, 'Unauthorized');
    }
}
