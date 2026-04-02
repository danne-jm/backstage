import { Head, usePage, router } from '@inertiajs/react';
import Heading from '@backstage/components/heading';
import AppLayout from '@backstage/layouts/app-layout';
import SettingsLayout from '@backstage/layouts/settings/layout';
import type { BreadcrumbItem } from '@backstage/types';
import { useState } from 'react';
import { Button } from '@backstage/components/ui/button';
import { Badge } from '@backstage/components/ui/badge';
import { Checkbox } from '@backstage/components/ui/checkbox';
import { Input } from '@backstage/components/ui/input';
import { Label } from '@backstage/components/ui/label';
import { cn } from '@backstage/lib/utils';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@backstage/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/settings/users',
    },
];

const availablePermissions = [
    { value: 'view_dashboard', label: 'View Dashboard' },
    { value: 'view_office', label: 'View Office Shifts' },
    { value: 'create_office', label: 'Create Office Shifts' },
    { value: 'update_office', label: 'Update Office Shifts' },
    { value: 'delete_office', label: 'Delete Office Shifts' },
    { value: 'view_store_manager', label: 'View Store Manager' },
    { value: 'update_store_settings', label: 'Update Store Settings' },
    { value: 'view_sellables', label: 'View Sellables' },
    { value: 'create_product', label: 'Create Product' },
    { value: 'update_product', label: 'Update Product' },
    { value: 'delete_product', label: 'Delete Product' },
    { value: 'create_event', label: 'Create Event' },
    { value: 'update_event', label: 'Update Event' },
    { value: 'delete_event', label: 'Delete Event' },
    { value: 'view_event_attendees', label: 'View Attendees' },
    { value: 'update_event_attendee', label: 'Update Attendee' },
    { value: 'view_inventory', label: 'View Inventory' },
    { value: 'create_item', label: 'Create Item' },
    { value: 'update_item', label: 'Update Item' },
    { value: 'delete_item', label: 'Delete Item' },
    { value: 'view_ticket_scanner', label: 'View Ticket Scanner' },
    { value: 'scan_tickets', label: 'Scan Tickets' },
    { value: 'view_ticket_distributor', label: 'View Ticket Distributor' },
    { value: 'send_tickets', label: 'Send Tickets' },
    { value: 'view_mail_distributor', label: 'View Mail Distributor' },
    { value: 'send_mails', label: 'Send Mails' },
    { value: 'create_mail_templates', label: 'Create Mail Templates' },
    { value: 'view_settings_profile', label: 'View Settings Profile' },
    { value: 'update_settings_profile', label: 'Update Settings Profile' },
    { value: 'delete_account', label: 'Delete Account' },
    { value: 'view_settings_password', label: 'View Settings Password' },
    { value: 'update_settings_password', label: 'Update Settings Password' },
    { value: 'view_settings_2fa', label: 'View 2FA Settings' },
    { value: 'update_settings_2fa', label: 'Update 2FA Settings' },
    { value: 'view_settings_google', label: 'View Google Settings' },
    { value: 'update_settings_google', label: 'Update Google Settings' },
    { value: 'view_settings_appearance', label: 'View Appearance' },
    { value: 'view_settings_footer', label: 'View Footer Settings' },
    { value: 'update_settings_footer', label: 'Update Footer Settings' },
    { value: 'view_settings_users', label: 'View Users' },
    { value: 'create_user', label: 'Create User' },
    { value: 'update_user', label: 'Update User' },
    { value: 'delete_user', label: 'Delete User' },
];

const rolePresets: Record<string, string[]> = {
    Administrator: availablePermissions.map(p => p.value),
    Board: ['view_dashboard', 'view_office', 'view_sellables', 'view_inventory', 'view_ticket_scanner'],
    Guest: [],
};

