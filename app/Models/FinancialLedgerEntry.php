<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialLedgerEntry extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'entry_type',
        'direction',
        'amount',
        'currency',
        'channel',
        'payment_method',
        'source_type',
        'source_id',
        'source_reference',
        'idempotency_key',
        'online_transaction_id',
        'online_sale_id',
        'office_shift_id',
        'office_shift_sale_id',
        'product_id',
        'event_id',
        'metadata',
        'occurred_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];
}
