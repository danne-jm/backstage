<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class StartShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_cash_breakdown' => ['nullable', 'array'],
            'start_cash_breakdown.*.denomination' => ['required_with:start_cash_breakdown', 'numeric'],
            'start_cash_breakdown.*.count' => ['required_with:start_cash_breakdown', 'integer', 'min:0'],
            'start_cash_breakdown.*.total' => ['required_with:start_cash_breakdown', 'numeric', 'min:0'],
        ];
    }
}
