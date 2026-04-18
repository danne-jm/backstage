<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnforceLockout
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && $user->is_locked) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json(['message' => 'Your account has been locked.'], 403);
            }

            return redirect()->route('login')->with('error', 'Your account has been locked.');
        }

        return $next($request);
    }
}
