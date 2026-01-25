<?php

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\Event;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\Product;
use App\Models\User;
use App\Services\PaymentGateways\DevelopmentPaymentGateway;
use App\Services\PaymentGateways\SumUpPaymentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('PaymentGatewayInterface binding', function () {
    it('binds DevelopmentPaymentGateway in testing environment', function () {
        $gateway = app(PaymentGatewayInterface::class);

        expect($gateway)->toBeInstanceOf(DevelopmentPaymentGateway::class);
        expect($gateway->getName())->toBe('Development');
    });

    it('returns DevelopmentPaymentGateway for local environment', function () {
        config(['app.env' => 'local']);
        app()->forgetInstance(PaymentGatewayInterface::class);

        $gateway = app(PaymentGatewayInterface::class);

        expect($gateway)->toBeInstanceOf(DevelopmentPaymentGateway::class);
    });

    it('returns DevelopmentPaymentGateway for development environment', function () {
        config(['app.env' => 'development']);
        app()->forgetInstance(PaymentGatewayInterface::class);

        $gateway = app(PaymentGatewayInterface::class);

        expect($gateway)->toBeInstanceOf(DevelopmentPaymentGateway::class);
    });

    it('returns SumUpPaymentGateway for production environment', function () {
        config(['app.env' => 'production']);
        app()->forgetInstance(PaymentGatewayInterface::class);

        $gateway = app(PaymentGatewayInterface::class);

        expect($gateway)->toBeInstanceOf(SumUpPaymentGateway::class);
        expect($gateway->getName())->toBe('SumUp');
    });
});

describe('DevelopmentPaymentGateway', function () {
    beforeEach(function () {
        $this->gateway = new DevelopmentPaymentGateway;
    });

    it('creates a pending payment with auto_complete flag', function () {
        $transaction = OnlineTransaction::create([
            'reference_id' => 'test_ref_123',
            'total_amount' => 100.00,
            'processing_fee' => 2.00,
            'payment_status' => PaymentResult::STATUS_PENDING,
        ]);

        $result = $this->gateway->createPayment($transaction);

        expect($result->status)->toBe(PaymentResult::STATUS_PENDING);
        expect($result->paymentId)->toStartWith('dev_');
        expect($result->metadata['auto_complete'])->toBeTrue();
        expect($result->metadata['mode'])->toBe('development');

        $transaction->refresh();
        expect($transaction->external_payment_id)->toBe($result->paymentId);
    });

    it('verifies payment successfully', function () {
        $transaction = OnlineTransaction::create([
            'reference_id' => 'test_ref_456',
            'total_amount' => 50.00,
            'processing_fee' => 1.00,
            'payment_status' => PaymentResult::STATUS_PENDING,
            'external_payment_id' => 'dev_test123',
        ]);

        $result = $this->gateway->verifyPayment('dev_test123', $transaction);

        expect($result->isSuccessful())->toBeTrue();
        expect($result->status)->toBe(PaymentResult::STATUS_COMPLETED);

        $transaction->refresh();
        expect($transaction->payment_status)->toBe(PaymentResult::STATUS_COMPLETED);
        expect($transaction->completed_at)->not->toBeNull();
    });

    it('returns completed status for valid dev payment id', function () {
        $result = $this->gateway->getPaymentStatus('dev_abc123');

        expect($result->isSuccessful())->toBeTrue();
    });

    it('returns failed status for invalid payment id', function () {
        $result = $this->gateway->getPaymentStatus('invalid_payment_id');

        expect($result->isFailed())->toBeTrue();
        expect($result->errorCode)->toBe('INVALID_PAYMENT_ID');
    });

    it('supports refunds', function () {
        expect($this->gateway->supportsRefunds())->toBeTrue();
    });

    it('processes mock refund successfully', function () {
        $result = $this->gateway->refund('dev_payment_123', 25.00);

        expect($result->status)->toBe(PaymentResult::STATUS_REFUNDED);
        expect($result->metadata['refunded_amount'])->toBe(25.00);
    });
});

