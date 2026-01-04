<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class OfficeShiftSale extends Model
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

    protected $fillable = ['office_shift_id', 'product_id', 'event_id', 'method', 'amount', 'description', 'snapshot', 'breakdown', 'sold_by', 'sold_at'];

    protected $casts = [
        'snapshot' => 'array',
        'breakdown' => 'array',
        'amount' => 'decimal:2',
        'sold_at' => 'datetime',
    ];

    public function shift()
    {
        return $this->belongsTo(OfficeShift::class, 'office_shift_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
