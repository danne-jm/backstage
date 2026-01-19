<?php

use Illuminate\Support\Facades\Broadcast;

/**
 * Presence channel for online users.
 * Returns user data that will be visible to other presence channel members.
 */
Broadcast::channel('presence.users', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'initials' => strtoupper(substr($user->first_name ?? '', 0, 1).substr($user->last_name ?? '', 0, 1)),
    ];
});
