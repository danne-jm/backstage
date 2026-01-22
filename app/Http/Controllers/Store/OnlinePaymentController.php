<?php

namespace App\Http\Controllers\Store;

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
    protected DiscountAllocator $allocator;

    public function __construct(DiscountAllocator $allocator)
    {
        $this->allocator = $allocator;
    }

    /**
     * Validate cart and return discount breakdown.
     */
    public function validateCart(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer'],
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
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.type' => ['required', 'in:product,event'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.use_member_price' => ['nullable', 'boolean'],
            'discount_codes' => ['nullable', 'array'],
            'discount_codes.*' => ['string'],
        ]);

        $items = $validated['items'];
        $discountCodes = $validated['discount_codes'] ?? [];
        $hasDiscount = count($discountCodes) > 0;

        return DB::transaction(function () use ($items) {

            // Perform strict discount allocation
            // SECURITY FIX: Pass useLock=true to enable pessimistic locking inside this transaction
            $codes = $validated['discount_codes'] ?? [];
            $allocation = $this->allocator->allocate($items, $codes, true);

            // Re-validate stock while we are here (allocator checks prices, but maybe not hard stock limits?)
            // Allocator checks pricing logic. We still need to verify availability.
            // Let's iterate the original items one more time for basic stock limits using the same logic as before,
            // or trust the previous implementation.
            // The previous implementation was: iterate $items.
            // We should keep the stock check logic BUT use the PRICING and TICKET TYPES determined by the allocator.

            // Actually, allocator returns 'units'. We can iterate units.
            $subtotal = 0;
            $salesToCreate = [];

            foreach ($allocation['units'] as $unit) {
                // Stock check
                $entity = $unit['entity'];
                $isDiscounted = isset($unit['discounted_with']);
                $ticketType = $isDiscounted ? 'with_card' : 'without_card';
                // For products, ticket_type is usually null unless we start supporting member price tracking clearly.
                // Current Product logic uses price vs member_price. Let's assume null for Product ticket type or 'member'.
                // If product, let's just say ticket_type is null or 'standard'/'member' for reporting.
                // But schema says ticket_type nullable.

                // Re-verify Sellability
                if (! $entity->is_online_sellable) {
                    throw ValidationException::withMessages(['items' => "{$entity->name} is no longer available."]);
                }

                // Stock Validation
                if ($unit['type'] === 'product') {
                    $isUnlimited = $entity->unlimited_quantity || $entity->unlimited_quantity_with_card; // simplifying
                    $remaining = $entity->remaining ?? 0;
                    if (! $isUnlimited && $remaining < 1) { // checking 1 unit at a time, but this loop runs Q times
                        // To avoid N queries, we should ideally aggregate.
                        // However, we are inside a transaction. The previous logic aggregated by item ID.
                        // Let's stick to the aggregator logic from before BUT apply the prices from allocator.
                    }
                    // Optimization: Use the previous loop for stock checks, and this one for pricing?
                    // Or just rely on the allocator data?
                    // Allocator calculates prices. It does not strictly check "remaining" stock for throwing exceptions (it just assigns).

                    $itemTicketType = null;
                } else {
                    // Event
                    $isUnlimited = ($ticketType === 'with_card')
                        ? ($entity->unlimited_quantity_with_card)
                        : ($entity->unlimited_quantity_without_card ?? $entity->unlimited_quantity); // fallback

                    $remaining = ($ticketType === 'with_card')
                        ? ($entity->remaining_with_card)
                        : ($entity->remaining_without_card ?? $entity->remaining);

                    // Note: This check is per-unit. If we have 3 units, we check if remaining < 1?
                    // No, "remaining" decreases as sales happen. But we haven't created sales yet.
                    // THIS IS TRICKY. The stock check logic in the previous version checked TOTAL quantity against usage.
                    // We must ensure the total requested quantity for each type doesn't exceed.
                }

                // Prepare Sale Data
                $salesToCreate[] = [
                    'product_id' => $unit['type'] === 'product' ? $unit['id'] : null,
                    'event_id' => $unit['type'] === 'event' ? $unit['id'] : null,
                    'amount' => $unit['final_price'] ?? $unit['regular_price'], // Allocator sets final_price
                    'ticket_type' => $unit['type'] === 'event' ? $ticketType : null,
                    'item_name' => $entity->name,
                    'code_used' => $unit['discounted_with'] ?? null,
                    'original_price' => $unit['regular_price'],
                    'saved_amount' => $unit['savings'] ?? 0,
                    'is_discounted' => $isDiscounted,
                ];
                $subtotal += ($unit['final_price'] ?? $unit['regular_price']);
            }

            // AGGREGATE STOCK CHECK
            // We need to count how many 'with_card' and 'without_card' we are trying to buy for each event.
            $stockDemands = [];
            foreach ($allocation['units'] as $unit) {
                $key = $unit['type'].'-'.$unit['id'];
                $ticketType = isset($unit['discounted_with']) ? 'with_card' : 'without_card';
                if ($unit['type'] === 'event') {
                    $key .= '-'.$ticketType;
                }
                if (! isset($stockDemands[$key])) {
                    $stockDemands[$key] = ['count' => 0, 'entity' => $unit['entity'], 'type' => $unit['type'], 'ticket_type' => $ticketType];
                }
                $stockDemands[$key]['count']++;
            }

            foreach ($stockDemands as $demand) {
                $entity = $demand['entity'];
                $count = $demand['count'];

                if ($demand['type'] === 'product') {
                    $remaining = $entity->remaining ?? 0;
                    $isUnlimited = $entity->unlimited_quantity || $entity->unlimited_quantity_with_card;
                    if (! $isUnlimited && $remaining < $count) {
                        throw ValidationException::withMessages(['stock' => "{$entity->name} is sold out or insufficient stock."]);
                    }
                } else {
                    // Event
                    if ($demand['ticket_type'] === 'with_card') {
                        $remaining = $entity->remaining_with_card;
                        $isUnlimited = $entity->unlimited_quantity_with_card;

                        // If not strictly unlimited, we must check remaining.
                        // But if remaining is NULL, does that mean unlimited?
                        // Model logic says: if unlimited_quantity_with_card is true, remaining is null.
                        // So checking if (!$isUnlimited) handles the null case implicitly IF we trust the flag.

                        if (! $isUnlimited && (! is_null($remaining) && $remaining < $count)) {
                            throw ValidationException::withMessages(['stock' => "{$entity->name} (Member Price) is sold out."]);
                        }
                    } else {
                        // WITHOUT CARD (or standard)
                        $remaining = $entity->remaining_without_card ?? $entity->remaining;

                        // Fix: Logical fallback for unlimited flag
                        $isUnlimited = $entity->unlimited_quantity_without_card;
                        if (is_null($isUnlimited)) {
                            $isUnlimited = $entity->unlimited_quantity;
                        }

                        // If remaining is null, it might mean unlimited or just not set (which implies 0 if not unlimited flag?)
                        // The accessor `getRemainingAttribute` returns NULL if unlimited.
                        // So if !isUnlimited, remaining SHOULD be an integer.

                        if (! $isUnlimited && (! is_null($remaining) && $remaining < $count)) {
                            throw ValidationException::withMessages(['stock' => "{$entity->name} is sold out."]);
                        }
                    }
                }
            }

            // Calculate processing fee (2%)
            $processingFee = round($subtotal * 0.02, 2);
            $totalAmount = $subtotal + $processingFee;

            // Generate secure token
            $token = Str::random(64);

            // Create transaction with secure token
            $transaction = OnlineTransaction::create([
                'token' => $token,
                'total_amount' => $totalAmount,
                'processing_fee' => $processingFee,
                'discount_codes' => count($codes) > 0 ? $codes : null,
                'completed_at' => now(),
            ]);

            // Create sales and history records
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

                // SECURITY FIX: Atomically increment sold_count to prevent overselling via snapshot isolation
                if ($saleData['event_id']) {
                    if ($saleData['ticket_type'] === 'with_card') {
                        Event::where('id', $saleData['event_id'])->increment('sold_count_with_card');
                    } else {
                        Event::where('id', $saleData['event_id'])->increment('sold_count_without_card');
                    }
                }
                if ($saleData['product_id']) {
                    Product::where('id', $saleData['product_id'])->increment('sold_count');
                }

                // Track Usage if discounted
                if ($saleData['is_discounted'] && $saleData['code_used']) {
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

            return response()->json([
                'success' => true,
                'redirect_url' => '/confirmation?bag='.$token,
            ]);
        });
    }

    /**
     * Display purchase confirmation page using secure token.
     */
    public function confirmation(Request $request)
    {
        $token = $request->query('bag');

        if (! $token) {
            return redirect('/')->with('error', 'Invalid confirmation link.');
        }

        $transaction = OnlineTransaction::with(['sales.product', 'sales.event'])
            ->where('token', $token)
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
            ],
            'items' => $items,
        ]);
    }
}
