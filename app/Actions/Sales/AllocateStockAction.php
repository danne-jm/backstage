<?php

namespace App\Actions\Sales;

use App\Models\InventoryMovement;
use App\Models\Sale;

class AllocateStockAction
{
    /**
     * Records a sale movement in the inventory ledger.
     * Throws an exception if stock is insufficient.
     */
    public function handle(Sale $sale): InventoryMovement
    {
        // 1. Fetch the purchasable entity (Event or Product)
        $purchasable = $sale->purchasable;
        $ticketType = $sale->ticket_type;

        // 2. Prevent overselling if stock is limited
        if (! $purchasable->hasUnlimitedQuantity($ticketType)) {
            // Because we are inside a DB transaction from the orchestrator,
            // the most concurrent-safe way is locking the parent row.
            // In a highly concurrent setup, you would `lockForUpdate()` here.
            $remaining = $purchasable->getRemainingStock($ticketType);

            if ($remaining < $sale->quantity) {
                throw new \Exception("Insufficient stock for {$purchasable->getName()}. Remaining: {$remaining}");
            }
        }

        if ($sale->variant_id && $sale->variant) {
            if ($sale->variant->quantity !== null) {
                $variantSold = $purchasable->getSoldCount($ticketType, $sale->variant_id);
                $variantRemaining = $sale->variant->quantity - $variantSold;
                if ($variantRemaining < $sale->quantity) {
                    throw new \Exception("Insufficient stock for variant of {$purchasable->getName()}. Remaining: {$variantRemaining}");
                }
            }
        }

        // 3. Write to the append-only ledger
        return InventoryMovement::create([
            'purchasable_type' => $sale->purchasable_type,
            'purchasable_id' => $sale->purchasable_id,
            'variant_id' => $sale->variant_id,
            'sale_id' => $sale->id,
            'type' => 'sale',
            'quantity' => -$sale->quantity, // Negative for deduction
            'ticket_type' => $ticketType,
            'notes' => 'Automated sale allocation',
        ]);
    }
}
