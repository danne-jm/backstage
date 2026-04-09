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
        'type',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'member_price' => 'decimal:2',
        'price_with_card' => 'decimal:2',
        'price_without_card' => 'decimal:2',
        'start_sell_date' => 'datetime',
        'end_sell_date' => 'datetime',
    ];

    public function checkMainStock(int $qty, bool $useMemberPrice = false): void
    {
        if ($this->unlimited_quantity || is_null($this->quantity)) {
            return;
        }

        $remaining = max(0, $this->quantity - $this->computedSoldCount());
        if ($remaining < $qty) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'stock' => "Insufficient stock for {$this->name}.",
            ]);
        }
    }

    /**
     * Count actual sold/reserved units from real sale records.
     * Online sales are counted while pending or completed; failed/abandoned are excluded.
     */
    public function computedSoldCount(): int
    {
        $office = \App\Models\OfficeShiftSale::where('product_id', $this->id)->count();
        $online = \App\Models\OnlineSale::where('product_id', $this->id)
            ->where(fn($q) => $q->whereNull('online_transaction_id')
                ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
            ->count();
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
