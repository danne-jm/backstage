import { Head } from '@inertiajs/react';
import AppearanceTabs from '@backstage/components/appearance-tabs';
import Heading from '@backstage/components/heading';
import AppLayout from '@backstage/layouts/app-layout';
import SettingsLayout from '@backstage/layouts/settings/layout';
import { edit as editAppearance } from '@backstage/routes/appearance';
import type { BreadcrumbItem } from '@backstage/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: editAppearance(),
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
