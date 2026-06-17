<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class SaveItemRequest extends FormRequest
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
            'image' => ['nullable', 'image', 'max:5120'],
            'changed_by' => ['nullable', 'string', 'max:255'],
        ];
    }
}
