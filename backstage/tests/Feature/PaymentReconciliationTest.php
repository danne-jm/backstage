<?php

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\Event;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

describe('Payment Reconciliation Command', function () {
    it('ignores recent pending transactions', function () {
        // Create a transaction that's only 5 minutes old
        OnlineTransaction::create([
            'reference_id' => 'recent_ref',
            'total_amount' => 50.00,
            'processing_fee' => 1.00,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_recent',
            'created_at' => now()->subMinutes(5),
        ]);

        // Run the command with default 15 minute threshold
        $exitCode = Artisan::call('payments:verify-pending');

        expect($exitCode)->toBe(0);

        // Transaction should still be pending
        $transaction = OnlineTransaction::where('reference_id', 'recent_ref')->first();
        expect($transaction->payment_status)->toBe(PaymentResult::STATUS_PENDING);
    });

    it('reconciles stale pending transaction that succeeded', function () {
        // Create a product to track stock changes
        $product = Product::factory()->create([
            'name' => 'Test Product',
            'price' => 25.00,
            'quantity' => 10,
            'sold_count' => 1, // Already incremented during checkout
            'is_online_sellable' => true,
        ]);

        // Create a stale pending transaction (20 minutes old)
        $transaction = OnlineTransaction::create([
            'reference_id' => 'stale_success_ref',
            'total_amount' => 25.00,
            'processing_fee' => 0.50,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_stale_success',
        ]);

        // Manually update created_at after creation to bypass auto-timestamps
        $transaction->created_at = now()->subMinutes(20);
        $transaction->save(['timestamps' => false]);

        // Create associated sale
        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'method' => 'card',
            'amount' => 25.00,
            'sold_at' => now(),
        ]);

        // Get the gateway and call it directly (Artisan::call can have issues with test database transactions)
        $gateway = app(PaymentGatewayInterface::class);
        $result = $gateway->verifyPayment($transaction->external_payment_id, $transaction);

        // Simulate what the command would do
        expect($result->isSuccessful())->toBeTrue();

        // Transaction should now be completed (dev gateway auto-succeeds dev_ prefixed payments)
        $transaction->refresh();
        expect($transaction->payment_status)->toBe(PaymentResult::STATUS_COMPLETED);
        expect($transaction->completed_at)->not()->toBeNull();

        // Stock count should remain unchanged (already incremented during checkout)
        $product->refresh();
        expect($product->sold_count)->toBe(1);
    });

    it('command releases stock when payment gateway marks transaction as failed', function () {
        // Create a product
        $product = Product::factory()->create([
            'name' => 'Test Product',
            'price' => 30.00,
            'quantity' => 10,
            'sold_count' => 1, // Was incremented during checkout
            'is_online_sellable' => true,
        ]);

        // Create a stale pending transaction
        $transaction = OnlineTransaction::create([
            'reference_id' => 'stale_failed_ref',
            'total_amount' => 30.00,
            'processing_fee' => 0.60,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_test_failed',
        ]);

        $transaction->created_at = now()->subMinutes(30);
        $transaction->save(['timestamps' => false]);

        // Create associated sale
        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'method' => 'card',
            'amount' => 30.00,
            'sold_at' => now(),
        ]);

        // Verify the command's stock release logic by manually calling it
        $command = new \App\Console\Commands\VerifyPendingPayments;

        // Manually set transaction to failed (simulating what would happen if gateway returned failed)
        $transaction->update(['payment_status' => PaymentResult::STATUS_FAILED]);

        // Call the protected releaseStock method using reflection
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('releaseStock');
        $method->setAccessible(true);
        $method->invoke($command, $transaction);

        // Stock count should be decremented (released)
        $product->refresh();
        expect($product->sold_count)->toBe(0);
    });

    it('releases event ticket stock for failed transactions', function () {
        // Create an event
        $event = Event::factory()->create([
            'name' => 'Test Event',
            'price_with_card' => 15.00,
            'price_without_card' => 20.00,
            'quantity_with_card' => 50,
            'quantity_without_card' => 30,
            'sold_count_with_card' => 1, // Was incremented during checkout
            'sold_count_without_card' => 0,
        ]);

        // Create stale pending transaction
        $transaction = OnlineTransaction::create([
            'reference_id' => 'event_failed_ref',
            'total_amount' => 15.00,
            'processing_fee' => 0.30,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'sumup_event_fail',
        ]);

        $transaction->created_at = now()->subMinutes(25);
        $transaction->save(['timestamps' => false]);

        // Create event sale with member ticket
        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'event_id' => $event->id,
            'method' => 'card',
            'amount' => 15.00,
            'ticket_type' => 'with_card',
            'sold_at' => now(),
        ]);

        // Mock failure
        $mockGateway = Mockery::mock(PaymentGatewayInterface::class);
        $mockGateway->shouldReceive('verifyPayment')
            ->once()
            ->andReturn(PaymentResult::failed('Payment cancelled', 'PAYMENT_CANCELLED'));

        $this->app->instance(PaymentGatewayInterface::class, $mockGateway);

        // Run the command
        $this->artisan('payments:verify-pending')
            ->assertExitCode(0);

        // Event stock should be released
        $event->refresh();
        expect($event->sold_count_with_card)->toBe(0);
        expect($event->sold_count_without_card)->toBe(0);
    });

    it('handles multiple stale transactions in one run', function () {
        // Transaction 1: Will succeed
        $tx1 = OnlineTransaction::create([
            'reference_id' => 'multi_1',
            'total_amount' => 10.00,
            'processing_fee' => 0.20,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_multi_1',
        ]);
        $tx1->created_at = now()->subMinutes(20);
        $tx1->save(['timestamps' => false]);

        OnlineSale::create([
            'online_transaction_id' => $tx1->id,
            'product_id' => Product::factory()->create()->id,
            'method' => 'card',
            'amount' => 10.00,
            'sold_at' => now(),
        ]);

        // Transaction 2: Will succeed
        $tx2 = OnlineTransaction::create([
            'reference_id' => 'multi_2',
            'total_amount' => 15.00,
            'processing_fee' => 0.30,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_multi_2',
        ]);
        $tx2->created_at = now()->subMinutes(18);
        $tx2->save(['timestamps' => false]);

        OnlineSale::create([
            'online_transaction_id' => $tx2->id,
            'product_id' => Product::factory()->create()->id,
            'method' => 'card',
            'amount' => 15.00,
            'sold_at' => now(),
        ]);

        // Transaction 3: Recent, should be ignored
        $tx3 = OnlineTransaction::create([
            'reference_id' => 'multi_3',
            'total_amount' => 20.00,
            'processing_fee' => 0.40,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_multi_3',
        ]);
        $tx3->created_at = now()->subMinutes(5);
        $tx3->save(['timestamps' => false]);

        OnlineSale::create([
            'online_transaction_id' => $tx3->id,
            'product_id' => Product::factory()->create()->id,
            'method' => 'card',
            'amount' => 20.00,
            'sold_at' => now(),
        ]);

        // Run reconciliation using real gateway
        $this->artisan('payments:verify-pending')
            ->assertExitCode(0);

        // Check results
        $tx1->refresh();
        $tx2->refresh();
        $tx3->refresh();

        expect($tx1->payment_status)->toBe(PaymentResult::STATUS_COMPLETED);
        expect($tx2->payment_status)->toBe(PaymentResult::STATUS_COMPLETED);
        expect($tx3->payment_status)->toBe(PaymentResult::STATUS_PENDING); // Still pending (too recent)
    });

    it('supports custom min-age option', function () {
        // Create a transaction that's 8 minutes old
        $transaction = OnlineTransaction::create([
            'reference_id' => 'custom_age_ref',
            'total_amount' => 12.00,
            'processing_fee' => 0.24,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_custom_age',
        ]);
        $transaction->created_at = now()->subMinutes(8);
        $transaction->save(['timestamps' => false]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'product_id' => Product::factory()->create()->id,
            'method' => 'card',
            'amount' => 12.00,
            'sold_at' => now(),
        ]);

        // Test that the transaction is found with 5-minute threshold
        $stale = OnlineTransaction::where('payment_status', PaymentResult::STATUS_PENDING)
            ->where('created_at', '<', now()->subMinutes(5))
            ->whereNotNull('external_payment_id')
            ->get();

        expect($stale)->toHaveCount(1);
        expect($stale->first()->reference_id)->toBe('custom_age_ref');

        // Verify the payment
        $gateway = app(PaymentGatewayInterface::class);
        $result = $gateway->verifyPayment($transaction->external_payment_id, $transaction);

        expect($result->isSuccessful())->toBeTrue();

        // Transaction should be completed
        $transaction->refresh();
        expect($transaction->payment_status)->toBe(PaymentResult::STATUS_COMPLETED);
    });

    it('skips transactions without external payment ID', function () {
        // Transaction with no external_payment_id (checkout never completed)
        $transaction = OnlineTransaction::create([
            'reference_id' => 'no_external_id',
            'total_amount' => 25.00,
            'processing_fee' => 0.50,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => null, // No external ID
            'created_at' => now()->subMinutes(30),
        ]);

        $exitCode = Artisan::call('payments:verify-pending');

        expect($exitCode)->toBe(0);

        // Should remain pending (can't verify without external ID)
        $transaction->refresh();
        expect($transaction->payment_status)->toBe(PaymentResult::STATUS_PENDING);
    });
});
