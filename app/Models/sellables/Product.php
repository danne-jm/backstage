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
}
