import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    label?: string;
    templateSelector?: React.ReactNode;
}

export function RichTextEditor({
    value,
    onChange,
    label = 'Message',
    templateSelector,
}: RichTextEditorProps) {
    const bodyRef = React.useRef<HTMLDivElement>(null);
    const isInternalChange = React.useRef(false);

    // Sync external value to editor content
    React.useEffect(() => {
        if (bodyRef.current) {
            if (value !== bodyRef.current.innerHTML && !isInternalChange.current) {
                bodyRef.current.innerHTML = value;
            }
        }
        isInternalChange.current = false;
    }, [value]);

    const handleInput = () => {
        isInternalChange.current = true;
        if (bodyRef.current) {
            onChange(bodyRef.current.innerHTML);
        }
    };

    const applyFormat = (cmd: string, arg?: string) => {
        bodyRef.current?.focus();
        document.execCommand(cmd, false, arg);
        handleInput(); // Trigger change after format
    };

    const insertBulletList = () => applyFormat('insertUnorderedList');

    const insertLink = () => {
        const url = prompt('Enter the URL for the link:');
        if (!url) return;
        applyFormat('createLink', url);
        // Ensure target clean
        if (bodyRef.current) {
            const links = bodyRef.current.querySelectorAll('a');
            links.forEach((a) => {
                if (a.href === url) {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                }
            });
        }
        handleInput();
    };

    const removeLink = () => applyFormat('unlink');

    const setTextColor = () => {
        // Simplified for this component - could be upgraded to a popover
        const input = document.createElement('input');
        input.type = 'color';
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.click();
        input.oninput = () => {
            applyFormat('foreColor', input.value);
            document.body.removeChild(input);
        };
        input.onblur = () => document.body.removeChild(input);
    };

    const setBgColor = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.click();
        input.oninput = () => {
            applyFormat('hiliteColor', input.value);
            document.body.removeChild(input);
        };
        input.onblur = () => document.body.removeChild(input);
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex gap-2">
                    <Button onClick={() => applyFormat('bold')} size="sm" variant="outline" aria-label="Bold">B</Button>
                    <Button onClick={() => applyFormat('italic')} size="sm" variant="outline" aria-label="Italic">I</Button>
                    <Button onClick={() => applyFormat('underline')} size="sm" variant="outline" aria-label="Underline">U</Button>
                    <Button onClick={insertBulletList} size="sm" variant="outline" aria-label="Insert list">•</Button>
                    <Button onClick={insertLink} size="sm" variant="outline" aria-label="Insert link">🔗</Button>
                    <Button onClick={removeLink} size="sm" variant="outline" aria-label="Remove link">⛔</Button>
                    <Button onClick={setTextColor} size="sm" variant="outline" aria-label="Text color" style={{ color: '#d97706' }}>A</Button>
                    <Button onClick={setBgColor} size="sm" variant="outline" aria-label="Background color" style={{ background: '#fde68a', color: '#222' }}>Bg</Button>
                </div>
                {templateSelector}
            </div>

            <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="min-h-[180px] w-full rounded-md border bg-black p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                style={{ overflowY: 'auto' }}
            />
        </div>
    );
}

// Default export for lazy loading if needed, or consistent import style
export default RichTextEditor;
