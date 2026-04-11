<?php

namespace App\Models\sellables;

use App\Models\Sellable;
use Illuminate\Support\Facades\Cache;

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

    public function checkHasStock(): bool
    {
        if ($this->unlimited_quantity) {
            return true;
        }
        if (is_null($this->quantity)) {
            return true;
        }
        // Split without-card pool configured.
        if (!is_null($this->quantity_without_card)) {
            return $this->computedRemainingWithoutCard() > 0;
        }
        // Universal pool.
        $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
        return ($this->quantity - $totalSold) > 0;
    }

    public function checkHasStockWithCard(): bool
    {
        if ($this->unlimited_quantity_with_card) {
            return true;
        }
        if (!is_null($this->quantity_with_card)) {
            return $this->computedRemainingWithCard() > 0;
        }
        // No with-card split: fall back to universal pool.
        if (!is_null($this->quantity)) {
            $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
            return ($this->quantity - $totalSold) > 0;
        }
        return true;
    }

    public function checkHasStockWithoutCard(): bool
    {
        if ($this->unlimited_quantity_without_card) {
            return true;
        }
        if (!is_null($this->quantity_without_card)) {
            return $this->computedRemainingWithoutCard() > 0;
        }
        // No without-card split: fall back to universal pool.
        if (!is_null($this->quantity)) {
            $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
            return ($this->quantity - $totalSold) > 0;
        }
        return true;
    }

    public function checkMainStock(int $qty, bool $useMemberPrice = false): void
    {
        if ($useMemberPrice) {
            // With-card split configured.
            if (!is_null($this->quantity_with_card)) {
                if ($this->unlimited_quantity_with_card) {
                    return;
                }
                $remaining = max(0, $this->quantity_with_card - $this->computedSoldWithCard());
                if ($remaining < $qty) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'stock' => "Insufficient member-price stock for {$this->name}.",
                    ]);
                }
                return;
            }
            // No with-card split: check universal pool.
            if ($this->unlimited_quantity || is_null($this->quantity)) {
                return;
            }
            $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
            if (max(0, $this->quantity - $totalSold) < $qty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => "Insufficient stock for {$this->name}.",
                ]);
            }
        } else {
            // Without-card split configured.
            if (!is_null($this->quantity_without_card)) {
                if ($this->unlimited_quantity_without_card) {
                    return;
                }
                $remaining = max(0, $this->quantity_without_card - $this->computedSoldWithoutCard());
                if ($remaining < $qty) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'stock' => "Insufficient stock for {$this->name}.",
                    ]);
                }
                return;
            }
            // No without-card split: check universal pool.
            if ($this->unlimited_quantity || is_null($this->quantity)) {
                return;
            }
            $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
            if (max(0, $this->quantity - $totalSold) < $qty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => "Insufficient stock for {$this->name}.",
                ]);
            }
        }
    }

    /**
     * Count all sold/reserved units regardless of ticket type (for universal pool).
     * Online sales are counted while pending or completed.
     */
    public function computedSoldCount(): int
    {
        return Cache::remember("sold_count_product_{$this->id}", 30, function () {
            $office = \App\Models\OfficeShiftSale::where('product_id', $this->id)->count();
            $online = \App\Models\OnlineSale::where('product_id', $this->id)
                ->where(fn($q) => $q->whereNull('online_transaction_id')
                    ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
                ->count();
            return $office + $online;
        });
    }

    /**
     * Count with-card (ESN card price) sales.
     * Legacy sales with ticket_type = null are treated as without-card.
     */
    public function computedSoldWithCard(): int
    {
        return Cache::remember("sold_count_product_{$this->id}_with_card", 30, function () {
            $office = \App\Models\OfficeShiftSale::where('product_id', $this->id)
                ->whereJsonContains('snapshot->ticket_type', 'with_card')
                ->count();
            $online = \App\Models\OnlineSale::where('product_id', $this->id)
                ->where('ticket_type', 'with_card')
                ->where(fn($q) => $q->whereNull('online_transaction_id')
                    ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
                ->count();
            return $office + $online;
        });
    }

    /**
     * Count without-card (regular price) sales.
     * Legacy sales with ticket_type = null are treated as without-card.
     */
    public function computedSoldWithoutCard(): int
    {
        return Cache::remember("sold_count_product_{$this->id}_without_card", 30, function () {
            $office = \App\Models\OfficeShiftSale::where('product_id', $this->id)
                ->where(function ($q) {
                    $q->whereJsonDoesntContain('snapshot->ticket_type', 'with_card')
                        ->orWhereNull('snapshot->ticket_type');
                })
                ->count();
            $online = \App\Models\OnlineSale::where('product_id', $this->id)
                ->where(function ($q) {
                    $q->where('ticket_type', '!=', 'with_card')
                        ->orWhereNull('ticket_type');
                })
                ->where(fn($q) => $q->whereNull('online_transaction_id')
                    ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
                ->count();
            return $office + $online;
        });
    }

    public static function bustSoldCountCache(string $id): void
    {
        Cache::forget("sold_count_product_{$id}");
        Cache::forget("sold_count_product_{$id}_with_card");
        Cache::forget("sold_count_product_{$id}_without_card");
    }

    public function computedRemaining(): ?int
    {
        if ($this->unlimited_quantity || is_null($this->quantity)) {
            return null;
        }
        $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
        return max(0, $this->quantity - $totalSold);
    }

    public function computedRemainingWithCard(): ?int
    {
        if ($this->unlimited_quantity_with_card || is_null($this->quantity_with_card)) {
            return null;
        }
        return max(0, $this->quantity_with_card - $this->computedSoldWithCard());
    }

    public function computedRemainingWithoutCard(): ?int
    {
        if ($this->unlimited_quantity_without_card || is_null($this->quantity_without_card)) {
            return null;
        }
        return max(0, $this->quantity_without_card - $this->computedSoldWithoutCard());
    }
}
