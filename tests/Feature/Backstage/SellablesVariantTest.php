<?php

namespace Tests\Feature\Backstage;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellablesVariantTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://localhost']);
    }

    public function test_switching_from_variants_to_simple_cap_clears_variants()
    {
        $user = User::factory()->create(['permissions' => ['create_product', 'update_product', 'view_sellables']]);

        // 1. Create product with variants
        $variantsConfig = [
            ['name' => 'Size', 'options' => ['S', 'M', 'L']],
        ];

        $variantsStock = [
            ['options' => ['Size' => 'S'], 'quantity' => '10'],
            ['options' => ['Size' => 'M'], 'quantity' => '20'],
            ['options' => ['Size' => 'L'], 'quantity' => '15'],
        ];

        $this->actingAs($user)
            ->post(route('sellables.products.store'), [
                'name' => 'ESN Hoodie',
                'price' => 25.00,
                'variable_amount' => false,
                'variants_config' => $variantsConfig,
                'variants_stock' => $variantsStock,
            ])
            ->assertRedirect(route('sellables'));

        $product = Product::where('name', 'ESN Hoodie')->first();
        $this->assertNotNull($product);
        $this->assertNotNull($product->variants_config);
        $this->assertCount(3, $product->variants);

        // 2. Switch to simple cap (normal quantity)
        $this->actingAs($user)
            ->put(route('sellables.products.update', $product), [
                'name' => 'ESN Hoodie',
                'price' => 25.00,
                'variable_amount' => false,
                'quantity' => 1, // Set max cap to 1
                'variants_config' => '', // Explicitly clear variants
            ])
            ->assertOk();

        // 3. Verify variants_config is cleared and variants are deleted
        $product->refresh();
        $this->assertNull($product->variants_config, 'variants_config should be null when switching to simple cap');
        $this->assertCount(0, $product->variants, 'All variants should be deleted when switching to simple cap');
        $this->assertEquals(1, $product->quantity);
        $this->assertFalse($product->unlimited_quantity);
    }

    public function test_switching_from_variants_to_variable_amount_clears_variants()
    {
        $user = User::factory()->create(['permissions' => ['create_product', 'update_product', 'view_sellables']]);

        // 1. Create product with variants
        $this->actingAs($user)
            ->post(route('sellables.products.store'), [
                'name' => 'ESN Shirt',
                'price' => 15.00,
                'variable_amount' => false,
                'variants_config' => [
                    ['name' => 'Color', 'options' => ['Red', 'Blue']],
                ],
                'variants_stock' => [
                    ['options' => ['Color' => 'Red'], 'quantity' => '5'],
                    ['options' => ['Color' => 'Blue'], 'quantity' => '10'],
                ],
            ])
            ->assertRedirect(route('sellables'));

        $product = Product::where('name', 'ESN Shirt')->first();
        $this->assertCount(2, $product->variants);

        // 2. Switch to variable amount (ESNcard pricing)
        $this->actingAs($user)
            ->put(route('sellables.products.update', $product), [
                'name' => 'ESN Shirt',
                'price' => 15.00,
                'variable_amount' => true,
                'quantity_with_card' => 20,
                'quantity_without_card' => 10,
                'variants_config' => '', // Explicitly clear variants
            ])
            ->assertOk();

        // 3. Verify variants_config is cleared and variants are deleted
        $product->refresh();
        $this->assertNull($product->variants_config, 'variants_config should be null when switching to variable amount');
        $this->assertCount(0, $product->variants, 'All variants should be deleted when switching to variable amount');
        $this->assertTrue($product->variable_amount);
        $this->assertEquals(20, $product->quantity_with_card);
        $this->assertEquals(10, $product->quantity_without_card);
    }

    public function test_switching_from_simple_cap_to_variants_creates_variants()
    {
        $user = User::factory()->create(['permissions' => ['create_product', 'update_product', 'view_sellables']]);

        // 1. Create product with simple cap
        $this->actingAs($user)
            ->post(route('sellables.products.store'), [
                'name' => 'ESN Cap',
                'price' => 10.00,
                'variable_amount' => false,
                'quantity' => 50,
            ])
            ->assertRedirect(route('sellables'));

        $product = Product::where('name', 'ESN Cap')->first();
        $this->assertNull($product->variants_config);
        $this->assertCount(0, $product->variants);

        // 2. Switch to variants
        $this->actingAs($user)
            ->put(route('sellables.products.update', $product), [
                'name' => 'ESN Cap',
                'price' => 10.00,
                'variable_amount' => false,
                'variants_config' => [
                    ['name' => 'Size', 'options' => ['One Size', 'Large']],
                ],
                'variants_stock' => [
                    ['options' => ['Size' => 'One Size'], 'quantity' => '30'],
                    ['options' => ['Size' => 'Large'], 'quantity' => '20'],
                ],
            ])
            ->assertOk();

        // 3. Verify variants are created and normal quantity is cleared
        $product->refresh();
        $this->assertNotNull($product->variants_config);
        $this->assertCount(2, $product->variants);
        $this->assertNull($product->quantity);
    }

    public function test_online_store_does_not_display_variants_when_switched_to_simple_cap()
    {
        $user = User::factory()->create(['permissions' => ['create_product', 'update_product', 'view_sellables']]);

        // 1. Create product with variants and make it online sellable
        $this->actingAs($user)
            ->post(route('sellables.products.store'), [
                'name' => 'ESN Mug',
                'price' => 8.00,
                'variable_amount' => false,
                'is_online_sellable' => true,
                'variants_config' => [
                    ['name' => 'Color', 'options' => ['White', 'Black']],
                ],
                'variants_stock' => [
                    ['options' => ['Color' => 'White'], 'quantity' => '15'],
                    ['options' => ['Color' => 'Black'], 'quantity' => '10'],
                ],
            ])
            ->assertRedirect(route('sellables'));

        $product = Product::where('name', 'ESN Mug')->first();

        // Verify product shows up in store with variants
        $response = $this->get(route('shop.cart'));
        $sellables = $response->viewData('page')['props']['sellables'];
        $mug = collect($sellables)->firstWhere('name', 'ESN Mug');
        $this->assertNotNull($mug['variants_config']);
        $this->assertNotEmpty($mug['variants']);

        // 2. Switch to simple cap
        $this->actingAs($user)
            ->put(route('sellables.products.update', $product), [
                'name' => 'ESN Mug',
                'price' => 8.00,
                'variable_amount' => false,
                'quantity' => 25,
                'is_online_sellable' => true,
                'variants_config' => '', // Explicitly clear variants
            ])
            ->assertOk();

        // Clear cache to get fresh data
        \Illuminate\Support\Facades\Cache::flush();

        // 3. Verify product shows up in store WITHOUT variants
        $response = $this->get(route('shop.cart'));
        $sellables = $response->viewData('page')['props']['sellables'];
        $mug = collect($sellables)->firstWhere('name', 'ESN Mug');
        $this->assertNull($mug['variants_config'], 'variants_config should be null in store response');
        $this->assertNull($mug['variants'], 'variants should be null in store response');
    }
}
