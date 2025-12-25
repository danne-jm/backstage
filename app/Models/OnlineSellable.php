<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineSellable extends Model
{
    use HasFactory;

    protected $table = 'online_sellables';

    protected $fillable = [
        'original_type',
        'original_id',
        'name',
        'description',
        'price',
        'event_date',
        'remaining',
        'metadata',
        'images',
    ];

    protected $casts = [
        'metadata' => 'array',
        'images' => 'array',
        'price' => 'decimal:2',
    ];
}
