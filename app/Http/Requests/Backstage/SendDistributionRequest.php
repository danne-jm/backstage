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
            // One of these must be provided
            'event_id' => ['nullable', 'string', 'exists:events,id'],
            'recipient_emails' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->filled('event_id') && ! $this->filled('recipient_emails')) {
                $validator->errors()->add('recipients', 'Provide either an event or a list of recipient emails.');
            }
        });
    }
}