const permissionCategories = [
    { title: 'Dashboard', keys: ['view_dashboard'] },
    { title: 'Office Shifts', keys: ['view_office', 'create_office', 'update_office', 'delete_office'] },
    { title: 'Store Manager', keys: ['view_store_manager', 'update_store_settings'] },
    { title: 'Sellables', keys: ['view_sellables', 'create_product', 'update_product', 'delete_product', 'create_event', 'update_event', 'delete_event', 'view_event_attendees', 'update_event_attendee'] },
    { title: 'Inventory', keys: ['view_inventory', 'create_item', 'update_item', 'delete_item'] },
    { title: 'Ticket Scanner', keys: ['view_ticket_scanner', 'scan_tickets'] },
    { title: 'Ticket Distributor', keys: ['view_ticket_distributor', 'send_tickets'] },
    { title: 'Mail Distributor', keys: ['view_mail_distributor', 'send_mails', 'create_mail_templates'] },
    { title: 'Settings', keys: ['view_settings_profile', 'update_settings_profile', 'delete_account', 'view_settings_password', 'update_settings_password', 'view_settings_2fa', 'update_settings_2fa', 'view_settings_google', 'update_settings_google', 'view_settings_appearance', 'view_settings_footer', 'update_settings_footer', 'view_settings_users', 'create_user', 'update_user', 'delete_user'] },
];

