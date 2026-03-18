import * as React from 'react';

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
            <select
                className="h-8 w-[160px] rounded border text-xs bg-background text-foreground"
                value={selectedId}
                onChange={(e) =>
                    onChange(e.target.value === 'none' ? 'none' : e.target.value)
                }
            >
                <option value="none" className="bg-white text-black">
                    No Template
                </option>
                {templates.map((template) => (
                    <option
                        key={template.id}
                        value={template.id}
                        className="bg-white text-black"
                    >
                        {template.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
