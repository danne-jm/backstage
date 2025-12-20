<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:0'],
            'category' => ['nullable', 'array'],
            'category.*' => ['string', 'max:255'],
            'image' => ['nullable', 'image', 'max:10240'], // optional image, max 10MB
        ];
    }
}
