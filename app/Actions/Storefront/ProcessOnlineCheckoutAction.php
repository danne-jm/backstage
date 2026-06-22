<?php

namespace App\Actions\Storefront;

use App\Actions\Sales\AllocateStockAction;
use App\Actions\Sales\AttachSaleLinesAction;
use App\Actions\Sales\CreateTransactionRecordAction;
use App\DTOs\Sales\SaleLinePayload;
use App\DTOs\Sales\TransactionPayload;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class ProcessOnlineCheckoutAction
{
    public function __construct(
        protected CreateTransactionRecordAction $createTransactionRecordAction,
        protected AttachSaleLinesAction $attachSaleLinesAction,
        protected AllocateStockAction $allocateStockAction
    ) {}

    /**
     * @param  SaleLinePayload[]  $saleLines
     */
    public function handle(TransactionPayload $transactionPayload, array $saleLines): Transaction
    {
        return DB::transaction(function () use ($transactionPayload, $saleLines) {
            // 1. Create the pending online transaction
            $transaction = $this->createTransactionRecordAction->handle($transactionPayload);

            // 2. Attach the cart items
            $this->attachSaleLinesAction->handle($transaction, $saleLines);

            // 3. Allocate stock in the event-sourced ledger
            $transaction->load('sales.purchasable');
            foreach ($transaction->sales as $sale) {
                $this->allocateStockAction->handle($sale);
            }

            // 4. (Mock) Proceed to Payment Gateway
            // $paymentGateway->charge($transaction);

            // 5. (Mock) Dispatch confirmation email if successful

            return $transaction;
        });
    }
}
