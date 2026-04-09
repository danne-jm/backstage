<?php

namespace App\Models\Concerns;

use App\Models\SellableVariant;
use Illuminate\Validation\ValidationException;

trait HasSellableStock
{
    /**
     * Pre-check whether the entity has sufficient stock.
     * This is a non-locking pre-flight check; the real guard is the locked count
     * inside the DB transaction during the actual sale creation.
     *
     * @throws ValidationException if stock is insufficient
     */
    abstract public function checkMainStock(int $qty, bool $useMemberPrice = false): void;

    /**
     * Resolve a variant from this sellable by matching options exactly.
     */
    public function resolveVariantByOptions(array $options): ?SellableVariant
    {
        $variants = $this->variants instanceof \Illuminate\Database\Eloquent\Collection
            ? $this->variants
            : $this->variants()->get();

        ksort($options);
        $targetKey = serialize($options);

        return $variants->first(function (SellableVariant $v) use ($targetKey): bool {
            $vOpts = $v->options;
            ksort($vOpts);
            return serialize($vOpts) === $targetKey;
        });
    }
}
