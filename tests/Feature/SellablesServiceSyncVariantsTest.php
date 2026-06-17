<?php

namespace Tests\Feature;

use App\Models\SellableVariant;
use App\Models\sellables\Product;
use App\Services\SellablesService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellablesServiceSyncVariantsTest extends TestCase
{
    use RefreshDatabase;

    private SellablesService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SellablesService;
    }

    private function makeProduct(array $attrs = []): Product
    {
        return Product::create(array_merge([
            'name' => 'T-Shirt',
            'price' => 20.00,
            'is_variant_based' => true,
            'is_online_sellable' => true,
        ], $attrs));
    }

    public function test_sync_creates_new_variants(): void
    {
        $product = $this->makeProduct();

        $this->service->syncVariants($product, [
            ['options' => ['size' => 'S'], 'quantity' => 10],
            ['options' => ['size' => 'M'], 'quantity' => 5],
        ]);

        $this->assertCount(2, $product->variants()->get());
    }

    public function test_sync_updates_existing_variant_quantity(): void
    {
        $product = $this->makeProduct();
        $variant = $product->variants()->create(['options' => ['size' => 'L'], 'quantity' => 10]);

        $this->service->syncVariants($product, [
            ['options' => ['size' => 'L'], 'quantity' => 25],
        ]);

        $this->assertSame(25, $variant->fresh()->quantity);
    }

    public function test_sync_deletes_removed_variants(): void
    {
        $product = $this->makeProduct();
        $product->variants()->create(['options' => ['size' => 'XL'], 'quantity' => 5]);

        $this->service->syncVariants($product, [
            ['options' => ['size' => 'S'], 'quantity' => 10],
        ]);

        $this->assertSame(1, $product->variants()->count());
        $this->assertSame('S', $product->variants()->first()->options['size']);
    }

    public function test_sync_backfills_remaining_quantity_for_new_variant(): void
    {
        $product = $this->makeProduct();

        $this->service->syncVariants($product, [
            ['options' => ['size' => 'M'], 'remaining_quantity' => 7],
        ]);

        // No sales yet, so quantity == remaining
        $this->assertSame(7, $product->variants()->first()->quantity);
    }

    public function test_sync_backfills_remaining_quantity_for_existing_variant(): void
    {
        $product = $this->makeProduct();
        $variant = $product->variants()->create(['options' => ['color' => 'red'], 'quantity' => 20]);

        // Simulate 3 sales by creating OfficeShiftSale records with snapshot_variant_id
        // Since computedSoldCount uses a cache+query, we test that remaining_quantity
        // is added on top of the current sold count (0 here, no sales yet).
        $this->service->syncVariants($product, [
            ['options' => ['color' => 'red'], 'remaining_quantity' => 10],
        ]);

        // 0 sold + 10 remaining = 10
        $this->assertSame(10, $variant->fresh()->quantity);
    }

    public function test_sync_allows_null_quantity_unlimited(): void
    {
        $product = $this->makeProduct();

        $this->service->syncVariants($product, [
            ['options' => ['size' => 'OS'], 'quantity' => null],
        ]);

        $this->assertNull($product->variants()->first()->quantity);
    }

    public function test_sync_matches_variants_by_options_regardless_of_key_order(): void
    {
        $product = $this->makeProduct();
        $variant = $product->variants()->create(['options' => ['color' => 'blue', 'size' => 'M'], 'quantity' => 5]);

        $this->service->syncVariants($product, [
            ['options' => ['size' => 'M', 'color' => 'blue'], 'quantity' => 99],
        ]);

        $this->assertSame(99, $variant->fresh()->quantity);
        $this->assertSame(1, $product->variants()->count());
    }
}
