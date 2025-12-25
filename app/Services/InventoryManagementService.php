<?php

namespace App\Services;

class InventoryManagementService
{
    /**
     * Normalize the unlimited/quantity semantics for products and events.
     *
     * @param array $data Validated request data
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
}
