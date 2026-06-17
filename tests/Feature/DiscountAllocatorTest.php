<?php

namespace Tests\Feature;

use App\Models\DiscountUsage;
use App\Models\OnlineTransaction;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Services\DiscountAllocator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DiscountAllocatorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Fake the ESNcard HTTP API so that each code in $validCodes returns
     * an "available" card and all other codes return an empty body (invalid).
     */
    private function fakeEsncard(array $validCodes = []): void
    {
        Http::fake(function ($request) use ($validCodes) {
            $code = $request->data()['code'] ?? '';
            if (in_array($code, $validCodes, true)) {
                return Http::response([['status' => 'available', 'code' => $code]], 200);
            }

            return Http::response([], 200);
        });
    }

    private function makeAllocator(): DiscountAllocator
    {
        return app(DiscountAllocator::class);
    }

    private function makeEvent(array $attrs = []): Event
    {
        return Event::create(array_merge([
            'name' => 'Event',
            'price_with_card' => 8.00,
            'price_without_card' => 12.00,
            'event_date' => now()->addMonth(),
            'is_online_sellable' => true,
            'unlimited_quantity' => true,
        ], $attrs));
    }

    private function makeProduct(array $attrs = []): Product
    {
        return Product::create(array_merge([
            'name' => 'Product',
            'price' => 20.00,
            'price_with_card' => 15.00,
            'price_without_card' => 20.00,
            'is_online_sellable' => true,
        ], $attrs));
    }

    // -------------------------------------------------------------------------
    // Basic allocation
    // -------------------------------------------------------------------------

    public function test_no_codes_returns_full_price(): void
    {
        $this->fakeEsncard();
        $event = $this->makeEvent();

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            []
        );

        $this->assertEqualsWithDelta(12.00, $result['total_original'], 0.001);
        $this->assertEqualsWithDelta(12.00, $result['total_final'], 0.001);
        $this->assertEqualsWithDelta(0.00, $result['total_savings'], 0.001);
    }

    public function test_invalid_code_is_ignored(): void
    {
        $this->fakeEsncard([]); // no valid codes
        $event = $this->makeEvent();

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            ['INVALID-CODE']
        );

        $this->assertEqualsWithDelta(12.00, $result['total_final'], 0.001);
        $this->assertEmpty($result['valid_codes']);
    }

    public function test_valid_code_applies_member_price_to_event(): void
    {
        $this->fakeEsncard(['ESN123']);
        $event = $this->makeEvent();

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            ['ESN123']
        );

        $this->assertEqualsWithDelta(8.00, $result['total_final'], 0.001);
        $this->assertEqualsWithDelta(4.00, $result['total_savings'], 0.001);
    }

    public function test_valid_code_applies_member_price_to_product(): void
    {
        $this->fakeEsncard(['ESN-P']);
        $product = $this->makeProduct();

        $result = $this->makeAllocator()->allocate(
            [['id' => $product->id, 'type' => 'product', 'quantity' => 1]],
            ['ESN-P']
        );

        $this->assertEqualsWithDelta(15.00, $result['total_final'], 0.001);
        $this->assertEqualsWithDelta(5.00, $result['total_savings'], 0.001);
    }

    // -------------------------------------------------------------------------
    // Session deduplication — one code per item type per session
    // -------------------------------------------------------------------------

    public function test_one_code_cannot_discount_same_event_twice_in_session(): void
    {
        $this->fakeEsncard(['ESN-A']);
        $event = $this->makeEvent();

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 2]],
            ['ESN-A']
        );

        // Only 1 of the 2 tickets should be discounted
        $breakdown = collect($result['breakdown'])->firstWhere('type', 'event');
        $this->assertSame(1, $breakdown['discounted_quantity']);
    }

    public function test_two_different_codes_can_each_discount_same_event_once(): void
    {
        $this->fakeEsncard(['ESN-A', 'ESN-B']);
        $event = $this->makeEvent();

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 2]],
            ['ESN-A', 'ESN-B']
        );

        $breakdown = collect($result['breakdown'])->firstWhere('type', 'event');
        $this->assertSame(2, $breakdown['discounted_quantity']);
    }

    // -------------------------------------------------------------------------
    // History guard — code already used for this item globally
    // -------------------------------------------------------------------------

    public function test_code_already_used_for_event_is_blocked(): void
    {
        $this->fakeEsncard(['USED-CODE']);
        $event = $this->makeEvent();

        $tx = OnlineTransaction::create([
            'reference_id' => 'TX-HIST',
            'total_amount' => 8.00,
            'processing_fee' => 0,
            'payment_status' => 'completed',
            'payment_gateway' => 'test',
            'email' => 'h@test.com',
            'mail_success' => false,
        ]);

        DiscountUsage::create([
            'code' => 'USED-CODE',
            'online_transaction_id' => $tx->id,
            'event_id' => $event->id,
            'original_price' => 12.00,
            'paid_price' => 8.00,
            'saved_amount' => 4.00,
            'used_at' => now(),
        ]);

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            ['USED-CODE']
        );

        // Code should not apply again
        $this->assertEqualsWithDelta(12.00, $result['total_final'], 0.001);
        $breakdown = collect($result['breakdown'])->firstWhere('type', 'event');
        $this->assertSame(0, $breakdown['discounted_quantity']);
    }

    // -------------------------------------------------------------------------
    // can_discount = false (same price for with/without card)
    // -------------------------------------------------------------------------

    public function test_event_with_same_prices_is_not_discounted(): void
    {
        $this->fakeEsncard(['ESN-SAME']);
        $event = $this->makeEvent([
            'price_with_card' => 10.00,
            'price_without_card' => 10.00,
        ]);

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            ['ESN-SAME']
        );

        $this->assertEqualsWithDelta(0.00, $result['total_savings'], 0.001);
    }

    // -------------------------------------------------------------------------
    // Breakdown structure
    // -------------------------------------------------------------------------

    public function test_breakdown_contains_correct_quantity_and_total(): void
    {
        $this->fakeEsncard();
        $event = $this->makeEvent();

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 3]],
            []
        );

        $breakdown = collect($result['breakdown'])->firstWhere('type', 'event');
        $this->assertSame(3, $breakdown['quantity']);
        $this->assertEqualsWithDelta(36.00, $breakdown['total_price'], 0.001);
    }

    public function test_valid_codes_list_returned(): void
    {
        $this->fakeEsncard(['CODE-1', 'CODE-2']);
        $event = $this->makeEvent();

        $result = $this->makeAllocator()->allocate(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            ['CODE-1', 'CODE-2', 'INVALID']
        );

        $this->assertContains('CODE-1', $result['valid_codes']);
        $this->assertContains('CODE-2', $result['valid_codes']);
        $this->assertNotContains('INVALID', $result['valid_codes']);
    }
}
