<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Event extends Model
{
    protected $fillable = [
        'name',
        'description',
        'event_date',
        'start_sell_date',
        'end_sell_date',
        'price_with_card',
        'price_without_card',
        'quantity',
        'unlimited_quantity',
        'responsible_user_id',
        'notes',
        'variable_amount',
        'quantity_with_card',
        'unlimited_quantity_with_card',
        'quantity_without_card',
        'unlimited_quantity_without_card',
        'google_spreadsheet_id',
        'google_sheet_name',
        'is_online_sellable',
    ];

    protected $appends = ['remaining', 'remaining_with_card', 'remaining_without_card'];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'start_sell_date' => 'date',
            'end_sell_date' => 'date',
            'variable_amount' => 'boolean',
            'price_with_card' => 'decimal:2',
            'price_without_card' => 'decimal:2',
            'unlimited_quantity' => 'boolean',
            'unlimited_quantity_with_card' => 'boolean',
            'unlimited_quantity_without_card' => 'boolean',
        ];
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function attendees()
    {
        return $this->hasMany(Attendee::class);
    }

    public function sales()
    {
        return $this->hasMany(OfficeShiftSale::class);
    }

    public function onlineSales()
    {
        return $this->hasMany(OnlineSale::class);
    }

    /**
     * Ensure event_date is always serialized as YYYY-MM-DD (date only).
     */
    public function getEventDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getStartSellDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getEndSellDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getSalesWithCardCountAttribute()
    {
        $officeSales = array_key_exists('sales_with_card_count', $this->attributes) ? $this->attributes['sales_with_card_count'] : $this->sales()->where('snapshot->ticket_type', 'with_card')->count();
        $onlineSales = array_key_exists('online_sales_with_card_count', $this->attributes) ? $this->attributes['online_sales_with_card_count'] : $this->onlineSales()->where('details->ticket_type', 'with_card')->count();

        return $officeSales + $onlineSales;
    }

    public function getSalesWithoutCardCountAttribute()
    {
        $officeSales = array_key_exists('sales_without_card_count', $this->attributes) ? $this->attributes['sales_without_card_count'] : $this->sales()->where('snapshot->ticket_type', 'without_card')->count();
        $onlineSales = array_key_exists('online_sales_without_card_count', $this->attributes) ? $this->attributes['online_sales_without_card_count'] : $this->onlineSales()->where('details->ticket_type', 'without_card')->count();

        return $officeSales + $onlineSales;
    }

    public function getRemainingWithCardAttribute()
    {
        // Return null when unlimited or quantity is not set so the frontend can show "Unlimited"
        if ($this->unlimited_quantity_with_card) {
            return null;
        }
        if (is_null($this->quantity_with_card)) {
            return null;
        }

        return $this->quantity_with_card - $this->getSalesWithCardCountAttribute();
    }

    public function getRemainingWithoutCardAttribute()
    {
        if ($this->unlimited_quantity_without_card) {
            return null;
        }
        if (is_null($this->quantity_without_card)) {
            return null;
        }

        return $this->quantity_without_card - $this->getSalesWithoutCardCountAttribute();
    }

    public function getRemainingAttribute()
    {
        if ($this->unlimited_quantity) {
            return null;
        }
        if (is_null($this->quantity)) {
            return null;
        }

        if (array_key_exists('sales_count', $this->attributes) && array_key_exists('online_sales_count', $this->attributes)) {
            return $this->quantity - $this->attributes['sales_count'] - $this->attributes['online_sales_count'];
        }

        return $this->quantity - $this->sales()->count() - $this->onlineSales()->count();
    }
}
