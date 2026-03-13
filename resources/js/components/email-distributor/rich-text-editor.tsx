import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Rich text editor component for email composition
 * Provides toolbar for basic HTML formatting
 */
interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    label?: string;
    className?: string;
    toolbar?: React.ReactNode;
}

export function RichTextEditor({
    value,
    onChange,
    label = 'Message',
    className,
    toolbar,
}: RichTextEditorProps) {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const isInternalChange = React.useRef(false);

    // Sync external value to editor content
    React.useEffect(() => {
        if (editorRef.current && !isInternalChange.current) {
            if (value !== editorRef.current.innerHTML) {
                editorRef.current.innerHTML = value;
            }
        }
        isInternalChange.current = false;
    }, [value]);

    const handleInput = () => {
        isInternalChange.current = true;
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const applyFormat = (cmd: string, arg?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, arg);
        handleInput();
    };

    const toolbarActions = (
        <div className="flex flex-wrap items-center gap-1">
            <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => applyFormat('bold')}
                title="Bold"
            >
                <strong>B</strong>
            </Button>
            <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => applyFormat('italic')}
                title="Italic"
            >
                <em>I</em>
            </Button>
            <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => applyFormat('underline')}
                title="Underline"
            >
                <u>U</u>
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => applyFormat('insertUnorderedList')}
                title="Bullet List"
            >
                ≡
            </Button>
            <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                    const url = prompt('Enter URL:');
                    if (url) applyFormat('createLink', url);
                }}
                title="Insert Link"
            >
                🔗
            </Button>
        </div>
    );

    return (
        <div className={cn('space-y-2', className)}>
            {label && <Label>{label}</Label>}
            
            {toolbar && <div className="flex items-center justify-between">
                {toolbarActions}
                {toolbar}
            </div>}
            
            {!toolbar && toolbarActions}

            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="min-h-[200px] rounded-md border border-input bg-background p-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                }}
            />
        </div>
    );
}
