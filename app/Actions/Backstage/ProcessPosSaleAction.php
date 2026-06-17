<?php

namespace App\Actions\Backstage;

use App\Actions\Sales\AttachSaleLinesAction;
use App\Actions\Sales\CreateTransactionRecordAction;
use App\DTOs\Sales\TransactionPayload;
use App\DTOs\Sales\SaleLinePayload;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class ProcessPosSaleAction
{
    public function __construct(
        protected CreateTransactionRecordAction $createTransactionRecordAction,
        protected AttachSaleLinesAction $attachSaleLinesAction,
        protected \App\Actions\Sales\AllocateStockAction $allocateStockAction
    ) {}

    /**
     * @param TransactionPayload $transactionPayload
     * @param SaleLinePayload[] $saleLines
     */
    public function handle(TransactionPayload $transactionPayload, array $saleLines): Transaction
    {
        return DB::transaction(function () use ($transactionPayload, $saleLines) {
            // 1. Create the base transaction record for POS
            $transaction = $this->createTransactionRecordAction->handle($transactionPayload);

            // 2. Attach the individual items bought
            $this->attachSaleLinesAction->handle($transaction, $saleLines);

            // 3. Allocate stock in the event-sourced ledger
            $transaction->load('sales.purchasable');
            foreach ($transaction->sales as $sale) {
                $this->allocateStockAction->handle($sale);
            }

            return $transaction;
        });
    }
}
