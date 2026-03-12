import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Footer',
        href: '/settings/footer',
    },
];

export default function Footer() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Footer" />

            <SettingsLayout>
                <Heading
                    variant="small"
                    title="Footer"
                    description="Manage footer content and links"
                />
            </SettingsLayout>
        </AppLayout>
    );
}
