import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Google',
        href: '/settings/google',
    },
];

export default function Google() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Google" />

            <SettingsLayout>
                <Heading
                    variant="small"
                    title="Google"
                    description="Manage Google integration settings"
                />
            </SettingsLayout>
        </AppLayout>
    );
}
