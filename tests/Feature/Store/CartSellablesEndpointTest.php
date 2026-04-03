<?php

namespace Tests\Feature\Store;

use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartSellablesEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_only_requested_online_sellable_items(): void
    {
        $now = now();

        $includedProduct = Product::create([
            'name' => 'Included Product',
            'price' => 12,
            'member_price' => 10,
            'price_with_card' => 10,
            'price_without_card' => 12,
            'is_online_sellable' => true,
            'start_sell_date' => $now->copy()->subDay(),
            'end_sell_date' => $now->copy()->addDay(),
        ]);

        $excludedProduct = Product::create([
            'name' => 'Excluded Product',
            'price' => 20,
            'member_price' => 18,
            'price_with_card' => 18,
            'price_without_card' => 20,
            'is_online_sellable' => true,
            'start_sell_date' => $now->copy()->subDay(),
            'end_sell_date' => $now->copy()->addDay(),
        ]);

        $includedEvent = Event::create([
            'name' => 'Included Event',
            'price_with_card' => 8,
            'price_without_card' => 12,
            'is_online_sellable' => true,
            'start_sell_date' => $now->copy()->subDay(),
            'end_sell_date' => $now->copy()->addDay(),
            'event_date' => $now->copy()->addWeek(),
        ]);

        Event::create([
            'name' => 'Not Sellable Event',
            'price_with_card' => 8,
            'price_without_card' => 12,
            'is_online_sellable' => false,
            'start_sell_date' => $now->copy()->subDay(),
            'end_sell_date' => $now->copy()->addDay(),
            'event_date' => $now->copy()->addWeek(),
        ]);

        $response = $this->postJson('http://store.localhost/cart/sellables', [
                'items' => [
                    ['id' => $includedProduct->id, 'type' => 'product'],
                    ['id' => $includedEvent->id, 'type' => 'event'],
                ],
        ]);

        $response->assertOk();

        $returnedIds = collect($response->json('sellables'))->pluck('id')->all();

        $this->assertContains($includedProduct->id, $returnedIds);
        $this->assertContains($includedEvent->id, $returnedIds);
        $this->assertNotContains($excludedProduct->id, $returnedIds);
    }
}
