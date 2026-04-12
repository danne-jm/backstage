<?php

namespace App\Http\Resources;

use App\Models\User;
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
        $quantity  = $this->quantity ?? null;
        $unlimited = (bool) ($this->unlimited_quantity ?? false);

        $remaining = ($unlimited || $quantity === null)
            ? null
            : $this->computedRemaining();

        $remainingWithCard    = $this->computedRemainingWithCard();
        $remainingWithoutCard = $this->computedRemainingWithoutCard();

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
            'remaining' => $remaining,
            'quantity_with_card' => $this->quantity_with_card,
            'unlimited_quantity_with_card' => (bool) ($this->unlimited_quantity_with_card ?? false),
            'remaining_with_card' => $remainingWithCard,
            'quantity_without_card' => $this->quantity_without_card,
            'unlimited_quantity_without_card' => (bool) ($this->unlimited_quantity_without_card ?? false),
            'remaining_without_card' => $remainingWithoutCard,
            'responsible_user_ids' => $this->responsible_user_ids ?? [],
            'responsible_users' => User::whereIn('id', $this->responsible_user_ids ?? [])
                ->get(['id', 'first_name', 'last_name', 'email'])
                ->map(fn($u) => ['id' => $u->id, 'name' => trim("{$u->first_name} {$u->last_name}"), 'email' => $u->email])
                ->values(),
            'variants_config' => $this->variants_config,
            'variants' => $this->variants->map(fn($v) => [
                'id' => $v->id,
                'options' => $v->options,
                'quantity' => $v->quantity,
                'remaining' => $v->computedRemaining(),
            ]),
            'sales_count' => $this->sales_count,
            'online_sales_count' => $this->online_sales_count,
            'image' => $this->image,
            'images_list' => $this->images_list,
            'instagram_link' => $this->instagram_link,
            'variable_amount' => (bool) $this->variable_amount,
            'is_online_sellable' => (bool) $this->is_online_sellable,
            'hide_until_sale' => (bool) $this->hide_until_sale,
            'type' => 'product',
        ];
    }
}
