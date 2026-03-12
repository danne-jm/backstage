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
        return [
            'id' => $this->id, // deprecated for frontend selection
            'actual_id' => $this->id,
            'unique_id' => 'product-' . $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price ?? 0,
            'is_variant_based' => (bool) ($this->is_variant_based || $this->variants->count() > 0),
            'unlimited_quantity' => (bool) ($this->unlimited_quantity ?? false),
            'quantity' => $this->quantity ?? 0,
            'variants_config' => $this->variants_config,
            'variants' => $this->variants->map(fn($v) => [
                'id' => $v->id,
                'options' => $v->options,
                'quantity' => $v->quantity,
                'sold_count' => $v->sold_count,
                'remaining' => ($v->quantity !== null) ? ($v->quantity - $v->sold_count) : null,
            ]),
            'sales_count' => $this->sales_count,
            'online_sales_count' => $this->online_sales_count,
            'image' => $this->image,
            'images_list' => $this->images_list,
            'instagram_link' => $this->instagram_link,
            'variable_amount' => (bool) $this->variable_amount,
            'type' => 'product', // Added for frontend consistency
        ];
    }
}
