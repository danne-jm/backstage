import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from './rich-text-editor';
import { BaseFormSection } from './base-form-section';

/**
 * Email composition component
 * Combines subject input and rich text editor
 */
interface EmailComposerProps {
    subject: string;
    onSubjectChange: (subject: string) => void;
    body: string;
    onBodyChange: (body: string) => void;
    templateSelector?: React.ReactNode;
}

export function EmailComposer({
    subject,
    onSubjectChange,
    body,
    onBodyChange,
    templateSelector,
}: EmailComposerProps) {
    return (
        <BaseFormSection>
            <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                    id="email-subject"
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    placeholder="Email subject"
                />
            </div>

            <div>
                <RichTextEditor
                    value={body}
                    onChange={onBodyChange}
                    toolbar={templateSelector}
                />
            </div>
        </BaseFormSection>
    );
}
