<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class EndShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'end_of_shift_cash_breakdown' => ['nullable', 'array'],
            'end_of_shift_cash_breakdown.*.denomination' => ['required_with:end_of_shift_cash_breakdown', 'numeric'],
            'end_of_shift_cash_breakdown.*.count' => ['required_with:end_of_shift_cash_breakdown', 'integer', 'min:0'],
            'end_of_shift_cash_breakdown.*.total' => ['required_with:end_of_shift_cash_breakdown', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
