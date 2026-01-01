<?php

namespace App\Enums;

enum UserPermission: string
{
    // Roles / Identity
    case ADMIN = 'admin';
    case BOARD = 'board';
    case GUEST = 'guest';

    // Resources: Dashboard
    case VIEW_DASHBOARD = 'view_dashboard';

    // Resources: Office
    case VIEW_OFFICE = 'view_office';
    case CREATE_OFFICE = 'create_office';
    case UPDATE_OFFICE = 'update_office';
    case DELETE_OFFICE = 'delete_office';

    // Resources: Sellables (Events & Products)
    case VIEW_SELLABLES = 'view_sellables';
    case CREATE_PRODUCT = 'create_product';
    case UPDATE_PRODUCT = 'update_product';
    case DELETE_PRODUCT = 'delete_product';
    case CREATE_EVENT = 'create_event';
    case UPDATE_EVENT = 'update_event';
    case DELETE_EVENT = 'delete_event';

    // Resources: Ticket Scanner
    case VIEW_TICKET_SCANNER = 'view_ticket_scanner';
    case SCAN_TICKETS = 'scan_tickets';

    // Resources: Ticket Distributor
    case VIEW_TICKET_DISTRIBUTOR = 'view_ticket_distributor';
    case SEND_TICKETS = 'send_tickets';

    // Resources: Mail Distributor
    case VIEW_MAIL_DISTRIBUTOR = 'view_mail_distributor';
    case SEND_MAILS = 'send_mails';

    // Resources: Inventory
    case VIEW_INVENTORY = 'view_inventory';
    case CREATE_ITEM = 'create_item';
    case UPDATE_ITEM = 'update_item';
    case DELETE_ITEM = 'delete_item';

    // Resources: Store Manager
    case VIEW_STORE_MANAGER = 'view_store_manager';
    case UPDATE_STORE_SETTINGS = 'update_store_settings';

    // Event Attendees
    case VIEW_EVENT_ATTENDEES = 'view_event_attendees';
    case UPDATE_EVENT_ATTENDEE = 'update_event_attendee';
    
    // Settings
    case VIEW_SETTINGS_PROFILE = 'view_settings_profile';
    case UPDATE_SETTINGS_PROFILE = 'update_settings_profile';
    case DELETE_ACCOUNT = 'delete_account';
    case VIEW_SETTINGS_PASSWORD = 'view_settings_password';
    case UPDATE_SETTINGS_PASSWORD = 'update_settings_password';
    case VIEW_SETTINGS_2FA = 'view_settings_2fa';
    case UPDATE_SETTINGS_2FA = 'update_settings_2fa';
    case VIEW_SETTINGS_GOOGLE = 'view_settings_google';
    case UPDATE_SETTINGS_GOOGLE = 'update_settings_google';
    case VIEW_SETTINGS_APPEARANCE = 'view_settings_appearance';
    case VIEW_SETTINGS_FOOTER = 'view_settings_footer';
    case UPDATE_SETTINGS_FOOTER = 'update_settings_footer';
    case VIEW_SETTINGS_USERS = 'view_settings_users';
    case CREATE_USER = 'create_user';
    case UPDATE_USER = 'update_user';
    case DELETE_USER = 'delete_user';

    // Legacy (Consider deprecating or mapping these)
    case MANAGE_USERS = 'manage_users';

    /**
     * Get all available permissions
     */
    public static function all(): array
    {
        return array_map(fn ($case) => $case->value, self::cases());
    }

    /**
     * Get permission label
     */
    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'System Administrator',
            self::BOARD => 'Board Member',
            self::GUEST => 'Guest User',

            // Dashboard
            self::VIEW_DASHBOARD => 'View Dashboard',

            // Office
            self::VIEW_OFFICE => 'View Office Shifts',
            self::CREATE_OFFICE => 'Create Office Layouts/Shifts',
            self::UPDATE_OFFICE => 'Update Office Shifts',
            self::DELETE_OFFICE => 'Delete Office Shifts',

            // Sellables
            self::VIEW_SELLABLES => 'View Sellables',
            self::CREATE_PRODUCT => 'Create Products',
            self::UPDATE_PRODUCT => 'Update Products',
            self::DELETE_PRODUCT => 'Delete Products',
            self::CREATE_EVENT => 'Create Events',
            self::UPDATE_EVENT => 'Update Events',
            self::DELETE_EVENT => 'Delete Events',

            // Ticket Scanner
            self::VIEW_TICKET_SCANNER => 'View Ticket Scanner',
            self::SCAN_TICKETS => 'Perform Ticket Scans',

            // Ticket Distributor
            self::VIEW_TICKET_DISTRIBUTOR => 'View Ticket Distributor',
            self::SEND_TICKETS => 'Distribute Tickets',

            // Mail Distributor
            self::VIEW_MAIL_DISTRIBUTOR => 'View Mail Distributor',
            self::SEND_MAILS => 'Send Emails',

            // Inventory
            self::VIEW_INVENTORY => 'View Inventory',
            self::CREATE_ITEM => 'Create Inventory Items',
            self::UPDATE_ITEM => 'Update Inventory Items',
            self::DELETE_ITEM => 'Delete Inventory Items',