export default function Users() {
    const { users: initialUsers } = usePage().props as any;
    
    // Process backend data into predictable frontend structure
    const users = (initialUsers || []).map((u: any) => ({
        ...u,
        is_locked: !!u.is_locked,
        permissions: (typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions) || [],
    }));

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const [permissionLevel, setPermissionLevel] = useState<string>('Guest');
    const [savedGuestPermissions, setSavedGuestPermissions] = useState<string[]>([]);

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        password: '',
        permissions: [] as string[],
        is_locked: false,
    });

    const handleLevelChange = (level: string) => {
        if (permissionLevel === 'Guest' && level !== 'Guest') {
            setSavedGuestPermissions(form.permissions);
        }
        setPermissionLevel(level);

        if (level === 'Guest') {
            setForm((prev) => ({
                ...prev,
                permissions: savedGuestPermissions,
            }));
        } else {
            const preset = rolePresets[level] || [];
            setForm((prev) => ({ ...prev, permissions: preset }));
        }
    };

    const togglePermission = (permissionValue: string) => {
        if (permissionLevel !== 'Guest') return;
        setForm((prev) => {
            const hasIt = prev.permissions.includes(permissionValue);
            return {
                ...prev,
                permissions: hasIt
                    ? prev.permissions.filter((p) => p !== permissionValue)
                    : [...prev.permissions, permissionValue],
            };
        });
    };

    const determineLevel = (userPermissions: string[]) => {
        const adminSet = rolePresets['Administrator'] || [];
        const boardSet = rolePresets['Board'] || [];

        const sortAndStr = (arr: string[]) => [...arr].sort().join(',');
        const userStr = sortAndStr(userPermissions);

        if (userStr === sortAndStr(adminSet)) return 'Administrator';
        if (userStr === sortAndStr(boardSet)) return 'Board';
        return 'Guest';
    };

    const openAddModal = () => {
        setSelectedUser(null);
        setPermissionLevel('Guest');
        const defaultGuest = rolePresets['Guest'] || [];
        setSavedGuestPermissions(defaultGuest);
        setForm({
            first_name: '',
            last_name: '',
            email: '',
            role: 'Anonymous',
            password: '',
            permissions: defaultGuest,
            is_locked: false,
        });
        setAddModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        const level = determineLevel(user.permissions || []);
        setPermissionLevel(level);

        const currentPerms = user.permissions || [];
        if (level === 'Guest') {
            setSavedGuestPermissions(currentPerms);
        } else {
            setSavedGuestPermissions(rolePresets['Guest'] || []);
        }

        setForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || '',
            password: '',
            permissions: currentPerms,
            is_locked: user.is_locked || false,
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

        if (isEdit) {
            router.patch(`/settings/users/${selectedUser.id}`, form as any, {
                onSuccess: () => {
                    setEditModalOpen(false);
                    setSelectedUser(null);
                }
            });
        } else {
            router.post(`/settings/users`, form as any, {
                onSuccess: () => {
                    setAddModalOpen(false);
                    setSelectedUser(null);
                }
            });
        }
    };

    const handleDelete = () => {
        if (!selectedUser) return;
        router.delete(`/settings/users/${selectedUser.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setSelectedUser(null);
            }
        });
    };

    const handleLockToggle = (e: any) => {
        setForm((f) => ({ ...f, is_locked: !f.is_locked }));
    };

    const renderUserForm = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                        id="first-name"
                        value={form.first_name}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                first_name: e.target.value,
                            }))
                        }
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                        id="last-name"
                        value={form.last_name}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                last_name: e.target.value,
                            }))
                        }
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
                    onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="role-desc">Role (Job Title)</Label>
                <Input
                    id="role-desc"
                    placeholder="e.g. President, Guest"
                    value={form.role}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value }))
                    }
                />
            </div>

            <div className="flex items-center space-x-2 py-2">
                <Checkbox
                    id="is-locked"
                    checked={form.is_locked}
                    onCheckedChange={(checked) => 
                        setForm((f) => ({ ...f, is_locked: checked === true }))
                    }
                />
                <Label htmlFor="is-locked" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Lock User Account
                </Label>
            </div>
            {form.is_locked && (
                <p className="text-xs text-muted-foreground">
                    This user will not be able to log in while their account is locked.
                </p>
            )}

            <div className="space-y-3">
                <Label>Permission Level</Label>
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
                                        'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
                                        isActive
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'hover:bg-background/50 hover:text-foreground',
                                    )}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    {permissionLevel === 'Administrator' && 'Full access to all system resources.'}
                    {permissionLevel === 'Board' && 'Access to Board resources.'}
                    {permissionLevel === 'Guest' && 'Limited access. Select specific permissions below.'}
                </p>
            </div>

            {permissionLevel === 'Guest' && (
                <div className="animate-in space-y-4 rounded-md border bg-muted/20 p-3 duration-200 zoom-in-95 fade-in max-h-[300px] overflow-y-auto">
                    <Label className="text-xs text-muted-foreground uppercase">
                        Additional Permissions
                    </Label>

                    {permissionCategories.map((category) => {
                        const perms = category.keys.map(key => availablePermissions.find(p => p.value === key)).filter(Boolean);
                        if (perms.length === 0) return null;

                        return (
                            <div key={category.title} className="space-y-2">
                                <h4 className="border-b pb-1 text-xs font-semibold text-foreground/70">
                                    {category.title}
                                </h4>
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
                                                    className="cursor-pointer text-sm leading-none font-medium"
                                                >
                                                    {perm.label}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="space-y-2 pt-2">
                <Label htmlFor="password">
                    Password {selectedUser && '(Leave blank to keep current)'}
                </Label>
                <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    required={!selectedUser}
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <SettingsLayout wide={true}>
                <div className="space-y-6">
                    <div className="flex justify-between items-start">
                        <Heading
                            variant="small"
                            title="User Management"
                            description="Manage users, assign job titles, set permissions and lock accounts."
                        />
                        <Button onClick={openAddModal}>Add User</Button>
                    </div>

                    <div className="w-full overflow-hidden rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-3 text-left text-sm font-medium">User</th>
                                        <th className="p-3 text-left text-sm font-medium">Role</th>
                                        <th className="p-3 text-left text-sm font-medium">Permissions</th>
                                        <th className="p-3 text-left text-sm font-medium">Status</th>
                                        <th className="p-3 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u: any) => {
                                        const isLocked = u.is_locked;
                                        return (
                                            <tr key={u.id} className={cn("border-b last:border-0", isLocked && "opacity-75 bg-muted/20")}>
                                                <td className="p-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {u.first_name} {u.last_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {u.email}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {u.role ? (
                                                        <span className="font-medium text-muted-foreground">
                                                            {u.role}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        variant="outline"
                                                        className="block w-fit max-w-[200px] truncate"
                                                    >
                                                        {determineLevel(u.permissions || [])}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    {isLocked ? (
                                                        <Badge variant="destructive">Locked</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">Active</Badge>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditModal(u)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => openDeleteModal(u)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No users found.
                                </div>
                            )}
                        </div>
                    </div>

                    <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>
                                    Create a user with specific access rights.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                {renderUserForm()}
                                <DialogFooter className="mt-6">
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

                    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                    Update user details, toggle lock status and manage permissions.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                {renderUserForm()}
                                <DialogFooter className="mt-6">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
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
                                    Are you sure you want to delete{' '}
                                    <strong>
                                        {selectedUser?.first_name} {selectedUser?.last_name}
                                    </strong>
                                    ? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={handleDelete}>
                                    Delete User
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
