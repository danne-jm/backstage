<?php

namespace App\Services\Storefront\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\DTOs\Storefront\PaymentResult;
use App\Models\Transaction;
use App\Services\Ledger\FinancialLedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DevelopmentPaymentGateway implements PaymentGatewayInterface
{
    public function __construct(
        protected FinancialLedgerService $ledgerService
    ) {}

    public function createPayment(Transaction $transaction): PaymentResult
    {
        $mockId = 'DEV_PAYMENT_'.Str::random(10);

        $transaction->update([
            'external_payment_id' => $mockId,
            // Automatically complete it in dev mode
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->ledgerService->recordOnlineTransactionCompleted($transaction);

        // Redirect directly to the callback since it's dev
        $checkoutUrl = route('store.payment.callback', ['transaction_id' => $transaction->id]);

        return new PaymentResult(
            status: 'completed',
            paymentId: $mockId,
            checkoutUrl: $checkoutUrl,
        );
    }

    public function verifyPayment(string $paymentId): PaymentResult
    {
        return new PaymentResult(status: 'completed', paymentId: $paymentId);
    }

    public function handleWebhook(Request $request): void
    {
        // No-op for dev
    }

    public function isWebhookSignatureValid(Request $request): bool
    {
        return true;
    }

    public function refund(Transaction $transaction): PaymentResult
    {
        $transaction->update([
            'status' => 'refunded',
        ]);

        $this->ledgerService->recordOnlineTransactionReversal($transaction);

        return new PaymentResult(status: 'refunded');
    }
}
