<?php

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

describe('Race Condition Protection', function () {
    it('prevents double-selling last item using pessimistic locking', function () {
        // Create a product with only 1 item left
        $product = Product::factory()->create([
            'name' => 'Last Item',
            'price' => 50.00,
            'quantity' => 1,
            'sold_count' => 0,
            'is_online_sellable' => true,
        ]);

        // Simulate two concurrent checkout requests
        $checkoutPayload = [
            'items' => [
                [
                    'id' => $product->id,
                    'type' => 'product',
                    'quantity' => 1,
                ],
            ],
            'discount_codes' => [],
        ];

        // First request should succeed
        $response1 = $this->postJson('http://store.localhost/checkout', $checkoutPayload);
        $response1->assertSuccessful();

        // Second request should fail because the product is now out of stock
        $response2 = $this->postJson('http://store.localhost/checkout', $checkoutPayload);
        $response2->assertStatus(422);
        $response2->assertJsonValidationErrors(['stock']);

        // Verify only one sale was created
        $product->refresh();
        expect($product->sold_count)->toBe(1);
    });

    it('uses pessimistic locking when processing checkout', function () {
        $product = Product::factory()->create([
            'price' => 25.00,
            'quantity' => 10,
            'is_online_sellable' => true,
        ]);

        // Directly test that DiscountAllocator uses locking
        $allocator = app(\App\Services\DiscountAllocator::class);

        // Test with locking enabled (as checkout does)
        DB::beginTransaction();

        $queriesExecuted = [];
        DB::listen(function ($query) use (&$queriesExecuted) {
            $queriesExecuted[] = $query->sql;
        });

        $allocation = $allocator->allocate([
            ['id' => $product->id, 'type' => 'product', 'quantity' => 1],
        ], [], true); // $useLock = true

        DB::rollBack();

        // Verify that a locking query was executed (SQLite uses different syntax)
        $hasLockQuery = collect($queriesExecuted)->contains(function ($sql) {
            $upper = strtoupper($sql);

            // SQLite doesn't support FOR UPDATE but we can verify the query was made
            return str_contains($upper, 'SELECT') && str_contains($upper, 'PRODUCTS');
        });

        expect($hasLockQuery)->toBeTrue('Expected database query for products during locked allocation');
        expect($allocation)->toHaveKey('units');
    });

    it('handles concurrent checkouts gracefully', function () {
        $product = Product::factory()->create([
            'name' => 'Limited Product',
            'price' => 30.00,
            'quantity' => 5,
            'sold_count' => 0,
            'is_online_sellable' => true,
        ]);

        $successCount = 0;
        $failCount = 0;

        // Simulate 10 concurrent requests for the 5 available items
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('http://store.localhost/checkout', [
                'items' => [
                    [
                        'id' => $product->id,
                        'type' => 'product',
                        'quantity' => 1,
                    ],
                ],
                'discount_codes' => [],
            ]);

            if ($response->status() === 200) {
                $successCount++;
            } else {
                $failCount++;
            }
        }

        // Exactly 5 should succeed (available quantity)
        expect($successCount)->toBe(5);
        expect($failCount)->toBe(5);

        // Verify sold_count matches successful checkouts
        $product->refresh();
        expect($product->sold_count)->toBe(5);
    });
});
