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
        
        // Administrator
        'administrator' => [
            // Dashboard
            'view_dashboard',
            
            // Office
            'view_office', 'create_office', 'update_office', 'delete_office',

            // Sellables
            'view_sellables',
            'create_product', 'update_product', 'delete_product',
            'create_event', 'update_event', 'delete_event',
            'view_event_attendees', 'update_event_attendee',

            // Warehouse
            'view_inventory',
            'create_item', 'update_item', 'delete_item',

            // Store Manager
            'view_store_manager',

            // Ticketing & Distribution
            'view_ticket_distributor', 'view_ticket_scanner', 'send_tickets', 'view_mail_distributor',

            // Settings - Profile
            'view_settings_profile', 'update_settings_profile', 'delete_account',
            'view_settings_password', 'update_settings_password',
            'view_settings_appearance',
            'update_settings_footer', 'view_settings_footer',

            // Settings - Integrations
            'view_settings_google', 'update_settings_google',
            'view_settings_2fa',

            // Settings - User Management
            'view_settings_users', 'create_user', 'update_user', 'delete_user',
        ],

        // Board members have access to all management features except dangerous settings
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

             // Settings - Board can view profile/password/appearance/footer/google/2fa
             'view_settings_profile', 'update_settings_profile',
             'view_settings_password', 'update_settings_password',
             'view_settings_appearance',
             'update_settings_footer', 'view_settings_footer',
             'view_settings_google', 'update_settings_google',
             'view_settings_2fa',
             
             // Board typically cannot manage users or delete accounts
        ],

        // Guest level is empty/basic by default, usually customizable per user
        'guest' => [],
    ],
];
