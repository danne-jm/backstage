<?php

namespace Tests\Unit\Store;

use App\Contracts\PaymentGatewayInterface;
use App\Services\CheckoutService;
use App\Services\DiscountAllocator;
use App\Services\FinancialLedgerService;
use App\Services\SaleService;
use Mockery;
use Tests\TestCase;

class CheckoutServiceMoneyMathTest extends TestCase
{
    public function test_it_calculates_cents_and_processing_fee_deterministically(): void
    {
        $allocator = Mockery::mock(DiscountAllocator::class);
        $gateway = Mockery::mock(PaymentGatewayInterface::class);
        $saleService = Mockery::mock(SaleService::class);
        $ledger = Mockery::mock(FinancialLedgerService::class);

        $service = new class ($allocator, $gateway, $saleService, $ledger) extends CheckoutService {
            public function exposeToCents(float $amount): int
            {
                return $this->toCents($amount);
            }

            public function exposeCalculateProcessingFeeCents(int $subtotalCents, float $rate): int
            {
                return $this->calculateProcessingFeeCents($subtotalCents, $rate);
            }
        };

        $this->assertSame(1999, $service->exposeToCents(19.99));
        $this->assertSame(40, $service->exposeCalculateProcessingFeeCents(1999, 0.02));
        $this->assertSame(34, $service->exposeCalculateProcessingFeeCents(1999, 0.017));
    }
}
