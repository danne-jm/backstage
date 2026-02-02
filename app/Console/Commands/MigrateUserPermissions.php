<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class MigrateUserPermissions extends Command
{
    protected $signature = 'app:migrate-user-permissions';

    protected $description = 'Migrate existing user permissions and roles to Spatie Permission tables';

    public function handle()
    {
        $this->info('Starting migration of User Permissions...');

        // 1. Define Permissions and Role Presets locally (since Enum was removed)
        $allPermissions = [
            'view_dashboard',
            'view_office', 'create_office', 'update_office', 'delete_office',
            'view_sellables', 'create_product', 'update_product', 'delete_product',
            'create_event', 'update_event', 'delete_event',
            'view_event_attendees', 'update_event_attendee',
            'view_inventory', 'create_item', 'update_item', 'delete_item',
            'view_store_manager',
            'view_ticket_distributor', 'view_ticket_scanner', 'import_ticket', 'scan_tickets', 'send_tickets',
            'view_mail_distributor',
            'view_settings_profile', 'update_settings_profile', 'delete_account',
            'view_settings_password', 'update_settings_password',
            'view_settings_appearance',
            'view_settings_google', 'update_settings_google',
            'view_settings_2fa',
            'view_settings_footer', 'update_settings_footer',
            'view_settings_users', 'create_user', 'update_user', 'delete_user',
            'manage_users'
        ];

        $presets = [
            'Administrator' => $allPermissions,
            'Board' => array_diff($allPermissions, [
                'delete_office', 'delete_product', 'delete_event', 'delete_item', 'delete_user',
                'view_settings_users', 'create_user', 'update_user', 'delete_account'
            ]),
            'Guest' => []
        ];

        // Create Permissions
        foreach ($allPermissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        // Create Roles and Assign Permissions
        foreach ($presets as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $this->info("Role ensured: {$roleName}");
            $role->syncPermissions($perms);
        }

        // 2. Assign Roles/Permissions to Users
        $users = User::all();
        $bar = $this->output->createProgressBar($users->count());

        foreach ($users as $user) {
            // Assign Role based on legacy 'role' column
            if (! empty($user->role)) {
                $roleName = $user->role;
                $targetRole = Role::where('name', $roleName)->first();

                if (! $targetRole) {
                    // Map legacy/custom roles
                    $normalized = strtolower($roleName);
                    if ($normalized === 'admin' || $normalized === 'it manager') {
                        $targetRole = Role::where('name', 'Administrator')->first();
                    } elseif ($normalized === 'board' || $normalized === 'president' || str_contains($normalized, 'manager')) {
                        // Managers (Marketing, Finance) usually Board
                        $targetRole = Role::where('name', 'Board')->first();
                    } elseif ($normalized === 'guest') {
                        $targetRole = Role::where('name', 'Guest')->first();
                    }
                }

                if ($targetRole) {
                    $user->assignRole($targetRole);
                } else {
                    $this->warn(" Could not map role '{$roleName}' for user {$user->email}.");
                }
            }

            // Assign Direct Permissions (from legacy_permissions JSON column)
            // This ensures any custom permissions assigned to users are preserved
            if (! empty($user->legacy_permissions) && is_array($user->legacy_permissions)) {
                foreach ($user->legacy_permissions as $permName) {
                    // Check if permission exists (it should, as we created all known ones)
                    // If it's a legacy string not in our list, create it or ignore?
                    // Let's safe create it to preserve data.
                    $perm = Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
                    $user->givePermissionTo($perm);
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('User permissions migrated.');
    }
}
