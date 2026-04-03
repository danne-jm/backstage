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

    public function incrementMainSoldCount(bool $useMemberPrice = false): int
    {
        return static::where('id', $this->id)
            ->whereRaw('(unlimited_quantity = 1 OR quantity IS NULL OR sold_count + 1 <= quantity)')
            ->increment('sold_count');
    }

    public function decrementMainSoldCount(bool $useMemberPrice = false): void
    {
        static::where('id', $this->id)
            ->where('sold_count', '>', 0)
            ->decrement('sold_count');
    }
}
