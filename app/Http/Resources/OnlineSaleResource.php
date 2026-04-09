<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OnlineSaleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * This is the canonical shape for online sales used by both the
     * Office views and the Store Manager "All Sales" page, so we avoid
     * re-implementing the same mapping logic in multiple controllers.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $product = $this->product;
        $event = $this->event;

        $itemName = $product?->name ?? $event?->name ?? 'Unknown Item';

        $variantOptions = $this->details['options'] ?? null;
        $itemType = $product ? 'product' : ($event ? 'event' : 'custom');
        $actualId = $this->product_id ?? $this->event_id;

        $transaction = $this->transaction ?? null;

        return [
            'id' => $this->id,
            'name' => $itemName,
            'method' => 'online',
            'amount' => (float) $this->amount,
            'ticket_type' => $this->ticket_type,
            'with_esncard' => ($this->ticket_type === 'with_card' || !empty($this->details['code_used'])),
            'ticket_type_label' => ($this->ticket_type === 'with_card' || !empty($this->details['code_used'])) ? 'ESNcard' : ($this->ticket_type === 'without_card' ? 'No ESNcard' : null),
            'reference_id' => $this->reference_id,
            'variant_options' => $variantOptions,
            'is_variant_based' => !empty($variantOptions),
            'code_used' => $this->details['code_used'] ?? null,
            'sold_at' => $this->sold_at?->toIso8601String(),
            'created_at' => $this->sold_at?->toIso8601String(),
            'is_online' => true,
            'actual_id' => $actualId,
            'item_type' => $itemType,

            // Online transaction metadata – used by the Store Manager
            // all-sales page to group and link receipts.
            'online_transaction_id' => $this->online_transaction_id,
            'transaction_ref' => $transaction?->reference_id,
            'payment_status' => $transaction?->payment_status,
            'email' => $transaction?->email,
            'mail_success' => $transaction?->mail_success,
            'processing_fee' => $transaction ? (float) $transaction->processing_fee : null,
        ];
    }
}
