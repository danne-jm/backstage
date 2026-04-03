<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class RecordOfficeSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route is already guarded by auth middleware.
        return true;
    }

    public function rules(): array
    {
        return [
            'item_id' => ['nullable'],
            'item_type' => ['nullable', 'string', 'in:product,event,custom'],
            'method' => ['required', 'in:cash,card'],
            'amount' => ['required', 'numeric'],
            'description' => ['nullable', 'string'],
            'ticket_type' => ['nullable', 'string', 'in:with_card,without_card'],
            'variant_id' => ['nullable', 'string'],
            'breakdown' => ['nullable', 'array'],
        ];
    }
}
