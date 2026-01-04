<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Permission Levels
    |--------------------------------------------------------------------------
    |
    | Here you may define "Permission Levels" which are essentially groups or
    | roles that expand into a specific set of granular permissions.
    |
    | When a user has one of these keys in their `permissions` array,
    | the system will automatically treat them as having all the permissions
    | listed in the corresponding array below.
    |
    */

    'levels' => [
        
        // Administrator has the magic 'admin' permission which bypasses all checks
        'administrator' => [
            'admin',
        ],

        // Board members have access to all management features
        'board' => [
            'view_dashboard',
            
            // Office
            'view_office',
            'create_office',
            'update_office',
            'delete_office',

            // Sellables (Products & Events)
            'view_sellables',
            'create_product',
            'update_product',
            'delete_product',
            'create_event',
            'update_event',
            'delete_event',
            'view_event_attendees',
            'update_event_attendee',

            // Warehouse / Inventory
            'view_inventory',
            'create_item',
            'update_item',
            'delete_item',

            // Store Manager
            'view_store_manager',

            // Ticketing & Distribution
            'view_ticket_distributor',
            'view_ticket_scanner',
            'send_tickets',
            'view_mail_distributor',
        ],

        // Guest level is empty/basic by default, usually customizable per user
        'guest' => [],
    ],
];
