<?php

namespace App\Services;

use App\Models\DiscountUsage;
use App\Models\Event;
use App\Models\Product;

class DiscountAllocator
{
    /**
     * Allocate discount codes to items in the cart to maximize savings.
     * Enforces the rule: One code usage per product/event type per history.
     *
     * @param  array  $items  Format: [['id' => 1, 'type' => 'event', 'quantity' => 2, ...]]
     * @param  array  $codes  List of code strings ['CODE1', 'CODE2']
     * @param  bool  $useLock  Whether to use pessimistic locking (for transactional checkout)
     * @return array
     */
    public function allocate(array $cartItems, array $codes, bool $useLock = false)
    {
        // 1. Fetch all related Enitities to get pricing details
        // SECURITY FIX: Use lockForUpdate() when inside a transaction to prevent TOCTOU race conditions
        $productIds = collect($cartItems)->where('type', 'product')->pluck('id')->unique();
        $eventIds = collect($cartItems)->where('type', 'event')->pluck('id')->unique();

        $productQuery = Product::whereIn('id', $productIds);
        $eventQuery = Event::whereIn('id', $eventIds);

        if ($useLock) {
            $productQuery->lockForUpdate();
            $eventQuery->lockForUpdate();
        }

        $products = $productQuery->get()->keyBy('id');
        $events = $eventQuery->get()->keyBy('id');

        // 2. Explode cart items into individual "Units" suitable for single-code application
        $units = [];
        foreach ($cartItems as $item) {
            $entity = $item['type'] === 'product' ? $products->get($item['id']) : $events->get($item['id']);

            if (! $entity) {
                continue;
            }

            // Determine pricing - IMPORTANT: Cast to float for proper numeric comparison
            // Database stores prices as decimal strings like "75.00", and PHP string comparison
            // can give wrong results (e.g., "9" > "85" as strings but 9 < 85 as numbers)
            $priceWithCard = (float) ($entity->price_with_card ?? 0);
            $priceWithoutCard = (float) ($entity->price_without_card ?? $entity->price_with_card ?? 0);
            
            $regularPrice = $item['type'] === 'product' 
                ? (float) $entity->price 
                : $priceWithoutCard;

            // Determine potential savings
            $memberPrice = $item['type'] === 'product' 
                ? (float) $entity->price 
                : $priceWithCard;

            $canDiscount = false;
            $savings = 0.0;

            if ($item['type'] === 'event') {
                if ($entity->variable_amount) {
                    // Check stock for member price
                    $memberStock = $entity->remaining_with_card ?? 0;
                    $isUnlimited = $entity->unlimited_quantity_with_card;

                    if ($isUnlimited || $memberStock > 0) {
                        // Ensure there is actually a discount
                        if ($priceWithCard < $priceWithoutCard) {
                            $canDiscount = true;
                            $savings = $priceWithoutCard - $priceWithCard;
                            $memberPrice = $priceWithCard;
                        }
                    }
                } elseif ($priceWithCard < $priceWithoutCard) {
                    // Even if not variable, if price_with_card is lower, it's discountable
                    $canDiscount = true;
                    $savings = $priceWithoutCard - $priceWithCard;
                    $memberPrice = $priceWithCard;
                }
            } elseif ($item['type'] === 'product') {
                $productMemberPrice = (float) ($entity->member_price ?? $entity->price);
                $productPrice = (float) $entity->price;
                if ($productMemberPrice < $productPrice) {
                    $canDiscount = true;
                    $savings = $productPrice - $productMemberPrice;
                    $memberPrice = $productMemberPrice;
                }
            }

            for ($i = 0; $i < $item['quantity']; $i++) {
                $units[] = [
                    'id' => $item['id'],
                    'type' => $item['type'],
                    'regular_price' => $regularPrice,
                    'member_price' => $memberPrice,
                    'savings' => $savings,
                    'can_discount' => $canDiscount,
                    'entity' => $entity,
                    'original_item_index' => $item['id'].'-'.$item['type'], // tracking
                ];
            }
        }

        // 3. (Removed Sorting - Allocator is now FCFS / Natural Order)

        // 4. Validate Codes against ESNcard API AND History
        // First, check each code against the official ESNcard API
        $cleanCodes = array_unique(array_filter($codes));
        $esnService = new ESNcardService();
        $validExternalCodes = [];
        
        foreach ($cleanCodes as $code) {
            if ($esnService->validate($code)) {
                $validExternalCodes[] = $code;
            }
        }

        // Now check history only for valid external codes
        // SECURITY FIX: Lock DiscountUsage rows to prevent double-spending in concurrent requests
        $historyQuery = DiscountUsage::whereIn('code', $validExternalCodes);
        if ($useLock) {
            $historyQuery->lockForUpdate();
        }
        $history = $historyQuery->get()->groupBy('code');

        // 5. Allocate
        $allocations = []; // Map of unit_index => code_used
        $codeUsageInSession = []; // Track code usage per item type in this session

        foreach ($units as $index => &$unit) {
            if (! $unit['can_discount']) {
                continue;
            }

            // Try to find a code from the API-validated codes
            foreach ($validExternalCodes as $code) {
                // Rule 1: Code must not be used for this specific item type by THIS user (globally)
                // History check
                $alreadyUsedHistory = false;
                if ($history->has($code)) {
                    $usages = $history->get($code);
                    foreach ($usages as $usage) {
                        if ($unit['type'] === 'event' && $usage->event_id === $unit['id']) {
                            $alreadyUsedHistory = true;
                        }
                        if ($unit['type'] === 'product' && $usage->product_id === $unit['id']) {
                            $alreadyUsedHistory = true;
                        }
                    }
                }
                if ($alreadyUsedHistory) {
                    continue;
                }

                // Rule 2: One code per item type in THIS session?
                // "ensure one code isn't repeated on the same product or event"
                // This means if I use Code A for Event X once, I can't use Code A for Event X twice in cart.
                // But I CAN use Code A for Product Y.
                $sessionKey = $code.'-'.$unit['type'].'-'.$unit['id'];
                if (isset($codeUsageInSession[$sessionKey])) {
                    continue;
                }

                // Apply!
                $unit['discounted_with'] = $code;
                $unit['final_price'] = $unit['member_price'];
                $codeUsageInSession[$sessionKey] = true;
                break; // Move to next unit
            }
        }
        unset($unit); // Break the reference to avoid PHP foreach quirk

        // 6. Reconstruct Cart Summary
        $totalOriginal = 0;
        $totalFinal = 0;
        $totalSavings = 0;
        $itemBreakdowns = [];

        foreach ($units as $unit) {
            $price = isset($unit['discounted_with']) ? $unit['member_price'] : $unit['regular_price'];
            $totalOriginal += $unit['regular_price'];
            $totalFinal += $price;

            $key = $unit['type'].'-'.$unit['id'];
            if (! isset($itemBreakdowns[$key])) {
                $itemBreakdowns[$key] = [
                    'id' => $unit['id'],
                    'type' => $unit['type'],
                    'name' => $unit['entity']->name,
                    'quantity' => 0,
                    'discounted_quantity' => 0,
                    'total_price' => 0,
                    'codes_applied' => [],
                ];
            }
            $itemBreakdowns[$key]['quantity']++;
            $itemBreakdowns[$key]['total_price'] += $price;

            if (isset($unit['discounted_with'])) {
                $itemBreakdowns[$key]['discounted_quantity']++;
                $itemBreakdowns[$key]['codes_applied'][] = $unit['discounted_with'];
                $totalSavings += $unit['savings'];
            }
        }

        return [
            'total_original' => $totalOriginal,
            'total_final' => $totalFinal,
            'total_savings' => $totalSavings,
            'breakdown' => array_values($itemBreakdowns),
            'units' => $units,
            'valid_codes' => $validExternalCodes, // Codes that passed ESNcard API validation
        ];
    }
}
