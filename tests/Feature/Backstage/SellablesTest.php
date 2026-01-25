<?php

namespace Tests\Feature\Backstage;

use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SellablesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://localhost']);
    }

    // --- PRODUCTS ---

    public function test_can_view_sellables_page()
    {
        $user = User::factory()->create(['permissions' => ['view_sellables']]);

        $this->actingAs($user)
            ->get(route('sellables'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Backstage/sellables')
            );
    }

    public function test_can_create_product()
    {
        $user = User::factory()->create(['permissions' => ['create_product', 'view_sellables']]);

        $this->actingAs($user)
            ->post(route('sellables.products.store'), [
                'name' => 'Test Product',
                'price' => 10.50,
                'variable_amount' => false,
                'unlimited_quantity' => true,
            ])
            ->assertRedirect(route('sellables'));

        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'price' => 10.50,
        ]);
    }

    public function test_can_update_product()
    {
        $user = User::factory()->create(['permissions' => ['update_product', 'view_sellables']]);
        $product = Product::factory()->create([
            'name' => 'Old Name',
            'price' => 5.00,
        ]);

        $this->actingAs($user)
            ->put(route('sellables.products.update', $product), [
                'name' => 'New Name',
                'price' => 15.00,
                'variable_amount' => false,
                'unlimited_quantity' => true,
            ])
            ->assertOk(); // Helper says it returns nothing (just updates) or redirects? Check Controller.

        // Controller seems to return nothing on update (void response implicitly 200 OK or similar?)
        // Wait, typical Inertia/Laravel update redirects back.
        // Looking at controller code: `public function updateProduct` ends without return statement?
        // PHP implicitly returns null. Laravel handles this... poorly?
        // Actually, Inertia requests usually expect a redirect.
        // Let's re-read controller code. `updateProduct` does NOT have a return statement.
        // This might arguably be a bug in the controller I need to fix, or it relies on implicit behavior.
        // Let's assume for now it might fail or return 200 blank.
        // I will add a redirect to the controller if needed, but let's test first.

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'New Name',
            'price' => 15.00,
        ]);
    }

    public function test_can_delete_product()
    {
        $user = User::factory()->create(['permissions' => ['delete_product', 'view_sellables']]);
        $product = Product::factory()->create();

        $this->actingAs($user)
            ->delete(route('sellables.products.destroy', $product))
            ->assertRedirect(route('sellables'));

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    // --- EVENTS ---

    public function test_can_create_event()
    {
        $user = User::factory()->create(['permissions' => ['create_event', 'view_sellables']]);
        $responsible = User::factory()->create();

        $this->actingAs($user)
            ->post(route('sellables.events.store'), [
                'name' => 'Test Event',
                'event_date' => now()->addDays(7)->toDateTimeString(),
                'start_sell_date' => now()->subDay()->toDateTimeString(),
                'end_sell_date' => now()->addDay()->toDateTimeString(),
                'price_with_card' => 5.00,
                'price_without_card' => 8.00,
                'variable_amount' => false,
                'unlimited_quantity' => true,
                'responsible_user_id' => $responsible->id,
            ])
            ->assertRedirect(route('sellables'));

        $this->assertDatabaseHas('events', [
            'name' => 'Test Event',
            'price_with_card' => 5.00,
        ]);
    }

    public function test_can_update_event()
    {
        $user = User::factory()->create(['permissions' => ['update_event', 'view_sellables']]);
        $event = Event::factory()->create();
        $responsible = User::factory()->create();

        $this->actingAs($user)
            ->put(route('sellables.events.update', $event), [
                'name' => 'Updated Event',
                'event_date' => now()->addDays(20)->toDateTimeString(),
                'start_sell_date' => now()->addDays(1)->toDateTimeString(),
                'end_sell_date' => now()->addDays(10)->toDateTimeString(),
                'price_with_card' => 10.00,
                'price_without_card' => 15.00,
                'variable_amount' => false,
                'unlimited_quantity' => true,
                'responsible_user_id' => $responsible->id,
            ])
            ->assertOk(); // Same potential issue as product update

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'name' => 'Updated Event',
            'price_with_card' => 10.00,
        ]);
    }

    public function test_can_delete_event()
    {
        $user = User::factory()->create(['permissions' => ['delete_event', 'view_sellables']]);
        $event = Event::factory()->create();

        $this->actingAs($user)
            ->delete(route('sellables.events.destroy', $event))
            ->assertRedirect(route('sellables'));

        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }
}
