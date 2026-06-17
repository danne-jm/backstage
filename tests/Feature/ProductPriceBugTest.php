<?php
namespace Tests\Feature;
use App\Models\sellables\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductPriceBugTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_price_update()
    {
        $user = User::factory()->withAllPermissions()->create(['email' => 'admin@example.com']);
        $product = Product::create([
            'name' => 'Tshirt',
            'price' => 15,
            'price_with_card' => 10,
            'price_without_card' => 15,
            'variable_amount' => false,
            'quantity' => null,
            'unlimited_quantity' => true,
        ]);

        $this->actingAs($user)->put("/sellables/products/{$product->id}", [
            'name' => 'Tshirt',
            'price' => 15,
            'price_with_card' => 10,
            'price_without_card' => 15,
            'variable_amount' => false,
            'unlimited_quantity' => true,
            'is_variant_based' => false,
            'is_online_sellable' => true,
        ])->assertStatus(302);

        $product->refresh();
        $this->assertEquals(10, $product->price_with_card);
        $this->assertEquals(15, $product->price_without_card);
    }
}
