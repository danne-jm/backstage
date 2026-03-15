<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for distributing emails
 * Centralizes validation logic
 */
class DistributeEmailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Permission checks disabled - handled later
        return true;
    }

    public function rules(): array
    {
        return [
            'recipients' => ['required', 'array', 'min:1'],
            'recipients.*.email' => ['required', 'string', 'email'],
            'recipients.*.subject' => ['nullable', 'string'],
            'recipients.*.body' => ['nullable', 'string'],
            'recipients.*.event_id' => ['nullable', 'string'],
            'recipients.*.first_name' => ['nullable', 'string'],
            'recipients.*.last_name' => ['nullable', 'string'],
            'recipients.*.event_name' => ['nullable', 'string'],
            'recipients.*.event_date' => ['nullable', 'string'],
            'recipients.*.unique_trait' => ['nullable', 'string'],
            'recipients.*.scan_count' => ['nullable', 'integer'],
            'recipients.*.scan_details' => ['nullable'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipients.required' => 'At least one recipient is required.',
            'recipients.*.email.required' => 'Each recipient must have a valid email address.',
            'recipients.*.email.email' => 'The email address must be valid.',
        ];
    }
}
