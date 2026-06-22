import { Head, usePage, useForm } from '@inertiajs/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { edit as editGoogle } from '@/routes/google';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function GoogleSettings() {
    const { auth } = usePage<PageProps>().props;
    const { delete: destroy, processing } = useForm();

    const isConnected = !!auth.user.gmail_provider_id;
    const providerEmail = auth.user.gmail_provider_email;

    const disconnectGoogle = () => {
        destroy('/auth/google/disconnect', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Google integration" />

            <h1 className="sr-only">Google settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Google Integration"
                    description="Connect your Google Workspace account to enable automatic email distribution and sheet syncing."
                />

                <div className="rounded-lg border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-medium">Google Account Status</h3>
                        {isConnected ? (
                            <div className="mt-1 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                <span>Connected as <strong className="font-semibold">{providerEmail}</strong></span>
                            </div>
                        ) : (
                            <div className="mt-1 flex items-center text-sm text-amber-600 dark:text-amber-400">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                <span>Not connected</span>
                            </div>
                        )}
                    </div>

                    <div>
                        {isConnected ? (
                            <Button 
                                variant="destructive" 
                                onClick={disconnectGoogle} 
                                disabled={processing}
                            >
                                Disconnect
                            </Button>
                        ) : (
                            <Button asChild>
                                <a href="/auth/google/redirect?intent=connect">
                                    Connect Google Account
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

GoogleSettings.layout = {
    breadcrumbs: [
        {
            title: 'Google settings',
            href: editGoogle().url,
        },
    ],
};
