<?php

namespace App\Services\Storefront;

use App\Models\DiscountUsage;
use App\Models\Event;
use App\Models\Product;
use App\Services\Integrations\ESNcardService;
use Illuminate\Support\Collection;

class DiscountAllocator
{
    public function __construct(
        protected ESNcardService $esncardService
    ) {}

    /**
     * Process the cart and allocate discount codes optimally.
     *
     * @param  Collection  $items  The cart items array (each containing id, type, quantity, ticket_type)
     * @param  array  $providedCodes  List of raw discount codes provided by the user
     * @return array Contains 'items' (mutated with discounts applied), 'savings', 'applied_codes', 'errors'
     */
    public function allocate(Collection $items, array $providedCodes): array
    {
        $codes = array_values(array_unique(array_filter(array_map('trim', $providedCodes))));

        $results = [
            'items' => [],
            'savings' => 0.0,
            'applied_codes' => [],
            'errors' => [],
        ];

        // 1. Pre-validate codes via external API concurrently
        $validities = $this->esncardService->validateMany($codes);
        $validCodes = [];
        foreach ($validities as $code => $isValid) {
            if ($isValid) {
                $validCodes[] = $code;
            } else {
                $results['errors'][] = "The ESNcard code '{$code}' is invalid or inactive.";
            }
        }

        // 2. Process cart items. We'll flatten them into individual units for easier 1-to-1 allocation.
        $units = collect();
        foreach ($items as $index => $item) {
            $model = match ($item['purchasable_type']) {
                'event', Event::class => Event::find($item['purchasable_id']),
                'product', Product::class => Product::find($item['purchasable_id']),
                default => null,
            };

            if (! $model) {
                continue;
            }

            $regularPrice = $model->price_without_membership ?? $model->getPrice();
            $memberPrice = $model->price_with_membership ?? $model->getPrice();

            // Only consider for discount if the item has a variable amount (dual pricing)
            $isDiscountable = $model->variable_amount && ($regularPrice > $memberPrice);

            for ($i = 0; $i < $item['quantity']; $i++) {
                $units->push([
                    'cart_index' => $index,
                    'purchasable_id' => $model->id,
                    'purchasable_type' => get_class($model),
                    'model' => $model,
                    'regular_price' => $regularPrice,
                    'member_price' => $memberPrice,
                    'savings' => $regularPrice - $memberPrice,
                    'is_discountable' => $isDiscountable,
                    'code_applied' => null,
                ]);
            }
        }

        // 3. Allocate valid codes to units greedily (biggest savings first)
        // Sort units by potential savings descending
        $units = $units->sortByDesc('savings')->values();

        foreach ($validCodes as $code) {
            $codeAllocated = false;

            foreach ($units as $key => $unit) {
                // Skip if already discounted or not eligible
                if ($unit['code_applied'] !== null || ! $unit['is_discountable']) {
                    continue;
                }

                // Rule 1: A specific code can only be used ONCE per Purchasable entity globally
                $alreadyUsedGlobally = DiscountUsage::where('code', $code)
                    ->where('purchasable_id', $unit['purchasable_id'])
                    ->exists();

                if ($alreadyUsedGlobally) {
                    continue;
                }

                // Rule 2: A specific code can only be used ONCE per cart for this Purchasable
                $alreadyUsedInCart = $units->where('code_applied', $code)
                    ->where('purchasable_id', $unit['purchasable_id'])
                    ->isNotEmpty();

                if ($alreadyUsedInCart) {
                    continue;
                }

                // Rule 3: Check member-stock availability
                $remainingMemberStock = $unit['model']->getRemainingStock('with_membership');
                if ($remainingMemberStock !== null) {
                    // Count how many we are already allocating in this cart
                    $allocatedInCart = $units->where('code_applied', '!=', null)
                        ->where('purchasable_id', $unit['purchasable_id'])
                        ->count();

                    if ($allocatedInCart >= $remainingMemberStock) {
                        continue; // No member stock left
                    }
                }

                // Allocate!
                $units[$key]['code_applied'] = $code;
                $results['applied_codes'][] = $code;
                $results['savings'] += $unit['savings'];
                $codeAllocated = true;
                break; // Move to the next code
            }

            if (! $codeAllocated) {
                $results['errors'][] = "The code '{$code}' could not be applied to any items in your cart (already used for these items or no applicable items).";
            }
        }

        // 4. Reconstruct the cart items from the units
        $processedItems = [];
        foreach ($items as $index => $originalItem) {
            $itemUnits = $units->where('cart_index', $index);

            if ($itemUnits->isEmpty()) {
                $processedItems[] = $originalItem;

                continue;
            }

            // Split into regular vs discounted lines
            $discountedUnits = $itemUnits->whereNotNull('code_applied');
            $regularUnits = $itemUnits->whereNull('code_applied');

            // Add the discounted lines
            foreach ($discountedUnits as $dUnit) {
                $processedItems[] = array_merge($originalItem, [
                    'quantity' => 1,
                    'unit_price' => $dUnit['member_price'],
                    'subtotal' => $dUnit['member_price'],
                    'ticket_type' => 'with_membership',
                    'discount_code_used' => $dUnit['code_applied'],
                ]);
            }

            // Add the remaining regular line (aggregated)
            if ($regularUnits->count() > 0) {
                $firstUnit = $regularUnits->first();
                $processedItems[] = array_merge($originalItem, [
                    'quantity' => $regularUnits->count(),
                    'unit_price' => $firstUnit['regular_price'],
                    'subtotal' => $firstUnit['regular_price'] * $regularUnits->count(),
                    'ticket_type' => 'regular',
                    'discount_code_used' => null,
                ]);
            }
        }

        $results['items'] = $processedItems;
        $results['applied_codes'] = array_unique($results['applied_codes']);

        return $results;
    }
}
