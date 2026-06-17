<?php

namespace App\Models\Traits;

trait HasStockPools
{
    public function hasUnlimitedQuantity(): bool
    {
        return $this->unlimited_quantity ?? false;
    }

    public function getRemainingStock(): ?int
    {
        if ($this->hasUnlimitedQuantity()) {
            return null;
        }

        // Real logic would calculate from an event-sourced ledger or material view
        return max(0, ($this->quantity ?? 0) - $this->getSoldCount());
    }

    public function getSoldCount(): int
    {
        // Placeholder for ledger calculation
        return 0; 
    }

    public function isAvailable(): bool
    {
        if ($this->hasUnlimitedQuantity()) {
            return true;
        }

        return $this->getRemainingStock() > 0;
    }
}
