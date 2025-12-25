<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'price', 'type', 'quantity', 'variable_amount', 'quantity_with_card', 'quantity_without_card', 'is_online_sellable'];

    protected $appends = ['remaining'];

    public function sales()
    {
        return $this->hasMany(OfficeShiftSale::class);
    }

    public function getRemainingAttribute()
    {
        if ($this->quantity === -1) {
            return -1; // Unlimited
        }
        return $this->quantity - $this->sales()->count();
    }
}