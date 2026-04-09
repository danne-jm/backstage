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

        \App\Models\sellables\Product::updateOrCreate(['name' => 'ESNcard'], [
            'description' => 'The ESNcard, the membership card of the Erasmus Student Network (ESN), provides international students and trainees with access to ESN services and partners, offering discounts on housing, sport, food, bars, and more across Europe. It also allows participation in numerous events with various ESN sections during their time abroad.',
            'price' => 15.00,
            'member_price' => 15.00,
            'is_online_sellable' => true,
            'quantity' => 100,
        ]);

        \App\Models\sellables\Product::updateOrCreate(['name' => 'ESN Hoodie'], [
            'description' => 'Stylish branding Soft, comfortable, and durable fabric Nice colors Perfect for layering in cooler weather Ideal for casual outings or lounging',
            'price' => 36.00,
            'member_price' => 36.00,
            'is_online_sellable' => true,
            'is_variant_based' => true,
        ]);

        \App\Models\sellables\Event::updateOrCreate(['name' => 'Horse Riding in Sint Joris Weert'], [
            'description' => 'The ESNcard, the membership card of the Erasmus Student Network (ESN), provides international students and trainees with access to ESN services and partners, offering discounts on housing, sport, food, bars, and more across Europe. It also allows participation in numerous events with various ESN sections during their time abroad.',
            'price_with_card' => 30.00,
            'price_without_card' => 36.00,
            'start_sell_date' => now()->subDays(1),
            'end_sell_date' => now()->addDays(5),
            'is_online_sellable' => true,
        ]);

        \App\Models\sellables\Event::updateOrCreate(['name' => 'Enchanted Garden Gala'], [
            'description' => 'The ESNcard, the membership card of the Erasmus Student Network (ESN), provides international students and trainees with access to ESN services and partners, offering discounts on housing, sport, food, bars, and more across Europe. It also allows participation in numerous events with various ESN sections during their time abroad.',
            'price_with_card' => 6.00,
            'price_without_card' => 10.00,
            'start_sell_date' => now(),
            'end_sell_date' => now()->addDays(61),
            'is_online_sellable' => true,
        ]);
    }
}
