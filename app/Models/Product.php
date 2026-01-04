<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Product extends Model
{
    use HasFactory;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = ['name', 'description', 'price', 'type', 'quantity', 'unlimited_quantity', 'variable_amount', 'quantity_with_card', 'unlimited_quantity_with_card', 'quantity_without_card', 'unlimited_quantity_without_card', 'is_online_sellable'];

    protected $appends = ['remaining'];

    protected function casts(): array
    {
        return [
            'unlimited_quantity' => 'boolean',
            'unlimited_quantity_with_card' => 'boolean',
            'unlimited_quantity_without_card' => 'boolean',
            'price' => 'decimal:2',
            'variable_amount' => 'boolean',
        ];
    }

    public function sales()
    {
        return $this->hasMany(OfficeShiftSale::class);
    }

    public function onlineSales()
    {
        return $this->hasMany(OnlineSale::class);
    }

    public function getRemainingAttribute()
    {
        // Return null when unlimited or quantity is not set so frontend shows 'Unlimited'
        if ($this->unlimited_quantity) {
            return null;
        }
        if (is_null($this->quantity)) {
            return null; // treat null as unlimited for backwards compatibility
        }

        // If sales_count and online_sales_count are loaded, use them. Otherwise, query.
        if (array_key_exists('sales_count', $this->attributes) && array_key_exists('online_sales_count', $this->attributes)) {
            return max(0, $this->quantity - $this->attributes['sales_count'] - $this->attributes['online_sales_count']);
        }

        return max(0, $this->quantity - $this->sales()->count() - $this->onlineSales()->count());
    }
}
