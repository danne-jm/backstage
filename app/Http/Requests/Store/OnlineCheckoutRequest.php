<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class OnlineCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxQty = config('services.store.max_quantity_per_item', 50);

        return [
            'items'                    => ['required', 'array', 'min:1'],
            'items.*.id'               => ['required', 'string'],
            'items.*.type'             => ['required', 'in:product,event'],
            'items.*.quantity'         => ['required', 'integer', 'min:1', "max:{$maxQty}"],
            'items.*.options'          => ['nullable', 'array'],
            'items.*.use_member_price' => ['nullable', 'boolean'],
            'discount_codes'           => ['nullable', 'array'],
            'discount_codes.*'         => ['string'],
            'email'                    => ['required', 'email', 'max:255'],
        ];
    }
}