            // Store Manager
            self::VIEW_STORE_MANAGER => 'Access Store Manager',
            self::UPDATE_STORE_SETTINGS => 'Update Store Settings (Online toggle)',

            // Event Attendees
            self::VIEW_EVENT_ATTENDEES => 'View Event Attendees',
            self::UPDATE_EVENT_ATTENDEE => 'Update Attendee Details',
            
            // Settings
            self::VIEW_SETTINGS_PROFILE => 'View Profile (& Settings Home)',
            self::UPDATE_SETTINGS_PROFILE => 'Update Profile',
            self::DELETE_ACCOUNT => 'Delete Own Account',
            self::VIEW_SETTINGS_PASSWORD => 'View Password Settings',
            self::UPDATE_SETTINGS_PASSWORD => 'Update Password',
            self::VIEW_SETTINGS_2FA => 'View 2FA Settings',
            self::UPDATE_SETTINGS_2FA => 'Update 2FA Settings',
            self::VIEW_SETTINGS_GOOGLE => 'View Google Settings',
            self::UPDATE_SETTINGS_GOOGLE => 'Update Google Settings',
            self::VIEW_SETTINGS_APPEARANCE => 'View Appearance Settings',
            self::VIEW_SETTINGS_FOOTER => 'View Footer Settings',
            self::UPDATE_SETTINGS_FOOTER => 'Update Footer Settings',
            self::VIEW_SETTINGS_USERS => 'View Users',
            self::CREATE_USER => 'Create Users',
            self::UPDATE_USER => 'Update Users',
            self::DELETE_USER => 'Delete Users',

            self::MANAGE_USERS => 'Manage Users (Legacy)',
        };
    }

    /**
     * Get all permissions with labels
     */
    public static function allWithLabels(): array
    {
        return array_map(
            fn ($case) => ['value' => $case->value, 'label' => $case->label()],
            self::cases()
        );
    }

    /**
     * Define Pre-configured Role Presets
     */
    public static function rolePresets(): array
    {
        return [
            'Administrator' => [
                self::ADMIN->value,
                self::MANAGE_USERS->value,
                self::VIEW_DASHBOARD->value,
                self::VIEW_OFFICE->value, self::CREATE_OFFICE->value, self::UPDATE_OFFICE->value, self::DELETE_OFFICE->value,
                self::VIEW_SELLABLES->value, self::CREATE_PRODUCT->value, self::UPDATE_PRODUCT->value, self::DELETE_PRODUCT->value,
                self::CREATE_EVENT->value, self::UPDATE_EVENT->value, self::DELETE_EVENT->value,
                self::VIEW_EVENT_ATTENDEES->value, self::UPDATE_EVENT_ATTENDEE->value,
                self::VIEW_INVENTORY->value, self::CREATE_ITEM->value, self::UPDATE_ITEM->value, self::DELETE_ITEM->value,
                self::VIEW_STORE_MANAGER->value, self::UPDATE_STORE_SETTINGS->value,
                self::VIEW_TICKET_SCANNER->value, self::SCAN_TICKETS->value,
                self::VIEW_TICKET_DISTRIBUTOR->value, self::SEND_TICKETS->value,
                self::VIEW_MAIL_DISTRIBUTOR->value, self::SEND_MAILS->value,
                self::VIEW_SETTINGS_PROFILE->value, self::UPDATE_SETTINGS_PROFILE->value, self::DELETE_ACCOUNT->value,
                self::VIEW_SETTINGS_PASSWORD->value, self::UPDATE_SETTINGS_PASSWORD->value,
                self::VIEW_SETTINGS_2FA->value, self::UPDATE_SETTINGS_2FA->value,
                self::VIEW_SETTINGS_GOOGLE->value, self::UPDATE_SETTINGS_GOOGLE->value,
                self::VIEW_SETTINGS_APPEARANCE->value,
                self::VIEW_SETTINGS_FOOTER->value, self::UPDATE_SETTINGS_FOOTER->value,
                self::VIEW_SETTINGS_USERS->value, self::CREATE_USER->value, self::UPDATE_USER->value, self::DELETE_USER->value,
            ],
            'Board' => [
                self::BOARD->value,
                self::VIEW_DASHBOARD->value,
                self::VIEW_OFFICE->value,
                self::VIEW_SELLABLES->value,
                self::VIEW_EVENT_ATTENDEES->value,
                self::VIEW_INVENTORY->value,
                self::VIEW_STORE_MANAGER->value,
                self::VIEW_TICKET_SCANNER->value,
                self::VIEW_TICKET_DISTRIBUTOR->value,
                self::VIEW_MAIL_DISTRIBUTOR->value,
                self::VIEW_SETTINGS_PROFILE->value,
                self::VIEW_SETTINGS_PASSWORD->value,
                self::VIEW_SETTINGS_APPEARANCE->value,
            ],
            'Guest' => [
                self::GUEST->value,
                // No default view permissions for guest, they must be added manually
            ],
        ];
    }
}
