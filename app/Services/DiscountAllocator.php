<?php

namespace App\Services;

use App\Models\DiscountUsage;
use App\Models\sellables\Event;
use App\Models\sellables\Product;

class DiscountAllocator
{
    /**
     * Allocate discount codes to items in the cart to maximize savings.
     * Enforces the rule: One code usage per product/event type per history.
     *
     * @param  array  $items  Format: [['id' => 1, 'type' => 'event', 'quantity' => 2, ...]]
     * @param  array  $codes  List of code strings ['CODE1', 'CODE2']
     * @param  bool  $useLock  Whether to use pessimistic locking (for transactional checkout)
     */
    public function allocate(array $cartItems, array $codes, bool $useLock = false): array
    {
        // 1. Fetch all related entities to get pricing details
        // Use lockForUpdate() when inside a transaction to prevent TOCTOU race conditions
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

            if (!$entity) {
                continue;
            }

            // Determine pricing — cast to float for proper numeric comparison
            $priceWithCard = (float) ($entity->price_with_card ?? 0);
            $priceWithoutCard = (float) ($entity->price_without_card ?? $entity->price_with_card ?? 0);

            $regularPrice = $item['type'] === 'product'
                ? (float) $entity->price
                : $priceWithoutCard;

            $memberPrice = $item['type'] === 'product'
                ? (float) $entity->price
                : $priceWithCard;

            $canDiscount = false;
            $savings = 0.0;

            if ($item['type'] === 'event') {
                if ($entity->variable_amount) {
                    // Check stock for member price tier
                    $memberStock = $this->getRemainingWithCard($entity);
                    $isUnlimited = $entity->unlimited_quantity_with_card;

                    if ($isUnlimited || $memberStock > 0) {
                        if ($priceWithCard < $priceWithoutCard) {
                            $canDiscount = true;
                            $savings = $priceWithoutCard - $priceWithCard;
                            $memberPrice = $priceWithCard;
                        }
                    }
                } elseif ($priceWithCard < $priceWithoutCard) {
                    $canDiscount = true;
                    $savings = $priceWithoutCard - $priceWithCard;
                    $memberPrice = $priceWithCard;
                }
            } elseif ($item['type'] === 'product') {
                $basePrice = (float) ($entity->price_without_card ?? $entity->price);
                $productMemberPrice = $entity->price_with_card !== null ? (float) $entity->price_with_card : ($entity->member_price !== null ? (float) $entity->member_price : null);

                if ($productMemberPrice !== null && $productMemberPrice > 0 && $productMemberPrice < $basePrice) {
                    $canDiscount = true;
                    $savings = $basePrice - $productMemberPrice;
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
                    'options' => $item['options'] ?? null,
                    'original_item_index' => $item['id'] . '-' . $item['type'],
                ];
            }
        }

        // 3. Validate codes against ESNcard API (parallel HTTP calls for uncached codes)
        $cleanCodes = array_values(array_unique(array_filter($codes)));
        $esnService = new ESNcardService;
        $validationResults = $esnService->validateMany($cleanCodes);
        $validExternalCodes = array_keys(array_filter($validationResults));

        // Check discount usage history for valid codes only
        // Lock rows to prevent double-spending in concurrent requests
        $historyQuery = DiscountUsage::whereIn('code', $validExternalCodes);
        if ($useLock) {
            $historyQuery->lockForUpdate();
        }
        $history = $historyQuery->get()->groupBy('code');

        // 4. Allocate codes to units (FCFS — natural cart order)
        $allocations = [];
        $codeUsageInSession = [];

        foreach ($units as $index => &$unit) {
            if (!$unit['can_discount']) {
                continue;
            }

            foreach ($validExternalCodes as $code) {
                // Rule 1: Code must not have been used for this specific item before (globally)
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

                // Rule 2: One code per item type in this session
                $sessionKey = $code . '-' . $unit['type'] . '-' . $unit['id'];
                if (isset($codeUsageInSession[$sessionKey])) {
                    continue;
                }

                // Apply discount
                $unit['discounted_with'] = $code;
                $unit['final_price'] = $unit['member_price'];
                $codeUsageInSession[$sessionKey] = true;
                break;
            }
        }
        unset($unit);

        // 5. Reconstruct cart summary
        $totalOriginal = 0;
        $totalFinal = 0;
        $totalSavings = 0;
        $itemBreakdowns = [];

        foreach ($units as $unit) {
            $price = isset($unit['discounted_with']) ? $unit['member_price'] : $unit['regular_price'];
            $totalOriginal += $unit['regular_price'];
            $totalFinal += $price;

            $key = $unit['type'] . '-' . $unit['id'];
            if (!isset($itemBreakdowns[$key])) {
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
            'valid_codes' => $validExternalCodes,
        ];
    }

    /**
     * Compute remaining with-card stock for an Event without relying on model accessors.
     * Falls back to null (unlimited) if no quantity is set.
     */
    private function getRemainingWithCard(Event $event): ?int
    {
        if ($event->unlimited_quantity_with_card) {
            return null;
        }

        if (is_null($event->quantity_with_card)) {
            return null;
        }

        return max(0, $event->quantity_with_card - ($event->sold_count_with_card ?? 0));
    }
}
