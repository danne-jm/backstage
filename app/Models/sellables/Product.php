<?php

namespace App\Models\sellables;

use App\Models\Sellable;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Sellable implements HasMedia
{
    use InteractsWithMedia;
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
