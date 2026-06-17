<?php

namespace App\Http\Requests\Backstage;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendeeFilterConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendee_filter_config' => ['nullable', 'array'],
            'attendee_filter_config.*.column' => ['required_with:attendee_filter_config', 'string'],
            'attendee_filter_config.*.label' => ['nullable', 'string'],
            'attendee_filter_config.*.visible' => ['nullable', 'boolean'],
        ];
    }
}
