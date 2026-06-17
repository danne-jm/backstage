<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'purchasable_id',
        'purchasable_type',
        'variant_id',
        'sale_id',
        'type',
        'quantity',
        'ticket_type',
        'notes',
    ];

    public function purchasable()
    {
        return $this->morphTo();
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
