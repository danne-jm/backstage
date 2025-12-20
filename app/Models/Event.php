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
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'start_sell_date' => 'datetime',
            'end_sell_date' => 'datetime',
            'variable_amount' => 'boolean',
            'price_with_card' => 'decimal:2',
            'price_without_card' => 'decimal:2',
        ];
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }
}
