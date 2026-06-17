import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/Components/Backstage/appearance-tabs';
import HeadingSmall from '@/Components/Backstage/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/Backstage/app-layout';
import SettingsLayout from '@/layouts/Backstage/settings/layout';
import { route } from 'ziggy-js';

export default function Appearance() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Appearance settings',
            href: route('appearance.edit'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
