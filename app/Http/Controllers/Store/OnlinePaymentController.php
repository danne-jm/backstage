<?php

namespace App\Http\Controllers\Store;

use App\Actions\Storefront\ProcessOnlineCheckoutAction;
use App\DTOs\Sales\SaleLinePayload;
use App\DTOs\Sales\TransactionPayload;
use App\Http\Controllers\Controller;
use App\Http\Requests\Store\CheckoutRequest;
use App\Models\Transaction;
use App\Services\Storefront\DiscountAllocator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnlinePaymentController extends Controller
{
    /**
     * Step 1: Validate cart and apply discount codes before redirecting to payment.
     * Returns JSON with calculated totals and any discount allocations.
     *
     * POST /validate-cart
     */
    public function validateCart(Request $request, DiscountAllocator $allocator): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchasable_id' => ['required', 'string'],
            'items.*.purchasable_type' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.ticket_type' => ['nullable', 'string', 'in:regular,with_membership'],
            'discount_codes' => ['nullable', 'array'],
            'discount_codes.*' => ['string'],
        ]);

        $items = collect($request->input('items'));
        $codes = $request->input('discount_codes', []);

        $allocationResult = $allocator->allocate($items, $codes);

        return response()->json([
            'valid' => empty($allocationResult['errors']),
            'items' => $allocationResult['items'],
            'discount_applied' => $allocationResult['savings'] > 0,
            'discount_savings' => $allocationResult['savings'],
            'applied_codes' => $allocationResult['applied_codes'],
            'errors' => $allocationResult['errors'],
            'message' => empty($allocationResult['errors']) ? 'Cart is valid.' : 'There are issues with the discount codes.',
        ]);
    }

    /**
     * Step 2: Initiate the checkout. Creates a pending transaction and
     * returns the payment gateway URL to redirect the customer to.
     *
     * POST /checkout
     */
    public function checkout(CheckoutRequest $request, ProcessOnlineCheckoutAction $action): JsonResponse
    {
        $saleLines = collect($request->input('items'))->map(fn (array $item) => new SaleLinePayload(
            purchasableId: $item['purchasable_id'],
            purchasableType: $item['purchasable_type'],
            unitPrice: (float) $item['unit_price'],
            quantity: (int) $item['quantity'],
            subtotal: (float) $item['subtotal'],
            ticketType: $item['ticket_type'] ?? 'regular',
            variantId: $item['variant_id'] ?? null,
            snapshot: $item['snapshot'] ?? null,
            discountCodeUsed: $item['discount_code_used'] ?? null,
        ))->all();

        $totalAmount = collect($saleLines)->sum('subtotal');

        $transactionPayload = new TransactionPayload(
            channel: 'online',
            paymentMethod: 'sumup_online',
            totalAmount: $totalAmount,
            status: 'pending',
            customerEmail: $request->input('customer_email'),
        );

        $transaction = $action->handle($transactionPayload, $saleLines);

        // TODO: Once PaymentGatewayInterface is implemented, call:
        // $paymentResult = $gateway->createPayment($transaction);
        // return response()->json(['checkout_url' => $paymentResult->checkoutUrl]);

        // Placeholder: store transaction ID in session and send customer to confirmation
        session(['pending_transaction_id' => $transaction->id]);

        return response()->json([
            'transaction_id' => $transaction->id,
            'checkout_url' => null, // Will be populated by payment gateway
            'status' => 'pending',
        ]);
    }

    /**
     * Step 3: The gateway redirects the customer here after payment.
     * Verifies the transaction status.
     *
     * GET /payment/callback
     */
    public function callback(Request $request): Response|RedirectResponse
    {
        $transactionId = $request->input('transaction_id')
            ?? session('pending_transaction_id');

        if (! $transactionId) {
            return redirect('/')->withErrors(['payment' => 'No transaction found.']);
        }

        $transaction = Transaction::find($transactionId);

        if (! $transaction) {
            return redirect('/')->withErrors(['payment' => 'Transaction not found.']);
        }

        // If already completed, go straight to confirmation
        if ($transaction->status === 'completed') {
            return to_route('store.confirmation', ['transaction_id' => $transaction->id]);
        }

        // Still pending — show a "verifying payment" interstitial page
        return Inertia::render('store/payment-verifying', [
            'transaction_id' => $transaction->id,
        ]);
    }

    /**
     * Step 4: Frontend polls this endpoint to confirm payment completion.
     * Returns the latest transaction status.
     *
     * POST /payment/verify
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'transaction_id' => ['required', 'string'],
        ]);

        $transaction = Transaction::findOrFail($request->input('transaction_id'));

        return response()->json([
            'transaction_id' => $transaction->id,
            'status' => $transaction->status,
            'completed' => $transaction->status === 'completed',
        ]);
    }

    /**
     * SumUp webhook: validates signature and marks transaction as completed/failed.
     *
     * POST /payment/webhook
     */
    public function webhook(Request $request): \Illuminate\Http\Response
    {
        // TODO: Once PaymentGatewayInterface is implemented:
        // if (!$gateway->isWebhookSignatureValid($request)) { abort(401); }
        // $gateway->handleWebhook($request->all());

        // For now, accept and process known event types
        $eventType = $request->input('event_type');
        $checkoutId = $request->input('id');

        if ($eventType === 'CHECKOUT_COMPLETED' && $checkoutId) {
            $transaction = Transaction::where('external_payment_id', $checkoutId)->first();
            $transaction?->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }

        return response('OK', 200);
    }

    /**
     * Order confirmation page.
     *
     * GET /confirmation
     */
    public function confirmation(Request $request): Response
    {
        $transactionId = $request->input('transaction_id')
            ?? session()->pull('pending_transaction_id');

        $transaction = $transactionId
            ? Transaction::with('sales.purchasable')->find($transactionId)
            : null;

        return Inertia::render('store/confirmation', [
            'transaction' => $transaction ? [
                'id' => $transaction->id,
                'status' => $transaction->status,
                'customer_email' => $transaction->customer_email,
                'total_amount' => $transaction->total_amount,
                'completed_at' => $transaction->completed_at?->toIso8601String(),
                'items' => $transaction->sales->map(fn ($s) => [
                    'name' => $s->snapshot['name'] ?? $s->purchasable?->getName(),
                    'quantity' => $s->quantity,
                    'subtotal' => $s->subtotal,
                ]),
            ] : null,
        ]);
    }
}