describe('Store checkout flow with payment gateway', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
    });

    it('completes checkout using development gateway', function () {
        $product = Product::factory()->create([
            'name' => 'Test Product',
            'price' => 25.00,
            'member_price' => 20.00,
            'quantity' => 10,
            'is_online_sellable' => true,
        ]);

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

        $response->assertSuccessful();
        $response->assertJsonStructure([
            'success',
            'redirect_url',
        ]);
        expect($response->json('success'))->toBeTrue();
        expect($response->json('redirect_url'))->toContain('/confirmation?bag=');

        // Verify transaction was created
        $transaction = OnlineTransaction::first();
        expect($transaction)->not->toBeNull();
        expect($transaction->payment_status)->toBe(PaymentResult::STATUS_COMPLETED);
        expect($transaction->payment_gateway)->toBe('Development');
    });

    it('creates transaction with correct totals', function () {
        $product = Product::factory()->create([
            'name' => 'Expensive Item',
            'price' => 100.00,
            'quantity' => 5,
            'is_online_sellable' => true,
        ]);

        $response = $this->postJson('http://store.localhost/checkout', [
            'items' => [
                [
                    'id' => $product->id,
                    'type' => 'product',
                    'quantity' => 2,
                ],
            ],
            'discount_codes' => [],
        ]);

        $response->assertSuccessful();

        $transaction = OnlineTransaction::first();
        
        $rate = config('services.sumup.processing_fee_rate');
        $expectedFee = round(200 * $rate, 2);
        $expectedTotal = round(200 + $expectedFee, 2);

        expect((float) $transaction->total_amount)->toBe($expectedTotal);
        expect((float) $transaction->processing_fee)->toBe($expectedFee);
    });

    it('rejects checkout when product is out of stock', function () {
        $product = Product::factory()->create([
            'name' => 'Limited Item',
            'price' => 50.00,
            'quantity' => 1,
            'unlimited_quantity' => false,
            'is_online_sellable' => true,
        ]);

        // Create an existing sale to make the product sold out
        OnlineSale::create([
            'product_id' => $product->id,
            'method' => 'card',
            'amount' => 50.00,
            'sold_at' => now(),
        ]);

        $response = $this->postJson('http://store.localhost/checkout', [
            'items' => [
                [
                    'id' => $product->id,
                    'type' => 'product',
                    'quantity' => 1,
                ],
            ],
        ]);

        $response->assertStatus(422);
    });

    it('handles event checkout correctly', function () {
        $user = User::factory()->create();

        $event = Event::factory()->create([
            'name' => 'Test Event',
            'event_date' => now()->addDays(10),
            'start_sell_date' => now()->subDays(1),
            'end_sell_date' => now()->addDays(5),
            'price_with_card' => 15.00,
            'price_without_card' => 20.00,
            'quantity' => 50,
            'unlimited_quantity' => false,
            'is_online_sellable' => true,
            'responsible_user_id' => $user->id,
        ]);

        $response = $this->postJson('http://store.localhost/checkout', [
            'items' => [
                [
                    'id' => $event->id,
                    'type' => 'event',
                    'quantity' => 1,
                ],
            ],
            'discount_codes' => [],
        ]);

        $response->assertSuccessful();

        $transaction = OnlineTransaction::first();
        expect($transaction)->not->toBeNull();
        expect($transaction->sales)->toHaveCount(1);
    });
});

describe('Payment callback and verification', function () {
    it('verifies payment status via API', function () {
        $transaction = OnlineTransaction::create([
            'reference_id' => 'verify_test_ref',
            'total_amount' => 100.00,
            'processing_fee' => 2.00,
            'payment_status' => PaymentResult::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        $response = $this->postJson('http://store.localhost/payment/verify', [
            'reference' => 'verify_test_ref',
        ]);

        $response->assertSuccessful();
        $response->assertJson([
            'status' => 'completed',
        ]);
        expect($response->json('redirect_url'))->toContain('/confirmation?bag=');
    });

    it('returns pending status for incomplete payment', function () {
        $transaction = OnlineTransaction::create([
            'reference_id' => 'pending_test_ref',
            'total_amount' => 100.00,
            'processing_fee' => 2.00,
            'payment_status' => PaymentResult::STATUS_PENDING,
        ]);

        $response = $this->postJson('http://store.localhost/payment/verify', [
            'reference' => 'pending_test_ref',
        ]);

        $response->assertSuccessful();
        $response->assertJson([
            'status' => 'pending',
        ]);
    });

    it('returns error for non-existent transaction', function () {
        $response = $this->postJson('http://store.localhost/payment/verify', [
            'reference' => 'non_existent_ref',
        ]);

        $response->assertNotFound();
    });
});

describe('PaymentResult DTO', function () {
    it('creates success result correctly', function () {
        $result = PaymentResult::success('pay_123', 'Payment completed', ['key' => 'value']);

        expect($result->isSuccessful())->toBeTrue();
        expect($result->isPending())->toBeFalse();
        expect($result->isFailed())->toBeFalse();
        expect($result->paymentId)->toBe('pay_123');
        expect($result->message)->toBe('Payment completed');
        expect($result->metadata)->toBe(['key' => 'value']);
    });

    it('creates pending result correctly', function () {
        $result = PaymentResult::pending('pay_456', 'https://checkout.example.com');

        expect($result->isPending())->toBeTrue();
        expect($result->isSuccessful())->toBeFalse();
        expect($result->checkoutUrl)->toBe('https://checkout.example.com');
    });

    it('creates failed result correctly', function () {
        $result = PaymentResult::failed('Payment declined', 'CARD_DECLINED');

        expect($result->isFailed())->toBeTrue();
        expect($result->message)->toBe('Payment declined');
        expect($result->errorCode)->toBe('CARD_DECLINED');
    });

    it('converts to array correctly', function () {
        $result = PaymentResult::success('pay_789');

        $array = $result->toArray();

        expect($array)->toHaveKeys(['status', 'payment_id', 'checkout_url', 'message', 'error_code', 'metadata']);
        expect($array['status'])->toBe(PaymentResult::STATUS_COMPLETED);
        expect($array['payment_id'])->toBe('pay_789');
    });
});
