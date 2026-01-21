<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class OnlineSale extends Model
{
    use HasFactory;
    use \Spatie\Activitylog\Traits\LogsActivity;

    public function getActivitylogOptions(): \Spatie\Activitylog\LogOptions
    {
        return \Spatie\Activitylog\LogOptions::defaults()
            ->logOnly(['*'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'online_transaction_id',
        'reference_id',
        'product_id',
        'event_id',
        'method',
        'amount',
        'details',
        'ticket_type',
        'sold_at',
    ];

    protected $casts = [
        'details' => 'array',
        'amount' => 'decimal:2',
        'sold_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            if (empty($sale->reference_id)) {
                $sale->reference_id = self::generateUniqueReferenceId();
            }
        });
    }

    public static function generateUniqueReferenceId(): string
    {
        do {
            $id = Str::upper(Str::random(12));
        } while (self::where('reference_id', $id)->exists());

        return $id;
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(OnlineTransaction::class, 'online_transaction_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
