/* eslint-disable */
import { Head, useForm, router } from '@inertiajs/react';
import { Search, X, Plus, Minus } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as inventoryRoute } from '@/routes/backstage/inventory';

const SUGGESTED_TAGS: string[] = [];

function TagInput({ tags, suggestions, onChange }: { tags: string[]; suggestions: string[]; onChange: (tags: string[]) => void }) {
    const [input, setInput] = useState('');

    const addTag = (tag: string) => {
        const trimmed = tag.trim();

        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }

        setInput('');
    };

    const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    const filteredSuggestions = suggestions.filter(
        s => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="space-y-2">
            {/* Active tag chips */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-0.5 text-zinc-400 hover:text-zinc-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            {/* Free-type input */}
            <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to filter or add..."
            />
            {/* Suggestion chips */}
            {filteredSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {filteredSuggestions.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => addTag(s)}
                            className="rounded-md bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

type Item = {
    id: string;
    name: string;
    quantity: number;
    category: string[] | null;
    image_path: string | null;
    changed_by: string | null;
    updated_at: string;
};

function ItemModal({ 
    isOpen, 
    onClose, 
    item = null,
    allTags = [],
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    item?: Item | null,
    allTags?: string[],
}) {
    const { data, setData, post, processing, reset, clearErrors } = useForm({
        name: item?.name || '',
        quantity: item?.quantity || 0,
        image: null as File | null,
        remove_image: false,
        _method: item ? 'PUT' : 'POST',
    });

    const [tags, setTags] = useState<string[]>(item?.category || []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // image_path from the controller is now already a full URL via Storage::url()
    const [previewUrl, setPreviewUrl] = useState<string | null>(item?.image_path ?? null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload: any = {
            name: data.name,
            quantity: data.quantity,
            category: tags,
            remove_image: data.remove_image,
            _method: data._method,
        };

        if (data.image) {
            payload.image = data.image;
        }

        const url = item ? `/inventory/${item.id}` : '/inventory';
        
        router.post(url, payload, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{item ? 'Edit item' : 'Create item'}</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            {item ? 'Update the item details below.' : 'Add a new item to the inventory.'}
                        </p>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                value={data.quantity}
                                onChange={(e) => setData('quantity', parseInt(e.target.value) || 0)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <TagInput tags={tags} suggestions={allTags} onChange={setTags} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image">Image</Label>
                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="relative w-16 h-16 rounded overflow-hidden border">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : null}
                                <div className="flex items-center gap-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {previewUrl ? 'Change' : 'Add image'}
                                    </Button>
                                    {previewUrl && (
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={removeImage}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <input
                                type="file"
                                id="image"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex items-center justify-between">
                        <div></div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {item ? 'Save' : 'Create'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Inventory({ items, allTags }: { items: Item[]; allTags: string[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const openCreate = () => {
 setEditingItem(null); setIsModalOpen(true); 
};
    const openEdit = (item: Item) => {
 setEditingItem(item); setIsModalOpen(true); 
};

    const filteredItems = items.filter((item) => {
        if (!searchQuery) {
return true;
}

        const query = searchQuery.toLowerCase();

        return (
            item.name.toLowerCase().includes(query) ||
            item.changed_by?.toLowerCase().includes(query) ||
            item.quantity.toString().includes(query) ||
            (item.category && item.category.join(' ').toLowerCase().includes(query))
        );
    });

    const updateQuantity = (item: Item, change: number) => {
        const newQuantity = Math.max(0, item.quantity + change);

        if (newQuantity === item.quantity) {
return;
}
        
        router.put(`/inventory/${item.id}`, {
            name: item.name,
            quantity: newQuantity,
            category: item.category,
            _method: 'PUT',
        }, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Inventory" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center w-full sm:w-auto gap-2">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, category, email or quantity"
                                className="pl-9 bg-zinc-900/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {searchQuery && (
                            <Button variant="ghost" onClick={() => setSearchQuery('')}>
                                Clear
                            </Button>
                        )}
                    </div>
                    <Button onClick={openCreate} className="bg-white text-black hover:bg-zinc-200">
                        Create Item
                    </Button>
                </div>

                <div className="rounded-md border bg-zinc-950">
                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-zinc-900/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Qty</th>
                                    <th className="px-4 py-3 font-medium">IMG</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                    <th className="px-4 py-3 font-medium">Last Modified</th>
                                    <th className="px-4 py-3 font-medium">Changed By</th>
                                    <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-4 py-4 font-medium">{item.name}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded border-zinc-800"
                                                    onClick={() => updateQuantity(item, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-6 text-center">{item.quantity}</span>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded border-zinc-800"
                                                    onClick={() => updateQuantity(item, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.image_path ? (
                                                <div className="w-10 h-10 rounded overflow-hidden">
                                                    <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-center text-xs text-zinc-500">
                                                    No IMG
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.category?.map(cat => (
                                                <span key={cat} className="inline-flex items-center rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300 mr-1">
                                                    {cat}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-4 py-4 text-muted-foreground">
                                            {new Date(item.updated_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-muted-foreground">
                                            {item.changed_by || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 border-zinc-800 bg-transparent hover:bg-zinc-800"
                                                    onClick={() => openEdit(item)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    className="h-8 bg-red-900/50 text-red-500 hover:bg-red-900/80 hover:text-red-400"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this item?')) {
                                                            router.delete(`/inventory/${item.id}`);
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            No items found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ItemModal
                    isOpen={isModalOpen}
                    onClose={() => {
 setIsModalOpen(false); setEditingItem(null); 
}}
                    item={editingItem}
                    allTags={allTags}
                />
            )}
        </>
    );
}

Inventory.layout = {
    breadcrumbs: [
        {
            title: 'Inventory',
            href: inventoryRoute().url,
        },
    ],
};
