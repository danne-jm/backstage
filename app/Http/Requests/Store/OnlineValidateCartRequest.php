<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class OnlineValidateCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxQty = config('services.store.max_quantity_per_item', 50);

        return [
            'items'              => ['required', 'array'],
            'items.*.id'         => ['required', 'string'],
            'items.*.type'       => ['required', 'in:product,event'],
            'items.*.quantity'   => ['required', 'integer', 'min:1', "max:{$maxQty}"],
            'items.*.options'    => ['nullable', 'array'],
            'codes'              => ['nullable', 'array'],
            'codes.*'            => ['string'],
        ];
    }
}
