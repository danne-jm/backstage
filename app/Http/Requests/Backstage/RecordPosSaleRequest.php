<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPosSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method' => ['required', 'string', Rule::in(['pos_card', 'pos_cash'])],

            'lines' => ['required', 'array', 'min:1'],
            'lines.*.purchasable_id' => ['required', 'string'],
            'lines.*.purchasable_type' => ['required', 'string'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.quantity' => ['required', 'integer', 'min:1'],
            'lines.*.subtotal' => ['required', 'numeric', 'min:0'],
            'lines.*.ticket_type' => ['nullable', 'string', Rule::in(['regular', 'with_membership'])],
            'lines.*.variant_id' => ['nullable', 'string'],
            'lines.*.snapshot' => ['nullable', 'array'],
            'lines.*.discount_code_used' => ['nullable', 'string'],

            // Cash-specific fields (required when payment_method is pos_cash)
            'cash_tendered_amount' => ['required_if:payment_method,pos_cash', 'nullable', 'numeric', 'min:0'],
            'cash_change_amount' => ['required_if:payment_method,pos_cash', 'nullable', 'numeric', 'min:0'],
            'cash_tendered_breakdown' => ['nullable', 'array'],
            'cash_change_breakdown' => ['nullable', 'array'],
        ];
    }
}
