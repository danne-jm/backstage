<?php

namespace App\Models\sellables;

use App\Models\Sellable;
use Illuminate\Support\Facades\Cache;

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
        'responsible_user_ids',
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
        'responsible_user_ids' => 'array',
    ];

    public function responsibleUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'responsible_user_id');
    }

    public function checkHasStock(): bool
    {
        if ($this->unlimited_quantity) {
            return true;
        }
        if (is_null($this->quantity)) {
            return true;
        }
        // Split quantity configured — check the without-card pool.
        if (!is_null($this->quantity_without_card)) {
            return $this->computedRemainingWithoutCard() > 0;
        }
        // Universal quantity: all sales (any ticket type) count against one shared pool.
        $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
        return ($this->quantity - $totalSold) > 0;
    }

    public function checkHasStockWithCard(): bool
    {
        if ($this->unlimited_quantity_with_card) {
            return true;
        }
        // Split quantity configured — check the with-card pool.
        if (!is_null($this->quantity_with_card)) {
            return $this->computedRemainingWithCard() > 0;
        }
        // No with-card split: fall back to the universal pool if one is set.
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
        // Split quantity configured — check the without-card pool.
        if (!is_null($this->quantity_without_card)) {
            return $this->computedRemainingWithoutCard() > 0;
        }
        // No without-card split: fall back to the universal pool if one is set.
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
                        'stock' => "Insufficient member-price tickets for {$this->name}.",
                    ]);
                }
                return;
            }
            // No with-card split: check against universal pool.
            if ($this->unlimited_quantity || is_null($this->quantity)) {
                return;
            }
            $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
            $remaining = max(0, $this->quantity - $totalSold);
            if ($remaining < $qty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => "Insufficient tickets for {$this->name}.",
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
            // No without-card split: check against universal pool.
            if ($this->unlimited_quantity || is_null($this->quantity)) {
                return;
            }
            $totalSold = $this->computedSoldWithCard() + $this->computedSoldWithoutCard();
            $remaining = max(0, $this->quantity - $totalSold);
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
        return Cache::remember("sold_count_event_{$this->id}_with_card", 30, function () {
            return \App\Models\OfficeShiftSale::where('event_id', $this->id)
                ->whereJsonContains('snapshot->ticket_type', 'with_card')
                ->count()
                + \App\Models\OnlineSale::where('event_id', $this->id)
                    ->where('ticket_type', 'with_card')
                    ->where(fn($q) => $q->whereNull('online_transaction_id')
                        ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
                    ->count();
        });
    }

    /**
     * Count actual without-card sales from real records.
     * Online sales are counted while pending or completed; failed/abandoned are excluded.
     */
    public function computedSoldWithoutCard(): int
    {
        return Cache::remember("sold_count_event_{$this->id}_without_card", 30, function () {
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
        });
    }

    public static function bustSoldCountCache(string $id): void
    {
        Cache::forget("sold_count_event_{$id}_with_card");
        Cache::forget("sold_count_event_{$id}_without_card");
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
