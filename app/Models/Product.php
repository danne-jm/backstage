<?php

namespace App\Models;

use App\Contracts\Purchasable;
use App\Models\Traits\HasMembershipPricing;
use App\Models\Traits\HasStockPools;
use App\Models\Traits\HasVariants;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model implements Purchasable
{
    use HasFactory, HasMembershipPricing, HasStockPools, HasUlids, HasVariants;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'variants_config' => 'array',
            'is_variant_based' => 'boolean',
            'unlimited_quantity' => 'boolean',
            'unlimited_quantity_with_membership' => 'boolean',
            'unlimited_quantity_without_membership' => 'boolean',
            'variable_amount' => 'boolean',
            'is_online_sellable' => 'boolean',
            'hide_until_sale' => 'boolean',
            'start_sell_date' => 'datetime',
            'end_sell_date' => 'datetime',
            'responsible_user_ids' => 'array',
        ];
    }

    public function getPrice(): float
    {
        return $this->price;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getDescription(): string
    {
        return $this->description ?? '';
    }
}
