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

Broadcast::channel('inventory', function ($user) {
    return $user->hasPermission('view_inventory') || $user->hasPermission('admin');
});

Broadcast::channel('tickets.{eventId}', function ($user, $eventId) {
    return $user->hasPermission('scan_tickets') || $user->hasPermission('admin');
});

Broadcast::channel('store-stats', function ($user) {
    return $user->hasPermission('view_store_manager') || $user->hasPermission('admin');
});

Broadcast::channel('office.{officeId}', function ($user, $officeId) {
    return $user->hasPermission('sell_tickets') || $user->hasPermission('admin');
});
