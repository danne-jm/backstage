<?php

namespace App\Models\Traits;

use App\Models\InventoryMovement;

trait HasStockPools
{
    public function isSplitPool(): bool
    {
        return $this->quantity_with_membership !== null
            || $this->quantity_without_membership !== null
            || $this->unlimited_quantity_with_membership
            || $this->unlimited_quantity_without_membership;
    }

    public function hasUnlimitedQuantity(?string $ticketType = null): bool
    {
        if ($this->isSplitPool()) {
            if ($ticketType === 'with_membership') {
                return $this->unlimited_quantity_with_membership;
            }
            if ($ticketType === 'regular') {
                return $this->unlimited_quantity_without_membership;
            }
        }

        return $this->unlimited_quantity ?? false;
    }

    public function getRemainingStock(?string $ticketType = null): ?int
    {
        if ($this->hasUnlimitedQuantity($ticketType)) {
            return null;
        }

        if (! $this->isSplitPool()) {
            // For simple (shared) quantity, all ticket types draw from the same global pool.
            $baseQuantity = $this->quantity ?? 0;

            return max(0, $baseQuantity - $this->getSoldCount(null));
        }

        $baseQuantity = $this->getBaseQuantity($ticketType);

        return max(0, $baseQuantity - $this->getSoldCount($ticketType));
    }

    public function getBaseQuantity(?string $ticketType = null): int
    {
        if ($this->isSplitPool()) {
            if ($ticketType === 'with_membership') {
                return $this->quantity_with_membership ?? 0;
            }
            if ($ticketType === 'regular') {
                return $this->quantity_without_membership ?? 0;
            }
        }

        return $this->quantity ?? 0;
    }

    public function getSoldCount(?string $ticketType = null, ?string $variantId = null): int
    {
        $query = InventoryMovement::where('purchasable_type', $this->getMorphClass())
            ->where('purchasable_id', $this->id)
            ->whereIn('type', ['sale', 'refund']);

        if ($ticketType) {
            $query->where('ticket_type', $ticketType);
        }

        if ($variantId) {
            $query->where('variant_id', $variantId);
        }

        // Sales are recorded as negative quantities, refunds as positive.
        // We take the absolute value of the net movement to get total sold.
        return abs((int) $query->sum('quantity'));
    }

    public function isAvailable(?string $ticketType = null): bool
    {
        if ($this->hasUnlimitedQuantity($ticketType)) {
            return true;
        }

        return $this->getRemainingStock($ticketType) > 0;
    }
}
