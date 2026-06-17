import { Form, Head, usePage, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { edit as editFooter } from '@/routes/footer';
import * as LucideIcons from 'lucide-react';
import { Trash2 } from 'lucide-react';
import type { Auth } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PageProps = {
    auth: Auth;
};

const COMMON_ICONS = [
    'Mail', 'Package', 'Globe', 'ShoppingBag', 'TreePine', 'Link', 'Github', 
    'Twitter', 'Facebook', 'Instagram', 'Youtube', 'Linkedin', 'Calendar', 
    'Camera', 'Video', 'Music', 'File', 'Folder', 'Image', 'MessageCircle'
];

export default function Footer() {
    const { auth } = usePage<PageProps>().props;

    const { data, setData, patch, processing } = useForm<{ pinned: any[] }>({
        pinned: Array.isArray(auth.user.pinned) 
            ? auth.user.pinned 
            : (typeof auth.user.pinned === 'string' ? JSON.parse(auth.user.pinned) : []),
    });

    const addLink = () => {
        setData('pinned', [...data.pinned, { title: 'New Link', url: 'https://', icon: 'Link' }]);
    };

    const removeLink = (index: number) => {
        const newPinned = [...data.pinned];
        newPinned.splice(index, 1);
        setData('pinned', newPinned);
    };

    const updateLink = (index: number, field: string, value: string) => {
        const newPinned = [...data.pinned];
        newPinned[index][field] = value;
        setData('pinned', newPinned);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(editFooter().url, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Footer quick links" />

            <h1 className="sr-only">Footer settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Footer quick links"
                    description="Customize the small footer links shown in the app sidebar"
                />

                <form onSubmit={submit} className="space-y-4">
                    {data.pinned.map((pin: any, index: number) => {
                        const Icon = (LucideIcons[pin.icon as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.Link;
                        return (
                            <div key={index} className="flex flex-col sm:flex-row items-center gap-2">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <Input
                                    value={pin.title}
                                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                                    placeholder="Link name"
                                    className="flex-[1.5] w-full sm:w-auto min-w-[150px]"
                                />
                                <Input
                                    value={pin.url}
                                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                                    placeholder="https://..."
                                    className="flex-[2] w-full sm:w-auto min-w-[200px]"
                                />
                                <Select
                                    value={pin.icon}
                                    onValueChange={(val) => updateLink(index, 'icon', val)}
                                >
                                    <SelectTrigger className="w-full sm:w-[160px] shrink-0">
                                        <SelectValue placeholder="Select icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMMON_ICONS.map((iconName) => {
                                            const ItemIcon = (LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.Link;
                                            return (
                                                <SelectItem key={iconName} value={iconName}>
                                                    <div className="flex items-center gap-2">
                                                        <ItemIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span>{iconName}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="ghost" size="icon" className="shrink-0 w-full sm:w-10" onClick={() => removeLink(index)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove link</span>
                                </Button>
                            </div>
                        );
                    })}

                    <div className="flex items-center gap-4 pt-4">
                        <Button disabled={processing} type="submit">Save</Button>
                        <Button type="button" variant="outline" onClick={addLink}>
                            Add link
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Footer.layout = {
    breadcrumbs: [
        {
            title: 'Footer settings',
            href: editFooter().url,
        },
    ],
};
