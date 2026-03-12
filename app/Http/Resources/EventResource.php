<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $hasVariants = !empty($this->variants_config);

        return [
            'id' => $this->id, // deprecated for frontend selection
            'actual_id' => $this->id,
            'unique_id' => 'event-' . $this->id,
            'is_variant_based' => (bool) $this->is_variant_based,
            'name' => $this->name,
            'description' => $this->description,
            'event_date' => $this->event_date,
            'start_sell_date' => $this->start_sell_date,
            'end_sell_date' => $this->end_sell_date,
            'price_with_card' => $this->price_with_card ?? 0,
            'price_without_card' => $this->price_without_card ?? 0,
            'quantity' => $this->quantity,
            'unlimited_quantity' => (bool) ($this->unlimited_quantity ?? false),
            'responsible_user_id' => $this->responsible_user_id,
            'notes' => $this->notes,
            'variable_amount' => (bool) $this->variable_amount,
            'quantity_with_card' => $this->quantity_with_card,
            'unlimited_quantity_with_card' => (bool) ($this->unlimited_quantity_with_card ?? false),
            'quantity_without_card' => $this->quantity_without_card,
            'unlimited_quantity_without_card' => (bool) ($this->unlimited_quantity_without_card ?? false),
            'google_spreadsheet_id' => $this->google_spreadsheet_id,
            'responsibleUser' => $this->responsibleUser ? [
                'id' => $this->responsibleUser->id,
                'first_name' => $this->responsibleUser->first_name,
                'last_name' => $this->responsibleUser->last_name,
            ] : null,
            'remaining' => $this->remaining,
            'remaining_with_card' => $this->remaining_with_card,
            'remaining_without_card' => $this->remaining_without_card,
            'is_online_sellable' => (bool) $this->is_online_sellable,
            'image' => $this->image,
            'images_list' => $this->images_list,
            'instagram_link' => $this->instagram_link,
            'variants_config' => $hasVariants ? $this->variants_config : null,
            'variants' => $this->variants->map(fn($v) => [
                'id' => $v->id,
                'options' => $v->options,
                'quantity' => $v->quantity,
                'sold_count' => $v->sold_count,
                'remaining' => ($v->quantity !== null) ? ($v->quantity - $v->sold_count) : null,
            ]),
            'sales_count' => $this->sales_count,
            'online_sales_count' => $this->online_sales_count,
            'type' => 'event', // Added for frontend consistency
        ];
    }
}
