<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class SaveProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_sell_date' => ['nullable', 'date'],
            'end_sell_date' => ['nullable', 'date', 'after_or_equal:start_sell_date'],
            'is_online_sellable' => ['boolean'],
            'hide_until_sale' => ['boolean'],

            // Pricing
            'price' => ['required', 'numeric', 'min:0'],
            'price_without_membership' => ['numeric', 'min:0'],
            'price_with_membership' => ['numeric', 'min:0'],
            'variable_amount' => ['boolean'],

            // Stock — universal pool
            'unlimited_quantity' => ['boolean'],
            'quantity' => ['nullable', 'integer', 'min:0'],

            // Stock — membership split pools
            'unlimited_quantity_with_membership' => ['boolean'],
            'quantity_with_membership' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity_without_membership' => ['boolean'],
            'quantity_without_membership' => ['nullable', 'integer', 'min:0'],

            // Variants
            'is_variant_based' => ['boolean'],
            'variants_config' => ['nullable', 'array'],

            // Access
            'responsible_user_ids' => ['nullable', 'array'],
            'responsible_user_ids.*' => ['string'],
        ];
    }
}
