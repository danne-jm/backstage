const fs = require('fs');
let file = 'resources/js/pages/settings/users.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    /import { Head, usePage } from '@inertiajs\/react';/,
    "import { Head, usePage, router } from '@inertiajs/react';"
);

data = data.replace(
    /const { users: initialUsers } = usePage\(\)\.props as any;\s*\/\/ Pure front-end state for now to demonstrate UI logic\s*const \[users, setUsers\] = useState<any\[\]>\(\s*\(initialUsers \|\| \[\]\)\.map\(\(u: any\) => \(\{\s*\.\.\.u,\s*is_locked: u\.is_locked \|\| false,\s*permissions: u\.permissions \|\| \[\],\s*\}\)\)\s*\);\s*\/\/ If empty initially, show dummy data for demo purposes\s*if \(users\.length === 0\) \{\s*users\.push\([^)]+\);\s*\}/,
    `const { users: initialUsers } = usePage().props as any;
    
    const users = (initialUsers || []).map((u: any) => ({
        ...u,
        is_locked: !!u.is_locked,
        permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || []),
    }));`
);

data = data.replace(
    /const handleSubmit = \(e: any\) => {[\s\S]*?};/g,
    `const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = !!selectedUser;

        if (isEdit) {
            router.patch(\`/settings/users/\${selectedUser.id}\`, form as any, {
                onSuccess: () => {
                    setEditModalOpen(false);
                    setSelectedUser(null);
                }
            });
        } else {
            router.post(\`/settings/users\`, form as any, {
                onSuccess: () => {
                    setAddModalOpen(false);
                    setSelectedUser(null);
                }
            });
        }
    };`
);

data = data.replace(
    /const handleDelete = \(\) => {[\s\S]*?};/g,
    `const handleDelete = () => {
        if (!selectedUser) return;
        router.delete(\`/settings/users/\${selectedUser.id}\`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setSelectedUser(null);
            }
        });
    };`
);

fs.writeFileSync(file, data);
