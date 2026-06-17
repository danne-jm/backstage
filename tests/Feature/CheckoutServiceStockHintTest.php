<?php

namespace Tests\Feature;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Services\CheckoutService;
use App\Services\DiscountAllocator;
use App\Services\ESNcardService;
use App\Services\FinancialLedgerService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutServiceStockHintTest extends TestCase
{
    use RefreshDatabase;

    private function makeCheckoutService(): CheckoutService
    {
        // Mock ESNcard so we don't make HTTP calls
        $this->mock(ESNcardService::class, function ($mock) {
            $mock->shouldReceive('validateMany')->andReturn([]);
        });

        return app(CheckoutService::class);
    }

    private function makeEvent(array $attrs = []): Event
    {
        return Event::create(array_merge([
            'name' => 'Hint Test Event',
            'price_with_card' => 8.00,
            'price_without_card' => 12.00,
            'event_date' => now()->addMonth(),
            'is_online_sellable' => true,
        ], $attrs));
    }

    // -------------------------------------------------------------------------
    // validateCartWithWarnings — produces warnings when out of stock
    // -------------------------------------------------------------------------

    public function test_no_warnings_when_stock_is_available(): void
    {
        $event = $this->makeEvent([
            'unlimited_quantity' => true,
        ]);

        $service = $this->makeCheckoutService();

        $result = $service->validateCartWithWarnings(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            []
        );

        $this->assertEmpty($result['warnings']);
    }

    public function test_warning_produced_when_event_pool_exhausted(): void
    {
        $event = $this->makeEvent([
            'quantity_without_card' => 1,
            'unlimited_quantity_without_card' => false,
        ]);

        // Fill the pool
        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'EX-1',
            'ticket_type' => 'without_card',
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);

        $service = $this->makeCheckoutService();

        $result = $service->validateCartWithWarnings(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            []
        );

        $this->assertNotEmpty($result['warnings']);
    }

    public function test_hint_added_when_other_pool_has_stock(): void
    {
        $event = $this->makeEvent([
            'quantity_with_card' => 0,
            'unlimited_quantity_with_card' => false,
            'quantity_without_card' => 5,
            'unlimited_quantity_without_card' => false,
        ]);

        Event::bustSoldCountCache($event->id);

        $service = $this->makeCheckoutService();

        // Request a with_card ticket — pool is empty, but without_card has stock
        // Simulate a discounted unit by injecting a code that the mock validates.
        // Without a valid code the unit defaults to without_card, so test
        // the without_card pool exhausted, with_card has stock hint path instead.
        $event2 = $this->makeEvent([
            'quantity_without_card' => 1,
            'unlimited_quantity_without_card' => false,
            'quantity_with_card' => 5,
            'unlimited_quantity_with_card' => false,
        ]);

        OnlineSale::create([
            'event_id' => $event2->id,
            'reference_id' => 'HINT-1',
            'ticket_type' => 'without_card',
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event2->id);

        $result = $service->validateCartWithWarnings(
            [['id' => $event2->id, 'type' => 'event', 'quantity' => 1]],
            []
        );

        $this->assertNotEmpty($result['warnings']);
        $this->assertStringContainsString('ESNcard', $result['warnings'][0]);
    }

    // -------------------------------------------------------------------------
    // initiateCheckout — stock validation throws on exhausted pool
    // -------------------------------------------------------------------------

    public function test_initiate_checkout_throws_on_sold_out_event(): void
    {
        $event = $this->makeEvent([
            'quantity' => 1,
            'unlimited_quantity' => false,
        ]);

        // Fill the pool
        OnlineSale::create([
            'event_id' => $event->id,
            'reference_id' => 'EX-2',
            'ticket_type' => 'without_card',
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);

        Event::bustSoldCountCache($event->id);

        /** @var PaymentGatewayInterface|\Mockery\MockInterface $gateway */
        $gateway = $this->mock(PaymentGatewayInterface::class);
        $gateway->shouldReceive('getName')->andReturn('test');

        $service = $this->makeCheckoutService();

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        $service->initiateCheckout(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            [],
            'buyer@test.com'
        );
    }

    public function test_initiate_checkout_creates_transaction_and_sales(): void
    {
        $event = $this->makeEvent([
            'unlimited_quantity' => true,
        ]);

        $gateway = $this->mock(PaymentGatewayInterface::class);
        $gateway->shouldReceive('getName')->andReturn('test');
        $gateway->shouldReceive('createPayment')->andReturn(
            PaymentResult::pending('pay-id-123', 'https://pay.example.com/pay-id-123')
        );

        $service = $this->makeCheckoutService();

        $result = $service->initiateCheckout(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            [],
            'buyer@test.com'
        );

        $this->assertInstanceOf(OnlineTransaction::class, $result['transaction']);
        $this->assertDatabaseHas('online_transactions', ['email' => 'buyer@test.com']);
        $this->assertSame(1, OnlineSale::where('event_id', $event->id)->count());
    }

    public function test_initiate_checkout_records_processing_fee(): void
    {
        $event = $this->makeEvent(['unlimited_quantity' => true]);

        $gateway = $this->mock(PaymentGatewayInterface::class);
        $gateway->shouldReceive('getName')->andReturn('test');
        $gateway->shouldReceive('createPayment')->andReturn(
            PaymentResult::pending('pay-id-456', 'https://pay.example.com/pay-id-456')
        );

        config(['services.sumup.processing_fee_rate' => 0.025]);

        $service = $this->makeCheckoutService();

        $result = $service->initiateCheckout(
            [['id' => $event->id, 'type' => 'event', 'quantity' => 1]],
            [],
            'fee@test.com'
        );

        $tx = $result['transaction'];
        $this->assertGreaterThan(0, (float) $tx->processing_fee);
    }

    // -------------------------------------------------------------------------
    // handleTransactionFailure
    // -------------------------------------------------------------------------

    public function test_handle_transaction_failure_marks_transaction_failed(): void
    {
        $tx = OnlineTransaction::create([
            'reference_id' => 'TX-FAIL',
            'total_amount' => 10.00,
            'processing_fee' => 0.20,
            'payment_status' => 'pending',
            'payment_gateway' => 'test',
            'email' => 'x@test.com',
            'mail_success' => false,
        ]);

        $service = $this->makeCheckoutService();
        $service->handleTransactionFailure($tx);

        $this->assertSame('failed', $tx->fresh()->payment_status);
    }
}
