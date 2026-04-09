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
        'attendee_filter_config'
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'start_sell_date' => 'datetime',
        'end_sell_date' => 'datetime',
        'price_with_card' => 'decimal:2',
        'price_without_card' => 'decimal:2',
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
            || $this->computedRemainingWithoutCard() > 0;
    }

    public function checkHasStockWithCard(): bool
    {
        return (bool) $this->unlimited_quantity_with_card
            || is_null($this->quantity_with_card)
            || $this->computedRemainingWithCard() > 0;
    }

    public function checkHasStockWithoutCard(): bool
    {
        return (bool) $this->unlimited_quantity_without_card
            || is_null($this->quantity_without_card)
            || $this->computedRemainingWithoutCard() > 0;
    }

    public function checkMainStock(int $qty, bool $useMemberPrice = false): void
    {
        if ($useMemberPrice) {
            if ($this->unlimited_quantity_with_card || is_null($this->quantity_with_card)) {
                return;
            }
            $remaining = max(0, $this->quantity_with_card - $this->computedSoldWithCard());
            if ($remaining < $qty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => "Insufficient member-price tickets for {$this->name}.",
                ]);
            }
        } else {
            $unlimited = $this->unlimited_quantity_without_card ?? $this->unlimited_quantity;
            $qtyCol = $this->quantity_without_card ?? $this->quantity;
            if ($unlimited || is_null($qtyCol)) {
                return;
            }
            $remaining = max(0, $qtyCol - $this->computedSoldWithoutCard());
            if ($remaining < $qty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => "Insufficient stock for {$this->name}.",
                ]);
            }
        }
    }

    /**
     * Count actual with-card (member-price) sales from real records.
     * Online sales are counted while pending or completed; failed/abandoned are excluded.
     */
    public function computedSoldWithCard(): int
    {
        return \App\Models\OfficeShiftSale::where('event_id', $this->id)
            ->whereJsonContains('snapshot->ticket_type', 'with_card')
            ->count()
            + \App\Models\OnlineSale::where('event_id', $this->id)
                ->where('ticket_type', 'with_card')
                ->where(fn($q) => $q->whereNull('online_transaction_id')
                    ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
                ->count();
    }

    /**
     * Count actual without-card sales from real records.
     * Online sales are counted while pending or completed; failed/abandoned are excluded.
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
                ->where(fn($q) => $q->whereNull('online_transaction_id')
                    ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
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
