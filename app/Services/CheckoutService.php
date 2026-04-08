<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Mail\OrderConfirmation;
use App\Models\DiscountUsage;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\SellableVariant;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        protected DiscountAllocator $allocator,
        public PaymentGatewayInterface $paymentGateway,
        protected SaleService $saleService,
        protected FinancialLedgerService $financialLedgerService,
    ) {
    }

    /**
     * Validate cart items and return the discount allocation with stock warnings.
     * Read-only — does not lock rows or mutate state.
     */
    public function validateCartWithWarnings(array $items, array $codes): array
    {
        $allocation = $this->allocator->allocate($items, $codes);

        $warnings = [];
        $stockDemands = $this->buildStockDemands($allocation['units']);

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

        return $allocation;
    }

    /**
     * Run the full checkout pipeline inside a DB transaction.
     *
     * Returns ['transaction' => OnlineTransaction, 'payment_result' => PaymentResult].
     *
     * @throws ValidationException on stock / availability failures
     * @throws \Exception on payment gateway initialization failure
     */
    public function initiateCheckout(array $items, array $codes, string $email): array
    {
        return DB::transaction(function () use ($items, $codes, $email) {
            $allocation = $this->allocator->allocate($items, $codes, true);

            $salesToCreate = $this->validateStockAndPrepareSales($allocation);

            $subtotalCents = (int) collect($salesToCreate)
                ->sum(fn(array $sale): int => $this->toCents((float) $sale['amount']));

            $processingFeeRate = (float) config('services.sumup.processing_fee_rate', 0.02);
            $processingFeeCents = $this->calculateProcessingFeeCents($subtotalCents, $processingFeeRate);

            $subtotal = $subtotalCents / 100;
            $processingFee = $processingFeeCents / 100;
            $totalAmount = ($subtotalCents + $processingFeeCents) / 100;

            $transaction = OnlineTransaction::create([
                'reference_id' => Str::random(64),
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
                        'variant_id' => $saleData['variant_id'] ?? null,
                    ],
                ]);
            }

            $this->updateStockCounts($salesToCreate);

            $transaction->refresh();
            $this->trackDiscountUsage($transaction, $salesToCreate);

            $paymentResult = $this->paymentGateway->createPayment($transaction, [
                'description' => 'Store Purchase - ' . $transaction->reference_id,
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
    }

    /**
     * Verify a payment with the gateway.
     * The status update (inside the gateway) and ledger creation are wrapped in one
     * DB transaction so they can never diverge — either both land or neither does.
     */
    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult
    {
        $wasCompleted = $transaction->isCompleted();

        return DB::transaction(function () use ($paymentId, $transaction, $wasCompleted): PaymentResult {
            $result = $this->paymentGateway->verifyPayment($paymentId, $transaction);

            $transaction->refresh();

            if (!$wasCompleted && $transaction->isCompleted()) {
                $this->financialLedgerService->recordOnlineTransactionCompleted($transaction);
            }

            return $result;
        });
    }

    /**
     * Handle a confirmed payment failure: revert stock and discount usages atomically,
     * then mark the transaction as failed.
     */
    public function handleTransactionFailure(OnlineTransaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $this->revertStockForTransaction($transaction);
            $this->revertDiscountUsagesForTransaction($transaction);
            $this->financialLedgerService->recordOnlineTransactionReversal($transaction, 'failed');
            $transaction->update(['payment_status' => PaymentResult::STATUS_FAILED]);
        });
    }

    /**
     * Revert all stock counts for every sale on a transaction.
     * Safe to call on already-reverted transactions (decrements guard against going below 0).
     */
    public function revertStockForTransaction(OnlineTransaction $transaction): void
    {
        foreach ($transaction->sales as $sale) {
            $useMemberPrice = ($sale->ticket_type === 'with_card');

            // Prefer the stored variant_id; fall back to option-matching for older sales.
            $variantId = $sale->details['variant_id'] ?? null;

            if (!$variantId && !empty($sale->details['options'])) {
                $type = $sale->product_id ? Product::class : Event::class;
                $id = $sale->product_id ?? $sale->event_id;
                $entity = $type::find($id);
                if ($entity) {
                    $variant = $entity->resolveVariantByOptions($sale->details['options']);
                    $variantId = $variant?->id;
                }
            }

            if ($sale->product_id) {
                Product::find($sale->product_id)?->revertStockForUnit($useMemberPrice, $variantId);
            } elseif ($sale->event_id) {
                Event::find($sale->event_id)?->revertStockForUnit($useMemberPrice, $variantId);
            }
        }
    }

    /**
     * Delete all DiscountUsage records tied to a transaction.
     */
    public function revertDiscountUsagesForTransaction(OnlineTransaction $transaction): void
    {
        $transaction->discountUsages()->delete();
    }

    /**
     * Handle a payment gateway webhook.
     */
    public function handleWebhook(array $data): PaymentResult
    {
        return $this->paymentGateway->handleWebhook($data);
    }

    /**
     * Dispatch the order confirmation email if not already sent. Idempotent.
     * Also links each online sale to the currently open office shift (if any).
     */
    public function dispatchConfirmationEmail(OnlineTransaction $transaction): void
    {
        // Link each online sale to the currently open office shift (if any).
        $this->attachSalesToOpenShift($transaction);

        if ($transaction->mail_success || empty($transaction->email)) {
            return;
        }

        try {
                Mail::to($transaction->email)->queue(
                    (new OrderConfirmation($transaction))
                        ->onQueue(config('mail.confirmation_queue', 'confirmations'))
                );
            $transaction->update(['mail_success' => true]);
        } catch (\Throwable $e) {
            Log::error('Order confirmation email failed', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * If an office shift is currently open, link each online sale from this transaction
     * to the shift. Preserves the original sold_at timestamp.
     *
     * Uses a pessimistic lock on the shift row so concurrent webhook completions
     * always resolve to the same shift and never produce partial or split assignments.
     */
    protected function attachSalesToOpenShift(OnlineTransaction $transaction): void
    {
        DB::transaction(function () use ($transaction): void {
            $openShift = OfficeShift::where('status', 'open')->lockForUpdate()->first();
            if (!$openShift) {
                return;
            }

            $transaction->loadMissing('sales');

            foreach ($transaction->sales as $sale) {
                if ($sale->office_shift_id === null) {
                    $sale->update(['office_shift_id' => $openShift->id]);
                }
            }
        });
    }


    // -------------------------------------------------------------------------
    // Protected helpers
    // -------------------------------------------------------------------------

    /**
     * Build a map of unique stock demands from allocation units.
     * Groups individual units by entity+ticket_type+options so we can
     * check total demand against available stock in one pass.
     */
    protected function buildStockDemands(array $units): array
    {
        $productIds = array_unique(array_column(array_filter($units, fn($u) => $u['type'] === 'product'), 'id'));
        $eventIds = array_unique(array_column(array_filter($units, fn($u) => $u['type'] === 'event'), 'id'));

        $products = Product::with('variants')->whereIn('id', $productIds)->get()->keyBy('id');
        $events = Event::whereIn('id', $eventIds)->get()->keyBy('id');

        $demands = [];

        foreach ($units as $unit) {
            $entity = $unit['type'] === 'product'
                ? ($products[$unit['id']] ?? null)
                : ($events[$unit['id']] ?? null);

            if (!$entity) {
                continue;
            }

            $ticketType = $unit['ticket_type'] ?? null;
            $options = $unit['options'] ?? null;

            $key = $unit['type'] . '_' . $unit['id'];
            if ($unit['type'] === 'event' && $ticketType) {
                $key .= '_' . $ticketType;
            }
            if (!empty($options)) {
                $opts = $options;
                ksort($opts);
                $key .= '_' . serialize($opts);
            }

            if (!isset($demands[$key])) {
                $demands[$key] = [
                    'count' => 0,
                    'entity' => $entity,
                    'type' => $unit['type'],
                    'ticket_type' => $ticketType,
                    'options' => $options,
                ];
            }
            $demands[$key]['count']++;
        }

        return $demands;
    }

    /**
     * Validate stock and prepare sales data from an allocation result.
     * Returns an array of sale rows ready for OnlineSale::create().
     *
     * @throws ValidationException on stock / availability failures
     * @throws \Exception on non-sellable items
     */
    protected function validateStockAndPrepareSales(array $allocation): array
    {
        $salesToCreate = [];
        $stockDemands = [];

        foreach ($allocation['units'] as $unit) {
            $entity = $unit['entity'];
            $isDiscounted = isset($unit['discounted_with']);
            $ticketType = $isDiscounted ? 'with_card' : 'without_card';

            if (!$entity->is_online_sellable) {
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

            $key = $unit['type'] . '-' . $unit['id'];
            if ($unit['type'] === 'event') {
                $key .= '-' . $ticketType;
            }
            if (!empty($unit['options'])) {
                $key .= '-' . md5(json_encode($unit['options']));
            }

            if (!isset($stockDemands[$key])) {
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

            $key = $type . '-' . $id;
            if ($type === 'event') {
                $key .= '-' . $sale['ticket_type'];
            }
            if (!empty($sale['options'])) {
                $key .= '-' . md5(json_encode($sale['options']));
            }

            if (isset($resolvedVariants[$key])) {
                $sale['variant_id'] = $resolvedVariants[$key];
            }
        }
        unset($sale);

        return $salesToCreate;
    }

    /**
     * Validate a single stock demand using the HasSellableStock trait methods.
     * Returns the matched SellableVariant when the entity is variant-based.
     *
     * @throws ValidationException on stock or option failures
     */
    protected function validateStockDemand(array $demand): ?SellableVariant
    {
        $entity = $demand['entity'];
        $count = $demand['count'];
        $options = $demand['options'] ?? null;
        $useMemberPrice = ($demand['ticket_type'] === 'with_card');

        if ($entity->is_variant_based) {
            if (empty($options)) {
                throw ValidationException::withMessages([
                    'items' => "{$entity->name} requires you to select an option (e.g. size/color).",
                ]);
            }

            $variant = $entity->resolveVariantByOptions($options);

            if (!$variant) {
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

        if (!empty($options)) {
            throw ValidationException::withMessages([
                'items' => "The configuration for {$entity->name} has changed. Please remove it and add it again.",
            ]);
        }

        $entity->checkMainStock($count, $useMemberPrice);

        return null;
    }

    /**
     * Atomically increment sold counts for all sales using the HasSellableStock trait.
     *
     * @throws \Exception on race-condition sold-out
     */
    protected function updateStockCounts(array $salesToCreate): void
    {
        $variantCounts = [];
        $eventCounts = [];
        $productCounts = [];

        foreach ($salesToCreate as $saleData) {
            if (!empty($saleData['variant_id'])) {
                $variantId = $saleData['variant_id'];
                $variantCounts[$variantId] = ($variantCounts[$variantId] ?? 0) + 1;
            }

            $useMemberPrice = ($saleData['ticket_type'] === 'with_card');

            if ($saleData['event_id']) {
                $key = $saleData['event_id'] . '_' . ($useMemberPrice ? 'card' : 'no');
                if (!isset($eventCounts[$key])) {
                    $eventCounts[$key] = ['id' => $saleData['event_id'], 'useMemberPrice' => $useMemberPrice, 'count' => 0];
                }
                $eventCounts[$key]['count']++;
            } elseif ($saleData['product_id']) {
                $key = $saleData['product_id'] . '_' . ($useMemberPrice ? 'card' : 'no');
                if (!isset($productCounts[$key])) {
                    $productCounts[$key] = ['id' => $saleData['product_id'], 'useMemberPrice' => $useMemberPrice, 'count' => 0];
                }
                $productCounts[$key]['count']++;
            }
        }

        foreach ($variantCounts as $id => $count) {
            $updated = SellableVariant::where('id', $id)
                ->whereRaw('(quantity IS NULL OR sold_count + ? <= quantity)', [$count])
                ->increment('sold_count', $count);

            if (!$updated) {
                throw new \Exception('One or more items became sold out during processing.');
            }
        }

        foreach ($eventCounts as $data) {
            $event = Event::findOrFail($data['id']);
            $updated = $event->incrementMainSoldCount($data['useMemberPrice'], $data['count']);
            if (!$updated) {
                throw new \Exception('Event tickets sold out during processing.');
            }
        }

        foreach ($productCounts as $data) {
            $product = Product::findOrFail($data['id']);
            $updated = $product->incrementMainSoldCount($data['useMemberPrice'], $data['count']);
            if (!$updated) {
                throw new \Exception('Product sold out during processing.');
            }
        }

        // Bust the shop caches so stock changes are immediately visible.
        Cache::forget('shop_index');
        foreach ($eventCounts as $data) {
            Cache::forget("shop_item_event_{$data['id']}");
        }
        foreach ($productCounts as $data) {
            Cache::forget("shop_item_product_{$data['id']}");
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

    /**
     * Convert a decimal money value to integer cents with deterministic rounding.
     */
    protected function toCents(float $amount): int
    {
        return (int) round($amount * 100, 0, PHP_ROUND_HALF_UP);
    }

    /**
     * Calculate fee in cents using basis points to avoid float accumulation errors.
     */
    protected function calculateProcessingFeeCents(int $subtotalCents, float $rate): int
    {
        $basisPoints = (int) round($rate * 10000, 0, PHP_ROUND_HALF_UP);

        return (int) round(($subtotalCents * $basisPoints) / 10000, 0, PHP_ROUND_HALF_UP);
    }
}
