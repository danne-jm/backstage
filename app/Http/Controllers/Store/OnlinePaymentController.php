<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\OnlineCheckoutRequest;
use App\Http\Requests\Store\OnlineValidateCartRequest;
use App\Models\OnlineTransaction;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Services\CheckoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OnlinePaymentController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService,
    ) {
    }

    /**
     * Validate cart and return discount breakdown + stock warnings.
     */
    public function validateCart(OnlineValidateCartRequest $request)
    {
        $validated = $request->validated();

        $allocation = $this->checkoutService->validateCartWithWarnings(
            $validated['items'],
            $validated['codes'] ?? []
        );

        return response()->json($allocation);
    }

    /**
     * Process checkout: create pending transaction, deduct stock, initiate payment.
     */
    public function checkout(OnlineCheckoutRequest $request)
    {
        $validated = $request->validated();

        try {
            $result = $this->checkoutService->initiateCheckout(
                $validated['items'],
                $validated['discount_codes'] ?? [],
                $validated['email']
            );
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }

        $transaction = $result['transaction'];
        $paymentResult = $result['payment_result'];

        if ($paymentResult->metadata['auto_complete'] ?? false) {
            $verifyResult = $this->checkoutService->verifyPayment(
                $paymentResult->paymentId,
                $transaction
            );

            if ($verifyResult->isSuccessful()) {
                $this->checkoutService->dispatchConfirmationEmail($transaction->fresh());

                return response()->json([
                    'success' => true,
                    'redirect_url' => '/confirmation?bag=' . $transaction->reference_id,
                ]);
            }
        }

        if ($paymentResult->checkoutUrl) {
            return response()->json([
                'success' => true,
                'checkout_url' => $paymentResult->checkoutUrl,
                'payment_id' => $paymentResult->paymentId,
                'reference' => $transaction->reference_id,
            ]);
        }

        return response()->json([
            'success' => true,
            'redirect_url' => '/confirmation?bag=' . $transaction->reference_id,
        ]);
    }

    /**
     * Handle payment callback from external gateway.
     */
    public function paymentCallback(Request $request)
    {
        $reference = $request->query('reference');
        $paymentId = $request->query('payment_id');

        if (!$reference) {
            return redirect('/cart')->with('error', 'Invalid payment callback.');
        }

        $transaction = OnlineTransaction::where('reference_id', $reference)->lockForUpdate()->first();

        if (!$transaction) {
            return redirect('/cart')->with('error', 'Transaction not found.');
        }

        $paymentId = $paymentId ?? $transaction->external_payment_id;

        if ($paymentId) {
            $result = $this->checkoutService->verifyPayment($paymentId, $transaction);

            if ($result->isSuccessful()) {
                $this->checkoutService->dispatchConfirmationEmail($transaction->fresh());

                return redirect('/confirmation?bag=' . $transaction->reference_id);
            }

            if ($result->isFailed()) {
                $this->checkoutService->handleTransactionFailure($transaction);

                return redirect('/cart')->with('error', $result->message ?? 'Payment failed.');
            }
        }

        return redirect('/confirmation?bag=' . $transaction->reference_id);
    }

    /**
     * Handle webhook from payment gateway.
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('X-SumUp-Signature') ?? '';

        // Verify signature if a secret is configured or if we're in production
        if (!$this->checkoutService->paymentGateway->isWebhookSignatureValid($request->getContent(), $signature)) {
            Log::warning('SumUp webhook signature verification failed', [
                'ip' => $request->ip(),
                'signature' => $signature,
            ]);

            return response()->json(['success' => false, 'error' => 'Invalid signature'], 401);
        }

        $result = $this->checkoutService->handleWebhook($request->all());

        if ($result->isSuccessful()) {
            $externalId = $result->paymentId;

            $transaction = OnlineTransaction::where('external_payment_id', $externalId)
                ->lockForUpdate()
                ->first();

            if ($transaction && $transaction->isPending()) {
                $verifyResult = $this->checkoutService->verifyPayment($externalId, $transaction);

                if ($verifyResult->isSuccessful()) {
                    $this->checkoutService->dispatchConfirmationEmail($transaction->fresh());
                }
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Poll payment status (frontend polling).
     */
    public function verifyPayment(Request $request)
    {
        $reference = $request->input('reference');
        $transaction = OnlineTransaction::where('reference_id', $reference)->lockForUpdate()->first();

        if (!$transaction) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }

        if ($transaction->isCompleted()) {
            return response()->json([
                'status' => 'completed',
                'redirect_url' => '/confirmation?bag=' . $transaction->reference_id,
            ]);
        }

        if ($transaction->external_payment_id) {
            $result = $this->checkoutService->verifyPayment(
                $transaction->external_payment_id,
                $transaction
            );

            return response()->json([
                'status' => $result->status,
                'redirect_url' => $result->isSuccessful()
                    ? '/confirmation?bag=' . $transaction->reference_id
                    : null,
            ]);
        }

        return response()->json(['status' => $transaction->payment_status]);
    }

    /**
     * Display purchase confirmation page.
     */
    public function confirmation(Request $request)
    {
        $referenceId = $request->query('bag');

        if (!$referenceId) {
            return redirect('/')->with('error', 'Invalid confirmation link.');
        }

        $transaction = OnlineTransaction::with('sales')
            ->where('reference_id', $referenceId)
            ->first();

        if (!$transaction) {
            return redirect('/')->with('error', 'Transaction not found.');
        }

        $productIds = $transaction->sales->pluck('product_id')->filter()->unique();
        $eventIds = $transaction->sales->pluck('event_id')->filter()->unique();
        $productNames = Product::whereIn('id', $productIds)->pluck('name', 'id');
        $eventNames = Event::whereIn('id', $eventIds)->pluck('name', 'id');

        $items = $transaction->sales->map(function ($sale) use ($productNames, $eventNames) {
            $name = $sale->product_id
                ? ($productNames[$sale->product_id] ?? 'Unknown Item')
                : ($eventNames[$sale->event_id] ?? 'Unknown Item');

            return [
                'id' => $sale->id,
                'reference_id' => $sale->reference_id,
                'name' => $name,
                'type' => $sale->product_id ? 'product' : 'event',
                'amount' => $sale->amount,
                'ticket_type' => $sale->ticket_type,
                'variant_options' => $sale->details['options'] ?? null,
                'code_used' => $sale->details['code_used'] ?? null,
            ];
        });

        return Inertia::render('confirmation', [
            'transaction' => [
                'id' => $transaction->id,
                'total_amount' => $transaction->total_amount,
                'processing_fee' => $transaction->processing_fee,
                'discount_codes' => $transaction->discount_codes,
                'completed_at' => $transaction->completed_at?->toIso8601String(),
                'payment_status' => $transaction->payment_status,
            ],
            'items' => $items,
        ]);
    }
}
