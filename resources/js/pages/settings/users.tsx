import { usePage } from '@inertiajs/react';
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
import { router } from '@inertiajs/react';

export default function Users() {
    // rolePresets passed from controller
    const { users, auth, availablePermissions, rolePresets } = usePage().props as any;
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'Guest',
        password: '',
        permissions: [] as string[],
    });

    // Permission check for current user viewing the page
    const myPermissions = auth?.user?.permissions || [];
    const hasAdminPermission = Array.isArray(myPermissions) && 
        (myPermissions.includes('admin') || myPermissions.includes('manage_users'));

    if (!hasAdminPermission) {
        return <div className="p-8">Unauthorized</div>;
    }

    // --- Logic: Handle Role Presets ---
    const handleRoleChange = (newRole: string) => {
        const presetPermissions = rolePresets[newRole] || [];
        setForm(prev => ({
            ...prev,
            role: newRole,
            // Overwrite permissions with the preset defaults
            permissions: presetPermissions
        }));
    };

    const togglePermission = (permissionValue: string) => {
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
    // ----------------------------------

    const openAddModal = () => {
        setSelectedUser(null);
        // Default to Guest preset
        setForm({ 
            first_name: '', 
            last_name: '', 
            email: '', 
            role: 'Guest', 
            password: '', 
            permissions: rolePresets['Guest'] || [] 
        });
        setAddModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        setForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || 'Guest',
            password: '', // blank implies no change
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


    // Helper to render the form content (shared between Add/Edit)
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
                <Label htmlFor="role">Role Preset</Label>
                <Select value={form.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(rolePresets).map((roleKey) => (
                            <SelectItem key={roleKey} value={roleKey}>
                                {roleKey}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Selecting a role resets permissions to the default for that role. You can customize them below.
                </p>
            </div>

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

            <div className="space-y-3 pt-2">
                <Label>Effective Permissions</Label>
                <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                    {availablePermissions.map((perm: any) => (
                        <div key={perm.value} className="flex items-start space-x-2">
                            <Checkbox
                                id={`perm-${perm.value}`}
                                checked={form.permissions.includes(perm.value)}
                                onCheckedChange={() => togglePermission(perm.value)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor={`perm-${perm.value}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {perm.label}
                                </label>
                                <span className="text-[10px] text-muted-foreground">
                                    {perm.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="User Management"
                        description="Manage users, roles, and granular permissions."
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
                                                <Badge variant="outline">{u.role}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {u.permissions.length > 5 ? (
                                                        <>
                                                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                                                                {u.permissions.length} active permissions
                                                            </span>
                                                        </>
                                                    ) : (
                                                        u.permissions.map((p: string) => (
                                                            <span key={p} className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                                                                {p}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
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
