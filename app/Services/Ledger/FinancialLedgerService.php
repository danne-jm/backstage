<?php

namespace App\Services\Ledger;

use App\Models\FinancialLedgerEntry;
use App\Models\Transaction;

class FinancialLedgerService
{
    /**
     * Record a POS sale (Cash or Card).
     */
    public function recordOfficeSale(Transaction $transaction): FinancialLedgerEntry
    {
        return FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => "pos_sale:{$transaction->id}"],
            [
                'entry_type' => 'sale',
                'direction' => 'credit',
                'amount' => $transaction->total_amount,
                'channel' => 'pos',
                'payment_method' => $transaction->payment_method,
                'transaction_id' => $transaction->id,
                'notes' => 'POS sale recorded.',
            ]
        );
    }

    /**
     * Record a reversed or voided POS sale.
     */
    public function recordOfficeSaleRemoved(Transaction $transaction): FinancialLedgerEntry
    {
        return FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => "pos_sale_void:{$transaction->id}"],
            [
                'entry_type' => 'refund',
                'direction' => 'debit',
                'amount' => $transaction->total_amount,
                'channel' => 'pos',
                'payment_method' => $transaction->payment_method,
                'transaction_id' => $transaction->id,
                'notes' => 'POS sale voided.',
            ]
        );
    }

    /**
     * Record a completed online transaction.
     */
    public function recordOnlineTransactionCompleted(Transaction $transaction): FinancialLedgerEntry
    {
        return FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => "online_sale_completed:{$transaction->id}"],
            [
                'entry_type' => 'sale',
                'direction' => 'credit',
                'amount' => $transaction->total_amount,
                'channel' => 'online',
                'payment_method' => $transaction->payment_method,
                'transaction_id' => $transaction->id,
                'notes' => 'Online sale completed.',
            ]
        );
    }

    /**
     * Record a reversed/failed online transaction.
     */
    public function recordOnlineTransactionReversal(Transaction $transaction): FinancialLedgerEntry
    {
        return FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => "online_sale_reversed:{$transaction->id}"],
            [
                'entry_type' => 'refund',
                'direction' => 'debit',
                'amount' => $transaction->total_amount,
                'channel' => 'online',
                'payment_method' => $transaction->payment_method,
                'transaction_id' => $transaction->id,
                'notes' => 'Online sale reversed/abandoned.',
            ]
        );
    }
}
