<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed users from provided static array
        $users = [
            [
                'id' => 1,
                'first_name' => 'Daniel',
                'last_name' => 'Jaurell Mevorach',
                'email' => 'it@esnleuven.be',
                'email_verified_at' => '2025-12-22 20:48:24',
                'password_hash' => '$2y$12$QU7WEJ2yFZ4TmJIhkt.oUu0lmjX.nsHklygZaSG7ZS97NNZ5Znl5q',
                'remember_token' => 't4Anw2ZbtHrwxNWb4wWSekbsKckLnF7B3aeeCoBffnck00DbYVTwC1uc384p',
                'gmail_refresh_token' => 'eyJpdiI6InY4NTFVblZyMS9tcWwvalJCbExUbEE9PSIsInZhbHVlIjoiSmtaazFFVWVnUE04NFJkMWFXSTJ2MHJqcTQwNmkxTnV1RGovbUpIeTBrZTU2cThvZmRlUUt2bE0zcmZ2VWFQQ1NjTWRzZE4xdlVHRTM4NUJxb3h5OWJPWUNXUmJteEw4YVQzajBWWGI1RmF5NkhZdWUwRnp1U0dFckh3dVhyRGdpMzJ5NjBITmhWU1ZxUThGUFNXblBDT0NGQ3ZFS0M1RU9tajNpdTlVQ0pnPSIsIm1hYyI6Ijg0ZTMzODE0MGIyZDM5ZmVlMjA4NmRiMWE1M2Q5ZWNhZTNhNzY4ZGE5YTAyZjU3NzQzM2VlZTkxYTk5NDVhMzUiLCJ0YWciOiIifQ==',
                'gmail_provider_id' => '115724321629363931128',
                'gmail_provider_email' => 'danieljaurell@gmail.com',
                'permissions' => '["admin", "view_dashboard", "manage_users", "manage_events", "manage_tickets", "manage_inventory", "manage_sales", "scan_tickets", "view_reports"]',
                'pinned' => '[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]',
                'role' => 'IT Manager',
                'created_at' => '2025-12-22 20:48:25',
                'updated_at' => '2025-12-23 00:53:26',
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ],
            [
                'id' => 2,
                'first_name' => 'Debargha',
                'last_name' => 'Chakravorty',
                'email' => 'president@esnleuven.be',
                'email_verified_at' => null,
                'password_hash' => '$2y$12$hcWG.i3IHBXVfYKXPifa7.OoRZ/P7Z9EtjzhcTRhmZMX0XvF6079u',
                'remember_token' => null,
                'gmail_refresh_token' => null,
                'gmail_provider_id' => null,
                'gmail_provider_email' => null,
                'permissions' => '["admin", "view_dashboard", "manage_users", "manage_events", "manage_tickets", "manage_inventory", "manage_sales", "scan_tickets", "view_reports"]',
                'pinned' => '[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]',
                'role' => 'President',
                'created_at' => '2025-12-22 23:27:03',
                'updated_at' => '2025-12-22 23:27:03',
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ],
            [
                'id' => 3,
                'first_name' => 'Ammani',
                'last_name' => 'Ali Khan',
                'email' => 'marketing@esnleuven.be',
                'email_verified_at' => null,
                'password_hash' => '$2y$12$HcwGnBLmVKm7e.Uf2t1sIO3Oy.iynQxwdlio9OXTML1vVE09fR4GC',
                'remember_token' => null,
                'gmail_refresh_token' => null,
                'gmail_provider_id' => null,
                'gmail_provider_email' => null,
                'permissions' => '["board", "view_dashboard", "manage_events", "manage_tickets", "scan_tickets", "view_reports"]',
                'pinned' => '[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]',
                'role' => 'Marketing Manager',
                'created_at' => '2025-12-23 00:44:34',
                'updated_at' => '2025-12-23 00:44:34',
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ],
            [
                'id' => 4,
                'first_name' => 'Kaat',
                'last_name' => 'Janssen',
                'email' => 'finance@esnleuven.be',
                'email_verified_at' => null,
                'password_hash' => '$2y$12$.9zbrmM99jLHZdd2pknApuldYzFMKGI9899L0iRq..xbUKhCWuMuS',
                'remember_token' => null,
                'gmail_refresh_token' => null,
                'gmail_provider_id' => null,
                'gmail_provider_email' => null,
                'permissions' => '["board", "view_dashboard", "manage_events", "manage_tickets", "scan_tickets", "view_reports"]',
                'pinned' => '[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]',
                'role' => 'Finance Manager',
                'created_at' => '2025-12-23 10:47:34',
                'updated_at' => '2025-12-23 10:47:46',
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ],
        ];
        User::upsert($users, ['id'], array_keys($users[0]));

        // Populate products and events used by the Office UI
        $this->call([
            ProductSeeder::class,
            EventSeeder::class,
            MailTemplateSeeder::class,
            \Database\Seeders\EventTicketsSeeder::class,
            \Database\Seeders\SalesSeeder::class,
        ]);
    }
}
