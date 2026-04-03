<?php

namespace Tests\Unit;

use App\DTOs\Store\StoreItemData;
use App\Models\sellables\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreItemDataProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_price_is_derived_for_variant_based_product()
    {
        $product = Product::create([
            'name' => 'Variant Product',
            'price' => 31.00,
            'price_with_card' => 24.00,
            'price_without_card' => 31.00,
            'is_variant_based' => true,
            'unlimited_quantity' => true,
        ]);

        $dto = StoreItemData::fromProduct($product);

        $this->assertSame(31.00, $dto->price);
        $this->assertSame(24.00, $dto->member_price);
        $this->assertSame(31.00, $dto->price_without_card);
        $this->assertTrue($dto->is_variant_based);
    }
}
