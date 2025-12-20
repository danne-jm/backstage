<?php

namespace App\Enums;

enum UserPermission: string
{
    case ADMIN = 'admin';
    case BOARD = 'board';
    case GUEST = 'guest';
    case MANAGE_EVENTS = 'manage_events';
    case MANAGE_TICKETS = 'manage_tickets';
    case MANAGE_INVENTORY = 'manage_inventory';
    case MANAGE_SALES = 'manage_sales';
    case SCAN_TICKETS = 'scan_tickets';
    case VIEW_REPORTS = 'view_reports';

    /**
     * Get all available permissions
     */
    public static function all(): array
    {
        return array_map(fn($case) => $case->value, self::cases());
    }

    /**
     * Get permission label
     */
    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Administrator',
            self::BOARD => 'Board Member',
            self::GUEST => 'Guest',
            self::MANAGE_EVENTS => 'Manage Events',
            self::MANAGE_TICKETS => 'Manage Tickets',
            self::MANAGE_INVENTORY => 'Manage Inventory',
            self::MANAGE_SALES => 'Manage Sales',
            self::SCAN_TICKETS => 'Scan Tickets',
            self::VIEW_REPORTS => 'View Reports',
        };
    }

    /**
     * Get all permissions with labels
     */
    public static function allWithLabels(): array
    {
        return array_map(
            fn($case) => ['value' => $case->value, 'label' => $case->label()],
            self::cases()
        );
    }
    /**
     * Define Pre-configured Role Presets
     */
    public static function rolePresets(): array
    {
        return [
            'Admin' => [
                self::ADMIN->value,
                self::MANAGE_EVENTS->value,
                self::MANAGE_TICKETS->value,
                self::MANAGE_INVENTORY->value,
                self::MANAGE_SALES->value,
                self::SCAN_TICKETS->value,
                self::VIEW_REPORTS->value,
            ],
            'Board' => [
                self::BOARD->value,
                self::MANAGE_EVENTS->value,
                self::MANAGE_TICKETS->value,
                self::SCAN_TICKETS->value,
                self::VIEW_REPORTS->value,
            ],
            'Guest' => [
                self::GUEST->value,
            ],
        ];
    }
}
