<?php

namespace App\Actions\Sales;

use App\DTOs\Sales\SaleLinePayload;
use App\Models\Transaction;

class AttachSaleLinesAction
{
    /**
     * @param Transaction $transaction
     * @param SaleLinePayload[] $saleLines
     */
    public function handle(Transaction $transaction, array $saleLines): void
    {
        foreach ($saleLines as $line) {
            $transaction->sales()->create([
                'purchasable_id' => $line->purchasableId,
                'purchasable_type' => $line->purchasableType,
                'variant_id' => $line->variantId,
                'unit_price' => $line->unitPrice,
                'quantity' => $line->quantity,
                'subtotal' => $line->subtotal,
                'ticket_type' => $line->ticketType,
                'snapshot' => $line->snapshot,
                'discount_code_used' => $line->discountCodeUsed,
            ]);
        }
    }
}
