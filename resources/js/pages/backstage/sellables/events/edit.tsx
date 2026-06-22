import { Head, Link, useForm, router } from '@inertiajs/react';
import { ChevronUp, Plus, Trash2, X, ChevronDown } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { index as sellablesRoute } from '@/routes/backstage/sellables';
import { update as updateEventRoute } from '@/routes/backstage/sellables/events';

const inputCls = 'w-full rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600';
const textareaCls = `${inputCls} min-h-[90px] resize-none`;

type Attribute = { id: string; name: string; options: string[] };
type VariantRow = Record<string, string> & { quantity: string };

function cartesian(attributes: Attribute[]): VariantRow[] {
    if (!attributes.length || attributes.some(a => !a.options.length)) {
return [];
}

    const result: Record<string, string>[][] = [[]];

    for (const attr of attributes) {
        const newResult: Record<string, string>[][] = [];

        for (const existing of result) {
            for (const opt of attr.options) {
                newResult.push([...existing, { [attr.name || attr.id]: opt }]);
            }
        }

        result.length = 0;
        result.push(...newResult);
    }

    return result.map(combos => ({
        ...Object.assign({}, ...combos),
        quantity: '',
    }));
}

type Props = {
    users: { id: string; name: string }[];
    membershipCardName: string;
    event: any;
};

