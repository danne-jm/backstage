<?php

namespace Tests\Feature;

use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\sellables\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class EventStockTest extends TestCase
{
    use RefreshDatabase;

    private function makeEvent(array $attrs = []): Event
    {
        return Event::create(array_merge([
            'name' => 'Test Event',
            'price_with_card' => 8.00,
            'price_without_card' => 12.00,
            'event_date' => now()->addMonth(),
            'is_online_sellable' => true,
        ], $attrs));
    }

    // -------------------------------------------------------------------------
    // checkHasStock
    // -------------------------------------------------------------------------

    public function test_check_has_stock_returns_true_when_unlimited(): void
    {
        $event = $this->makeEvent(['unlimited_quantity' => true]);
        $this->assertTrue($event->checkHasStock());
    }

    public function test_check_has_stock_returns_true_when_quantity_is_null(): void
    {
        $event = $this->makeEvent(['quantity' => null, 'unlimited_quantity' => false]);
        $this->assertTrue($event->checkHasStock());
    }

    public function test_check_has_stock_uses_without_card_pool_when_split(): void
    {
        $event = $this->makeEvent([
            'quantity_without_card' => 2,
            'unlimited_quantity_without_card' => false,
        ]);

        $this->assertTrue($event->checkHasStock());
    }

    public function test_check_has_stock_returns_false_when_without_card_pool_empty(): void
    {
        // quantity must be non-null so checkHasStock reaches the split-pool branch.
        $event = $this->makeEvent([
            'quantity' => 10,
            'unlimited_quantity' => false,
            'quantity_without_card' => 1,
            'unlimited_quantity_without_card' => false,
        ]);

        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'REF-1',
            'ticket_type' => 'without_card',
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->assertFalse($event->checkHasStock());
    }

    public function test_check_has_stock_uses_universal_pool_when_no_split(): void
    {
        $event = $this->makeEvent([
            'quantity' => 1,
            'unlimited_quantity' => false,
        ]);

        $this->assertTrue($event->checkHasStock());

        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'REF-2',
            'ticket_type' => 'without_card',
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->assertFalse($event->checkHasStock());
    }

    // -------------------------------------------------------------------------
    // checkHasStockWithCard
    // -------------------------------------------------------------------------

    public function test_check_has_stock_with_card_unlimited_returns_true(): void
    {
        $event = $this->makeEvent(['unlimited_quantity_with_card' => true]);
        $this->assertTrue($event->checkHasStockWithCard());
    }

    public function test_check_has_stock_with_card_when_split_pool_available(): void
    {
        $event = $this->makeEvent([
            'quantity_with_card' => 5,
            'unlimited_quantity_with_card' => false,
        ]);
        $this->assertTrue($event->checkHasStockWithCard());
    }

    public function test_check_has_stock_with_card_false_when_split_pool_empty(): void
    {
        $event = $this->makeEvent([
            'quantity_with_card' => 1,
            'unlimited_quantity_with_card' => false,
        ]);

        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'REF-3',
            'ticket_type' => 'with_card',
            'method' => 'card',
            'amount' => 8.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->assertFalse($event->checkHasStockWithCard());
    }

    public function test_check_has_stock_with_card_falls_back_to_universal_pool(): void
    {
        $event = $this->makeEvent([
            'quantity' => 2,
            'unlimited_quantity' => false,
        ]);

        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'REF-4',
            'ticket_type' => 'without_card',
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);
        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'REF-5',
            'ticket_type' => 'with_card',
            'method' => 'card',
            'amount' => 8.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->assertFalse($event->checkHasStockWithCard());
    }

    // -------------------------------------------------------------------------
    // checkMainStock
    // -------------------------------------------------------------------------

    public function test_check_main_stock_passes_when_enough_without_card(): void
    {
        $event = $this->makeEvent([
            'quantity_without_card' => 5,
            'unlimited_quantity_without_card' => false,
        ]);

        $event->checkMainStock(3, false); // should not throw
        $this->assertTrue(true);
    }

    public function test_check_main_stock_throws_when_insufficient_without_card(): void
    {
        $event = $this->makeEvent([
            'quantity_without_card' => 2,
            'unlimited_quantity_without_card' => false,
        ]);

        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'REF-6',
            'ticket_type' => 'without_card',
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->expectException(ValidationException::class);
        $event->checkMainStock(2, false);
    }

    public function test_check_main_stock_passes_when_enough_with_card(): void
    {
        $event = $this->makeEvent([
            'quantity_with_card' => 10,
            'unlimited_quantity_with_card' => false,
        ]);

        $event->checkMainStock(5, true);
        $this->assertTrue(true);
    }

    public function test_check_main_stock_throws_when_insufficient_with_card(): void
    {
        $event = $this->makeEvent([
            'quantity_with_card' => 1,
            'unlimited_quantity_with_card' => false,
        ]);

        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'REF-7',
            'ticket_type' => 'with_card',
            'method' => 'card',
            'amount' => 8.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->expectException(ValidationException::class);
        $event->checkMainStock(1, true);
    }

    public function test_check_main_stock_unlimited_does_not_throw(): void
    {
        $event = $this->makeEvent([
            'unlimited_quantity' => true,
        ]);

        $event->checkMainStock(9999, false);
        $this->assertTrue(true);
    }

    public function test_check_main_stock_null_quantity_does_not_throw(): void
    {
        $event = $this->makeEvent([
            'quantity' => null,
            'unlimited_quantity' => false,
        ]);

        $event->checkMainStock(100, false);
        $this->assertTrue(true);
    }

    public function test_check_main_stock_universal_pool_throws_when_exceeded(): void
    {
        $event = $this->makeEvent([
            'quantity' => 3,
            'unlimited_quantity' => false,
        ]);

        // Sell 2
        foreach (['REF-8', 'REF-9'] as $ref) {
            OnlineSale::create([
                'event_id' => $event->id,
                'reference_id' => $ref,
                'ticket_type' => 'without_card',
                'method' => 'card',
                'amount' => 12.00,
                'sold_at' => now(),
            ]);
        }

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->expectException(ValidationException::class);
        $event->checkMainStock(2, false); // only 1 left
    }

    // -------------------------------------------------------------------------
    // computedSoldWithCard — excludes failed/abandoned online transactions
    // -------------------------------------------------------------------------

    public function test_computed_sold_with_card_excludes_failed_transactions(): void
    {
        $event = $this->makeEvent();

        $failedTx = OnlineTransaction::create([
            'reference_id' => 'TX-FAILED',
            'total_amount' => 8.00,
            'processing_fee' => 0,
            'payment_status' => 'failed',
            'payment_gateway' => 'sumup',
            'email' => 'fail@test.com',
            'mail_success' => false,
        ]);

        OnlineSale::create([
            'online_transaction_id' => $failedTx->id,
            'event_id' => $event->id,
            'reference_id' => 'FAIL-1',
            'ticket_type' => 'with_card',
            'method' => 'card',
            'amount' => 8.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->assertSame(0, $event->computedSoldWithCard());
    }

    public function test_computed_sold_with_card_counts_pending_and_completed(): void
    {
        $event = $this->makeEvent();

        foreach (['pending', 'completed'] as $status) {
            $tx = OnlineTransaction::create([
                'reference_id' => 'TX-' . $status,
                'total_amount' => 8.00,
                'processing_fee' => 0,
                'payment_status' => $status,
                'payment_gateway' => 'sumup',
                'email' => 'test@test.com',
                'mail_success' => false,
            ]);

            OnlineSale::create([
                'online_transaction_id' => $tx->id,
                'event_id' => $event->id,
                'reference_id' => 'SALE-' . $status,
                'ticket_type' => 'with_card',
                'method' => 'card',
                'amount' => 8.00,
                'sold_at' => now(),
            ]);
        }

        Event::bustSoldCountCache($event->id);
        $event->refresh();

        $this->assertSame(2, $event->computedSoldWithCard());
    }
}
