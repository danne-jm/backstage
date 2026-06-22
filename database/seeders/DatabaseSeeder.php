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

        $permission = Permission::create(['name' => 'admin']);
        $role = Role::create(['name' => 'IT Manager']);
        $role->givePermissionTo($permission);

        $user = User::create([
            'first_name' => 'Daniel',
            'last_name' => 'J. M',
            'email' => 'danieljaurell@gmail.com',
            'password_hash' => Hash::make('xghQ7lIGwEWP+5i28cPG'),
        ]);

        $user->assignRole($role);

        // Seed Events
        $airsoft = Event::create([
            'name' => 'Airsoft at The Abandoned Factory',
            'description' => 'Ready to lock and load? The Sports workgroup invites you to a full day of tactical, high-stakes airsoft action at The Abandoned Factory! Whether you\'re a seasoned Milsim operator or a weekend skirmisher, this event is built to test your skills, teamwork, and grit.',
            'event_date' => '2026-05-04 10:00:00',
            'start_sell_date' => '2026-04-30 08:00:00',
            'end_sell_date' => '2026-05-04 10:00:00',
            'price_without_membership' => 26.00,
            'price_with_membership' => 22.00,
            'is_online_sellable' => true,
            'unlimited_quantity' => false,
            'quantity' => 28,
            'responsible_user_ids' => [$user->id],
        ]);

        $horseRiding = Event::create([
            'name' => 'Horse Riding in Sint Joris Weert',
            'description' => 'The ESNcard, the membership card of the Erasmus Student Network (ESN), provides international students and trainees with access to ESN services and partners, offering discounts on housing, sport, food, bars, and more across Europe. It also allows participation in numerous events with various ESN sections during their time abroad.',
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
            'responsible_user_ids' => [$user->id],
        ]);

        // Seed Products
        $belgianBasket = Product::create([
            'name' => 'Belgian Basket',
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
        ]);

        $hoodie = Product::create([
            'name' => 'ESN Leuven Hoodie',
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
        ]);

        Product::create([
            'name' => 'ESNcard',
            'description' => 'The ESNcard, the membership card of the Erasmus Student Network (ESN), provides international students and trainees with access to ESN services and partners, offering discounts on housing, sport, food, bars, and more across Europe.',
            'price_without_membership' => 15.00,
            'price_with_membership' => 15.00,
            'price' => 15.00,
            'is_online_sellable' => true,
            'unlimited_quantity' => false,
            'quantity' => 100,
        ]);

        // Create Variant records for variant-based products
        $milkVariant = Variant::create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $belgianBasket->id,
            'options' => ['Type' => 'Milk Chocolate'],
            'quantity' => 18,
        ]);
        $darkVariant = Variant::create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $belgianBasket->id,
            'options' => ['Type' => 'Dark Chocolate'],
            'quantity' => 3,
        ]);
        Variant::create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $belgianBasket->id,
            'options' => ['Type' => 'White Chocolate'],
            'quantity' => 4,
        ]);

        $medPinkVariant = Variant::create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $hoodie->id,
            'options' => ['Size' => 'Medium', 'Colour' => 'Baby Pink'],
            'quantity' => 14,
        ]);
        $medBlueVariant = Variant::create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $hoodie->id,
            'options' => ['Size' => 'Medium', 'Colour' => 'Baby Blue'],
            'quantity' => 4,
        ]);

        // Seed inventory movements to simulate sales
        $movements = [
            // Airsoft: 4 sold total
            ['purchasable_type' => Event::class, 'purchasable_id' => $airsoft->id, 'type' => 'sale', 'quantity' => -4, 'ticket_type' => null],
            // Horse Riding: 2 sold with membership
            ['purchasable_type' => Event::class, 'purchasable_id' => $horseRiding->id, 'type' => 'sale', 'quantity' => -2, 'ticket_type' => 'with_membership'],
            // Belgian Basket: 1 milk + 1 dark sold
            ['purchasable_type' => Product::class, 'purchasable_id' => $belgianBasket->id, 'type' => 'sale', 'quantity' => -1, 'ticket_type' => null, 'variant_id' => $milkVariant->id],
            ['purchasable_type' => Product::class, 'purchasable_id' => $belgianBasket->id, 'type' => 'sale', 'quantity' => -1, 'ticket_type' => null, 'variant_id' => $darkVariant->id],
            // Hoodie: 1 Medium Baby Pink, 1 Medium Baby Blue sold
            ['purchasable_type' => Product::class, 'purchasable_id' => $hoodie->id, 'type' => 'sale', 'quantity' => -1, 'ticket_type' => null, 'variant_id' => $medPinkVariant->id],
            ['purchasable_type' => Product::class, 'purchasable_id' => $hoodie->id, 'type' => 'sale', 'quantity' => -1, 'ticket_type' => null, 'variant_id' => $medBlueVariant->id],
        ];

        foreach ($movements as $m) {
            InventoryMovement::create($m);
        }
    }
}
