/* eslint-disable */
import { Head, router, useForm } from '@inertiajs/react';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Link as LinkIcon,
    Send,
    Settings,
    Mail,
    RefreshCw,
    ChevronDown,
} from 'lucide-react';
import Papa from 'papaparse';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    getHeaders,
    getRows,
    distribute,
    distributeSample,
} from '@/actions/App/Http/Controllers/Backstage/EmailDistributorController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1 rounded-t-xl border-b border-[#2a2a2a] bg-[#141414] p-2">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`rounded-md p-2 ${editor.isActive('bold') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <Bold className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`rounded-md p-2 ${editor.isActive('italic') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <Italic className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`rounded-md p-2 ${editor.isActive('underline') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`rounded-md p-2 ${editor.isActive('strike') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <Strikethrough className="h-4 w-4" />
            </button>
            <div className="mx-1 h-6 w-[1px] bg-[#2a2a2a]" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`rounded-md p-2 ${editor.isActive('bulletList') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <List className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`rounded-md p-2 ${editor.isActive('orderedList') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <ListOrdered className="h-4 w-4" />
            </button>
        </div>
    );
};

export default function EmailDistributor({
    events,
    recent_logs,
    flash,
    errors,
    is_google_connected,
}: any) {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const selectedEvent = events.find((e: any) => e.id === selectedEventId);

    const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
    const [sheetRows, setSheetRows] = useState<any[]>([]);
    const [previewRowIndex, setPreviewRowIndex] = useState<number>(-1);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
    const [isOutboxExpanded, setIsOutboxExpanded] = useState(false);

    const { data, setData, post, processing, reset, clearErrors } = useForm({
        event_id: '',
        custom_event_name: '',
        custom_event_date: '',
        subject: '',
        body: '<p>Hello <strong>{{firstName}} {{last_name}}</strong>,</p><p></p><p>Thanks for registering — below are your ticket details for the event.</p><ul><li><p>Event: {{event_name}}</p></li><li><p>Date: {{event_date}}</p></li><li><p>Bring: Your card (if applicable)</p></li></ul><p>Please bring a copy of this email (printed or on your phone).</p><p></p><p>See you there,<br>Organization Name</p>',
        first_name_column: '',
        last_name_column: '',
        email_column: '',
        include_qr: false,
        emails: [] as { email: string; body: string }[],
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            TextStyle,
            Color,
        ],
        content: data.body,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none min-h-[300px] p-4 focus:outline-none focus:ring-0',
            },
        },
        onUpdate: ({ editor }) => {
            setData('body', editor.getHTML());
        },
    });

    useEffect(() => {
        if (is_google_connected === false) {
            toast.error(
                'Google account not connected or credentials expired. Please reconnect in settings.',
                { id: 'google-error' },
            );
        }
    }, [is_google_connected]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
            reset('subject', 'body', 'custom_event_name', 'emails');
            setSheetHeaders([]);
            setSheetRows([]);
            setPreviewRowIndex(-1);
            editor?.commands.setContent('');
        }

        if (flash?.error) {
            toast.error(flash.error, {
                id: flash.error.includes('Google') ? 'google-error' : undefined,
            });
        }
    }, [flash]);

    const handleEventChange = async (value: string) => {
        if (value === 'clear') {
            setSelectedEventId(null);
            setData('event_id', '');
            setSheetHeaders([]);
            setSheetRows([]);
            setPreviewRowIndex(-1);
        } else {
            const ev = events.find((e: any) => e.id === value);
            if (ev && !ev.google_spreadsheet_id) {
                toast.error(
                    'This event does not have a linked spreadsheet ID. Please link one in Sellables.',
                    { id: 'sheet-error' },
                );
            }

            setSelectedEventId(value);
            setData('event_id', value);

            setIsLoadingData(true);

            try {
                // Fetch headers and rows in parallel
                const [headersRes, rowsRes] = await Promise.all([
                    fetch(getHeaders.url({ event: value })),
                    fetch(getRows.url({ event: value })),
                ]);

                if (!headersRes.ok) {
                    const errorJson = await headersRes.json().catch(() => ({}));
                    toast.error(
                        errorJson.error || 'Failed to load Google Sheet data.',
                        { id: 'sheet-error' },
                    );

                    return;
                }

                if (!rowsRes.ok) {
                    const errorJson = await rowsRes.json().catch(() => ({}));
                    toast.error(
                        errorJson.error || 'Failed to load Google Sheet rows.',
                        { id: 'sheet-error' },
                    );

                    return;
                }

                const headersJson = await headersRes.json();
                setSheetHeaders(headersJson.headers || []);

                const hdrs = headersJson.headers || [];
                const findHeader = (keywords: string[]) =>
                    hdrs.find((h: string) =>
                        keywords.some((k) => h.toLowerCase().includes(k)),
                    ) || '';

                setData((prev) => ({
                    ...prev,
                    first_name_column: findHeader([
                        'first name',
                        'firstname',
                        'first_name',
                        'first-name',
                        'voornaam',
                    ]),
                    last_name_column: findHeader([
                        'last name',
                        'lastname',
                        'last_name',
                        'last-name',
                        'achternaam',
                        'surname',
                    ]),
                    email_column: findHeader([
                        'email',
                        'e-mail',
                        'address',
                        'email_address',
                        'email address',
                        'email-address',
                    ]),
                    event_id: value,
                }));

                const rowsJson = await rowsRes.json();
                setSheetRows(rowsJson.rows || []);

                if (rowsJson.rows && rowsJson.rows.length > 0) {
                    setPreviewRowIndex(0);
                }
            } catch (err) {
                console.error('Failed to fetch sheet data', err);
            } finally {
                setIsLoadingData(false);
            }
        }
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setIsLoadingData(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const hdrs = results.meta.fields || [];
                setSheetHeaders(hdrs);
                setSheetRows(results.data);

                if (results.data.length > 0) {
                    setPreviewRowIndex(0);
                }

                const findHeader = (keywords: string[]) =>
                    hdrs.find((h: string) =>
                        keywords.some((k) => h.toLowerCase().includes(k)),
                    ) || '';

                setData((prev) => ({
                    ...prev,
                    first_name_column: findHeader([
                        'first name',
                        'firstname',
                        'first_name',
                        'first-name',
                        'voornaam',
                    ]),
                    last_name_column: findHeader([
                        'last name',
                        'lastname',
                        'last_name',
                        'last-name',
                        'achternaam',
                        'surname',
                    ]),
                    email_column: findHeader([
                        'email',
                        'e-mail',
                        'address',
                        'email_address',
                        'email address',
                        'email-address',
                    ]),
                }));
                setIsLoadingData(false);
            },
            error: (err) => {
                console.error('CSV parse error:', err);
                toast.error('Failed to parse CSV file');
                setIsLoadingData(false);
            },
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (is_google_connected === false) {
            toast.error(
                'Google account not connected or credentials expired. Please reconnect in settings.',
                { id: 'google-error' },
            );
        }

        // Build the final emails array
        const builtEmails = sheetRows
            .map((row, i) => {
                if (!data.email_column || !row[data.email_column]) {
                    return null;
                }

                let content = data.body;
                // Preserve intentional empty lines and prevent list item double-spacing
                content = content.replace(/<p><\/p>/g, '<p><br></p>');
                content = content.replace(
                    /<p class="[^"]*"><\/p>/g,
                    '<p><br></p>',
                );
                content = content.replace(
                    /<li><p(?: class="[^"]*")?>/g,
                    '<li>',
                );
                content = content.replace(/<\/p><\/li>/g, '</li>');
                // Force zero margin on remaining paragraphs to perfectly match editor's tight spacing
                content = content.replace(/<p>/g, '<p style="margin: 0;">');
                content = content.replace(
                    /<p class="([^"]*)">/g,
                    '<p class="$1" style="margin: 0;">',
                );

                const firstName = data.first_name_column
                    ? row[data.first_name_column] || ''
                    : '';
                const lastName = data.last_name_column
                    ? row[data.last_name_column] || ''
                    : '';

                content = content.replace(/{{firstName}}/g, firstName);
                content = content.replace(/{{first_name}}/g, firstName);
                content = content.replace(/{{last_name}}/g, lastName);
                content = content.replace(/{{lastName}}/g, lastName);

                const evtName = selectedEvent
                    ? selectedEvent.name
                    : data.custom_event_name;
                content = content.replace(/{{event_name}}/g, evtName);

                const dateStr = selectedEvent?.event_date
                    ? new Date(selectedEvent.event_date).toLocaleDateString()
                    : data.custom_event_date
                      ? new Date(data.custom_event_date).toLocaleDateString()
                      : '';
                content = content.replace(/{{event_date}}/g, dateStr);

                return {
                    email: row[data.email_column],
                    first_name: firstName,
                    last_name: lastName,
                    body: content,
                };
            })
            .filter(Boolean);

        router.post(distribute.url(), {
            ...data,
            emails: builtEmails,
        } as any);
    };

    const inputCls =
        'flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-colors';

    const generatePreview = () => {
        let content = data.body;
        // Preserve intentional empty lines and prevent list item double-spacing
        content = content.replace(/<p><\/p>/g, '<p><br></p>');
        content = content.replace(/<p class="[^"]*"><\/p>/g, '<p><br></p>');
        content = content.replace(/<li><p(?: class="[^"]*")?>/g, '<li>');
        content = content.replace(/<\/p><\/li>/g, '</li>');
        // Force zero margin on remaining paragraphs to perfectly match editor's tight spacing
        content = content.replace(/<p>/g, '<p style="margin: 0;">');
        content = content.replace(
            /<p class="([^"]*)">/g,
            '<p class="$1" style="margin: 0;">',
        );

        let firstName = 'Attendee';
        let lastName = '';
        let email = 'preview@example.com';

        if (previewRowIndex >= 0 && sheetRows[previewRowIndex]) {
            const row = sheetRows[previewRowIndex];
            firstName = data.first_name_column
                ? row[data.first_name_column] || ''
                : firstName;
            lastName = data.last_name_column
                ? row[data.last_name_column] || ''
                : lastName;
            email = data.email_column ? row[data.email_column] || '' : email;

            content = content.replace(/{{firstName}}/g, firstName);
            content = content.replace(/{{first_name}}/g, firstName);
            content = content.replace(/{{last_name}}/g, lastName);
            content = content.replace(/{{lastName}}/g, lastName);
        }

        const evtName = selectedEvent
            ? selectedEvent.name
            : data.custom_event_name || 'General Event';
        content = content.replace(/{{event_name}}/g, evtName);

        const dateStr = selectedEvent?.event_date
            ? new Date(selectedEvent.event_date)
                  .toLocaleDateString('en-GB')
                  .replace(/\//g, '-')
            : data.custom_event_date
              ? new Date(data.custom_event_date)
                    .toLocaleDateString('en-GB')
                    .replace(/\//g, '-')
              : 'Unknown-Date';
        content = content.replace(/{{event_date}}/g, dateStr);

        if (data.include_qr) {
            const safeEventName = evtName.replace(/\s+/g, '-');
            const safeName = `${firstName} ${lastName}`
                .trim()
                .replace(/\s+/g, '-');
            const dummyFileName = `${safeEventName}_${dateStr}_to_${safeName}_via_${email}_PREV1234.png`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dummyFileName)}`;
            content = content.replace(
                /{{qr}}/g,
                `<img src="${qrUrl}" alt="Ticket QR Code" />`,
            );
        }

        return content;
    };

    const handleDistributeSample = () => {
        if (is_google_connected === false) {
            toast.error(
                'Google account not connected or credentials expired. Please reconnect in settings.',
                { id: 'google-error' },
            );

            return;
        }

        router.post(
            distributeSample.url(),
            {
                subject: data.subject || 'No Subject',
                body: generatePreview(),
            } as any,
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="Email Distributor" />
            <div className="flex h-full flex-col overflow-y-auto bg-[#0a0a0a] text-zinc-100">
                {/* Main Content */}
                <div className="w-full flex-1 p-6">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Left Column: Header & Editor */}
                        <div className="space-y-6 lg:col-span-8">
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Event Selection */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                                            Target Event
                                        </label>
                                        <Select
                                            value={selectedEventId || ''}
                                            onValueChange={handleEventChange}
                                        >
                                            <SelectTrigger className="w-full border-[#2a2a2a] bg-[#141414] text-zinc-200">
                                                <SelectValue placeholder="Select an event to load attendees..." />
                                            </SelectTrigger>
                                            <SelectContent className="border-[#2a2a2a] bg-[#141414] text-zinc-200">
                                                <SelectItem
                                                    value="clear"
                                                    className="text-zinc-500"
                                                >
                                                    No event selected
                                                </SelectItem>
                                                {events.map((e: any) => (
                                                    <SelectItem
                                                        key={e.id}
                                                        value={e.id}
                                                    >
                                                        {e.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.event_id && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.event_id}
                                            </p>
                                        )}
                                    </div>

                                    {!selectedEventId && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                                                    Custom Event Name
                                                </label>
                                                <Input
                                                    placeholder="e.g. End of Semester Party"
                                                    value={
                                                        data.custom_event_name
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'custom_event_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputCls}
                                                />
                                                {errors.custom_event_name && (
                                                    <p className="mt-1 text-xs text-red-500">
                                                        {
                                                            errors.custom_event_name
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                                                    Custom Event Date
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={
                                                        data.custom_event_date
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'custom_event_date',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputCls}
                                                    style={{
                                                        colorScheme: 'dark',
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                                                    Upload CSV file
                                                </label>
                                                <Input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={handleCsvUpload}
                                                    className="flex h-10 w-full cursor-pointer rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-1.5 text-sm text-zinc-200 transition-colors file:rounded file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-200 hover:file:bg-zinc-700"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Subject */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                                            Subject Line
                                        </label>
                                        <Input
                                            placeholder="Important update regarding your event..."
                                            value={data.subject}
                                            onChange={(e) =>
                                                setData(
                                                    'subject',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputCls}
                                        />
                                        {errors.subject && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.subject}
                                            </p>
                                        )}
                                    </div>

                                    {/* Rich Text Editor */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                                            Email Body
                                        </label>
                                        <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0d0d0d]">
                                            <MenuBar editor={editor} />
                                            <EditorContent
                                                editor={editor}
                                                className="min-h-[300px]"
                                            />
                                        </div>
                                        {errors.body && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.body}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-zinc-500">
                                            Tip: You can use variables like{' '}
                                            {'{first_name}'} and {'{last_name}'}{' '}
                                            in your email body to personalize
                                            the message.
                                        </p>
                                    </div>
                                </div>

                                {/* Live Preview Collapsible */}
                                {sheetRows.length > 0 && (
                                    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] transition-all duration-200">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsPreviewExpanded(
                                                    !isPreviewExpanded,
                                                )
                                            }
                                            className="flex w-full items-center justify-between bg-[#141414] p-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-[#1a1a1a]"
                                        >
                                            <span>Live Preview</span>
                                            <ChevronDown
                                                className={`h-4 w-4 transform text-zinc-400 transition-transform ${isPreviewExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {isPreviewExpanded && (
                                            <div className="border-t border-[#2a2a2a] p-5">
                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <label className="text-xs text-zinc-500">
                                                            Preview as:
                                                        </label>
                                                        <Select
                                                            value={previewRowIndex.toString()}
                                                            onValueChange={(
                                                                val,
                                                            ) =>
                                                                setPreviewRowIndex(
                                                                    parseInt(
                                                                        val,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                className={`${inputCls} h-8 w-[200px] bg-[#141414] text-xs`}
                                                            >
                                                                <SelectValue placeholder="Select user..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px] border-[#2a2a2a] bg-[#141414] text-zinc-200">
                                                                {sheetRows.map(
                                                                    (
                                                                        row,
                                                                        i,
                                                                    ) => {
                                                                        const label =
                                                                            data.email_column &&
                                                                            row[
                                                                                data
                                                                                    .email_column
                                                                            ]
                                                                                ? row[
                                                                                      data
                                                                                          .email_column
                                                                                  ]
                                                                                : `Row ${i + 2}`;

                                                                        return (
                                                                            <SelectItem
                                                                                key={
                                                                                    i
                                                                                }
                                                                                value={i.toString()}
                                                                            >
                                                                                {
                                                                                    label
                                                                                }
                                                                            </SelectItem>
                                                                        );
                                                                    },
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-[#2a2a2a] bg-[#1a1a1a] text-zinc-300 hover:bg-[#2a2a2a] hover:text-white"
                                                        onClick={
                                                            handleDistributeSample
                                                        }
                                                        disabled={processing}
                                                    >
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Distribute Sample
                                                    </Button>
                                                </div>
                                                <div
                                                    className="ProseMirror prose prose-invert max-w-none rounded border border-[#2a2a2a] bg-[#141414] p-4 text-sm"
                                                    dangerouslySetInnerHTML={{
                                                        __html: generatePreview(),
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-white text-black hover:bg-zinc-200"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {processing
                                            ? 'Queuing...'
                                            : 'Distribute Emails'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Sidebar: Configuration & Logs */}
                        <div className="space-y-6 lg:col-span-4">
                            {/* Recent Distribution Logs (Collapsible) */}
                            <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] transition-all duration-200">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsOutboxExpanded(!isOutboxExpanded)
                                    }
                                    className="flex w-full items-center justify-between bg-[#141414] p-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-[#1a1a1a]"
                                >
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-zinc-400" />
                                        <span>Recent Outbox</span>
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 transform text-zinc-400 transition-transform ${isOutboxExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {isOutboxExpanded && (
                                    <div className="flex h-[400px] flex-col border-t border-[#2a2a2a] bg-[#141414] p-5">
                                        <div className="mb-4 flex items-center justify-end">
                                            <button
                                                onClick={() =>
                                                    router.reload({
                                                        only: ['recent_logs'],
                                                    })
                                                }
                                                className="text-zinc-500 transition-colors hover:text-white"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
                                            {!recent_logs ? (
                                                <div className="py-8 text-center text-sm text-zinc-500">
                                                    Loading logs...
                                                </div>
                                            ) : recent_logs.length === 0 ? (
                                                <div className="py-8 text-center text-sm text-zinc-500">
                                                    No recent emails sent.
                                                </div>
                                            ) : (
                                                recent_logs.map((log: any) => (
                                                    <div
                                                        key={log.id}
                                                        className="rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-3 text-xs"
                                                    >
                                                        <div className="mb-1.5 flex items-start justify-between">
                                                            <span className="truncate pr-2 font-medium text-zinc-200">
                                                                {
                                                                    log.recipient_email
                                                                }
                                                            </span>
                                                            <span
                                                                className={`rounded px-1.5 py-0.5 text-[10px] tracking-wider uppercase ${log.success ? 'border border-emerald-900/50 bg-emerald-950 text-emerald-400' : 'border border-red-900/50 bg-red-950 text-red-400'}`}
                                                            >
                                                                {log.success
                                                                    ? 'Sent'
                                                                    : 'Failed'}
                                                            </span>
                                                        </div>
                                                        <p className="mb-1 truncate text-zinc-500">
                                                            {log.subject}
                                                        </p>
                                                        <div className="mt-2 flex items-center justify-between border-t border-[#1f1f1f] pt-2">
                                                            <span className="text-[10px] text-zinc-600">
                                                                {log.event_name ||
                                                                    'Manual Recipient'}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-600">
                                                                {new Date(
                                                                    log.sent_at,
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Field Mappings */}
                            <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-zinc-400" />
                                    <h3 className="text-sm font-medium text-zinc-200">
                                        Mail Config
                                    </h3>
                                </div>
                                <p className="mb-4 text-xs text-zinc-500">
                                    Define the exact column headers from the
                                    connected Google Spreadsheet so the
                                    distributor knows where to pull recipient
                                    data.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                            First Name Header
                                        </label>
                                        <Select
                                            value={data.first_name_column || ''}
                                            onValueChange={(val) =>
                                                setData(
                                                    'first_name_column',
                                                    val,
                                                )
                                            }
                                            disabled={
                                                sheetHeaders.length === 0 ||
                                                isLoadingData
                                            }
                                        >
                                            <SelectTrigger
                                                className={`${inputCls} h-8 bg-[#0d0d0d] text-xs`}
                                            >
                                                <SelectValue
                                                    placeholder={
                                                        isLoadingData
                                                            ? 'Loading...'
                                                            : 'Select column...'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="border-[#2a2a2a] bg-[#141414] text-zinc-200">
                                                {sheetHeaders.map((h) => (
                                                    <SelectItem
                                                        key={h}
                                                        value={h}
                                                    >
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                            Last Name Header
                                        </label>
                                        <Select
                                            value={data.last_name_column || ''}
                                            onValueChange={(val) =>
                                                setData('last_name_column', val)
                                            }
                                            disabled={
                                                sheetHeaders.length === 0 ||
                                                isLoadingData
                                            }
                                        >
                                            <SelectTrigger
                                                className={`${inputCls} h-8 bg-[#0d0d0d] text-xs`}
                                            >
                                                <SelectValue
                                                    placeholder={
                                                        isLoadingData
                                                            ? 'Loading...'
                                                            : 'Select column...'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="border-[#2a2a2a] bg-[#141414] text-zinc-200">
                                                {sheetHeaders.map((h) => (
                                                    <SelectItem
                                                        key={h}
                                                        value={h}
                                                    >
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                            Email Address Header
                                        </label>
                                        <Select
                                            value={data.email_column || ''}
                                            onValueChange={(val) =>
                                                setData('email_column', val)
                                            }
                                            disabled={
                                                sheetHeaders.length === 0 ||
                                                isLoadingData
                                            }
                                        >
                                            <SelectTrigger
                                                className={`${inputCls} h-8 bg-[#0d0d0d] text-xs`}
                                            >
                                                <SelectValue
                                                    placeholder={
                                                        isLoadingData
                                                            ? 'Loading...'
                                                            : 'Select column...'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="border-[#2a2a2a] bg-[#141414] text-zinc-200">
                                                {sheetHeaders.map((h) => (
                                                    <SelectItem
                                                        key={h}
                                                        value={h}
                                                    >
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2 border-t border-[#2a2a2a] pt-2">
                                        <Checkbox
                                            id="include_qr"
                                            checked={data.include_qr}
                                            onCheckedChange={(checked) =>
                                                setData(
                                                    'include_qr',
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="include_qr"
                                            className="cursor-pointer text-xs font-medium text-zinc-300"
                                        >
                                            Attach QR Code Tickets
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Spreadsheet Data preview */}
                            {sheetRows.length > 0 && (
                                <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-zinc-200">
                                            Spreadsheet Data
                                        </h3>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-[#2a2a2a] bg-[#1a1a1a] text-zinc-300 hover:bg-[#2a2a2a] hover:text-white"
                                                >
                                                    Manage Data
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="flex h-[90vh] w-[90vw] max-w-[90vw] flex-col border-[#2a2a2a] bg-[#0a0a0a] text-zinc-200">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Spreadsheet Data
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="custom-scrollbar mt-4 flex-1 overflow-auto rounded-lg border border-[#2a2a2a]">
                                                    <table className="w-full text-left text-xs whitespace-nowrap text-zinc-400">
                                                        <thead className="sticky top-0 z-10 bg-[#1a1a1a] text-zinc-300">
                                                            <tr>
                                                                {sheetHeaders.map(
                                                                    (
                                                                        header,
                                                                        i,
                                                                    ) => (
                                                                        <th
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="border-b border-[#2a2a2a] px-4 py-3 font-medium shadow-sm"
                                                                        >
                                                                            {
                                                                                header
                                                                            }
                                                                        </th>
                                                                    ),
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#2a2a2a]">
                                                            {sheetRows.map(
                                                                (
                                                                    row,
                                                                    rowIndex,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            rowIndex
                                                                        }
                                                                        className="transition-colors hover:bg-[#141414]"
                                                                    >
                                                                        {sheetHeaders.map(
                                                                            (
                                                                                header,
                                                                                colIndex,
                                                                            ) => (
                                                                                <td
                                                                                    key={
                                                                                        colIndex
                                                                                    }
                                                                                    className="px-4 py-2"
                                                                                >
                                                                                    {
                                                                                        row[
                                                                                            header
                                                                                        ]
                                                                                    }
                                                                                </td>
                                                                            ),
                                                                        )}
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div className="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0d0d0d]">
                                        <table className="w-full table-fixed text-left text-xs whitespace-nowrap text-zinc-400">
                                            <thead className="bg-[#1a1a1a] text-zinc-300">
                                                <tr>
                                                    {sheetHeaders
                                                        .slice(0, 5)
                                                        .map((header, i) => (
                                                            <th
                                                                key={i}
                                                                className="truncate border-b border-[#2a2a2a] px-3 py-2 font-medium"
                                                            >
                                                                {header}
                                                            </th>
                                                        ))}
                                                    {sheetHeaders.length >
                                                        5 && (
                                                        <th className="w-12 border-b border-[#2a2a2a] px-3 py-2 text-center font-medium">
                                                            ...
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#2a2a2a]">
                                                {sheetRows
                                                    .slice(0, 6)
                                                    .map((row, rowIndex) => (
                                                        <tr
                                                            key={rowIndex}
                                                            className="transition-colors hover:bg-[#141414]"
                                                        >
                                                            {sheetHeaders
                                                                .slice(0, 5)
                                                                .map(
                                                                    (
                                                                        header,
                                                                        colIndex,
                                                                    ) => (
                                                                        <td
                                                                            key={
                                                                                colIndex
                                                                            }
                                                                            className="truncate px-3 py-2"
                                                                            title={
                                                                                row[
                                                                                    header
                                                                                ]
                                                                            }
                                                                        >
                                                                            {
                                                                                row[
                                                                                    header
                                                                                ]
                                                                            }
                                                                        </td>
                                                                    ),
                                                                )}
                                                            {sheetHeaders.length >
                                                                5 && (
                                                                <td className="px-3 py-2 text-center text-zinc-500">
                                                                    ...
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                {sheetRows.length > 6 && (
                                                    <tr className="bg-[#0a0a0a]">
                                                        <td
                                                            colSpan={
                                                                Math.min(
                                                                    sheetHeaders.length,
                                                                    5,
                                                                ) +
                                                                (sheetHeaders.length >
                                                                5
                                                                    ? 1
                                                                    : 0)
                                                            }
                                                            className="px-3 py-3 text-center text-zinc-500"
                                                        >
                                                            ... and{' '}
                                                            {sheetRows.length -
                                                                6}{' '}
                                                            more rows
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #52525b;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror:focus {
                    outline: none;
                }
                .ProseMirror ul {
                    list-style-type: disc !important;
                    padding-left: 1.5rem !important;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .ProseMirror ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5rem !important;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .ProseMirror li p {
                    margin-top: 0.25rem;
                    margin-bottom: 0.25rem;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2a2a2a;
                    border-radius: 4px;
                }
            `,
                }}
            />
        </>
    );
}

EmailDistributor.layout = {
    breadcrumbs: [
        {
            title: 'Email Distributor',
            href: '/email-distributor',
        },
    ],
};
