import * as React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';

/**
 * Template selector component
 * Allows selection of email templates
 */
interface Template {
    id: string;
    name: string;
}

interface TemplateSelectorProps {
    templates: Template[];
    selectedId: string | 'none';
    onChange: (templateId: string | 'none') => void;
}

export function TemplateSelector({
    templates,
    selectedId,
    onChange,
}: TemplateSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
                Email Template:
            </span>
            <Select
                value={selectedId}
                onValueChange={(val) => onChange(val === 'none' ? 'none' : val)}
            >
                <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">No Template</SelectItem>
                    {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                            {template.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
