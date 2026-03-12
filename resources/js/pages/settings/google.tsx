import { Head, router, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import { connect, disconnect } from '@/routes/google';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Google',
        href: '/settings/google',
    },
];

export default function Google() {
    const { auth, flash } = usePage().props as any;
    const connectedEmail = auth.user.gmail_provider_email as string | null;

    function handleConnect() {
        window.location.href = connect.url();
    }

    function handleDisconnect() {
        router.delete(disconnect.url());
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Google" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Google / Gmail"
                        description="Connect your Google account to send emails from this app as you."
                    />

                    {flash?.success && (
                        <p className="text-sm text-green-500">{flash.success}</p>
                    )}
                    {flash?.error && (
                        <p className="text-sm text-destructive">{flash.error}</p>
                    )}

                    {connectedEmail ? (
                        <div className="space-y-4">
                            <p className="text-sm text-green-500">
                                Connected as {connectedEmail}
                            </p>
                            <Button variant="destructive" onClick={handleDisconnect}>
                                Disconnect Google
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Not connected.
                            </p>
                            <div className="space-y-1">
                                <Button variant="outline" onClick={handleConnect}>
                                    Connect with Google
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                You will be asked to grant the app permission to send email on your behalf (offline access).
                            </p>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
