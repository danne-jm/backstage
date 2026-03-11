<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

abstract class Sellable extends Model
{
    use HasFactory;

    protected $commonFillable = [
        'name',
        'description',
        'variants_config',
        'is_variant_based',
        'quantity',
        'unlimited_quantity',
        'variable_amount',
        'quantity_with_card',
        'unlimited_quantity_with_card',
        'quantity_without_card',
        'unlimited_quantity_without_card',
        'is_online_sellable',
        'instagram_link'
    ];

    protected $commonCasts = [
        'variants_config' => 'array',
        'is_variant_based' => 'boolean',
        'quantity' => 'integer',
        'unlimited_quantity' => 'boolean',
        'variable_amount' => 'boolean',
        'quantity_with_card' => 'integer',
        'unlimited_quantity_with_card' => 'boolean',
        'quantity_without_card' => 'integer',
        'unlimited_quantity_without_card' => 'boolean',
        'is_online_sellable' => 'boolean',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->fillable = array_merge($this->commonFillable, $this->fillable);
        $this->casts = array_merge($this->commonCasts, $this->casts);
    }

    public function variants()
    {
        return $this->morphMany(SellableVariant::class, 'sellable');
    }

    public function sales()
    {
        return $this->hasMany(OfficeShiftSale::class);
    }

    public function onlineSales()
    {
        return $this->hasMany(OnlineSale::class);
    }
}