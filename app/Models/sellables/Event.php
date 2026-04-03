<?php

namespace App\Models\sellables;

use App\Models\Sellable;

class Event extends Sellable
{
    protected $fillable = [
        'event_date',
        'start_sell_date',
        'end_sell_date',
        'google_spreadsheet_id',
        'google_sheet_name',
        'price_with_card',
        'price_without_card',
        'responsible_user_id',
        'notes',
        'sold_count_with_card',
        'sold_count_without_card',
        'attendee_filter_config'
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'start_sell_date' => 'datetime',
        'end_sell_date' => 'datetime',
        'price_with_card' => 'decimal:2',
        'price_without_card' => 'decimal:2',
        'sold_count_with_card' => 'integer',
        'sold_count_without_card' => 'integer',
        'attendee_filter_config' => 'array',
    ];

    public function responsibleUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'responsible_user_id');
    }

    public function checkHasStock(): bool
    {
        return (bool) $this->unlimited_quantity
            || is_null($this->quantity)
            || ($this->quantity - ($this->sold_count_without_card ?? 0)) > 0;
    }

    public function checkHasStockWithCard(): bool
    {
        return (bool) $this->unlimited_quantity_with_card
            || is_null($this->quantity_with_card)
            || ($this->quantity_with_card - ($this->sold_count_with_card ?? 0)) > 0;
    }

    public function checkHasStockWithoutCard(): bool
    {
        return (bool) $this->unlimited_quantity_without_card
            || is_null($this->quantity_without_card)
            || ($this->quantity_without_card - ($this->sold_count_without_card ?? 0)) > 0;
    }

    public function checkMainStock(int $qty, bool $useMemberPrice = false): void
    {
        if ($useMemberPrice) {
            if ($this->unlimited_quantity_with_card || is_null($this->quantity_with_card)) {
                return;
            }
            $remaining = max(0, $this->quantity_with_card - ($this->sold_count_with_card ?? 0));
            if ($remaining < $qty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => "Insufficient member-price tickets for {$this->name}.",
                ]);
            }
        } else {
            $unlimited = $this->unlimited_quantity_without_card ?? $this->unlimited_quantity;
            $qtyCol = $this->quantity_without_card ?? $this->quantity;
            $sold = $this->sold_count_without_card ?? 0;
            if ($unlimited || is_null($qtyCol)) {
                return;
            }
            $remaining = max(0, $qtyCol - $sold);
            if ($remaining < $qty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => "Insufficient stock for {$this->name}.",
                ]);
            }
        }
    }

    public function incrementMainSoldCount(bool $useMemberPrice = false, int $count = 1): int
    {
        if ($useMemberPrice) {
            return static::where('id', $this->id)
                ->whereRaw('(unlimited_quantity_with_card = 1 OR quantity_with_card IS NULL OR sold_count_with_card + ? <= quantity_with_card)', [$count])
                ->increment('sold_count_with_card', $count);
        }

        return static::where('id', $this->id)
            ->whereRaw('(unlimited_quantity_without_card = 1 OR quantity_without_card IS NULL OR sold_count_without_card + ? <= quantity_without_card)', [$count])
            ->increment('sold_count_without_card', $count);
    }

    public function decrementMainSoldCount(bool $useMemberPrice = false, int $count = 1): void
    {
        if ($useMemberPrice) {
            static::where('id', $this->id)
                ->where('sold_count_with_card', '>=', $count)
                ->decrement('sold_count_with_card', $count);
        } else {
            static::where('id', $this->id)
                ->where('sold_count_without_card', '>=', $count)
                ->decrement('sold_count_without_card', $count);
        }
    }

    /**
     * Count actual with-card (member-price) sales from real records.
     */
    public function computedSoldWithCard(): int
    {
        return \App\Models\OfficeShiftSale::where('event_id', $this->id)
            ->whereJsonContains('snapshot->ticket_type', 'with_card')
            ->count()
            + \App\Models\OnlineSale::where('event_id', $this->id)
                ->where('ticket_type', 'with_card')
                ->count();
    }

    /**
     * Count actual without-card sales from real records.
     */
    public function computedSoldWithoutCard(): int
    {
        return \App\Models\OfficeShiftSale::where('event_id', $this->id)
            ->where(function ($q) {
                $q->whereJsonDoesntContain('snapshot->ticket_type', 'with_card')
                    ->orWhereNull('snapshot->ticket_type');
            })
            ->count()
            + \App\Models\OnlineSale::where('event_id', $this->id)
                ->where(function ($q) {
                    $q->where('ticket_type', '!=', 'with_card')
                        ->orWhereNull('ticket_type');
                })
                ->count();
    }

    /**
     * Compute remaining with-card tickets live from actual sales.
     */
    public function computedRemainingWithCard(): ?int
    {
        if ($this->unlimited_quantity_with_card || is_null($this->quantity_with_card)) {
            return null;
        }
        return max(0, $this->quantity_with_card - $this->computedSoldWithCard());
    }

    /**
     * Compute remaining without-card tickets live from actual sales.
     */
    public function computedRemainingWithoutCard(): ?int
    {
        if ($this->unlimited_quantity_without_card || is_null($this->quantity_without_card)) {
            return null;
        }
        return max(0, $this->quantity_without_card - $this->computedSoldWithoutCard());
    }
}
