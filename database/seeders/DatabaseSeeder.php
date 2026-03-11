<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
    #php artisan db:seed
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'first_name' => 'Daniel',
            'last_name' => 'Jaurell Mevorach',
            'email' => 'it@esnleuven.be',
            'email_verified_at' => now(),
            'password_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'remember_token' => null,
            'gmail_refresh_token' => null,
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'pinned' => json_decode('[{"href": "https://mail.google.com/", "icon": "Mail", "title": "Gmail"}, {"href": "https://drive.google.com/", "icon": "Container", "title": "Google Drive"}, {"href": "https://www.esnleuven.be/", "icon": "Globe", "title": "ESN Leuven Website"}, {"href": "https://esn-leuven.sumupstore.com/", "icon": "ShoppingBag", "title": "ESN Leuven Store"}, {"href": "https://linktr.ee/esnleuven", "icon": "TreeDeciduous", "title": "Linktree"}]', true),
            'role' => 'IT Manager',
            'attributes' => ['permissions' => ['admin']],
            'created_at' => now(),
            'updated_at' => now(),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        \App\Models\sellables\Product::create([
            'name' => 'ESNcard',
            'description' => 'The membership card for the Erasmus Generation...',
            'price' => 15.00,
            'member_price' => 15.00,
            'is_online_sellable' => true,
            'quantity' => 100,
        ]);

        \App\Models\sellables\Product::create([
            'name' => 'ESN Hoodie',
            'description' => 'Stylish and comfortable branding',
            'price' => 36.00,
            'member_price' => 36.00,
            'is_online_sellable' => true,
        ]);

        \App\Models\sellables\Event::create([
            'name' => 'Horse Riding in Sint Joris Weert',
            'description' => 'Join us for a beautiful ride...',
            'price_with_card' => 30.00,
            'price_without_card' => 36.00,
            'start_sell_date' => now()->subDays(1),
            'end_sell_date' => now()->addDays(5),
            'is_online_sellable' => true,
        ]);

        \App\Models\sellables\Event::create([
            'name' => 'Enchanted Garden Gala',
            'description' => 'The most magical night of the year...',
            'price_with_card' => 6.00,
            'price_without_card' => 10.00,
            'start_sell_date' => now(),
            'end_sell_date' => now()->addDays(61),
            'is_online_sellable' => true,
        ]);
    }
}
