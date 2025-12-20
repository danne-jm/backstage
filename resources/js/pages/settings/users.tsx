import { usePage } from '@inertiajs/react';
import { useState } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { router } from '@inertiajs/react';

export default function Users() {
    const { users, auth, availablePermissions } = usePage().props as any;
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        password: '',
        permissions: [] as string[],
    });

    // Only allow users with 'admin' permission
    const permissions = auth?.user?.permissions || [];
    const hasAdminPermission = Array.isArray(permissions) && permissions.includes('admin');
    if (!hasAdminPermission) {
        return <div className="p-8">Unauthorized</div>;
    }

    const openAddModal = () => {
        setSelectedUser(null);
        setForm({ first_name: '', last_name: '', email: '', role: '', password: '', permissions: [] });
        setAddModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
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
        
        // Ensure guest permission is always included
        const payload = {
            ...form,
            permissions: Array.from(new Set([...(form.permissions || []), 'guest'])),
        };

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

    const togglePermission = (permission: string) => {
        if (permission === 'guest') return; // Prevent toggling guest
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="User Management"
                        description="Manage all user accounts on the platform"
                    />
                    
                    <Button onClick={openAddModal}>Add User</Button>
                    
                    <div className="w-full overflow-hidden rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Name</th>
                                        <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Email</th>
                                        <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Role</th>
                                        <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Permissions</th>
                                        <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u: any) => (
                                        <tr key={u.id} className="border-b last:border-0">
                                            <td className="whitespace-nowrap p-3 text-sm">{u.first_name || ''} {u.last_name || ''}</td>
                                            <td className="whitespace-nowrap p-3 text-sm">{u.email || ''}</td>
                                            <td className="whitespace-nowrap p-3 text-sm">{u.role || ''}</td>
                                            <td className="p-3 text-sm">
                                                <div className="flex flex-wrap gap-1">
                                                    {(u.permissions || []).map((perm: string) => (
                                                        <span key={perm} className="rounded bg-muted px-2 py-0.5 text-xs">
                                                            {perm}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap p-3">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => openEditModal(u)}>
                                                        Edit
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(u)}>
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

                    {/* Add User Dialog */}
                    <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add User</DialogTitle>
                                <DialogDescription>
                                    Create a new user account
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="add-first-name">First Name</Label>
                                    <Input
                                        id="add-first-name"
                                        value={form.first_name}
                                        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-last-name">Last Name</Label>
                                    <Input
                                        id="add-last-name"
                                        value={form.last_name}
                                        onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-email">Email</Label>
                                    <Input
                                        id="add-email"
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-role">Role</Label>
                                    <Input
                                        id="add-role"
                                        value={form.role}
                                        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-password">Password</Label>
                                    <Input
                                        id="add-password"
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label>Permissions</Label>
                                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                                        {availablePermissions.map((perm: any) => (
                                            <div key={perm.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`add-perm-${perm.value}`}
                                                    checked={perm.value === 'guest' ? true : form.permissions.includes(perm.value)}
                                                    onCheckedChange={() => togglePermission(perm.value)}
                                                    disabled={perm.value === 'guest'}
                                                />
                                                <label
                                                    htmlFor={`add-perm-${perm.value}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {perm.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit">Create User</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Edit User Dialog */}
                    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                    Update user account details
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-first-name">First Name</Label>
                                    <Input
                                        id="edit-first-name"
                                        value={form.first_name}
                                        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-last-name">Last Name</Label>
                                    <Input
                                        id="edit-last-name"
                                        value={form.last_name}
                                        onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Input
                                        id="edit-role"
                                        value={form.role}
                                        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-password">Password (leave blank to keep unchanged)</Label>
                                    <Input
                                        id="edit-password"
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label>Permissions</Label>
                                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                                        {availablePermissions.map((perm: any) => (
                                            <div key={perm.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`edit-perm-${perm.value}`}
                                                    checked={perm.value === 'guest' ? true : form.permissions.includes(perm.value)}
                                                    onCheckedChange={() => togglePermission(perm.value)}
                                                    disabled={perm.value === 'guest'}
                                                />
                                                <label
                                                    htmlFor={`edit-perm-${perm.value}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {perm.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit">Update User</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete {selectedUser?.first_name} {selectedUser?.last_name}? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={handleDelete}>
                                        Delete
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
