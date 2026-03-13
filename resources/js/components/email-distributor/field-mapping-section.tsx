import * as React from 'react';
import { BaseFormSection } from './base-form-section';
import { BaseFieldMapper } from './base-field-mapper';

/**
 * Field mapping section component
 * Maps data source fields to email recipient fields
 */
interface FieldMappingSectionProps {
    fields: string[];
    firstNameField: string;
    lastNameField: string;
    emailField: string;
    onFirstNameChange: (value: string) => void;
    onLastNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
}

export function FieldMappingSection({
    fields,
    firstNameField,
    lastNameField,
    emailField,
    onFirstNameChange,
    onLastNameChange,
    onEmailChange,
}: FieldMappingSectionProps) {
    return (
        <BaseFormSection
            title="Field Mapping"
            description="Map data source columns to recipient fields"
        >
            <div className="space-y-2">
                <BaseFieldMapper
                    label="First name source"
                    value={firstNameField}
                    onChange={onFirstNameChange}
                    options={fields}
                />

                <BaseFieldMapper
                    label="Last name source"
                    value={lastNameField}
                    onChange={onLastNameChange}
                    options={fields}
                />

                <BaseFieldMapper
                    label="Email source"
                    value={emailField}
                    onChange={onEmailChange}
                    options={fields}
                />
            </div>
        </BaseFormSection>
    );
}
