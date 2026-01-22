<?php

namespace Tests\Feature\Store;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://store.localhost']);
    }

    public function test_validate_cart_endpoint_returns_valid_items()
    {
        $product = Product::factory()->create([
            'name' => 'Test Product',
            'price' => 10.00,
            'member_price' => 8.00,
            'is_online_sellable' => true,
            'quantity' => 100
        ]);

        $cart = [
            [
                'id' => $product->id,
                'quantity' => 2,
                'type' => 'product'
            ]
        ];

        $response = $this->postJson('http://store.localhost/validate-cart', [
            'items' => $cart
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'units',
                'total_final',
                'total_original'
            ]);
    }

    public function test_validate_cart_returns_empty_allocation_for_invalid_items()
    {
        $response = $this->postJson('http://store.localhost/validate-cart', [
            'items' => [
                ['id' => 9999, 'quantity' => 1, 'type' => 'product']
            ]
        ]);

        $response->assertStatus(200); 
    }

    public function test_validate_cart_calculates_prices_correctly()
    {
        $product = Product::factory()->create([
            'price' => 10.00,
            'is_online_sellable' => true
        ]);

        $response = $this->postJson('http://store.localhost/validate-cart', [
            'items' => [
                ['id' => $product->id, 'quantity' => 5, 'type' => 'product']
            ]
        ]);

        $response->assertOk()
            ->assertJsonPath('total_final', 50); 
    }
}
