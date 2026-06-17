<?php

namespace App\Models\Traits;

trait HasMembershipPricing
{
    public function getMembershipPrice(): ?float
    {
        return $this->price_with_membership ?? null;
    }

    public function getRegularPrice(): float
    {
        return $this->price_without_membership ?? ($this->price ?? 0);
    }

    public function hasMembershipPricing(): bool
    {
        return $this->getMembershipPrice() !== null;
    }
}
