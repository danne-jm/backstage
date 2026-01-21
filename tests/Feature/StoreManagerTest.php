<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreManagerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_counts_online_sellables_correctly()
    {
        $admin = User::factory()->create(['permissions' => ['admin', 'view_store_manager']]);

        // 1. Valid Product (Online)
        Product::create([
            'name' => 'Valid Product',
            'price' => 10,
            'is_online_sellable' => true,
        ]);

        // 2. Valid Future Event (Online)
        Event::create([
            'name' => 'Future Event',
            'event_date' => now()->addDays(10),
            'start_sell_date' => now()->subDays(1),
            'end_sell_date' => now()->addDays(5),
            'is_online_sellable' => true,
            'price_with_card' => 10,
            'price_without_card' => 15,
            'responsible_user_id' => $admin->id,
        ]);

        // 3. Expired Event: Past event_date (Online)
        Event::create([
            'name' => 'Past Event',
            'event_date' => now()->subDays(1),
            'start_sell_date' => now()->subDays(10),
            'end_sell_date' => now()->subDays(1), // Also past sell date
            'is_online_sellable' => true,
            'price_with_card' => 10,
            'price_without_card' => 15,
            'responsible_user_id' => $admin->id,
        ]);

        // 4. Expired Event: Future event_date but Past end_sell_date (Online)
        Event::create([
            'name' => 'Sales Ended Event',
            'event_date' => now()->addDays(10),
            'start_sell_date' => now()->subDays(10),
            'end_sell_date' => now()->subDays(1),
            'is_online_sellable' => true,
            'price_with_card' => 10,
            'price_without_card' => 15,
            'responsible_user_id' => $admin->id,
        ]);

        // 5. Offline Product
        Product::create([
            'name' => 'Offline Product',
            'price' => 10,
            'is_online_sellable' => false,
        ]);

        $response = $this->actingAs($admin)
            ->getJson(route('store-manager.data'));

        $response->assertOk();

        // Current broken behavior would return 4 (3 events + 1 product)
        // Correct behavior should return 2 (1 product + 1 future event)
        $count = $response->json('onlineSellablesCount');

        // We assert 2 to verifying the failing state initially if it returns 4,
        // OR we can just print it. Let's assert 2 so we know when it passes.
        $this->assertEquals(2, $count, "Expected 2 sellables, got {$count}");
    }
}
