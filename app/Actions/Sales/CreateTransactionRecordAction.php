<?php

namespace App\Actions\Sales;

use App\DTOs\Sales\TransactionPayload;
use App\Models\Transaction;

class CreateTransactionRecordAction
{
    public function handle(TransactionPayload $payload): Transaction
    {
        return Transaction::create([
            'channel' => $payload->channel,
            'payment_method' => $payload->paymentMethod,
            'total_amount' => $payload->totalAmount,
            'discount_total' => $payload->discountTotal,
            'status' => $payload->status,
            'office_shift_id' => $payload->officeShiftId,
            'customer_email' => $payload->customerEmail,
            'external_payment_id' => $payload->externalPaymentId,
            'cash_tendered_amount' => $payload->cashTenderedAmount,
            'cash_change_amount' => $payload->cashChangeAmount,
            'cash_tendered_breakdown' => $payload->cashTenderedBreakdown,
            'cash_change_breakdown' => $payload->cashChangeBreakdown,
            'completed_at' => $payload->status === 'completed' ? now() : null,
        ]);
    }
}
