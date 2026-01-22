import HeadingSmall from '@/Components/Backstage/heading-small';
import { Icon } from '@/Components/Shared/icon';
import { Button } from '@/Components/Shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/Components/Shared/ui/dialog';
import { Input } from '@/Components/Shared/ui/input';
import AppLayout from '@/layouts/Backstage/app-layout';
import SettingsLayout from '@/layouts/Backstage/settings/layout';
import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Container,
    ExternalLink,
    Github,
    Globe,
    Instagram,
    Link as LinkIcon,
    Mail,
    PackageOpen,
    ShoppingBag,
    Store,
    Trash2,
    TreeDeciduous,
    Twitter,
} from 'lucide-react';
import * as React from 'react';

const iconMap: Record<string, any> = {
    Mail,
    Container,
    Globe,
    ShoppingBag,
    Link: LinkIcon,
    ExternalLink,
    Github,
    Twitter,
    Instagram,
    BookOpen,
    PackageOpen,
    Store,
    TreeDeciduous,
};

export default function SettingsFooter() {
    const { auth } = usePage<SharedData>().props;

    // Always use server-provided pinned items; default to empty array if absent.
    const initial = Array.isArray(auth?.user?.pinned) ? auth.user.pinned : [];
    const [items, setItems] = React.useState(initial);
    const [recentlySaved, setRecentlySaved] = React.useState(false);

    const iconOptions = Object.keys(iconMap);

    const updateAt = (idx: number, key: string, value: string) => {
        setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
        );
    };

    const addItem = () =>
        setItems((p) => [
            ...p,
            { title: 'New link', href: 'https://', icon: 'Link' },
        ]);
    const removeAt = (idx: number) => {
        const updatedItems = items.filter((_, i) => i !== idx);
        setItems(updatedItems);
        router.put(
            '/settings/profile/pinned',
            { pinned: updatedItems },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setRecentlySaved(true);
                    setTimeout(() => setRecentlySaved(false), 2000);
                },
            },
        );
    };

    const save = () => {
        router.put(
            '/settings/profile/pinned',
            { pinned: items },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setRecentlySaved(true);
                    setTimeout(() => setRecentlySaved(false), 2000);
                },
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Footer', href: '/settings/footer' }]}
        >
            <Head title="Footer quick links" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Footer quick links"
                        description="Customize the small footer links shown in the app sidebar"
                    />

                    <div className="space-y-3">
                        <div className="space-y-2">
                            {items.map((it, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex w-10 flex-shrink-0 items-center justify-center">
                                        <Icon
                                            iconNode={iconMap[it.icon] ?? Mail}
                                            className="h-5 w-5"
                                        />
                                    </div>

                                    <Input
                                        className="w-48 flex-shrink-0"
                                        value={it.title}
                                        onChange={(e) =>
                                            updateAt(
                                                idx,
                                                'title',
                                                e.target.value,
                                            )
                                        }
                                    />

                                    <Input
                                        className="min-w-0 flex-1"
                                        value={it.href}
                                        onChange={(e) =>
                                            updateAt(
                                                idx,
                                                'href',
                                                e.target.value,
                                            )
                                        }
                                    />

                                    <select
                                        className="w-40 flex-shrink-0 rounded-md border p-2"
                                        value={it.icon}
                                        onChange={(e) =>
                                            updateAt(
                                                idx,
                                                'icon',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {iconOptions.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="flex-shrink-0">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:bg-muted/30"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>
                                                    Remove this footer link?
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Removing this quick link
                                                    will delete it from your
                                                    sidebar. This action cannot
                                                    be undone.
                                                </DialogDescription>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>

                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() =>
                                                                removeAt(idx)
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button onClick={save} variant="default">
                                    Save
                                </Button>

                                <Transition
                                    show={recentlySaved}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">
                                        Saved
                                    </p>
                                </Transition>
                            </div>
                            <div>
                                <Button onClick={addItem}>Add link</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
