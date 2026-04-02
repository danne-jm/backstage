import * as React from 'react';
import { Button } from '@backstage/components/ui/button';
import { Label } from '@backstage/components/ui/label';
import { cn } from '@backstage/lib/utils';

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
            // Get the raw HTML and clean it
            let html = editorRef.current.innerHTML;

            // Ensure all p, li, ul, ol tags have proper inline styles if they don't already
            html = html.replace(/<p(?![^>]*style=)([^>]*)>/gi, '<p style="margin:0; padding:0; line-height:1.4;"$1>');
            html = html.replace(/<li(?![^>]*style=)([^>]*)>/gi, '<li style="margin:0; padding:0; display:list-item; line-height:1.4;"$1>');
            html = html.replace(/<ul(?![^>]*style=)([^>]*)>/gi, '<ul style="margin:0; padding-left:20px; list-style-type:disc; line-height:1.4;"$1>');
            html = html.replace(/<ol(?![^>]*style=)([^>]*)>/gi, '<ol style="margin:0; padding-left:20px; list-style-type:decimal; line-height:1.4;"$1>');

            // Mark empty paragraphs with a special inline style so backend can detect them
            // Replace <p><br></p> with <p class="email-spacing"><br></p>
            html = html.replace(/<p([^>]*style="[^"]*")><br\s*\/?><\/p>/gi, '<p$1 data-spacing="true"><br></p>');
            html = html.replace(/<p(?![^>]*data-spacing)><br\s*\/?><\/p>/gi, '<p data-spacing="true"><br></p>');

            onChange(html);
        }
    };

    const applyFormat = (cmd: string, arg?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, arg);
        handleInput();
    };

    const handleFocus = () => {
        document.execCommand('defaultParagraphSeparator', false, 'p');
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
                onFocus={handleFocus}
                className="min-h-[200px] rounded-md border border-input bg-background p-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                }}
            />
        </div>
    );
}
