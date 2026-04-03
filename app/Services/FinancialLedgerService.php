<?php

namespace App\Services;

use App\Models\FinancialLedgerEntry;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineTransaction;

class FinancialLedgerService
{
    /**
     * Record revenue entries for an online transaction when it becomes completed.
     * Idempotent by per-sale key and per-transaction processing-fee key.
     */
    public function recordOnlineTransactionCompleted(OnlineTransaction $transaction): void
    {
        $transaction->loadMissing('sales');

        foreach ($transaction->sales as $sale) {
            FinancialLedgerEntry::firstOrCreate(
                ['idempotency_key' => "online_sale_completed:{$sale->id}"],
                [
                    'entry_type' => 'online_sale_completed',
                    'direction' => 'credit',
                    'amount' => (float) $sale->amount,
                    'currency' => 'EUR',
                    'channel' => 'online',
                    'payment_method' => $sale->method ?? 'card',
                    'source_type' => 'online_sale',
                    'source_id' => $sale->id,
                    'source_reference' => $sale->reference_id,
                    'online_transaction_id' => $transaction->id,
                    'online_sale_id' => $sale->id,
                    'product_id' => $sale->product_id,
                    'event_id' => $sale->event_id,
                    'metadata' => [
                        'transaction_reference' => $transaction->reference_id,
                        'ticket_type' => $sale->ticket_type,
                    ],
                    'occurred_at' => $transaction->completed_at ?? now(),
                ]
            );
        }

        if ((float) $transaction->processing_fee > 0) {
            FinancialLedgerEntry::firstOrCreate(
                ['idempotency_key' => "online_processing_fee:{$transaction->id}"],
                [
                    'entry_type' => 'online_processing_fee',
                    'direction' => 'debit',
                    'amount' => (float) $transaction->processing_fee,
                    'currency' => 'EUR',
                    'channel' => 'online',
                    'payment_method' => 'card',
                    'source_type' => 'online_transaction',
                    'source_id' => $transaction->id,
                    'source_reference' => $transaction->reference_id,
                    'online_transaction_id' => $transaction->id,
                    'metadata' => [
                        'gateway' => $transaction->payment_gateway,
                    ],
                    'occurred_at' => $transaction->completed_at ?? now(),
                ]
            );
        }
    }

    /**
     * Record a POS/office sale entry when the sale is created.
     * Idempotent by office shift sale id.
     */
    public function recordOfficeSale(OfficeShiftSale $sale, OfficeShift $shift): void
    {
        FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => "office_shift_sale_recorded:{$sale->id}"],
            [
                'entry_type' => 'office_shift_sale_recorded',
                'direction' => 'credit',
                'amount' => (float) $sale->amount,
                'currency' => 'EUR',
                'channel' => 'office',
                'payment_method' => $sale->method,
                'source_type' => 'office_shift_sale',
                'source_id' => $sale->id,
                'source_reference' => $sale->id,
                'office_shift_id' => $shift->id,
                'office_shift_sale_id' => $sale->id,
                'product_id' => $sale->product_id,
                'event_id' => $sale->event_id,
                'metadata' => [
                    'sold_by' => $sale->sold_by,
                    'ticket_type' => data_get($sale->snapshot, 'ticket_type'),
                    'description' => $sale->description,
                ],
                'occurred_at' => $sale->sold_at ?? now(),
            ]
        );
    }

    /**
     * Record compensating entries for an online transaction.
     * Creates opposite-side entries for prior online completion entries.
     */
    public function recordOnlineTransactionReversal(OnlineTransaction $transaction, string $reason = 'failed'): void
    {
        $transaction->loadMissing('sales');

        foreach ($transaction->sales as $sale) {
            $completedKey = "online_sale_completed:{$sale->id}";

            if (!FinancialLedgerEntry::where('idempotency_key', $completedKey)->exists()) {
                continue;
            }

            FinancialLedgerEntry::firstOrCreate(
                ['idempotency_key' => "online_sale_reversed:{$sale->id}"],
                [
                    'entry_type' => 'online_sale_reversed',
                    'direction' => 'debit',
                    'amount' => (float) $sale->amount,
                    'currency' => 'EUR',
                    'channel' => 'online',
                    'payment_method' => $sale->method ?? 'card',
                    'source_type' => 'online_sale',
                    'source_id' => $sale->id,
                    'source_reference' => $sale->reference_id,
                    'online_transaction_id' => $transaction->id,
                    'online_sale_id' => $sale->id,
                    'product_id' => $sale->product_id,
                    'event_id' => $sale->event_id,
                    'metadata' => [
                        'transaction_reference' => $transaction->reference_id,
                        'reason' => $reason,
                        'reversal_of' => $completedKey,
                    ],
                    'occurred_at' => now(),
                ]
            );
        }

        $feeCompletedKey = "online_processing_fee:{$transaction->id}";

        if (FinancialLedgerEntry::where('idempotency_key', $feeCompletedKey)->exists()) {
            FinancialLedgerEntry::firstOrCreate(
                ['idempotency_key' => "online_processing_fee_reversed:{$transaction->id}"],
                [
                    'entry_type' => 'online_processing_fee_reversed',
                    'direction' => 'credit',
                    'amount' => (float) $transaction->processing_fee,
                    'currency' => 'EUR',
                    'channel' => 'online',
                    'payment_method' => 'card',
                    'source_type' => 'online_transaction',
                    'source_id' => $transaction->id,
                    'source_reference' => $transaction->reference_id,
                    'online_transaction_id' => $transaction->id,
                    'metadata' => [
                        'gateway' => $transaction->payment_gateway,
                        'reason' => $reason,
                        'reversal_of' => $feeCompletedKey,
                    ],
                    'occurred_at' => now(),
                ]
            );
        }
    }

    /**
     * Record compensating entry when an office sale is removed.
     */
    public function recordOfficeSaleRemoved(OfficeShiftSale $sale, OfficeShift $shift, string $reason = 'removed'): void
    {
        FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => "office_shift_sale_removed:{$sale->id}"],
            [
                'entry_type' => 'office_shift_sale_removed',
                'direction' => 'debit',
                'amount' => (float) $sale->amount,
                'currency' => 'EUR',
                'channel' => 'office',
                'payment_method' => $sale->method,
                'source_type' => 'office_shift_sale',
                'source_id' => $sale->id,
                'source_reference' => $sale->id,
                'office_shift_id' => $shift->id,
                'office_shift_sale_id' => $sale->id,
                'product_id' => $sale->product_id,
                'event_id' => $sale->event_id,
                'metadata' => [
                    'reason' => $reason,
                    'reversal_of' => "office_shift_sale_recorded:{$sale->id}",
                    'sold_by' => $sale->sold_by,
                    'ticket_type' => data_get($sale->snapshot, 'ticket_type'),
                    'description' => $sale->description,
                ],
                'occurred_at' => now(),
            ]
        );
    }
}
