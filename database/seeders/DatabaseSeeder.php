<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use App\Models\Variant;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permission = Permission::firstOrCreate(['name' => 'admin']);
        $role = Role::firstOrCreate(['name' => 'IT Manager']);
        $role->givePermissionTo($permission);

        $user = User::firstOrCreate(
            ['email' => 'danieljaurell@gmail.com'],
            [
                'first_name' => 'Daniel',
                'last_name' => 'J. Mevorach',
                'password_hash' => Hash::make('xghQ7lIGwEWP+5i28cPG'),
                'gmail_provider_id' => '115724321629363931128',
                'gmail_provider_email' => 'danieljaurell@gmail.com',
                'is_locked' => false,
            ]
        );

        $user->assignRole($role);

        $user2 = User::firstOrCreate(
            ['email' => 'alice.smith@example.com'],
            [
                'first_name' => 'Alice',
                'last_name' => 'Smith',
                'password_hash' => Hash::make('password'),
            ]
        );

        $user3 = User::firstOrCreate(
            ['email' => 'bob.jones@example.com'],
            [
                'first_name' => 'Bob',
                'last_name' => 'Jones',
                'password_hash' => Hash::make('password'),
            ]
        );

        // Seed Events
        $airsoft = Event::firstOrCreate(
            ['name' => 'Airsoft at The Abandoned Factory'],
            [
                'description' => 'Ready to lock and load? The Sports workgroup invites you to a full day of tactical, high-stakes airsoft action at The Abandoned Factory! Whether you\'re a seasoned Milsim operator or a weekend skirmisher, this event is built to test your skills, teamwork, and grit.',
                'event_date' => '2026-05-04 10:00:00',
                'start_sell_date' => '2026-04-30 08:00:00',
                'end_sell_date' => '2026-05-04 10:00:00',
                'price_without_membership' => 26.00,
                'price_with_membership' => 22.00,
                'is_online_sellable' => true,
                'unlimited_quantity' => false,
                'quantity' => 28,
                'responsible_user_ids' => [$user->id, $user2->id],
            ]
        );

        $horseRiding = Event::firstOrCreate(
            ['name' => 'Horse Riding in Sint Joris Weert'],
            [
                'description' => 'Saddle up and join us for a beautiful ride through the nature of Sint Joris Weert.',
                'event_date' => '2026-05-02 14:00:00',
                'start_sell_date' => '2026-04-09 10:00:00',
                'end_sell_date' => '2026-05-01 23:59:00',
                'price_without_membership' => 36.00,
                'price_with_membership' => 30.00,
                'is_online_sellable' => true,
                'unlimited_quantity_with_membership' => false,
                'unlimited_quantity_without_membership' => false,
                'quantity_with_membership' => 20,
                'quantity_without_membership' => 16,
                'responsible_user_ids' => [$user->id, $user3->id],
            ]
        );

        // Seed Products
        $belgianBasket = Product::firstOrCreate(
            ['name' => 'Belgian Basket'],
            [
                'description' => 'Step into the heart of Brussels with a curated collection of Belgium\'s finest chocolate artistry. This luxury hamper features a 500g Leonidas milk chocolate ballotin, filled with creamy pralines and hand-piped ganaches, alongside traditional Jules Destrooper almond cookies for the perfect crunch.',
                'price_without_membership' => 28.00,
                'price_with_membership' => 24.00,
                'price' => 28.00,
                'is_online_sellable' => true,
                'is_variant_based' => true,
                'variants_config' => [
                    ['Type' => 'Milk Chocolate', 'quantity' => 18],
                    ['Type' => 'Dark Chocolate', 'quantity' => 3],
                    ['Type' => 'White Chocolate', 'quantity' => 4],
                ],
                'responsible_user_ids' => [$user->id],
            ]
        );
        $belgianBasket->syncVariants();

        $hoodie = Product::firstOrCreate(
            ['name' => 'ESN Leuven Hoodie'],
            [
                'description' => 'Stylish branding Soft, comfortable, and durable fabric Nice colors Perfect for layering in cooler weather Ideal for casual outings or lounging',
                'price_without_membership' => 36.00,
                'price_with_membership' => 30.00,
                'price' => 36.00,
                'is_online_sellable' => true,
                'is_variant_based' => true,
                'variants_config' => [
                    ['Size' => 'Small', 'Colour' => 'Baby Pink', 'quantity' => null],
                    ['Size' => 'Small', 'Colour' => 'Baby Blue', 'quantity' => null],
                    ['Size' => 'Small', 'Colour' => 'Orange', 'quantity' => null],
                    ['Size' => 'Small', 'Colour' => 'White', 'quantity' => null],
                    ['Size' => 'Small', 'Colour' => 'Black', 'quantity' => null],
                    ['Size' => 'Medium', 'Colour' => 'Baby Pink', 'quantity' => 14],
                    ['Size' => 'Medium', 'Colour' => 'Baby Blue', 'quantity' => 4],
                    ['Size' => 'Medium', 'Colour' => 'Orange', 'quantity' => null],
                    ['Size' => 'Medium', 'Colour' => 'White', 'quantity' => null],
                    ['Size' => 'Medium', 'Colour' => 'Black', 'quantity' => null],
                    ['Size' => 'Large', 'Colour' => 'Baby Pink', 'quantity' => null],
                    ['Size' => 'Large', 'Colour' => 'Baby Blue', 'quantity' => null],
                    ['Size' => 'Large', 'Colour' => 'Orange', 'quantity' => null],
                    ['Size' => 'Large', 'Colour' => 'White', 'quantity' => null],
                    ['Size' => 'Large', 'Colour' => 'Black', 'quantity' => null],
                ],
                'responsible_user_ids' => [$user->id],
            ]
        );
        $hoodie->syncVariants();

        Product::firstOrCreate(
            ['name' => 'ESNcard'],
            [
                'description' => 'The ESNcard, the membership card of the Erasmus Student Network (ESN), provides international students and trainees with access to ESN services and partners, offering discounts on housing, sport, food, bars, and more across Europe.',
                'price_without_membership' => 15.00,
                'price_with_membership' => 15.00,
                'price' => 15.00,
                'is_online_sellable' => true,
                'unlimited_quantity' => false,
                'quantity' => 100,
                'responsible_user_ids' => [$user->id],
            ]
        );

        // Removed default inventory movements (sales/transactions) as per request.
    }
}
