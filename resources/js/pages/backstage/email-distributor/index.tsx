import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Link as LinkIcon, Send, Settings, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-[#2a2a2a] bg-[#141414] p-2 rounded-t-xl">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded-md ${editor.isActive('bold') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <Bold className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded-md ${editor.isActive('italic') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <Italic className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded-md ${editor.isActive('underline') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded-md ${editor.isActive('strike') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <Strikethrough className="h-4 w-4" />
            </button>
            <div className="w-[1px] h-6 bg-[#2a2a2a] mx-1" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-md ${editor.isActive('bulletList') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <List className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded-md ${editor.isActive('orderedList') ? 'bg-[#2a2a2a] text-white' : 'text-zinc-400 hover:bg-[#202020] hover:text-zinc-200'}`}
            >
                <ListOrdered className="h-4 w-4" />
            </button>
        </div>
    );
};

export default function EmailDistributor({ events, recent_logs, flash, errors }: any) {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const selectedEvent = events.find((e: any) => e.id === selectedEventId);
    
    const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
    const [sheetRows, setSheetRows] = useState<any[]>([]);
    const [previewRowIndex, setPreviewRowIndex] = useState<number>(-1);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const { data, setData, post, processing, reset, clearErrors } = useForm({
        event_id: '',
        subject: '',
        body: '<p>Hello {{firstName}} {{last_name}},</p><p>Thanks for registering — below are your ticket details for the event.</p><p></p><p>Event: {{event_name}}</p><p>Date: {{event_date}}</p><p>Bring: Your ESN card (if applicable)</p><p></p><p>Please bring a copy of this email (printed or on your phone).</p><p></p><p>See you there,<br>Organization Name</p>',
        recipient_emails: '',
        first_name_column: '',
        last_name_column: '',
        email_column: '',
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
        if (flash?.success) {
            toast.success(flash.success);
            reset('subject', 'body', 'recipient_emails');
            editor?.commands.setContent('');
        }
        if (flash?.error) {
            toast.error(flash.error);
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
            setSelectedEventId(value);
            setData('event_id', value);
            
            setIsLoadingData(true);
            try {
                // Fetch headers and rows in parallel
                const [headersRes, rowsRes] = await Promise.all([
                    fetch(`/backstage/email-distributor/${value}/headers`),
                    fetch(`/backstage/email-distributor/${value}/rows`)
                ]);
                
                if (headersRes.ok) {
                    const json = await headersRes.json();
                    setSheetHeaders(json.headers || []);
                    
                    const hdrs = json.headers || [];
                    const findHeader = (keywords: string[]) => 
                        hdrs.find((h: string) => keywords.some(k => h.toLowerCase().includes(k))) || '';
                        
                    setData((prev) => ({
                        ...prev,
                        first_name_column: findHeader(['first name', 'voornaam', 'first_name']),
                        last_name_column: findHeader(['last name', 'achternaam', 'last_name', 'surname']),
                        email_column: findHeader(['email', 'e-mail']),
                        event_id: value
                    }));
                }
                
                if (rowsRes.ok) {
                    const json = await rowsRes.json();
                    setSheetRows(json.rows || []);
                    if (json.rows && json.rows.length > 0) {
                        setPreviewRowIndex(0);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch sheet data", err);
            } finally {
                setIsLoadingData(false);
            }
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/email-distributor/distribute');
    };

    const inputCls = "flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-colors";

    const generatePreview = () => {
        let content = data.body;
        if (previewRowIndex >= 0 && sheetRows[previewRowIndex]) {
            const row = sheetRows[previewRowIndex];
            const firstName = data.first_name_column ? (row[data.first_name_column] || '') : '';
            const lastName = data.last_name_column ? (row[data.last_name_column] || '') : '';
            
            content = content.replace(/{{firstName}}/g, firstName);
            content = content.replace(/{{first_name}}/g, firstName);
            content = content.replace(/{{last_name}}/g, lastName);
            content = content.replace(/{{lastName}}/g, lastName);
        }
        if (selectedEvent) {
            content = content.replace(/{{event_name}}/g, selectedEvent.name);
            const dateStr = selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString() : '';
            content = content.replace(/{{event_date}}/g, dateStr);
        }
        return content;
    };

    return (
        <>
            <Head title="Email Distributor" />
            <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-100 overflow-y-auto">
                {/* Main Content */}
                <div className="flex-1 p-6 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Left Column: Header & Editor */}
                        <div className="lg:col-span-8 space-y-6">

                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Event Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Event</label>
                                        <Select value={selectedEventId || ''} onValueChange={handleEventChange}>
                                            <SelectTrigger className="w-full bg-[#141414] border-[#2a2a2a] text-zinc-200">
                                                <SelectValue placeholder="Select an event to load attendees..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#141414] border-[#2a2a2a] text-zinc-200">
                                                <SelectItem value="clear" className="text-zinc-500">No event selected</SelectItem>
                                                {events.map((e: any) => (
                                                    <SelectItem key={e.id} value={e.id}>
                                                        {e.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.event_id && <p className="text-red-500 text-xs mt-1">{errors.event_id}</p>}
                                    </div>

                                    {!selectedEventId && (
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Manual Recipients</label>
                                            <Input 
                                                placeholder="comma.separated@emails.com, ..."
                                                value={data.recipient_emails}
                                                onChange={(e) => setData('recipient_emails', e.target.value)}
                                                className={inputCls}
                                            />
                                            {errors.recipients && <p className="text-red-500 text-xs mt-1">{errors.recipients}</p>}
                                        </div>
                                    )}

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Subject Line</label>
                                        <Input 
                                            placeholder="Important update regarding your event..."
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            className={inputCls}
                                        />
                                        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                                    </div>

                                    {/* Rich Text Editor */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Body</label>
                                        <div className="border border-[#2a2a2a] rounded-xl bg-[#0d0d0d] overflow-hidden">
                                            <MenuBar editor={editor} />
                                            <EditorContent editor={editor} className="min-h-[300px]" />
                                        </div>
                                        {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body}</p>}
                                        <p className="text-xs text-zinc-500 mt-2">
                                            Tip: You can use variables like {'{first_name}'} and {'{last_name}'} in your email body to personalize the message.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-white text-black hover:bg-zinc-200"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {processing ? 'Queuing...' : 'Distribute Emails'}
                                    </Button>
                                </div>
                            </form>

                            {/* Live Preview Section */}
                            {selectedEventId && sheetRows.length > 0 && (
                                <div className="mt-8 border border-[#2a2a2a] rounded-xl bg-[#0d0d0d] p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium text-sm text-zinc-200">Live Preview</h3>
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs text-zinc-500">Preview as:</label>
                                            <Select 
                                                value={previewRowIndex.toString()} 
                                                onValueChange={(val) => setPreviewRowIndex(parseInt(val))}
                                            >
                                                <SelectTrigger className={`${inputCls} h-8 text-xs bg-[#141414] w-[200px]`}>
                                                    <SelectValue placeholder="Select user..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#141414] border-[#2a2a2a] text-zinc-200 max-h-[300px]">
                                                    {sheetRows.map((row, i) => {
                                                        const label = data.email_column && row[data.email_column] 
                                                            ? row[data.email_column] 
                                                            : `Row ${i + 2}`;
                                                        return <SelectItem key={i} value={i.toString()}>{label}</SelectItem>;
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div 
                                        className="prose prose-invert max-w-none p-4 border border-[#2a2a2a] rounded bg-[#141414] text-sm"
                                        dangerouslySetInnerHTML={{ __html: generatePreview() }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Sidebar: Configuration & Logs */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Field Mappings */}
                            <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Settings className="w-4 h-4 text-zinc-400" />
                                    <h3 className="font-medium text-sm text-zinc-200">Google Sheet Mappings</h3>
                                </div>
                                <p className="text-xs text-zinc-500 mb-4">
                                    Define the exact column headers from the connected Google Spreadsheet so the distributor knows where to pull recipient data.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">First Name Header</label>
                                        <Select 
                                            value={data.first_name_column || ''} 
                                            onValueChange={(val) => setData('first_name_column', val)}
                                            disabled={sheetHeaders.length === 0 || isLoadingData}
                                        >
                                            <SelectTrigger className={`${inputCls} h-8 text-xs bg-[#0d0d0d]`}>
                                                <SelectValue placeholder={isLoadingData ? "Loading..." : "Select column..."} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#141414] border-[#2a2a2a] text-zinc-200">
                                                {sheetHeaders.map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Last Name Header</label>
                                        <Select 
                                            value={data.last_name_column || ''} 
                                            onValueChange={(val) => setData('last_name_column', val)}
                                            disabled={sheetHeaders.length === 0 || isLoadingData}
                                        >
                                            <SelectTrigger className={`${inputCls} h-8 text-xs bg-[#0d0d0d]`}>
                                                <SelectValue placeholder={isLoadingData ? "Loading..." : "Select column..."} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#141414] border-[#2a2a2a] text-zinc-200">
                                                {sheetHeaders.map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address Header</label>
                                        <Select 
                                            value={data.email_column || ''} 
                                            onValueChange={(val) => setData('email_column', val)}
                                            disabled={sheetHeaders.length === 0 || isLoadingData}
                                        >
                                            <SelectTrigger className={`${inputCls} h-8 text-xs bg-[#0d0d0d]`}>
                                                <SelectValue placeholder={isLoadingData ? "Loading..." : "Select column..."} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#141414] border-[#2a2a2a] text-zinc-200">
                                                {sheetHeaders.map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Distribution Logs */}
                            <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-5 flex flex-col h-[400px]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-zinc-400" />
                                        <h3 className="font-medium text-sm text-zinc-200">Recent Outbox</h3>
                                    </div>
                                    <button onClick={() => router.reload({ only: ['recent_logs'] })} className="text-zinc-500 hover:text-white transition-colors">
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {!recent_logs ? (
                                        <div className="text-center py-8 text-zinc-500 text-sm">Loading logs...</div>
                                    ) : recent_logs.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-500 text-sm">No recent emails sent.</div>
                                    ) : (
                                        recent_logs.map((log: any) => (
                                            <div key={log.id} className="p-3 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] text-xs">
                                                <div className="flex items-start justify-between mb-1.5">
                                                    <span className="font-medium text-zinc-200 truncate pr-2">{log.recipient_email}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${log.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-red-950 text-red-400 border border-red-900/50'}`}>
                                                        {log.success ? 'Sent' : 'Failed'}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-500 truncate mb-1">{log.subject}</p>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1f1f1f]">
                                                    <span className="text-[10px] text-zinc-600">{log.event_name || 'Manual Recipient'}</span>
                                                    <span className="text-[10px] text-zinc-600">{new Date(log.sent_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
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
            `}} />
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
