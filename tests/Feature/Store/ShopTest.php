<?php

namespace Tests\Feature\Store;

use App\Models\Event;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class ShopTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Force store domain for these tests
        config(['app.url' => 'http://store.localhost']);
    }

    public function test_shop_index_can_be_rendered()
    {
        $this->get('http://store.localhost/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/home')
            );
    }

    public function test_products_are_visible_on_shop_index()
    {
        Product::factory()->create([
            'name' => 'Test Product',
            'is_online_sellable' => true,
            'quantity' => 10,
        ]);

        $this->get('http://store.localhost/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/home')
                ->has('sellables', 1)
                ->where('sellables.0.name', 'Test Product')
            );
    }

    public function test_events_are_visible_on_shop_index()
    {
        $user = \App\Models\User::factory()->create();
        Event::factory()->create([
            'name' => 'Test Event',
            'is_online_sellable' => true,
            'quantity' => 10,
            'event_date' => now()->addDays(5),
            'start_sell_date' => now()->subDay(),
            'end_sell_date' => now()->addDay(),
            'responsible_user_id' => $user->id,
        ]);

        $this->get('http://store.localhost/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/home')
                ->has('sellables', 1)
                ->where('sellables.0.name', 'Test Event')
            );
    }

    public function test_cart_page_can_be_rendered()
    {
        $this->get('http://store.localhost/cart')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/cart')
            );
    }
}
