<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $channel
 * @property string $status
 * @property string|null $office_shift_id
 * @property string|null $customer_email
 * @property string $total_amount
 * @property string $discount_total
 * @property string|null $payment_method
 * @property string|null $external_payment_id
 * @property string|null $cash_tendered_amount
 * @property string|null $cash_change_amount
 * @property array|null $cash_tendered_breakdown
 * @property array|null $cash_change_breakdown
 * @property Carbon|null $completed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Collection<int, Sale> $sales
 */
class Transaction extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'channel',
        'status',
        'office_shift_id',
        'customer_email',
        'total_amount',
        'discount_total',
        'payment_method',
        'external_payment_id',
        'cash_tendered_amount',
        'cash_change_amount',
        'cash_tendered_breakdown',
        'cash_change_breakdown',
        'completed_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'cash_tendered_amount' => 'decimal:2',
        'cash_change_amount' => 'decimal:2',
        'cash_tendered_breakdown' => 'array',
        'cash_change_breakdown' => 'array',
        'completed_at' => 'datetime',
    ];

    public function officeShift(): BelongsTo
    {
        return $this->belongsTo(OfficeShift::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
