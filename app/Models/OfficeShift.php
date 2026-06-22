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
 * @property string $started_by
 * @property string|null $ended_by
 * @property Carbon $started_at
 * @property Carbon|null $ended_at
 * @property string $status
 * @property array|null $start_cash_breakdown
 * @property string $expected_cash_total
 * @property array|null $end_of_shift_cash_breakdown
 * @property string|null $discrepancy_amount
 * @property string|null $notes
 * @property User $starter
 * @property User|null $ender
 * @property Collection<int, OfficeShiftWorker> $workers
 */
class OfficeShift extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'started_by',
        'ended_by',
        'started_at',
        'ended_at',
        'status',
        'start_cash_breakdown',
        'expected_cash_total',
        'end_of_shift_cash_breakdown',
        'discrepancy_amount',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'start_cash_breakdown' => 'array',
        'end_of_shift_cash_breakdown' => 'array',
        'expected_cash_total' => 'decimal:2',
        'discrepancy_amount' => 'decimal:2',
    ];

    public function starter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    public function ender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ended_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function workers(): HasMany
    {
        return $this->hasMany(OfficeShiftWorker::class);
    }
}
