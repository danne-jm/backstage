<?php

namespace App\Models\Traits;

trait HasStockPools
{
    public function hasUnlimitedQuantity(?string $ticketType = null): bool
    {
        if ($ticketType === 'with_membership' && isset($this->unlimited_quantity_with_membership)) {
            return $this->unlimited_quantity_with_membership;
        }
        if ($ticketType === 'regular' && isset($this->unlimited_quantity_without_membership)) {
            return $this->unlimited_quantity_without_membership;
        }

        return $this->unlimited_quantity ?? false;
    }

    public function getRemainingStock(?string $ticketType = null): ?int
    {
        if ($this->hasUnlimitedQuantity($ticketType)) {
            return null;
        }

        $baseQuantity = $this->getBaseQuantity($ticketType);
        return max(0, $baseQuantity - $this->getSoldCount($ticketType));
    }

    public function getBaseQuantity(?string $ticketType = null): int
    {
        if ($ticketType === 'with_membership' && isset($this->quantity_with_membership)) {
            return $this->quantity_with_membership;
        }
        if ($ticketType === 'regular' && isset($this->quantity_without_membership)) {
            return $this->quantity_without_membership;
        }
        
        return $this->quantity ?? 0;
    }

    public function getSoldCount(?string $ticketType = null, ?string $variantId = null): int
    {
        $query = \App\Models\InventoryMovement::where('purchasable_type', $this->getMorphClass())
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
