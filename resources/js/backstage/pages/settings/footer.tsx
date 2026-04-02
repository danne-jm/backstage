import { useForm, Head, usePage } from '@inertiajs/react';
import { icons } from 'lucide-react';
import Heading from '@backstage/components/heading';
import { Button } from '@backstage/components/ui/button';
import { Input } from '@backstage/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';
import AppLayout from '@backstage/layouts/app-layout';
import SettingsLayout from '@backstage/layouts/settings/layout';
import type { BreadcrumbItem, FooterLink } from '@backstage/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Footer',
        href: '/settings/footer',
    },
];

const ICON_OPTIONS = [
    'Mail',
    'Container',
    'Globe',
    'ShoppingBag',
    'TreeDeciduous',
    'Bell',
    'BookOpen',
    'Calendar',
    'Camera',
    'Clipboard',
    'Code',
    'Coffee',
    'Database',
    'ExternalLink',
    'FileText',
    'FolderGit2',
    'Heart',
    'Home',
    'Image',
    'Info',
    'Link',
    'Map',
    'MessageCircle',
    'Music',
    'Phone',
    'Play',
    'Search',
    'Settings',
    'Share',
    'Star',
    'Tag',
    'Truck',
    'User',
    'Video',
    'Wifi',
    'Youtube',
] as const;

function IconPreview({ name }: { name: string }) {
    const LucideIcon = icons[name as keyof typeof icons];
    if (!LucideIcon) return null;
    return <LucideIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export default function Footer() {
    const { auth } = usePage().props;

    const form = useForm({
        footer_links: auth.user.footer_links ?? [],
    });

    function updateLink(index: number, field: keyof FooterLink, value: string) {
        form.setData(
            'footer_links',
            form.data.footer_links.map((link, i) =>
                i === index ? { ...link, [field]: value } : link,
            ),
        );
    }

    function addLink() {
        form.setData('footer_links', [
            ...form.data.footer_links,
            { label: '', url: '', icon: 'Link' },
        ]);
    }

    function removeLink(index: number) {
        form.setData(
            'footer_links',
            form.data.footer_links.filter((_, i) => i !== index),
        );
    }

    function save() {
        form.patch('/settings/footer');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Footer" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Footer quick links"
                        description="Customize the small footer links shown in the app sidebar"
                    />

                    <div className="space-y-3">
                        {form.data.footer_links.map((link, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                {/* Icon preview */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                                    <IconPreview name={link.icon} />
                                </div>

                                {/* Label */}
                                <Input
                                    className="w-32 shrink-0"
                                    placeholder="Label"
                                    value={link.label}
                                    onChange={(e) =>
                                        updateLink(
                                            index,
                                            'label',
                                            e.target.value,
                                        )
                                    }
                                />

                                {/* URL */}
                                <Input
                                    className="w-80 shrink-0"
                                    placeholder="https://..."
                                    value={link.url}
                                    onChange={(e) =>
                                        updateLink(index, 'url', e.target.value)
                                    }
                                />

                                {/* Icon selector */}
                                <Select
                                    value={link.icon}
                                    onValueChange={(val) =>
                                        updateLink(index, 'icon', val)
                                    }
                                >
                                    <SelectTrigger className="w-44 shrink-0">
                                        <SelectValue placeholder="Icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ICON_OPTIONS.map((iconName) => (
                                            <SelectItem
                                                key={iconName}
                                                value={iconName}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <IconPreview
                                                        name={iconName}
                                                    />
                                                    {iconName}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Delete */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLink(index)}
                                    aria-label="Remove link"
                                >
                                    <icons.Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            onClick={save}
                            disabled={form.processing}
                        >
                            Save
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addLink}
                        >
                            Add link
                        </Button>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
