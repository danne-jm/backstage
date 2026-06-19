<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class ScanTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ticket_code' => ['required', 'string', 'max:50'],
            'event_id' => ['required', 'string', 'exists:events,id'],
        ];
    }
}
