<?php

namespace App\Models\sellables;

use App\Models\Sellable;

class Product extends Sellable
{
    protected $fillable = [
        'price',
        'member_price',
        'price_with_card',
        'price_without_card',
        'start_sell_date',
        'end_sell_date',
        'sold_count',
        'type',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'member_price' => 'decimal:2',
        'price_with_card' => 'decimal:2',
        'price_without_card' => 'decimal:2',
        'start_sell_date' => 'datetime',
        'end_sell_date' => 'datetime',
        'sold_count' => 'integer',
    ];

    public function checkMainStock(int $qty, bool $useMemberPrice = false): void
    {
        if ($this->unlimited_quantity || is_null($this->quantity)) {
            return;
        }

        $remaining = max(0, $this->quantity - ($this->sold_count ?? 0));
        if ($remaining < $qty) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'stock' => "Insufficient stock for {$this->name}.",
            ]);
        }
    }

    public function incrementMainSoldCount(bool $useMemberPrice = false, int $count = 1): int
    {
        return static::where('id', $this->id)
            ->whereRaw('(unlimited_quantity = 1 OR quantity IS NULL OR sold_count + ? <= quantity)', [$count])
            ->increment('sold_count', $count);
    }

    public function decrementMainSoldCount(bool $useMemberPrice = false, int $count = 1): void
    {
        static::where('id', $this->id)
            ->where('sold_count', '>=', $count)
            ->decrement('sold_count', $count);
    }

    /**
     * Count actual sold units from real sale records (ignores the cached sold_count column).
     */
    public function computedSoldCount(): int
    {
        $office = \App\Models\OfficeShiftSale::where('product_id', $this->id)->count();
        $online = \App\Models\OnlineSale::where('product_id', $this->id)->count();
        return $office + $online;
    }

    /**
     * Compute remaining stock live from actual sales records.
     * Returns null when unlimited.
     */
    public function computedRemaining(): ?int
    {
        if ($this->unlimited_quantity || is_null($this->quantity)) {
            return null;
        }
        return max(0, $this->quantity - $this->computedSoldCount());
    }
}
