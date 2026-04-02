<?php

namespace App\Http\Controllers\Store;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Http\Controllers\Controller;
use App\Mail\OrderConfirmation;
use App\Models\DiscountUsage;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\SellableVariant;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Services\DiscountAllocator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
     * Validate cart and return discount breakdown + stock warnings.
     */
    public function validateCart(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'string'],
            'items.*.type' => ['required', 'in:product,event'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.options' => ['nullable', 'array'],
            'codes' => ['nullable', 'array'],
            'codes.*' => ['string'],
        ]);

        $allocation = $this->allocator->allocate($validated['items'], $validated['codes'] ?? []);

        $warnings = [];
        $stockDemands = [];

        $productIds = array_unique(array_column(
            array_filter($allocation['units'], fn ($u) => $u['type'] === 'product'), 'id'
        ));
        $eventIds = array_unique(array_column(
            array_filter($allocation['units'], fn ($u) => $u['type'] === 'event'), 'id'
        ));

        $products = Product::with('variants')->whereIn('id', $productIds)->get()->keyBy('id');
        $events = Event::whereIn('id', $eventIds)->get()->keyBy('id');

        foreach ($allocation['units'] as $unit) {
            $entity = $unit['type'] === 'product'
                ? ($products[$unit['id']] ?? null)
                : ($events[$unit['id']] ?? null);

            if (! $entity) {
                $warnings[] = "Item not found.";
                continue;
            }

            $ticketType = $unit['ticket_type'] ?? null;
            $options = $unit['options'] ?? null;

            $key = $unit['type'].'_'.$unit['id'];
            if ($unit['type'] === 'event' && $ticketType) {
                $key .= '_'.$ticketType;
            }
            if (! empty($options)) {
                $opts = $options;
                ksort($opts);
                $key .= '_'.serialize($opts);
            }

            if (! isset($stockDemands[$key])) {
                $stockDemands[$key] = [
                    'count' => 0,
                    'entity' => $entity,
                    'type' => $unit['type'],
                    'ticket_type' => $ticketType,
                    'options' => $options,
                ];
            }
            $stockDemands[$key]['count']++;
        }

        foreach ($stockDemands as $demand) {
            try {
                $this->validateStockDemand($demand);
            } catch (ValidationException $e) {
                foreach ($e->errors() as $messages) {
                    foreach ($messages as $message) {
                        $warnings[] = $message;
                    }
                }
            }
        }

        $allocation['warnings'] = array_values(array_unique($warnings));

        return response()->json($allocation);
    }

    /**
     * Process checkout: create pending transaction, deduct stock, initiate payment.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'string'],
            'items.*.type' => ['required', 'in:product,event'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.options' => ['nullable', 'array'],
            'items.*.use_member_price' => ['nullable', 'boolean'],
            'discount_codes' => ['nullable', 'array'],
            'discount_codes.*' => ['string'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $items = $validated['items'];
        $codes = $validated['discount_codes'] ?? [];
        $email = $validated['email'];

        try {
            $result = DB::transaction(function () use ($items, $codes, $email) {
                $allocation = $this->allocator->allocate($items, $codes, true);

                $salesToCreate = $this->validateStockAndPrepareSales($allocation);

                $subtotal = collect($salesToCreate)->sum('amount');
                $processingFee = round($subtotal * config('services.sumup.processing_fee_rate', 0.02), 2);
                $totalAmount = $subtotal + $processingFee;

                $referenceId = Str::random(64);

                $transaction = OnlineTransaction::create([
                    'reference_id' => $referenceId,
                    'total_amount' => $totalAmount,
                    'processing_fee' => $processingFee,
                    'discount_codes' => count($codes) > 0 ? $codes : null,
                    'payment_status' => PaymentResult::STATUS_PENDING,
                    'payment_gateway' => $this->paymentGateway->getName(),
                    'email' => $email,
                    'mail_success' => false,
                ]);

                foreach ($salesToCreate as $saleData) {
                    OnlineSale::create([
                        'online_transaction_id' => $transaction->id,
                        'reference_id' => strtoupper(Str::random(10)),
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
                            'options' => $saleData['options'] ?? null,
                        ],
                    ]);
                }

                $this->updateStockCounts($salesToCreate);

                $transaction->refresh();
                $this->trackDiscountUsage($transaction, $salesToCreate);

                $paymentResult = $this->paymentGateway->createPayment($transaction, [
                    'description' => 'Store Purchase - '.$transaction->reference_id,
                    'items' => $salesToCreate,
                ]);

                if ($paymentResult->isFailed()) {
                    throw new \Exception($paymentResult->message ?? 'Payment initialization failed');
                }

                return [
                    'transaction' => $transaction,
                    'payment_result' => $paymentResult,
                ];
            });
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
            $verifyResult = $this->paymentGateway->verifyPayment(
                $paymentResult->paymentId,
                $transaction
            );

            if ($verifyResult->isSuccessful()) {
                $this->dispatchConfirmationEmail($transaction->fresh());

                return response()->json([
                    'success' => true,
                    'redirect_url' => '/confirmation?bag='.$transaction->reference_id,
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
            'redirect_url' => '/confirmation?bag='.$transaction->reference_id,
        ]);
    }

    /**
     * Handle payment callback from external gateway.
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

        $paymentId = $paymentId ?? $transaction->external_payment_id;

        if ($paymentId) {
            $result = $this->paymentGateway->verifyPayment($paymentId, $transaction);

            if ($result->isSuccessful()) {
                $this->dispatchConfirmationEmail($transaction->fresh());

                return redirect('/confirmation?bag='.$transaction->reference_id);
            }

            if ($result->isFailed()) {
                $this->revertStockCounts($transaction);
                return redirect('/cart')->with('error', $result->message ?? 'Payment failed.');
            }
        }

        return redirect('/confirmation?bag='.$transaction->reference_id);
    }

    /**
     * Handle webhook from payment gateway.
     */
    public function webhook(Request $request)
    {
        $result = $this->paymentGateway->handleWebhook($request->all());

        return $result->isSuccessful()
            ? response()->json(['success' => true])
            : response()->json(['success' => false], 400);
    }

    /**
     * Poll payment status (frontend polling).
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
     * Display purchase confirmation page.
     */
    public function confirmation(Request $request)
    {
        $referenceId = $request->query('bag');

        if (! $referenceId) {
            return redirect('/')->with('error', 'Invalid confirmation link.');
        }

        $transaction = OnlineTransaction::with('sales')
            ->where('reference_id', $referenceId)
            ->first();

        if (! $transaction) {
            return redirect('/')->with('error', 'Transaction not found.');
        }

        // Eager-load sellables for each sale
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

    /**
     * Validate stock and prepare sales data from allocation result.
     */
    protected function validateStockAndPrepareSales(array $allocation): array
    {
        $salesToCreate = [];
        $stockDemands = [];

        foreach ($allocation['units'] as $unit) {
            $entity = $unit['entity'];
            $isDiscounted = isset($unit['discounted_with']);
            $ticketType = $isDiscounted ? 'with_card' : 'without_card';

            if (! $entity->is_online_sellable) {
                throw ValidationException::withMessages([
                    'items' => "{$entity->name} is no longer available.",
                ]);
            }

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
                'options' => $unit['options'] ?? null,
            ];

            $key = $unit['type'].'-'.$unit['id'];
            if ($unit['type'] === 'event') {
                $key .= '-'.$ticketType;
            }
            if (! empty($unit['options'])) {
                $key .= '-'.md5(json_encode($unit['options']));
            }

            if (! isset($stockDemands[$key])) {
                $stockDemands[$key] = [
                    'count' => 0,
                    'entity' => $entity,
                    'type' => $unit['type'],
                    'ticket_type' => $ticketType,
                    'options' => $unit['options'] ?? null,
                ];
            }
            $stockDemands[$key]['count']++;
        }

        $resolvedVariants = [];
        foreach ($stockDemands as $key => $demand) {
            $variant = $this->validateStockDemand($demand);
            if ($variant) {
                $resolvedVariants[$key] = $variant->id;
            }
        }

        foreach ($salesToCreate as &$sale) {
            $type = $sale['product_id'] ? 'product' : 'event';
            $id = $sale['product_id'] ?? $sale['event_id'];

            $key = $type.'-'.$id;
            if ($type === 'event') {
                $key .= '-'.$sale['ticket_type'];
            }
            if (! empty($sale['options'])) {
                $key .= '-'.md5(json_encode($sale['options']));
            }

            if (isset($resolvedVariants[$key])) {
                $sale['variant_id'] = $resolvedVariants[$key];
            }
        }
        unset($sale);

        return $salesToCreate;
    }

    /**
     * Validate a single stock demand. Returns the matched variant if applicable.
     */
    protected function validateStockDemand(array $demand): ?SellableVariant
    {
        $entity = $demand['entity'];
        $count = $demand['count'];
        $options = $demand['options'] ?? null;

        if ($entity->is_variant_based && empty($options)) {
            throw ValidationException::withMessages([
                'items' => "{$entity->name} requires you to select an option (e.g. size/color).",
            ]);
        }

        if (! $entity->is_variant_based && ! empty($options)) {
            throw ValidationException::withMessages([
                'items' => "The configuration for {$entity->name} has changed. Please remove it and add it again.",
            ]);
        }

        if ($entity->is_variant_based && $options) {
            $variants = $entity->variants instanceof \Illuminate\Database\Eloquent\Collection
                ? $entity->variants
                : $entity->variants()->get();

            $variant = $variants->first(function ($v) use ($options) {
                $vOpts = $v->options;
                if (count($vOpts) !== count($options)) {
                    return false;
                }
                foreach ($options as $k => $val) {
                    if (! isset($vOpts[$k]) || $vOpts[$k] !== $val) {
                        return false;
                    }
                }
                return true;
            });

            if (! $variant) {
                throw ValidationException::withMessages([
                    'stock' => "Variant not available for {$entity->name}.",
                ]);
            }

            if ($variant->quantity !== null && ($variant->quantity - ($variant->sold_count ?? 0)) < $count) {
                throw ValidationException::withMessages([
                    'stock' => "Insufficient stock for variant of {$entity->name}.",
                ]);
            }

            return $variant;
        }

        if ($demand['type'] === 'product') {
            if (! $entity->unlimited_quantity && ! is_null($entity->quantity)) {
                $remaining = max(0, $entity->quantity - ($entity->sold_count ?? 0));
                if ($remaining < $count) {
                    throw ValidationException::withMessages([
                        'stock' => "Insufficient stock for {$entity->name}.",
                    ]);
                }
            }
        } else {
            if ($demand['ticket_type'] === 'with_card') {
                $unlimited = $entity->unlimited_quantity_with_card;
                if (! $unlimited && ! is_null($entity->quantity_with_card)) {
                    $remaining = max(0, $entity->quantity_with_card - ($entity->sold_count_with_card ?? 0));
                    if ($remaining < $count) {
                        throw ValidationException::withMessages([
                            'stock' => "Insufficient member-price tickets for {$entity->name}.",
                        ]);
                    }
                }
            } else {
                $unlimited = $entity->unlimited_quantity_without_card ?? $entity->unlimited_quantity;
                $qty = $entity->quantity_without_card ?? $entity->quantity;
                $sold = $entity->sold_count_without_card ?? 0;
                if (! $unlimited && ! is_null($qty)) {
                    $remaining = max(0, $qty - $sold);
                    if ($remaining < $count) {
                        throw ValidationException::withMessages([
                            'stock' => "Insufficient stock for {$entity->name}.",
                        ]);
                    }
                }
            }
        }

        return null;
    }

    /**
     * Atomically decrement stock counts after creating sales.
     */
    protected function updateStockCounts(array $salesToCreate): void
    {
        foreach ($salesToCreate as $saleData) {
            if (! empty($saleData['variant_id'])) {
                $updated = SellableVariant::where('id', $saleData['variant_id'])
                    ->whereRaw('(quantity IS NULL OR sold_count + 1 <= quantity)')
                    ->increment('sold_count');

                if (! $updated) {
                    throw new \Exception('One or more items became sold out during processing.');
                }
            }

            if ($saleData['event_id']) {
                if ($saleData['ticket_type'] === 'with_card') {
                    $updated = Event::where('id', $saleData['event_id'])
                        ->whereRaw('(unlimited_quantity_with_card = 1 OR quantity_with_card IS NULL OR sold_count_with_card + 1 <= quantity_with_card)')
                        ->increment('sold_count_with_card');
                } else {
                    $updated = Event::where('id', $saleData['event_id'])
                        ->whereRaw('(unlimited_quantity_without_card = 1 OR quantity_without_card IS NULL OR sold_count_without_card + 1 <= quantity_without_card)')
                        ->increment('sold_count_without_card');
                }

                if (! $updated) {
                    throw new \Exception('Event tickets sold out during processing.');
                }
            }

            if ($saleData['product_id']) {
                $updated = Product::where('id', $saleData['product_id'])
                    ->whereRaw('(unlimited_quantity = 1 OR quantity IS NULL OR sold_count + 1 <= quantity)')
                    ->increment('sold_count');

                if (! $updated) {
                    throw new \Exception('Product sold out during processing.');
                }
            }
        }
    }

    /**
     * Revert stock counts on payment failure.
     */
    protected function revertStockCounts(OnlineTransaction $transaction): void
    {
        foreach ($transaction->sales as $sale) {
            $options = $sale->details['options'] ?? null;

            if ($options) {
                $type = $sale->product_id
                    ? \App\Models\sellables\Product::class
                    : \App\Models\sellables\Event::class;
                $id = $sale->product_id ?? $sale->event_id;

                $variant = SellableVariant::where('sellable_type', $type)
                    ->where('sellable_id', $id)
                    ->get()
                    ->first(function ($v) use ($options) {
                        $vOpts = $v->options;
                        if (count($vOpts) !== count($options)) {
                            return false;
                        }
                        foreach ($options as $k => $val) {
                            if (! isset($vOpts[$k]) || $vOpts[$k] !== $val) {
                                return false;
                            }
                        }
                        return true;
                    });

                if ($variant) {
                    $variant->decrement('sold_count');
                }
            }

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
     * Dispatch the order confirmation email if not already sent.
     */
    protected function dispatchConfirmationEmail(OnlineTransaction $transaction): void
    {
        if ($transaction->mail_success || empty($transaction->email)) {
            return;
        }

        try {
            Mail::to($transaction->email)->sendNow(new OrderConfirmation($transaction));
            $transaction->update(['mail_success' => true]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Order confirmation email failed', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Record discount code usage for each discounted sale.
     */
    protected function trackDiscountUsage(OnlineTransaction $transaction, array $salesToCreate): void
    {
        $sales = $transaction->sales()->get();

        foreach ($salesToCreate as $index => $saleData) {
            if ($saleData['is_discounted'] && $saleData['code_used']) {
                $sale = $sales[$index] ?? null;

                if ($sale) {
                    DiscountUsage::create([
                        'code' => $saleData['code_used'],
                        'online_transaction_id' => $transaction->id,
                        'online_sale_id' => $sale->id,
                        'product_id' => $saleData['product_id'],
                        'event_id' => $saleData['event_id'],
                        'original_price' => $saleData['original_price'],
                        'paid_price' => $saleData['amount'],
                        'saved_amount' => $saleData['original_price'] - $saleData['amount'],
                        'used_at' => now(),
                    ]);
                }
            }
        }
    }
}
