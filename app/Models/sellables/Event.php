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
}