export default function EditEvent({ users, membershipCardName, event }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: event.name || '',
        description: event.description || '',
        event_date: event.event_date ? event.event_date.split('T')[0] : '',
        start_sell_date: event.start_sell_date ? event.start_sell_date.slice(0, 16) : '',
        end_sell_date: event.end_sell_date ? event.end_sell_date.slice(0, 16) : '',
        price_without_membership: event.price_without_membership?.toString() || '',
        price_with_membership: event.price_with_membership?.toString() || '',
        is_online_sellable: event.is_online_sellable ?? true,
        hide_until_sale: event.hide_until_sale ?? false,
        unlimited_quantity: event.unlimited_quantity ?? false,
        quantity: event.quantity?.toString() || '',
        unlimited_quantity_with_membership: event.unlimited_quantity_with_membership ?? false,
        quantity_with_membership: event.quantity_with_membership?.toString() || '',
        unlimited_quantity_without_membership: event.unlimited_quantity_without_membership ?? false,
        quantity_without_membership: event.quantity_without_membership?.toString() || '',
        is_variant_based: event.is_variant_based ?? false,
        variants_config: event.variants_config || null as any,
        google_spreadsheet_id: event.google_spreadsheet_id || '',
        instagram_link: event.instagram_link || '',
        notes: event.notes || '',
        responsible_user_ids: event.responsible_user_ids || [] as string[],
        image: null as File | null,
        remove_image: false,
    });

    const [pricingType, setPricingType] = useState<'single' | 'split'>(
        event.price_without_membership !== event.price_with_membership ? 'split' : 'single'
    );
    const [stockType, setStockType] = useState<'simple' | 'split' | 'variants'>(
        event.is_variant_based ? 'variants' : (event.quantity_with_membership !== null || event.unlimited_quantity_with_membership ? 'split' : 'simple')
    );

    // Variant builder state
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [optionInputs, setOptionInputs] = useState<Record<string, string>>({});
    const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(event.image_path || null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setData((prev) => ({ ...prev, image: file, remove_image: false }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setData((prev) => ({ ...prev, image: null, remove_image: true }));
        setPreviewUrl(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        if (event.is_variant_based && event.variants_config?.length > 0) {
            const keys = Object.keys(event.variants_config[0]).filter(k => k !== 'id' && k !== 'quantity');
            const attrs: Attribute[] = keys.map(k => {
                const options = Array.from(new Set(event.variants_config.map((r: any) => String(r[k] ?? ''))));

                return { id: crypto.randomUUID(), name: k, options: options as string[] };
            });
            setAttributes(attrs);
            setVariantRows(event.variants_config.map((r: any) => {
                const row: Record<string, string> = { quantity: r.quantity?.toString() || '' };

                for (const k of keys) {
row[k] = String(r[k] ?? '');
}

                return row as VariantRow;
            }));
        }
    }, [event]);

    const rebuildMatrix = useCallback((attrs: Attribute[]) => {
        setVariantRows(cartesian(attrs));
    }, []);

    const addAttribute = () => {
        const id = crypto.randomUUID();
        const next = [...attributes, { id, name: '', options: [] }];
        setAttributes(next);
        setOptionInputs(o => ({ ...o, [id]: '' }));
    };

    const updateAttrName = (id: string, name: string) => {
        const next = attributes.map(a => a.id === id ? { ...a, name } : a);
        setAttributes(next);
        rebuildMatrix(next);
    };

    const addOption = (id: string) => {
        const val = optionInputs[id]?.trim();

        if (!val) {
return;
}

        const next = attributes.map(a =>
            a.id === id && !a.options.includes(val) ? { ...a, options: [...a.options, val] } : a
        );
        setAttributes(next);
        setOptionInputs(o => ({ ...o, [id]: '' }));
        rebuildMatrix(next);
    };

    const removeOption = (attrId: string, opt: string) => {
        const next = attributes.map(a => a.id === attrId ? { ...a, options: a.options.filter(o => o !== opt) } : a);
        setAttributes(next);
        rebuildMatrix(next);
    };

    const removeAttribute = (id: string) => {
        const next = attributes.filter(a => a.id !== id);
        setAttributes(next);
        rebuildMatrix(next);
    };

    const updateVariantQty = (idx: number, qty: string) => {
        setVariantRows(rows => rows.map((r, i) => i === idx ? { ...r, quantity: qty } : r));
    };

    const toggleUser = (id: string) => {
        const current = data.responsible_user_ids;
        setData('responsible_user_ids',
            current.includes(id) ? current.filter((u: string) => u !== id) : [...current, id]
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const isVariants = stockType === 'variants';
        const attrKeys = attributes.filter(a => a.name && a.options.length).map(a => a.name);

        const variantsConfig = isVariants
            ? variantRows.map(row => {
                const cfg: Record<string, any> = {};

                for (const k of attrKeys) {
cfg[k] = row[k];
}

                cfg.quantity = row.quantity === '' ? null : Number(row.quantity);

                return cfg;
            })
            : null;

        router.post(updateEventRoute(event.id).url, {
            ...data,
            _method: 'PUT',
            price_with_membership: Number(data.price_with_membership || 0),
            price_without_membership: pricingType === 'single'
                ? Number(data.price_with_membership || 0)
                : Number(data.price_without_membership || 0),
            is_variant_based: isVariants,
            variants_config: variantsConfig,
            event_date: data.event_date || null,
            start_sell_date: data.start_sell_date || null,
            end_sell_date: data.end_sell_date || null,
            google_spreadsheet_id: data.google_spreadsheet_id || null,
            unlimited_quantity: !isVariants && stockType === 'simple' && data.quantity === '',
            quantity: !isVariants && stockType === 'simple' && data.quantity !== '' ? Number(data.quantity) : null,
            unlimited_quantity_with_membership: stockType === 'split' && data.quantity_with_membership === '',
            quantity_with_membership: stockType === 'split' && data.quantity_with_membership !== '' ? Number(data.quantity_with_membership) : null,
            unlimited_quantity_without_membership: stockType === 'split' && data.quantity_without_membership === '',
            quantity_without_membership: stockType === 'split' && data.quantity_without_membership !== '' ? Number(data.quantity_without_membership) : null,
        }, { preserveScroll: true });
    };

    const validAttrs = attributes.filter(a => a.name && a.options.length > 0);
    const horizontalAttr = validAttrs.length > 0 
        ? validAttrs.reduce((prev, current) => (prev.options.length > current.options.length) ? prev : current) 
        : null;
    const verticalAttrs = horizontalAttr ? validAttrs.filter(a => a.id !== horizontalAttr.id) : [];
    
    let verticalCombos: Record<string, string>[] = [];

    if (verticalAttrs.length > 0) {
        const result: Record<string, string>[][] = [[]];

        for (const attr of verticalAttrs) {
            const newResult: Record<string, string>[][] = [];

            for (const existing of result) {
                for (const opt of attr.options) {
                    newResult.push([...existing, { [attr.name]: opt }]);
                }
            }

            result.length = 0;
            result.push(...newResult);
        }

        verticalCombos = result.map(combos => Object.assign({}, ...combos));
    } else if (horizontalAttr) {
        verticalCombos = [{}];
    }

    return (
        <>
            <Head title="Create Event" />

            <div className="flex h-full flex-1 flex-col overflow-y-auto">
                <div className="w-full p-6 max-w-5xl mx-auto">

                    <div className="flex items-center gap-3 mb-6">
                        <div>
                            <h1 className="text-xl font-bold text-white">Edit Event</h1>
                            <p className="text-sm text-zinc-500">Update the details for the event.</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-0">

                        {/* Name */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <label htmlFor="name" className="block text-sm font-medium text-zinc-200 mb-2">Name</label>
                            <input id="name" className={inputCls} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        {/* Description */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-200 mb-2">Description <span className="text-zinc-500 font-normal">(optional)</span></label>
                            <textarea id="description" className={textareaCls} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                        </div>

                        {/* Image Upload */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <label className="block text-sm font-medium text-zinc-200 mb-3">Event Image <span className="text-zinc-500 font-normal">(optional)</span></label>
                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#0f0f0f]">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="relative w-24 h-24 rounded-lg border border-dashed border-[#2a2a2a] bg-[#0f0f0f] flex flex-col items-center justify-center text-zinc-500 text-xs">
                                        No image
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 items-start">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-[#0f0f0f] border-[#2a2a2a] text-zinc-300 hover:bg-[#1a1a1a] hover:text-white transition-colors h-8 text-xs"
                                    >
                                        Choose File
                                    </Button>
                                    {previewUrl && (
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={removeImage}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 text-xs px-3"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                    <p className="text-[10px] text-zinc-500">Recommended: 1200x800px, max 5MB</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                        </div>

                        {/* Event Date */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <label htmlFor="event_date" className="block text-sm font-medium text-zinc-200 mb-2">Event Date</label>
                            <input type="date" id="event_date" className={`${inputCls} dark:[color-scheme:dark]`} value={data.event_date} onChange={(e) => setData('event_date', e.target.value)} />
                        </div>

                        {/* Pricing */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-zinc-200">Pricing</span>
                                <ToggleGroup type="single" value={pricingType} onValueChange={(v) => v && setPricingType(v as 'single' | 'split')} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-md p-0.5 gap-0">
                                    <ToggleGroupItem value="single" className="text-xs h-7 px-3 rounded-sm data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-zinc-100 text-zinc-500">Single Price</ToggleGroupItem>
                                    <ToggleGroupItem value="split" className="text-xs h-7 px-3 rounded-sm data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-zinc-100 text-zinc-500">{import.meta.env.VITE_MEMBERSHIP_CARD_NAME} Pricing</ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                            <div className={`grid gap-4 ${pricingType === 'split' ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{pricingType === 'split' ? `Price w/ ${import.meta.env.VITE_MEMBERSHIP_CARD_NAME} (€)` : 'Price (€)'}</label>
                                    <input type="number" step="0.01" className={inputCls} value={data.price_with_membership} onChange={(e) => setData('price_with_membership', e.target.value)} />
                                </div>
                                {pricingType === 'split' && (
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Price w/o {import.meta.env.VITE_MEMBERSHIP_CARD_NAME} (€)</label>
                                        <input type="number" step="0.01" className={inputCls} value={data.price_without_membership} onChange={(e) => setData('price_without_membership', e.target.value)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Responsible Users */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <span className="block text-sm font-medium text-zinc-200 mb-3">Responsible Users</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between bg-[#0f0f0f] border-[#2a2a2a] text-zinc-300 hover:bg-[#1a1a1a] hover:text-white transition-colors h-10 font-normal">
                                        <span className="truncate">
                                            {data.responsible_user_ids.length > 0 
                                                ? users.filter(u => data.responsible_user_ids.includes(u.id)).map(u => u.name).join(', ') 
                                                : "Select users..."}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] bg-[#0f0f0f] border-[#2a2a2a]">
                                    {users.map(user => (
                                        <DropdownMenuCheckboxItem
                                            key={user.id}
                                            checked={data.responsible_user_ids.includes(user.id)}
                                            onCheckedChange={() => toggleUser(user.id)}
                                            className="text-zinc-300 focus:bg-[#2a2a2a] focus:text-white cursor-pointer"
                                        >
                                            {user.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    {users.length === 0 && <p className="text-xs text-zinc-600 p-2">No users available.</p>}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Notes */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <label htmlFor="notes" className="block text-sm font-medium text-zinc-200 mb-2">Notes <span className="text-zinc-500 font-normal">(optional)</span></label>
                            <textarea id="notes" className={textareaCls} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </div>

                        {/* Spreadsheet ID */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <label htmlFor="spreadsheet" className="block text-sm font-medium text-zinc-200 mb-2">Spreadsheet ID</label>
                            <input id="spreadsheet" className={inputCls} placeholder="Google Sheet ID" value={data.google_spreadsheet_id} onChange={(e) => setData('google_spreadsheet_id', e.target.value)} />
                        </div>

                        {/* Stock Management */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <div className="flex items-center justify-between mb-5">
                                <span className="text-base font-semibold text-zinc-100">Stock Management</span>
                                <ChevronUp className="h-4 w-4 text-zinc-600" />
                            </div>
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Type</span>
                                    <ToggleGroup type="single" value={stockType} onValueChange={(v) => v && setStockType(v as 'simple' | 'split' | 'variants')} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-md p-0.5 gap-0">
                                        <ToggleGroupItem value="simple" className="text-xs h-7 px-3 rounded-sm data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-zinc-100 text-zinc-500">Simple</ToggleGroupItem>
                                        <ToggleGroupItem value="split" className="text-xs h-7 px-3 rounded-sm data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-zinc-100 text-zinc-500">{import.meta.env.VITE_MEMBERSHIP_CARD_NAME} Split</ToggleGroupItem>
                                        <ToggleGroupItem value="variants" className="text-xs h-7 px-3 rounded-sm data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-zinc-100 text-zinc-500">Variants</ToggleGroupItem>
                                    </ToggleGroup>
                                </div>

                                {stockType === 'simple' && (
                                    <div>
                                        <label htmlFor="quantity" className="block text-sm font-medium text-zinc-300 mb-1.5">Initial Quantity</label>
                                        <input type="number" id="quantity" className={inputCls} placeholder="Leave empty for unlimited" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                                    </div>
                                )}

                                {stockType === 'split' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Qty w/ {import.meta.env.VITE_MEMBERSHIP_CARD_NAME}</label>
                                            <input type="number" className={inputCls} placeholder="Leave empty for unlimited" value={data.quantity_with_membership} onChange={(e) => setData('quantity_with_membership', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Qty w/o {import.meta.env.VITE_MEMBERSHIP_CARD_NAME}</label>
                                            <input type="number" className={inputCls} placeholder="Leave empty for unlimited" value={data.quantity_without_membership} onChange={(e) => setData('quantity_without_membership', e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {/* Variant Attributes Builder */}
                                {stockType === 'variants' && (
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-zinc-200">Variant Attributes</span>
                                            <button type="button" onClick={addAttribute} className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white border border-[#2a2a2a] rounded-md px-3 py-1.5 hover:bg-[#1a1a1a] transition-colors">
                                                <Plus className="h-3 w-3" /> Add Attribute
                                            </button>
                                        </div>

                                        {/* Attribute Cards */}
                                        {attributes.map(attr => (
                                            <div key={attr.id} className="rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-4 space-y-3">
                                                <div className="flex gap-3 items-start">
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Attribute Name</label>
                                                        <input
                                                            className={inputCls}
                                                            placeholder="e.g. Size, Color"
                                                            value={attr.name}
                                                            onChange={(e) => updateAttrName(attr.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Options (Press Enter)</label>
                                                        <input
                                                            className={inputCls}
                                                            placeholder="Type option and press Enter"
                                                            value={optionInputs[attr.id] ?? ''}
                                                            onChange={(e) => setOptionInputs(o => ({ ...o, [attr.id]: e.target.value }))}
                                                            onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault(); addOption(attr.id); 
} 
}}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttribute(attr.id)}
                                                        className="mt-6 p-2 rounded-md bg-red-950 border border-red-900 text-red-400 hover:bg-red-900 hover:text-red-300 transition-colors shrink-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {/* Option Tags */}
                                                {attr.options.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {attr.options.map(opt => (
                                                            <span key={opt} className="inline-flex items-center gap-1 bg-[#1c1c1c] border border-[#2a2a2a] text-zinc-300 text-xs rounded-md px-2.5 py-1">
                                                                {opt}
                                                                <button type="button" onClick={() => removeOption(attr.id, opt)} className="text-zinc-500 hover:text-zinc-200">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Inventory Matrix */}
                                        {variantRows.length > 0 && horizontalAttr && (
                                            <div className="pt-2">
                                                <p className="text-sm font-medium text-zinc-200 mb-1">Inventory Matrix</p>
                                                <p className="text-xs text-zinc-600 mb-3">Leave quantity empty for unlimited stock.</p>
                                                <div className="rounded-lg border border-[#2a2a2a] overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#0d0d0d] border-b border-[#2a2a2a]">
                                                            <tr>
                                                                {verticalAttrs.map(a => (
                                                                    <th key={a.id} className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 whitespace-nowrap border-r border-[#2a2a2a]">{a.name}</th>
                                                                ))}
                                                                {horizontalAttr.options.map(opt => (
                                                                    <th key={opt} className="text-center px-4 py-2.5 text-xs font-medium text-zinc-400 whitespace-nowrap min-w-[120px]">{opt}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {verticalCombos.map((vCombo, i) => (
                                                                <tr key={i} className={i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0d0d0d]'}>
                                                                    {verticalAttrs.map(a => (
                                                                        <td key={a.id} className="px-4 py-2.5 text-zinc-300 text-sm whitespace-nowrap border-r border-[#2a2a2a]">{vCombo[a.name]}</td>
                                                                    ))}
                                                                    {horizontalAttr.options.map(opt => {
                                                                        const idx = variantRows.findIndex(r => {
                                                                            if (r[horizontalAttr.name] !== opt) {
return false;
}

                                                                            for (const va of verticalAttrs) {
                                                                                if (r[va.name] !== vCombo[va.name]) {
return false;
}
                                                                            }

                                                                            return true;
                                                                        });
                                                                        const row = variantRows[idx];

                                                                        if (!row) {
return <td key={opt} className="px-4 py-2.5 text-center"></td>;
}

                                                                        return (
                                                                            <td key={opt} className="px-4 py-2.5 text-center">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-24 rounded-md border border-[#2a2a2a] bg-[#151515] px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 mx-auto text-center"
                                                                                    placeholder="Unlimited"
                                                                                    value={row.quantity}
                                                                                    onChange={(e) => updateVariantQty(idx, e.target.value)}
                                                                                />
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Online Store */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <div className="flex items-center justify-between mb-5">
                                <span className="text-base font-semibold text-zinc-100">Online Store</span>
                                <ChevronUp className="h-4 w-4 text-zinc-600" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <Checkbox id="is_online_sellable" checked={data.is_online_sellable} onCheckedChange={(c) => setData('is_online_sellable', c as boolean)} className="border-zinc-600 bg-[#0f0f0f] data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black" />
                                    <label htmlFor="is_online_sellable" className="text-sm font-medium text-zinc-300 cursor-pointer">Sellable Online</label>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <Checkbox id="hide_until_sale" checked={data.hide_until_sale} onCheckedChange={(c) => setData('hide_until_sale', c as boolean)} className="border-zinc-600 bg-[#0f0f0f] data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black" />
                                        <label htmlFor="hide_until_sale" className="text-sm font-medium text-zinc-300 cursor-pointer">Hide <span className="underline">until</span> sale starts</label>
                                    </div>
                                    <p className="text-xs text-zinc-600 pl-6 leading-relaxed">When unchecked, shows as a coming soon preview. When checked, hidden completely until sale begins.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Sale Start</label>
                                        <input type="datetime-local" className={`${inputCls} dark:[color-scheme:dark]`} value={data.start_sell_date} onChange={(e) => setData('start_sell_date', e.target.value)} />
                                        <p className="text-xs text-zinc-600 mt-1">When tickets become purchasable</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Sale End</label>
                                        <input type="datetime-local" className={`${inputCls} dark:[color-scheme:dark]`} value={data.end_sell_date} onChange={(e) => setData('end_sell_date', e.target.value)} />
                                        <p className="text-xs text-zinc-600 mt-1">Leave empty for no end</p>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Instagram Link */}
                        <div className="py-6 border-b border-[#1f1f1f]">
                            <label htmlFor="instagram_link" className="block text-sm font-medium text-zinc-200 mb-2">Instagram Link <span className="text-zinc-500 font-normal">(optional)</span></label>
                            <input id="instagram_link" className={inputCls} placeholder="https://instagram.com/..." value={data.instagram_link} onChange={(e) => setData('instagram_link', e.target.value)} />
                        </div>

                        {/* Footer */}
                        <div className="pt-8 flex items-center justify-end gap-4">
                            <Link href="/sellables" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors px-2">Cancel</Link>
                            <Button type="submit" disabled={processing} className="bg-white text-black hover:bg-zinc-100 font-medium px-6 h-9">
                                {processing ? 'Updating...' : 'Update Event'}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

EditEvent.layout = {
    breadcrumbs: [
        { title: 'Sellables', href: sellablesRoute().url },
        { title: 'Edit Event', href: '#' },
    ],
};
