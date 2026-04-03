<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $soldCount = (int) ($this->sold_count ?? 0);
        $quantity  = $this->quantity ?? null;   // null means unlimited
        $unlimited = (bool) ($this->unlimited_quantity ?? false);

        $remaining = ($unlimited || $quantity === null)
            ? null
            : max(0, $quantity - $soldCount);

        return [
            'id' => $this->id, // deprecated for frontend selection
            'actual_id' => $this->id,
            'unique_id' => 'product-' . $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price ?? 0,
            'price_with_card' => $this->price_with_card !== null ? (float) $this->price_with_card : null,
            'price_without_card' => $this->price_without_card !== null ? (float) $this->price_without_card : null,
            'start_sell_date' => $this->start_sell_date?->toIso8601String(),
            'end_sell_date' => $this->end_sell_date?->toIso8601String(),
            'is_variant_based' => (bool) ($this->is_variant_based || $this->variants->count() > 0),
            'unlimited_quantity' => $unlimited,
            'quantity' => $quantity,
            'sold_count' => $soldCount,
            'remaining' => $remaining,
            'variants_config' => $this->variants_config,
            'variants' => $this->variants->map(fn($v) => [
                'id' => $v->id,
                'options' => $v->options,
                'quantity' => $v->quantity,
                'sold_count' => $v->sold_count,
                'remaining' => ($v->quantity !== null) ? max(0, $v->quantity - $v->sold_count) : null,
            ]),
            'sales_count' => $this->sales_count,
            'online_sales_count' => $this->online_sales_count,
            'image' => $this->image,
            'images_list' => $this->images_list,
            'instagram_link' => $this->instagram_link,
            'variable_amount' => (bool) $this->variable_amount,
            'is_online_sellable' => (bool) $this->is_online_sellable,
            'type' => 'product',
        ];
    }
}
