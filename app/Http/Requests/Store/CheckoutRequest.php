<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_email' => ['required', 'email', 'max:255'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.purchasable_id' => ['required', 'string'],
            'items.*.purchasable_type' => ['required', 'string'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.subtotal' => ['required', 'numeric', 'min:0'],
            'items.*.ticket_type' => ['nullable', 'string', 'in:regular,with_membership'],
            'items.*.variant_id' => ['nullable', 'string'],
            'items.*.snapshot' => ['nullable', 'array'],
            'items.*.discount_code_used' => ['nullable', 'string'],

            'discount_codes' => ['nullable', 'array'],
            'discount_codes.*' => ['string'],
        ];
    }
}
