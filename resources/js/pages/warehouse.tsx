import AppLayout from '@/layouts/app-layout';
import { warehouse } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useRef } from 'react';
import { ChevronUpIcon, ChevronDownIcon, Search, Plus, Minus, Pencil } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Warehouse',
        href: warehouse().url,
    },
];

type Item = {
    id: number;
    name: string;
    quantity: number;
    category: string[] | null;
    last_modified: string | null;
    changed_by: string | null;
    image_url?: string | null;
};

export default function Warehouse() {
    const { items = [] } = usePage().props as { items?: Item[] };

    const createForm = useForm<{ name: string; quantity: number; category: string[]; image: File | null }>({
        name: '',
        quantity: 0,
        category: [], // array of categories
        image: null,
    });

    // Server-side filtering & sorting: read initial values from querystring (Inertia props may include them)
    const pageProps: any = usePage().props as any;
    const itemsProp = pageProps.items;
    const categoriesProp: string[] = pageProps.categories ?? [];

    const itemsList: Item[] = Array.isArray(itemsProp?.data) ? itemsProp.data : (Array.isArray(itemsProp) ? itemsProp : []);

    const [search, setSearch] = useState<string>(String((new URLSearchParams(window.location.search)).get('search') ?? ''));
    const [sort, setSort] = useState<{ column: string | null; dir: 'asc' | 'desc' }>({
        column: (new URLSearchParams(window.location.search)).get('sort_col'),
        dir: ((new URLSearchParams(window.location.search)).get('sort_dir') as 'asc' | 'desc') ?? 'asc',
    });

    // debounce search and update server-side results
    useEffect(() => {
        const t = setTimeout(() => {
            router.get('/warehouse', {
                search: search || undefined,
                sort_col: sort.column || undefined,
                sort_dir: sort.dir || undefined,
            }, { preserveState: true, replace: true, only: ['items', 'categories'] });
        }, 300);

        return () => clearTimeout(t);
    }, [search, sort.column, sort.dir]);

    // Controlled create dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    // image previews for create/edit
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editRemoveImage, setEditRemoveImage] = useState(false);

    const createFileInputRef = useRef<HTMLInputElement | null>(null);
    const editFileInputRef = useRef<HTMLInputElement | null>(null);

    // optimistic UI: per-item optimistic quantities (id => qty)
    const [optimisticQuantities, setOptimisticQuantities] = useState<Record<number, number>>({});
    // track which item ids are currently processing (to disable controls / show spinner)
    const [processingIds, setProcessingIds] = useState<number[]>([]);

    // category text states used for input to accept commas and spaces naturally
    const [createCategoryText, setCreateCategoryText] = useState('');

    function openCreate() {
        setCreateCategoryText('');
        createForm.reset();
        createForm.setData('image', null);
        setCreateImagePreview(null);
        setCreateOpen(true);
    }

    function submitCreate(e: any) {
        e.preventDefault();

        // simple client-side validation
        if (!createForm.data.name || createForm.data.name.trim() === '') {
            return createForm.setError('name', 'Name is required');
        }
        if (createForm.data.quantity < 0) {
            return createForm.setError('quantity', 'Quantity must be 0 or greater');
        }

        // convert categoryText into array
        const cats = (createCategoryText || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        createForm.setData('category', cats);
        // Use the useForm helper for submission and force FormData when a file is present.
        // Do NOT auto-close the create modal on success — wait for user confirmation.
        createForm.post('/warehouse/items', {
            forceFormData: true,
            preserveState: true,
            onSuccess: () => {
                // keep the modal open so the user can confirm; clear only the internal file input
                try { if (createFileInputRef.current) createFileInputRef.current.value = ''; } catch (e) {}
                createForm.setData('image', null);
            },
        });
    }

    

    // Controlled Edit dialog
    const editForm = useForm<{ name: string; quantity: number; category: string[]; image: File | null; remove_image?: boolean }>({ name: '', quantity: 0, category: [], image: null, remove_image: false });
    const [editCategoryText, setEditCategoryText] = useState('');

    function openEditFor(item: Item) {
        setSelectedItem(item);
        editForm.reset();
        editForm.setData({ name: item.name, quantity: item.quantity, category: item.category ?? [], image: null, remove_image: false });
        setEditCategoryText((item.category || []).join(', '));
        setEditImagePreview((item as any).image_url ?? null);
        setEditRemoveImage(false);
        setEditOpen(true);
    }

    function submitEdit(e: any) {
        e.preventDefault();
        if (!selectedItem) return;
        if (!editForm.data.name || editForm.data.name.trim() === '') {
            return editForm.setError('name', 'Name is required');
        }
        if (editForm.data.quantity < 0) {
            return editForm.setError('quantity', 'Quantity must be 0 or greater');
        }

        const cats = (editCategoryText || '').split(',').map((s) => s.trim()).filter(Boolean);
        editForm.setData('category', cats);

        // Use the useForm helper which supports file uploads when forceFormData is true.
        // For updates we always call put; useForm will send multipart when a File is present.
        if (editForm.data.image || editForm.data.remove_image) {
            editForm.put(`/warehouse/items/${selectedItem.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setEditOpen(false);
                    editForm.setData('image', null);
                    setEditImagePreview(null);
                    editForm.setData('remove_image', false);
                    setEditRemoveImage(false);
                    try { if (editFileInputRef.current) editFileInputRef.current.value = ''; } catch (e) {}
                },
            });
        } else {
            editForm.put(`/warehouse/items/${selectedItem.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setEditOpen(false);
                    editForm.setData('image', null);
                    setEditImagePreview(null);
                    editForm.setData('remove_image', false);
                    setEditRemoveImage(false);
                    try { if (editFileInputRef.current) editFileInputRef.current.value = ''; } catch (e) {}
                },
            });
        }
    }

    // Controlled Delete dialog
    const deleteForm = useForm();
    function openDeleteFor(item: Item) {
        setSelectedItem(item);
        setDeleteOpen(true);
    }

    function submitDelete() {
        if (!selectedItem) return;
        deleteForm.delete(`/warehouse/items/${selectedItem.id}`, {
            onSuccess: () => {
                setDeleteOpen(false);
            },
        });
    }

    // change quantity by delta (±1) with optimistic UI and processing state.
    function changeQuantity(item: Item, delta: number) {
        const currentQty = optimisticQuantities[item.id] ?? item.quantity;
        const newQty = currentQty + delta;
        if (newQty < 0) return; // prevent negative quantities

        const prevQty = currentQty;

        // optimistic update
        setOptimisticQuantities((m) => ({ ...m, [item.id]: newQty }));
        setProcessingIds((p) => (p.includes(item.id) ? p : p.concat([item.id])));

        router.put(
            `/warehouse/items/${item.id}`,
            {
                name: item.name,
                quantity: newQty,
                category: item.category ?? [],
            },
            {
                preserveState: true,
                onSuccess: () => {
                    // server will send updated props; clear optimistic value for this item so UI uses server value
                    setOptimisticQuantities((m) => {
                        const copy = { ...m };
                        delete copy[item.id];
                        return copy;
                    });
                },
                onError: () => {
                    // revert optimistic change on error
                    setOptimisticQuantities((m) => ({ ...m, [item.id]: prevQty }));
                },
                onFinish: () => {
                    setProcessingIds((p) => p.filter((id) => id !== item.id));
                },
            }
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouse" />

            <div className="p-4">
                <h1 className="mb-4 text-2xl font-semibold">Inventory</h1>

                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 w-1/2">
                            <div className="relative w-full">
                                <Input
                                    placeholder="Search by name, category, email or quantity"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <Search size={16} />
                                </div>
                            </div>
                            <div>
                                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSort({ column: null, dir: 'asc' }); }}>
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Button onClick={openCreate}>Create Item</Button>
                        </div>
                    </div>

                    {/* Create Dialog (controlled) */}
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogContent>
                            <DialogTitle>Create item</DialogTitle>
                            <DialogDescription>Create a new inventory item.</DialogDescription>

                            <form onSubmit={submitCreate} className="grid gap-3">
                                <div>
                                    <Label>Name</Label>
                                    <Input value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} />
                                    {createForm.errors.name && <div className="text-sm text-destructive mt-1">{createForm.errors.name}</div>}
                                </div>

                                <div>
                                    <Label>Quantity</Label>
                                    <Input type="number" value={String(createForm.data.quantity)} onChange={(e) => createForm.setData('quantity', Number(e.target.value))} />
                                    {createForm.errors.quantity && <div className="text-sm text-destructive mt-1">{createForm.errors.quantity}</div>}
                                </div>

                                <div className="mb-4">
                                    <Label>Category (comma separated)</Label>
                                    <Input value={createCategoryText} onChange={(e) => setCreateCategoryText(e.target.value)} />
                                    {createForm.errors.category && <div className="text-sm text-destructive mt-1">{createForm.errors.category}</div>}

                                    {/* reserved area for suggestions to avoid layout shift */}
                                        <div className="min-h-[2rem] mt-2">
                                            {/* suggestions rendered below when available and filtered by current token */}
                                            {categoriesProp && categoriesProp.length > 0 && (() => {
                                                const existing = createCategoryText.split(',').map((s) => s.trim()).filter(Boolean);
                                                const lastToken = (createCategoryText.split(',').pop() || '').trim();
                                                const q = lastToken.toLowerCase();
                                                const lowerExisting = existing.map((e) => e.toLowerCase());

                                                const suggestions = categoriesProp
                                                    .filter((c) => {
                                                        const cl = c.toLowerCase();
                                                        if (lowerExisting.includes(cl)) return false; // don't suggest already chosen
                                                        if (!q) return true; // show some suggestions when empty
                                                        return cl.includes(q);
                                                    })
                                                    .slice(0, 12);

                                                return (
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestions.map((c: string) => (
                                                            <button
                                                                type="button"
                                                                key={c}
                                                                className="text-xs px-2 py-1 rounded-md border bg-muted/10"
                                                                onClick={() => {
                                                                    // append suggestion to categoryText if not present
                                                                    const existingNow = createCategoryText.split(',').map((s) => s.trim()).filter(Boolean);
                                                                    if (!existingNow.map((x) => x.toLowerCase()).includes(c.toLowerCase())) {
                                                                        const next = existingNow.concat([c]).join(', ');
                                                                        setCreateCategoryText(next);
                                                                    }
                                                                }}
                                                            >
                                                                {c}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                </div>

                                <div className="mb-4">
                                    <Label>Image</Label>
                                    <input
                                        ref={createFileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] ?? null;
                                            // revoke previous preview URL
                                            if (createImagePreview) {
                                                try { URL.revokeObjectURL(createImagePreview); } catch (err) {}
                                            }
                                            if (f) {
                                                const url = URL.createObjectURL(f);
                                                setCreateImagePreview(url);
                                            } else {
                                                setCreateImagePreview(null);
                                            }
                                            createForm.setData('image', f);
                                        }}
                                    />
                                    <div className="mt-2">
                                        {createImagePreview ? (
                                            <div className="flex items-center gap-4">
                                                <img src={createImagePreview} className="h-20 w-20 object-cover rounded" />
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => createFileInputRef.current?.click()}>Change</Button>
                                                    <Button size="sm" variant="secondary" onClick={() => { createForm.setData('image', null); setCreateImagePreview(null); }}>Remove</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button onClick={() => createFileInputRef.current?.click()}>Add image</Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <DialogClose asChild>
                                        <Button variant="secondary">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={createForm.processing}>{createForm.processing ? 'Creating...' : 'Create'}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                                <thead className="bg-gray-50 dark:bg-transparent">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                                    <button className="flex items-center gap-2" onClick={() => setSort((s) => ({ column: 'name', dir: s.column === 'name' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                                        <span>Name</span>
                                        {sort.column === 'name' ? (sort.dir === 'asc' ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />) : <ChevronUpIcon size={14} className="opacity-30" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                                    <button className="flex items-center gap-2" onClick={() => setSort((s) => ({ column: 'quantity', dir: s.column === 'quantity' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                                        <span>Quantity</span>
                                        {sort.column === 'quantity' ? (sort.dir === 'asc' ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />) : <ChevronUpIcon size={14} className="opacity-30" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                                    <button className="flex items-center gap-2" onClick={() => setSort((s) => ({ column: 'category', dir: s.column === 'category' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                                        <span>Image</span>
                                        {/* image column is not sortable but keep icon for visual parity */}
                                        <ChevronUpIcon size={14} className="opacity-30" />
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                                    <button className="flex items-center gap-2" onClick={() => setSort((s) => ({ column: 'category', dir: s.column === 'category' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                                        <span>Category</span>
                                        {sort.column === 'category' ? (sort.dir === 'asc' ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />) : <ChevronUpIcon size={14} className="opacity-30" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                                    <button className="flex items-center gap-2" onClick={() => setSort((s) => ({ column: 'last_modified', dir: s.column === 'last_modified' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                                        <span>Last Modified</span>
                                        {sort.column === 'last_modified' ? (sort.dir === 'asc' ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />) : <ChevronUpIcon size={14} className="opacity-30" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                                    <button className="flex items-center gap-2" onClick={() => setSort((s) => ({ column: 'changed_by', dir: s.column === 'changed_by' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                                        <span>Changed By</span>
                                        {sort.column === 'changed_by' ? (sort.dir === 'asc' ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />) : <ChevronUpIcon size={14} className="opacity-30" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase hidden sm:table-cell">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-neutral-700">
                            {itemsList.map((item: Item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="truncate">{item.name}</div>
                                            <button
                                                type="button"
                                                className="ml-2 text-muted-foreground hover:text-foreground sm:hidden"
                                                aria-label={`Edit ${item.name}`}
                                                onClick={() => openEditFor(item)}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => changeQuantity(item, -1)}
                                                disabled={(optimisticQuantities[item.id] ?? item.quantity) <= 0 || processingIds.includes(item.id)}
                                                aria-label={`Decrease quantity for ${item.name}`}
                                            >
                                                {processingIds.includes(item.id) ? (
                                                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Minus size={14} />
                                                )}
                                            </Button>

                                            <span className="w-12 text-center">{optimisticQuantities[item.id] ?? item.quantity}</span>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => changeQuantity(item, 1)}
                                                disabled={processingIds.includes(item.id)}
                                                aria-label={`Increase quantity for ${item.name}`}
                                            >
                                                {processingIds.includes(item.id) ? (
                                                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Plus size={14} />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(item as any).image_url ? (
                                            <div>
                                                <img src={(item as any).image_url} alt={item.name} className="h-16 w-16 object-cover rounded" />
                                            </div>
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{(item.category || []).join(', ')}</div>
                                    </td>
                                    <td className="px-6 py-4">{item.last_modified ? new Date(item.last_modified).toLocaleString() : '-'}</td>
                                        <td className="px-6 py-4">{item.changed_by ?? '-'}</td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openEditFor(item)}>Edit</Button>
                                                <Button size="sm" variant="destructive" onClick={() => openDeleteFor(item)}>Delete</Button>
                                            </div>
                                        </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Edit Dialog (controlled) */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogTitle>Edit item</DialogTitle>
                        <DialogDescription>Update the item details below.</DialogDescription>

                        <form onSubmit={submitEdit} className="grid gap-3">
                            <div>
                                <Label>Name</Label>
                                <Input value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                {editForm.errors.name && <div className="text-sm text-destructive mt-1">{editForm.errors.name}</div>}
                            </div>

                            <div>
                                <Label>Quantity</Label>
                                <Input type="number" value={String(editForm.data.quantity)} onChange={(e) => editForm.setData('quantity', Number(e.target.value))} />
                                {editForm.errors.quantity && <div className="text-sm text-destructive mt-1">{editForm.errors.quantity}</div>}
                            </div>

                            <div className="mb-4">
                                <Label>Category (comma separated)</Label>
                                <Input value={editCategoryText} onChange={(e) => setEditCategoryText(e.target.value)} />

                                {/* reserved area for suggestions to avoid layout shift */}
                                <div className="min-h-[4rem] mt-2">
                                    {categoriesProp && categoriesProp.length > 0 && (() => {
                                        const existing = editCategoryText.split(',').map((s) => s.trim()).filter(Boolean);
                                        const lastToken = (editCategoryText.split(',').pop() || '').trim();
                                        const q = lastToken.toLowerCase();
                                        const lowerExisting = existing.map((e) => e.toLowerCase());

                                        const suggestions = categoriesProp
                                            .filter((c) => {
                                                const cl = c.toLowerCase();
                                                if (lowerExisting.includes(cl)) return false;
                                                if (!q) return true;
                                                return cl.includes(q);
                                            })
                                            .slice(0, 12);

                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {suggestions.map((c: string) => (
                                                    <button
                                                        type="button"
                                                        key={c}
                                                        className="text-xs px-2 py-1 rounded-md border bg-muted/10"
                                                        onClick={() => {
                                                            const existingNow = editCategoryText.split(',').map((s) => s.trim()).filter(Boolean);
                                                            if (!existingNow.map((x) => x.toLowerCase()).includes(c.toLowerCase())) {
                                                                const next = existingNow.concat([c]).join(', ');
                                                                setEditCategoryText(next);
                                                                editForm.setData('category', existingNow.concat([c]));
                                                            }
                                                        }}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="mb-4">
                                <Label>Image</Label>
                                <input
                                    ref={editFileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        if (editImagePreview) {
                                            try { URL.revokeObjectURL(editImagePreview); } catch (err) {}
                                        }
                                        if (f) {
                                            const url = URL.createObjectURL(f);
                                            setEditImagePreview(url);
                                            setEditRemoveImage(false);
                                            editForm.setData('remove_image', false);
                                        } else {
                                            setEditImagePreview((selectedItem as any)?.image_url ?? null);
                                        }
                                        editForm.setData('image', f);
                                    }}
                                />

                                <div className="mt-2 flex items-center gap-4">
                                    {editImagePreview ? (
                                        <>
                                            <img src={editImagePreview} className="h-20 w-20 object-cover rounded" />
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => editFileInputRef.current?.click()}>Change</Button>
                                                    <Button size="sm" variant="secondary" onClick={() => {
                                                        // mark for removal
                                                        editForm.setData('image', null);
                                                        setEditImagePreview(null);
                                                        setEditRemoveImage(true);
                                                        editForm.setData('remove_image', true);
                                                    }}>Remove</Button>
                                                </div>
                                                <div className="text-xs text-muted-foreground">Current image</div>
                                            </div>
                                        </>
                                    ) : (
                                        <Button onClick={() => editFileInputRef.current?.click()}>Add image</Button>
                                    )}
                                </div>
                            </div>

                                

                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            if (!selectedItem) return;
                                            // close edit modal and open delete confirmation
                                            setEditOpen(false);
                                            openDeleteFor(selectedItem);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <DialogClose asChild>
                                        <Button variant="secondary">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Saving...' : 'Save'}</Button>
                                </div>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog (controlled) */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogTitle>Delete item</DialogTitle>
                        <DialogDescription>Are you sure you want to delete {selectedItem?.name ?? ''}? This action cannot be undone.</DialogDescription>

                        <div className="flex justify-end gap-2 mt-4">
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={submitDelete} disabled={deleteForm.processing}>{deleteForm.processing ? 'Deleting...' : 'Delete'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
