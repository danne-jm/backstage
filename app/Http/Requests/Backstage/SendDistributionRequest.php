<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class SendDistributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'event_id' => ['nullable', 'string', 'exists:events,id'],
            'custom_event_name' => ['nullable', 'string', 'max:255'],
            'custom_event_date' => ['nullable', 'date'],
            'emails' => ['required', 'array', 'min:1'],
            'emails.*.email' => ['required', 'email'],
            'emails.*.body' => ['required', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        // Add any custom validation logic here if needed
    }
}
