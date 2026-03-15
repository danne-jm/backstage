import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Nullable fields section component
 * Collapsible section for marking fields as nullable/skippable
 * Useful for optional fields that might be empty in the data source
 */
interface NullableFieldsSectionProps {
    fields: string[];
    nullableFields: Record<string, boolean>;
    onChange: (field: string, value: boolean) => void;
}

export function NullableFieldsSection({
    fields,
    nullableFields,
    onChange,
}: NullableFieldsSectionProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isInfoOpen, setIsInfoOpen] = React.useState(false);

    if (fields.length === 0) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                    <div className="flex items-center gap-2">
                        <span>Nullable Fields</span>
                        <Badge variant="outline" className="text-xs">Not recommended</Badge>
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
                <div className="flex items-start gap-2">
                    <p className="text-xs text-muted-foreground flex-1">
                        Mark fields that can be inserted as blank if the value is missing in the data source.
                    </p>
                    <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                        <DialogTrigger asChild>
                            <button className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-4 w-4" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>About Nullable Fields</DialogTitle>
                            </DialogHeader>
                            <DialogDescription className="space-y-3">
                                <p>
                                    Mark fields that can be inserted as blank if the value is missing in the data source. This is useful for optional columns that might not be filled for every attendee.
                                </p>
                                <div className="bg-muted p-3 rounded-md space-y-2">
                                    <p className="font-semibold text-sm text-foreground">Example:</p>
                                    <p className="text-sm">
                                        For a "Quizz night" event, users had to provide their teammates via fields <code className="bg-background px-1 rounded text-xs">teammate1</code>, <code className="bg-background px-1 rounded text-xs">teammate2</code>, and <code className="bg-background px-1 rounded text-xs">teammate3</code>.
                                    </p>
                                    <p className="text-sm">
                                        If you append these into the email (e.g., <code className="bg-background px-1 rounded text-xs">{`{{teammate2}}`}</code>), the system can generate their names in every email.
                                    </p>
                                    <p className="text-sm">
                                        However, if a user only has two teammates, and column {`{{teammate3}}`} is <strong>not</strong> marked as skippable, it will show as "<code className="bg-background px-1 rounded text-xs">undefined</code>" instead of leaving it blank.
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This only affects the text editor for the email content generation. Modifying this section will only make sense in rare scenarios.
                                </p>
                            </DialogDescription>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="space-y-2">
                    {fields.map((field) => (
                        <div key={field} className="flex items-center space-x-2">
                            <Checkbox
                                id={`nullable-${field}`}
                                checked={nullableFields[field] ?? false}
                                onCheckedChange={(checked) =>
                                    onChange(field, checked as boolean)
                                }
                            />
                            <Label
                                htmlFor={`nullable-${field}`}
                                className="text-xs font-normal cursor-pointer font-mono"
                            >
                                {`{{${field}}}`}
                            </Label>
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
