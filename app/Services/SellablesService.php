<?php

namespace App\Services;

class SellablesService
{
    /**
     * Normalize the unlimited/quantity semantics for products and events.
     *
     * @param  array  $data  Validated request data
     * @return array Normalized data ready for storage
     */
    public function normalizeInput(array $data): array
    {
        $normalized = $data;
        $isVariable = $normalized['variable_amount'] ?? false;

        if ($isVariable) {
            $normalized['quantity'] = null;

            // Normalize quantity_with_card
            if (!array_key_exists('quantity_with_card', $normalized) || is_null($normalized['quantity_with_card'])) {
                $normalized['quantity_with_card'] = null;
                $normalized['unlimited_quantity_with_card'] = true;
            } else {
                $normalized['unlimited_quantity_with_card'] = false;
            }

            // Normalize quantity_without_card
            if (!array_key_exists('quantity_without_card', $normalized) || is_null($normalized['quantity_without_card'])) {
                $normalized['quantity_without_card'] = null;
                $normalized['unlimited_quantity_without_card'] = true;
            } else {
                $normalized['unlimited_quantity_without_card'] = false;
            }

            $normalized['unlimited_quantity'] = false;
            // Clear variants_config when using variable_amount (ESNcard pricing)
            $normalized['variants_config'] = null;
        } else {
            // Non-variable: if quantity not provided or empty -> unlimited
            if (!array_key_exists('quantity', $normalized) || $normalized['quantity'] === null) {
                $normalized['quantity'] = null;
                $normalized['unlimited_quantity'] = true;
            } else {
                $normalized['unlimited_quantity'] = false;
            }

            $normalized['quantity_with_card'] = null;
            $normalized['quantity_without_card'] = null;
            $normalized['unlimited_quantity_with_card'] = false;
            $normalized['unlimited_quantity_without_card'] = false;
        }

        return $normalized;
    }

    public function syncVariants($sellable, array $variantsInput): void
    {
        $existing = $sellable->variants()->get();
        $processedIds = [];

        foreach ($variantsInput as $variantData) {
            $options = $variantData['options'];
            $quantity = isset($variantData['quantity']) && $variantData['quantity'] !== '' ? (int) $variantData['quantity'] : null;
            $remainingQuantity = isset($variantData['remaining_quantity']) && $variantData['remaining_quantity'] !== '' ? (int) $variantData['remaining_quantity'] : null;

            $match = $existing->first(function ($v) use ($options) {
                $opt1 = $v->options;
                ksort($opt1);
                $opt2 = $options;
                ksort($opt2);

                return $opt1 == $opt2;
            });

            if ($match) {
                if ($remainingQuantity !== null) {
                    $quantity = $remainingQuantity + $match->computedSoldCount();
                }
                $match->update(['quantity' => $quantity]);
                $processedIds[] = $match->id;
            } else {
                if ($remainingQuantity !== null) {
                    $quantity = $remainingQuantity;
                }
                $created = $sellable->variants()->create([
                    'options' => $options,
                    'quantity' => $quantity,
                ]);
                $processedIds[] = $created->id;
            }
        }

        $sellable->variants()->whereNotIn('id', $processedIds)->delete();
    }
}

