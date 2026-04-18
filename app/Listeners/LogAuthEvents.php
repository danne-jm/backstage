<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;

class LogAuthEvents
{
    public function handleLogin(Login $event): void
    {
        activity('auth')
            ->causedBy($event->user)
            ->withProperties(['ip' => request()->ip(), 'user_agent' => request()->userAgent()])
            ->log('logged in');
    }

    public function handleLogout(Logout $event): void
    {
        if ($event->user) {
            activity('auth')
                ->causedBy($event->user)
                ->withProperties(['ip' => request()->ip()])
                ->log('logged out');
        }
    }

    public function handleFailed(Failed $event): void
    {
        activity('auth')
            ->withProperties([
                'ip'         => request()->ip(),
                'email'      => $event->credentials['email'] ?? null,
                'user_agent' => request()->userAgent(),
            ])
            ->log('login failed');
    }
}
