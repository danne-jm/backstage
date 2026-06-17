<?php

namespace Tests\Feature;

use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\User;
use App\Models\sellables\Event;
use App\Services\FinancialLedgerService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfficeShiftBreakdownTest extends TestCase
{
    use RefreshDatabase;

    private function makeShift(array $attrs = []): OfficeShift
    {
        $user = User::factory()->create();

        return OfficeShift::create(array_merge([
            'started_by' => $user->id,
            'started_at' => now(),
            'status' => 'open',
            'cash_total' => 0,
            'card_total' => 0,
            'start_cash' => 0,
            'start_card' => 0,
            'total_cash' => 0,
            'total_card' => 0,
        ], $attrs));
    }

    private function makeEvent(array $attrs = []): Event
    {
        return Event::create(array_merge([
            'name' => 'Office Test Event',
            'price_with_card' => 8.00,
            'price_without_card' => 12.00,
            'event_date' => now()->addMonth(),
            'is_online_sellable' => true,
            'unlimited_quantity' => true,
        ], $attrs));
    }

    private function saleService(): SaleService
    {
        return app(SaleService::class);
    }

    // -------------------------------------------------------------------------
    // recordOfficeSale — basic cash/card accounting
    // -------------------------------------------------------------------------

    public function test_cash_sale_increments_shift_cash_total(): void
    {
        $shift = $this->makeShift();
        $event = $this->makeEvent();

        $this->saleService()->recordOfficeSale($shift, [
            'event_id' => $event->id,
            'amount' => 12.00,
            'method' => 'cash',
            'ticket_type' => 'without_card',
            'price' => 12.00,
            'description' => null,
        ]);

        $shift->refresh();
        $this->assertEqualsWithDelta(12.00, $shift->cash_total, 0.001);
    }

    public function test_card_sale_increments_shift_card_total(): void
    {
        $shift = $this->makeShift();
        $event = $this->makeEvent();

        $this->saleService()->recordOfficeSale($shift, [
            'event_id' => $event->id,
            'amount' => 8.00,
            'method' => 'card',
            'ticket_type' => 'with_card',
            'price' => 8.00,
            'description' => null,
        ]);

        $shift->refresh();
        $this->assertEqualsWithDelta(8.00, $shift->card_total, 0.001);
    }

    public function test_cash_sale_with_breakdown_updates_cash_breakdown(): void
    {
        $shift = $this->makeShift();
        $event = $this->makeEvent();

        $this->saleService()->recordOfficeSale($shift, [
            'event_id' => $event->id,
            'method' => 'cash',
            'ticket_type' => 'without_card',
            'price' => 10.00,
            'breakdown' => ['10e' => 1],
            'description' => null,
        ]);

        $shift->refresh();
        $this->assertSame(1, $shift->cash_breakdown['10e'] ?? 0);
    }

    public function test_record_sale_creates_office_shift_sale_record(): void
    {
        $shift = $this->makeShift();
        $event = $this->makeEvent();

        $sale = $this->saleService()->recordOfficeSale($shift, [
            'event_id' => $event->id,
            'amount' => 12.00,
            'method' => 'cash',
            'ticket_type' => 'without_card',
            'price' => 12.00,
            'description' => null,
        ]);

        $this->assertInstanceOf(OfficeShiftSale::class, $sale);
        $this->assertDatabaseHas('office_shift_sales', ['id' => $sale->id]);
    }

    public function test_record_sale_creates_ledger_entry(): void
    {
        $shift = $this->makeShift();
        $event = $this->makeEvent();

        $sale = $this->saleService()->recordOfficeSale($shift, [
            'event_id' => $event->id,
            'amount' => 12.00,
            'method' => 'cash',
            'ticket_type' => 'without_card',
            'price' => 12.00,
            'description' => null,
        ]);

        $this->assertDatabaseHas('financial_ledger_entries', [
            'idempotency_key' => "office_shift_sale_recorded:{$sale->id}",
        ]);
    }

    // -------------------------------------------------------------------------
    // deductStock — guards
    // -------------------------------------------------------------------------

    public function test_deduct_stock_throws_when_event_with_card_pool_exhausted(): void
    {
        $event = $this->makeEvent([
            'unlimited_quantity' => false,
            'quantity_with_card' => 1,
            'unlimited_quantity_with_card' => false,
        ]);

        $shift = $this->makeShift();

        // First sale succeeds
        $this->saleService()->recordOfficeSale($shift, [
            'event_id' => $event->id,
            'amount' => 8.00,
            'method' => 'cash',
            'ticket_type' => 'with_card',
            'price' => 8.00,
            'description' => null,
        ]);

        Event::bustSoldCountCache($event->id);

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        // Second sale should fail — pool is exhausted
        $this->saleService()->recordOfficeSale($shift, [
            'event_id' => $event->id,
            'amount' => 8.00,
            'method' => 'cash',
            'ticket_type' => 'with_card',
            'price' => 8.00,
            'description' => null,
        ]);
    }

    public function test_deduct_stock_allows_sale_when_unlimited(): void
    {
        $event = $this->makeEvent(['unlimited_quantity' => true]);
        $shift = $this->makeShift();

        for ($i = 0; $i < 5; $i++) {
            $this->saleService()->recordOfficeSale($shift, [
                'event_id' => $event->id,
                'amount' => 12.00,
                'method' => 'cash',
                'ticket_type' => 'without_card',
                'price' => 12.00,
                'description' => null,
            ]);
        }

        $this->assertSame(5, OfficeShiftSale::where('event_id', $event->id)->count());
    }

    // -------------------------------------------------------------------------
    // claimStrayOnlineSales
    // -------------------------------------------------------------------------

    public function test_claim_stray_online_sales_assigns_completed_orphans(): void
    {
        $shift = $this->makeShift();

        $tx = \App\Models\OnlineTransaction::create([
            'reference_id' => 'TX-CLAIM',
            'total_amount' => 10.00,
            'processing_fee' => 0,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'x@test.com',
            'mail_success' => false,
        ]);

        $sale = \App\Models\OnlineSale::create([
            'online_transaction_id' => $tx->id,
            'reference_id' => 'CLAIM-1',
            'method' => 'card',
            'amount' => 10.00,
            'sold_at' => now(),
        ]);

        $this->assertNull($sale->office_shift_id);

        $this->saleService()->claimStrayOnlineSales($shift);

        $this->assertSame($shift->id, $sale->fresh()->office_shift_id);
    }

    public function test_claim_stray_online_sales_does_not_claim_pending(): void
    {
        $shift = $this->makeShift();

        $tx = \App\Models\OnlineTransaction::create([
            'reference_id' => 'TX-PENDING',
            'total_amount' => 10.00,
            'processing_fee' => 0,
            'payment_status' => 'pending',
            'payment_gateway' => 'sumup',
            'email' => 'p@test.com',
            'mail_success' => false,
        ]);

        $sale = \App\Models\OnlineSale::create([
            'online_transaction_id' => $tx->id,
            'reference_id' => 'PEND-1',
            'method' => 'card',
            'amount' => 10.00,
            'sold_at' => now(),
        ]);

        $this->saleService()->claimStrayOnlineSales($shift);

        $this->assertNull($sale->fresh()->office_shift_id);
    }
}
