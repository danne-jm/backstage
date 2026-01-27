<?php

namespace App\Http\Controllers\Store;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\Product;
use App\Services\DiscountAllocator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OnlinePaymentController extends Controller
{
    public function __construct(
        protected DiscountAllocator $allocator,
        protected PaymentGatewayInterface $paymentGateway,
    ) {}

    /**
     * Validate cart and return discount breakdown.
     */
    public function validateCart(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'string'], // Keep string as UUIDs are strings
            'items.*.type' => ['required', 'in:product,event'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'codes' => ['nullable', 'array'],
            'codes.*' => ['string'],
        ]);

        $allocation = $this->allocator->allocate($validated['items'], $validated['codes'] ?? []);

        return response()->json($allocation);
    }

    /**
     * Process cart checkout and create online transaction with sales.
     * Creates a pending transaction and initiates payment via the configured gateway.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'string'],
            'items.*.type' => ['required', 'in:product,event'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.use_member_price' => ['nullable', 'boolean'],
            'discount_codes' => ['nullable', 'array'],
            'discount_codes.*' => ['string'],
        ]);

        $items = $validated['items'];
        $codes = $validated['discount_codes'] ?? [];

        try {
            // Process within a database transaction
            $result = DB::transaction(function () use ($items, $codes) {
                // Perform strict discount allocation with pessimistic locking
                $allocation = $this->allocator->allocate($items, $codes, true);

                // Validate stock and prepare sales data
                $salesToCreate = $this->validateStockAndPrepareSales($allocation);

                // Calculate totals
                $subtotal = collect($salesToCreate)->sum('amount');
                $processingFee = round($subtotal * config('services.sumup.processing_fee_rate', 0.02), 2);
                $totalAmount = $subtotal + $processingFee;

                // Generate secure reference ID
                $referenceId = Str::random(64);

                // Create transaction in PENDING status
                $transaction = OnlineTransaction::create([
                    'reference_id' => $referenceId,
                    'total_amount' => $totalAmount,
                    'processing_fee' => $processingFee,
                    'discount_codes' => count($codes) > 0 ? $codes : null,
                    'payment_status' => PaymentResult::STATUS_PENDING,
                    'payment_gateway' => $this->paymentGateway->getName(),
                ]);

                // Create sales records (linked to pending transaction)
                foreach ($salesToCreate as $saleData) {
                    $sale = OnlineSale::create([
                        'online_transaction_id' => $transaction->id,
                        'product_id' => $saleData['product_id'],
                        'event_id' => $saleData['event_id'],
                        'method' => 'card',
                        'amount' => $saleData['amount'],
                        'ticket_type' => $saleData['ticket_type'],
                        'sold_at' => now(),
                        'details' => [
                            'item_name' => $saleData['item_name'],
                            'ticket_type' => $saleData['ticket_type'],
                            'code_used' => $saleData['code_used'],
                        ],
                    ]);
                    \App\Events\StoreUpdated::dispatch($sale);
                }

                // Update stock counts (optimistic - will be reverted if payment fails)
                $this->updateStockCounts($salesToCreate);

                // Track discount usage
                $this->trackDiscountUsage($transaction, $salesToCreate);

                // Initiate payment via gateway
                try {
                    $paymentResult = $this->paymentGateway->createPayment($transaction, [
                        'description' => 'Store Purchase - ' . $transaction->reference_id,
                        'items' => $salesToCreate,
                    ]);
                } catch (\Exception $e) {
                    throw $e; // Re-throw to trigger rollback
                }

                // If payment initialization failed, throw exception to rollback DB transaction
                if ($paymentResult->isFailed()) {
                    throw new \Exception($paymentResult->message ?? 'Payment initialization failed');
                }

                return [
                    'transaction' => $transaction,
                    'payment_result' => $paymentResult,
                ];
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }

        $transaction = $result['transaction'];
        $paymentResult = $result['payment_result'];

        // For development gateway, auto-verify the payment
        if ($paymentResult->metadata['auto_complete'] ?? false) {
            $verifyResult = $this->paymentGateway->verifyPayment(
                $paymentResult->paymentId,
                $transaction
            );

            if ($verifyResult->isSuccessful()) {
                return response()->json([
                    'success' => true,
                    'redirect_url' => '/confirmation?bag=' . $transaction->reference_id,
                ]);
            }
        }

        // For production gateway with checkout URL
        if ($paymentResult->checkoutUrl) {
            return response()->json([
                'success' => true,
                'checkout_url' => $paymentResult->checkoutUrl,
                'payment_id' => $paymentResult->paymentId,
                'reference' => $transaction->reference_id,
            ]);
        }

        // Fallback or specific gateway logic
        return response()->json([
            'success' => true,
            'redirect_url' => '/confirmation?bag=' . $transaction->reference_id,
        ]);
    }

    /**
     * Handle payment callback/return from external gateway.
     */
    public function paymentCallback(Request $request)
    {
        $reference = $request->query('reference');
        $paymentId = $request->query('payment_id');

        if (! $reference) {
            return redirect('/cart')->with('error', 'Invalid payment callback.');
        }

        $transaction = OnlineTransaction::where('reference_id', $reference)->first();

        if (! $transaction) {
            return redirect('/cart')->with('error', 'Transaction not found.');
        }

        // Verify payment with gateway
        $paymentId = $paymentId ?? $transaction->external_payment_id;

        if ($paymentId) {
            $result = $this->paymentGateway->verifyPayment($paymentId, $transaction);

            if ($result->isSuccessful()) {
                return redirect('/confirmation?bag='.$transaction->reference_id);
            }

            if ($result->isFailed()) {
                // Revert stock counts on payment failure
                $this->revertStockCounts($transaction);

                return redirect('/cart')->with('error', $result->message ?? 'Payment failed.');
            }
        }

        // Payment still pending - redirect to waiting page or confirmation
        return redirect('/confirmation?bag='.$transaction->reference_id);
    }

    /**
     * Handle webhook from payment gateway.
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();

        $result = $this->paymentGateway->handleWebhook($payload);

        if ($result->isSuccessful()) {
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false], 400);
    }

    /**
     * Verify payment status (for polling from frontend).
     */
    public function verifyPayment(Request $request)
    {
        $reference = $request->input('reference');

        $transaction = OnlineTransaction::where('reference_id', $reference)->first();

        if (! $transaction) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }

        if ($transaction->isCompleted()) {
            return response()->json([
                'status' => 'completed',
                'redirect_url' => '/confirmation?bag='.$transaction->reference_id,
            ]);
        }

        if ($transaction->external_payment_id) {
            $result = $this->paymentGateway->verifyPayment(
                $transaction->external_payment_id,
                $transaction
            );

            return response()->json([
                'status' => $result->status,
                'redirect_url' => $result->isSuccessful()
                    ? '/confirmation?bag='.$transaction->reference_id
                    : null,
            ]);
        }

        return response()->json(['status' => $transaction->payment_status]);
    }

    /**
     * Display purchase confirmation page using secure reference ID.
     */
    public function confirmation(Request $request)
    {
        $referenceId = $request->query('bag');

        if (! $referenceId) {
            return redirect('/')->with('error', 'Invalid confirmation link.');
        }

        $transaction = OnlineTransaction::with(['sales.product', 'sales.event'])
            ->where('reference_id', $referenceId)
            ->first();

        if (! $transaction) {
            return redirect('/')->with('error', 'Transaction not found.');
        }

        $items = $transaction->sales->map(function ($sale) {
            $name = $sale->product?->name ?? $sale->event?->name ?? 'Unknown Item';
            $type = $sale->product_id ? 'product' : 'event';

            return [
                'id' => $sale->id,
                'reference_id' => $sale->reference_id,
                'name' => $name,
                'type' => $type,
                'amount' => $sale->amount,
                'ticket_type' => $sale->ticket_type,
            ];
        });

        return Inertia::render('Store/confirmation', [
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

    /**
     * Validate stock availability and prepare sales data.
     */
    protected function validateStockAndPrepareSales(array $allocation): array
    {
        $salesToCreate = [];
        $stockDemands = [];

        // Build stock demands and sales data
        foreach ($allocation['units'] as $unit) {
            $entity = $unit['entity'];
            $isDiscounted = isset($unit['discounted_with']);
            $ticketType = $isDiscounted ? 'with_card' : 'without_card';

            // Verify sellability
            if (! $entity->is_online_sellable) {
                throw ValidationException::withMessages([
                    'items' => "{$entity->name} is no longer available.",
                ]);
            }

            // Prepare sale data
            $salesToCreate[] = [
                'product_id' => $unit['type'] === 'product' ? $unit['id'] : null,
                'event_id' => $unit['type'] === 'event' ? $unit['id'] : null,
                'amount' => $unit['final_price'] ?? $unit['regular_price'],
                'ticket_type' => $unit['type'] === 'event' ? $ticketType : null,
                'item_name' => $entity->name,
                'code_used' => $unit['discounted_with'] ?? null,
                'original_price' => $unit['regular_price'],
                'saved_amount' => $unit['savings'] ?? 0,
                'is_discounted' => $isDiscounted,
            ];

            // Aggregate stock demands
            $key = $unit['type'].'-'.$unit['id'];
            if ($unit['type'] === 'event') {
                $key .= '-'.$ticketType;
            }

            if (! isset($stockDemands[$key])) {
                $stockDemands[$key] = [
                    'count' => 0,
                    'entity' => $entity,
                    'type' => $unit['type'],
                    'ticket_type' => $ticketType,
                ];
            }
            $stockDemands[$key]['count']++;
        }

        // Validate stock for each demand
        foreach ($stockDemands as $demand) {
            $this->validateStockDemand($demand);
        }

        return $salesToCreate;
    }

    /**
     * Validate a single stock demand.
     */
    protected function validateStockDemand(array $demand): void
    {
        $entity = $demand['entity'];
        $count = $demand['count'];

        if ($demand['type'] === 'product') {
            $remaining = $entity->remaining ?? 0;
            $isUnlimited = $entity->unlimited_quantity || $entity->unlimited_quantity_with_card;

            if (! $isUnlimited && $remaining < $count) {
                throw ValidationException::withMessages([
                    'stock' => "{$entity->name} is sold out or insufficient stock.",
                ]);
            }
        } else {
            // Event
            if ($demand['ticket_type'] === 'with_card') {
                $remaining = $entity->remaining_with_card;
                $isUnlimited = $entity->unlimited_quantity_with_card;

                if (! $isUnlimited && (! is_null($remaining) && $remaining < $count)) {
                    throw ValidationException::withMessages([
                        'stock' => "{$entity->name} (Member Price) is sold out.",
                    ]);
                }
            } else {
                $remaining = $entity->remaining_without_card ?? $entity->remaining;
                $isUnlimited = $entity->unlimited_quantity_without_card ?? $entity->unlimited_quantity;

                if (! $isUnlimited && (! is_null($remaining) && $remaining < $count)) {
                    throw ValidationException::withMessages([
                        'stock' => "{$entity->name} is sold out.",
                    ]);
                }
            }
        }
    }

    /**
     * Update stock counts after successful sale creation.
     */
    protected function updateStockCounts(array $salesToCreate): void
    {
        foreach ($salesToCreate as $saleData) {
            if ($saleData['event_id']) {
                if ($saleData['ticket_type'] === 'with_card') {
                    Event::where('id', $saleData['event_id'])->increment('sold_count_with_card');
                } else {
                    Event::where('id', $saleData['event_id'])->increment('sold_count_without_card');
                }
                $event = Event::find($saleData['event_id']);
                \App\Events\InventoryUpdated::dispatch($event->id, 'event', $event->remaining, $event->remaining_with_card, $event->remaining_without_card);
            }

            if ($saleData['product_id']) {
                Product::where('id', $saleData['product_id'])->increment('sold_count');
                $product = Product::find($saleData['product_id']);
                \App\Events\InventoryUpdated::dispatch($product->id, 'product', $product->remaining);
            }
        }
    }

    /**
     * Revert stock counts on payment failure.
     */
    protected function revertStockCounts(OnlineTransaction $transaction): void
    {
        foreach ($transaction->sales as $sale) {
            if ($sale->event_id) {
                if ($sale->ticket_type === 'with_card') {
                    Event::where('id', $sale->event_id)->decrement('sold_count_with_card');
                } else {
                    Event::where('id', $sale->event_id)->decrement('sold_count_without_card');
                }
            }

            if ($sale->product_id) {
                Product::where('id', $sale->product_id)->decrement('sold_count');
            }
        }
    }

    /**
     * Track discount code usage.
     */
    protected function trackDiscountUsage(OnlineTransaction $transaction, array $salesToCreate): void
    {
        foreach ($salesToCreate as $index => $saleData) {
            if ($saleData['is_discounted'] && $saleData['code_used']) {
                $sale = $transaction->sales[$index] ?? null;

                if ($sale) {
                    \App\Models\DiscountUsage::create([
                        'code' => $saleData['code_used'],
                        'online_transaction_id' => $transaction->id,
                        'online_sale_id' => $sale->id,
                        'product_id' => $saleData['product_id'],
                        'event_id' => $saleData['event_id'],
                        'original_price' => $saleData['original_price'],
                        'paid_price' => $saleData['amount'],
                        'saved_amount' => ($saleData['original_price'] - $saleData['amount']),
                        'used_at' => now(),
                    ]);
                }
            }
        }
    }
}
