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
        'responsible_user_id',
        'notes',
        'variable_amount',
        'quantity_with_card',
        'quantity_without_card',
        'google_spreadsheet_id',
        'google_sheet_name',
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

    /**
     * Ensure event_date is always serialized as YYYY-MM-DD (date only).
     */
    public function getEventDateAttribute($value): ?string
    {
        if (!$value) return null;
        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getStartSellDateAttribute($value): ?string
    {
        if (!$value) return null;
        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getEndSellDateAttribute($value): ?string
    {
        if (!$value) return null;
        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getSalesWithCardCountAttribute()
    {
        return $this->sales()->where('snapshot->ticket_type', 'with_card')->count();
    }

    public function getSalesWithoutCardCountAttribute()
    {
        return $this->sales()->where('snapshot->ticket_type', 'without_card')->count();
    }

    public function getRemainingWithCardAttribute()
    {
        if ($this->quantity_with_card === -1) {
            return -1;
        }
        return $this->quantity_with_card - $this->getSalesWithCardCountAttribute();
    }

    public function getRemainingWithoutCardAttribute()
    {
        if ($this->quantity_without_card === -1) {
            return -1;
        }
        return $this->quantity_without_card - $this->getSalesWithoutCardCountAttribute();
    }

    public function getRemainingAttribute()
    {
        if ($this->quantity === -1) {
            return -1;
        }
        return $this->quantity - $this->sales()->count();
    }
}