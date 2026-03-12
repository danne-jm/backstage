<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfficeShiftSaleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $item_name = $this->product ? $this->product->name : ($this->event ? $this->event->name : 'Unknown Item');
        $user = \App\Models\User::find($this->sold_by);

        return [
            'id' => $this->id,
            'name' => $item_name,
            'method' => $this->method,
            'is_custom' => $this->description !== null && $this->description !== 'Quick Sale',
            'ticket_type' => $this->snapshot['ticket_type'] ?? null,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'breakdown' => $this->breakdown,
            'sold_by' => $user ? trim($user->first_name . ' ' . $user->last_name) : 'Unknown',
            'sold_at' => $this->sold_at ?? $this->created_at,
            'created_at' => $this->sold_at ?? $this->created_at, // for backward compatibility in frontend components
        ];
    }
}
