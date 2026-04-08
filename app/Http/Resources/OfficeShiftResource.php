<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfficeShiftResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $onlineRevenue = (float) \App\Models\OnlineSale::where('office_shift_id', $this->id)
            ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
            ->sum('amount');
        $posCashTotal = (float) $this->cash_total;
        $posCardTotal = (float) $this->card_total;

        return [
            'id' => $this->id,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'started_by' => $this->started_by,
            'ended_at' => $this->ended_at,
            'ended_by' => $this->ended_by,
            'cash_total' => $posCashTotal + 0, // In case we want to add online cash in future
            'card_total' => $posCardTotal + $onlineRevenue - (float) $this->start_card,
            'total' => $posCashTotal + $posCardTotal + $onlineRevenue - (float) $this->start_card,
            'pos_cash_total' => $posCashTotal,
            'pos_card_total' => $posCardTotal,
            'online_revenue' => $onlineRevenue,
            'start_cash' => (float) $this->start_cash,
            'start_card' => (float) $this->start_card,
            'total_cash' => (float) $this->total_cash,
            'total_card' => (float) $this->total_card,
            'cash_breakdown' => $this->cash_breakdown ?? [],
            'start_cash_breakdown' => $this->start_cash_breakdown ?? [],
            'end_of_shift_cash_breakdown' => $this->end_of_shift_cash_breakdown ?? [],
            'notes' => $this->notes,
            'workers' => $this->workers ? $this->workers->map(fn($w) => $w->user->first_name . ' ' . $w->user->last_name)->join(', ') : '',
            'workers_list' => $this->workers ? $this->workers->map(fn($w) => [
                'id' => $w->user->id,
                'name' => $w->user->first_name . ' ' . $w->user->last_name,
                'role' => $w->role,
                'email' => $w->user->email,
            ]) : [],
            // The following are calculated or joined properties needed by certain views
            'sales' => OfficeShiftSaleResource::collection($this->whenLoaded('sales')),
        ];
    }
}
