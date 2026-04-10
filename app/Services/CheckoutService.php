<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Jobs\SendConfirmationEmail;
use App\Models\DiscountUsage;
use App\Models\OfficeShift;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\SellableVariant;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
     * When the transaction first transitions to completed, online sales are immediately
     * bound to the currently open office shift (if any).
     */
    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult
    {
        $wasCompleted = $transaction->isCompleted();

        return DB::transaction(function () use ($paymentId, $transaction, $wasCompleted): PaymentResult {
            $result = $this->paymentGateway->verifyPayment($paymentId, $transaction);

            $transaction->refresh();

            if (!$wasCompleted && $transaction->isCompleted()) {
                $this->financialLedgerService->recordOnlineTransactionCompleted($transaction);
                $this->attachSalesToOpenShift($transaction);
            }

            return $result;
        });
    }

    /**
     * Handle a confirmed payment failure: revert discount usages atomically,
     * then mark the transaction as failed.
     *
     * Stock is self-healing: sold counts are computed from actual sale records,
     * and failed transactions are excluded from those counts automatically.
     */
    public function handleTransactionFailure(OnlineTransaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $this->revertDiscountUsagesForTransaction($transaction);
            $this->financialLedgerService->recordOnlineTransactionReversal($transaction, 'failed');
            $transaction->update(['payment_status' => PaymentResult::STATUS_FAILED]);
        });
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
     * Enqueues a SendConfirmationEmail job — mail_success stays false until
     * the job actually sends successfully, giving accurate status in the UI.
     */
    public function dispatchConfirmationEmail(OnlineTransaction $transaction): void
    {
        if ($transaction->mail_success || empty($transaction->email)) {
            return;
        }

        try {
            SendConfirmationEmail::dispatch($transaction->id);
        } catch (\Throwable $e) {
            Log::error('Order confirmation email failed to dispatch', [
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

            // Infer ticket_type the same way validateStockAndPrepareSales does:
            // discounted units go into the with_card pool, undiscounted into without_card.
            $ticketType = $unit['ticket_type'] ?? null;
            if ($unit['type'] === 'event' && $ticketType === null) {
                $ticketType = isset($unit['discounted_with']) ? 'with_card' : 'without_card';
            }
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

            if ($variant->quantity !== null && $variant->computedSoldCount() + $count > $variant->quantity) {
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
     * Verify that stock is still available after OnlineSale records have been created.
     *
     * OnlineSale rows are already committed to the DB (within the enclosing transaction),
     * so computedSoldCount() naturally includes this request's sales. We lock each
     * sellable/variant row to prevent concurrent checkouts from racing past capacity.
     *
     * @throws \Exception if any sellable is over capacity
     */
    protected function updateStockCounts(array $salesToCreate): void
    {
        $variantIds = [];
        $eventIds = [];
        $productIds = [];

        foreach ($salesToCreate as $saleData) {
            if (!empty($saleData['variant_id'])) {
                $variantIds[] = $saleData['variant_id'];
            }
            if ($saleData['event_id']) {
                $eventIds[] = $saleData['event_id'];
            } elseif ($saleData['product_id']) {
                $productIds[] = $saleData['product_id'];
            }
        }

        foreach (array_unique($variantIds) as $id) {
            $variant = SellableVariant::lockForUpdate()->findOrFail($id);
            if ($variant->quantity !== null && $variant->computedSoldCount() > $variant->quantity) {
                throw new \Exception('One or more items became sold out during processing.');
            }
        }

        foreach (array_unique($eventIds) as $id) {
            $event = Event::lockForUpdate()->findOrFail($id);
            if (!$event->unlimited_quantity_with_card && $event->quantity_with_card !== null
                && $event->computedSoldWithCard() > $event->quantity_with_card) {
                throw new \Exception('Event member-price tickets sold out during processing.');
            }
            $qtyWithout = $event->quantity_without_card ?? $event->quantity;
            $unlimitedWithout = $event->unlimited_quantity_without_card ?? $event->unlimited_quantity;
            if (!$unlimitedWithout && $qtyWithout !== null
                && $event->computedSoldWithoutCard() > $qtyWithout) {
                throw new \Exception('Event tickets sold out during processing.');
            }
        }

        foreach (array_unique($productIds) as $id) {
            $product = Product::lockForUpdate()->findOrFail($id);
            if (!$product->unlimited_quantity && $product->quantity !== null
                && $product->computedSoldCount() > $product->quantity) {
                throw new \Exception('Product sold out during processing.');
            }
        }

        // Bust the shop caches so stock changes are immediately visible.
        Cache::forget('shop_index');
        foreach (array_unique($eventIds) as $id) {
            Cache::forget("shop_item_event_{$id}");
            Event::bustSoldCountCache($id);
        }
        foreach (array_unique($productIds) as $id) {
            Cache::forget("shop_item_product_{$id}");
            Product::bustSoldCountCache($id);
        }
        foreach (array_unique($variantIds) as $id) {
            SellableVariant::bustSoldCountCache($id);
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
