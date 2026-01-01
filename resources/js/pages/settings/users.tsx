import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export default function Users() {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'User management', href: '/settings/users' },
    ];
    const { users, auth, availablePermissions, rolePresets } = usePage().props as any;

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // Permission Template State ('Administrator' | 'Board' | 'Guest')
    const [permissionLevel, setPermissionLevel] = useState<string>('Guest');

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '', // This is now Job Title / Description only
        password: '',
        permissions: [] as string[],
    });

    const myPermissions = auth?.user?.permissions || [];
    const hasAdminPermission = Array.isArray(myPermissions) &&
        (myPermissions.includes('admin') || myPermissions.includes('manage_users'));

    if (!hasAdminPermission) {
        return <div className="p-8">Unauthorized</div>;
    }

    // --- Logic: Handle Permission Level Toggle ---
    const handleLevelChange = (level: string) => {
        setPermissionLevel(level);
        const preset = rolePresets[level] || [];
        // Apply the preset permissions immediately
        setForm(prev => ({ ...prev, permissions: preset }));
    };

    // Toggle individual permissions (Only for Guest)
    const togglePermission = (permissionValue: string) => {
        if (permissionLevel !== 'Guest') return; // Locked for others

        setForm(prev => {
            const hasIt = prev.permissions.includes(permissionValue);
            return {
                ...prev,
                permissions: hasIt
                    ? prev.permissions.filter(p => p !== permissionValue)
                    : [...prev.permissions, permissionValue]
            };
        });
    };

    // Determine initial level based on user permissions
    const determineLevel = (userPermissions: string[]) => {
        const adminSet = rolePresets['Administrator'] || [];
        const boardSet = rolePresets['Board'] || [];

        // Simple array comparison logic
        const sortAndStr = (arr: string[]) => [...arr].sort().join(',');
        const userStr = sortAndStr(userPermissions);

        if (userStr === sortAndStr(adminSet)) return 'Administrator';
        if (userStr === sortAndStr(boardSet)) return 'Board';
        return 'Guest';
    };


    const openAddModal = () => {
        setSelectedUser(null);
        setPermissionLevel('Guest');
        setForm({
            first_name: '',
            last_name: '',
            email: '',
            role: 'Anonymous',
            password: '',
            permissions: rolePresets['Guest'] || []
        });
        setAddModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        const level = determineLevel(user.permissions || []);
        setPermissionLevel(level);
        setForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || '',
            password: '',
            permissions: user.permissions || [],
        });
        setEditModalOpen(true);
    };

    const openDeleteModal = (user: any) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const isEdit = !!selectedUser;
        const payload = { ...form };

        if (isEdit) {
            router.patch(`/settings/users/${selectedUser.id}`, payload, {
                onSuccess: () => {
                    setEditModalOpen(false);
                    setSelectedUser(null);
                },
            });
        } else {
            router.post('/settings/users', payload, {
                onSuccess: () => {
                    setAddModalOpen(false);
                    setSelectedUser(null);
                },
            });
        }
    };

    const handleDelete = () => {
        if (!selectedUser) return;
        router.delete(`/settings/users/${selectedUser.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setSelectedUser(null);
            },
        });
    };

    const renderUserForm = () => (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                        id="first-name"
                        value={form.first_name}
                        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                        id="last-name"
                        value={form.last_name}
                        onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="role-desc">Role</Label>
                <Input
                    id="role-desc"
                    placeholder="e.g. President, Trips Coordinator, Useless"
                    // default value/default initialized value 'Anonymous'
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                />
            </div>

            <div className="space-y-3">
                <Label>Permission Level</Label>
                {/* Custom Toggle Group mimicking the camera toggle style */}
                <div className="flex items-center">
                    <div className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground sm:w-auto">
                        {['Administrator', 'Board', 'Guest'].map((level) => {
                            const isActive = permissionLevel === level;
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => handleLevelChange(level)}
                                    className={cn(
                                        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                        isActive
                                            ? "bg-background text-foreground shadow-sm"
                                            : "hover:bg-background/50 hover:text-foreground"
                                    )}
                                >
                                    {level}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    {permissionLevel === 'Administrator' && "Full access to all system resources."}
                    {permissionLevel === 'Board' && "Access to Board resources."}
                    {permissionLevel === 'Guest' && "Limited access. Select specific permissions below."}
                </p>
            </div>

            {/* Granular Permissions - Only show if Guest is selected */}
            {permissionLevel === 'Guest' && (
                <div className="space-y-4 rounded-md border p-3 bg-muted/20 animate-in fade-in zoom-in-95 duration-200 max-h-[350px] overflow-y-auto">
                    <Label className="text-xs uppercase text-muted-foreground">Additional Permissions</Label>

                    {/* Helper to group permissions by category */}
                    {(() => {
                        const categories = {
                            'Dashboard': ['view_dashboard'],
                            'Office Shifts': ['view_office', 'create_office', 'update_office', 'delete_office'],
                            'Store Manager': ['view_store_manager', 'update_store_settings'],
                            'Sellables': [
                                'view_sellables',
                                'create_product', 'update_product', 'delete_product',
                                'create_event', 'update_event', 'delete_event',
                                'view_event_attendees', 'update_event_attendee',
                            ],
                            'Inventory': ['view_inventory', 'create_item', 'update_item', 'delete_item'],
                            'Ticket Scanner': ['view_ticket_scanner', 'scan_tickets'],
                            'Ticket Distributor': ['view_ticket_distributor', 'send_tickets'],
                            'Mail Distributor': ['view_mail_distributor', 'send_mails', 'create_mail_templates'],
                            'Settings': [
                                'view_settings_profile', 'update_settings_profile', 'delete_account',
                                'view_settings_password', 'update_settings_password',
                                'view_settings_2fa', 'update_settings_2fa',
                                'view_settings_google', 'update_settings_google',
                                'view_settings_appearance',
                                'view_settings_footer', 'update_settings_footer',
                                'view_settings_users', 'create_user', 'update_user', 'delete_user'
                            ],
                        };

                        return Object.entries(categories).map(([catName, permKeys]) => {
                            const perms = permKeys
                                .map(key => availablePermissions.find((p: any) => p.value === key))
                                .filter(Boolean);

                            if (perms.length === 0) return null;

                            return (
                                <div key={catName} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-foreground/70 border-b pb-1">{catName}</h4>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {perms.map((perm: any) => (
                                            <div key={perm.value} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`perm-${perm.value}`}
                                                    checked={form.permissions.includes(perm.value)}
                                                    onCheckedChange={() => togglePermission(perm.value)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={`perm-${perm.value}`}
                                                        className="text-sm font-medium leading-none cursor-pointer"
                                                    >
                                                        {perm.label}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="password">
                    Password {selectedUser && '(Leave blank to keep current)'}
                </Label>
                <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!selectedUser}
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User management" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="User Management"
                        description="Manage users, define job titles, and assign system permissions."
                    />

                    <Button onClick={openAddModal}>Add User</Button>

                    <div className="w-full overflow-hidden rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-3 text-left text-sm font-medium">User</th>
                                        <th className="p-3 text-left text-sm font-medium">Role</th>
                                        <th className="p-3 text-left text-sm font-medium">Permissions</th>
                                        <th className="p-3 text-left text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u: any) => (
                                        <tr key={u.id} className="border-b last:border-0">
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{u.first_name} {u.last_name}</span>
                                                    <span className="text-xs text-muted-foreground">{u.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm">
                                                {u.role ? (
                                                    <span className="font-medium text-muted-foreground">{u.role}</span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">-</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={cn(
                                                    "font-normal bg-primary/10 border-primary/30"
                                                )}>
                                                    {u.permission_display}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openEditModal(u)}>
                                                        Edit
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openDeleteModal(u)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>Create a user with specific access rights.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                {renderUserForm()}
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit">Create User</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                {renderUserForm()}
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
                                    This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={handleDelete}>Delete User</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
