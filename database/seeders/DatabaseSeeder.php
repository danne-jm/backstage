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
        // User::factory(10)->create();

        User::updateOrCreate(['email' => 'it@esnleuven.be'], [
            'first_name' => 'Daniel',
            'last_name' => 'J. Mevorach',
            'email_verified_at' => now(),
            'password_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'remember_token' => null,
            'gmail_refresh_token' => null,
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'pinned' => json_decode('[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]', true),
            'role' => 'IT Manager',
            'attributes' => ['permissions' => ['admin']],
            'updated_at' => now(),
        ]);

        User::updateOrCreate(['email' => 'president@esnleuven.be'], [
            'first_name' => 'Debargha',
            'last_name' => 'Chakravorty',
            'email_verified_at' => now(),
            'password_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'remember_token' => null,
            'gmail_refresh_token' => null,
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'pinned' => json_decode('[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]', true),
            'role' => 'President',
            'attributes' => ['permissions' => ['admin']],
            'updated_at' => now(),
        ]);

        User::updateOrCreate(['email' => 'finance@esnleuven.be'], [
            'first_name' => 'Kaat',
            'last_name' => 'Janssen',
            'email_verified_at' => now(),
            'password_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'remember_token' => null,
            'gmail_refresh_token' => null,
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'pinned' => json_decode('[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]', true),
            'role' => 'Finance',
            'attributes' => ['permissions' => ['board']],
            'updated_at' => now(),
        ]);

        User::updateOrCreate(['email' => 'secretary@esnleuven.be'], [
            'first_name' => 'Alberto',
            'last_name' => 'Binetti',
            'email_verified_at' => now(),
            'password_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'remember_token' => null,
            'gmail_refresh_token' => null,
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'pinned' => json_decode('[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]', true),
            'role' => 'Finance',
            'attributes' => ['permissions' => ['board']],
            'updated_at' => now(),
        ]);

        $this->call(SellablesSnapshotSeeder::class);
    }
}
