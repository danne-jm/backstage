<?php

namespace App\Models\Concerns;

use App\Models\SellableVariant;
use Illuminate\Validation\ValidationException;

trait HasSellableStock
{
    /**
     * Pre-check whether the entity has sufficient main stock.
     * This is a soft pre-flight check; the real guard is the atomic increment.
     *
     * @throws ValidationException if stock is insufficient
     */
    abstract public function checkMainStock(int $qty, bool $useMemberPrice = false): void;

    /**
     * Atomically increment the entity's sold count using a conditional WHERE clause.
     * Returns the number of affected rows (0 = race-condition sold-out).
     */
    abstract public function incrementMainSoldCount(bool $useMemberPrice = false, int $count = 1): int;

    /**
     * Decrement the entity's sold count, guarding against going below zero.
     */
    abstract public function decrementMainSoldCount(bool $useMemberPrice = false, int $count = 1): void;

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

    /**
     * Atomically deduct stock for one unit during checkout.
     *
     * Validates option requirements, pre-checks main stock, then atomically increments
     * both the main entity and variant (if applicable). The main entity increment is the
     * real race-condition guard via its conditional WHERE clause.
     *
     * Returns the matched SellableVariant, or null if not variant-based.
     *
     * @throws ValidationException on stock or option validation failures
     * @throws \Exception on race-condition sold-out
     */
    public function deductStockForCheckout(int $qty, ?array $options, bool $useMemberPrice = false): ?SellableVariant
    {
        $variant = null;

        if ($this->is_variant_based) {
            if (empty($options)) {
                throw ValidationException::withMessages([
                    'items' => "{$this->name} requires you to select an option (e.g. size/color).",
                ]);
            }

            $variant = $this->resolveVariantByOptions($options);

            if (!$variant) {
                throw ValidationException::withMessages([
                    'stock' => "Variant not available for {$this->name}.",
                ]);
            }

            if ($variant->quantity !== null && ($variant->quantity - ($variant->sold_count ?? 0)) < $qty) {
                throw ValidationException::withMessages([
                    'stock' => "Insufficient stock for variant of {$this->name}.",
                ]);
            }
        } elseif (!empty($options)) {
            throw ValidationException::withMessages([
                'items' => "The configuration for {$this->name} has changed. Please remove it and add it again.",
            ]);
        }

        // Pre-check main entity stock (not atomic — the increment is the real guard)
        $this->checkMainStock($qty, $useMemberPrice);

        // Atomically increment main entity
        $updated = $this->incrementMainSoldCount($useMemberPrice, $qty);
        if (!$updated) {
            throw new \Exception("{$this->name} sold out during processing.");
        }

        // Atomically increment variant (roll back main entity if this fails)
        if ($variant) {
            $variantUpdated = SellableVariant::where('id', $variant->id)
                ->whereRaw('(quantity IS NULL OR sold_count + ? <= quantity)', [$qty])
                ->increment('sold_count', $qty);

            if (!$variantUpdated) {
                $this->decrementMainSoldCount($useMemberPrice, $qty);
                throw new \Exception("Variant of {$this->name} sold out during processing.");
            }
        }

        return $variant;
    }

    /**
     * Revert one unit's stock deduction (payment failure or abandoned transaction cleanup).
     *
     * @param bool $useMemberPrice
     * @param string|null $variantId The variant's ID, stored in OnlineSale.details['variant_id'].
     */
    public function revertStockForUnit(bool $useMemberPrice = false, ?string $variantId = null): void
    {
        $this->decrementMainSoldCount($useMemberPrice);

        if ($variantId) {
            SellableVariant::where('id', $variantId)
                ->where('sold_count', '>', 0)
                ->decrement('sold_count');
        }
    }
}
