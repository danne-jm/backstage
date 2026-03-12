<?php

namespace App\Models\sellables;

use App\Models\Sellable;

class Product extends Sellable
{
    protected $fillable = [
        'price',
        'member_price',
        'sold_count',
        'type'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'member_price' => 'decimal:2',
        'sold_count' => 'integer'
    ];
}
