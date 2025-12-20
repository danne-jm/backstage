import { Head, Link, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';

export default function GoogleSettings() {
    const { auth } = usePage<SharedData>().props;
    // Use the computed gmail_connected flag from the backend
    const connected = Boolean(auth?.user?.gmail_connected);
    const providerEmail: string | undefined = (auth?.user?.gmail_provider_email as unknown as string) ?? (auth?.user?.email as unknown as string);

    const form = useForm();

    return (
        <AppLayout breadcrumbs={[{ title: 'Google', href: '/settings/google' }]}> 
            <Head title="Google" />

            <SettingsLayout>
                <div className="space-y-6">
                    <h3 className="text-lg font-medium">Google / Gmail</h3>
                    <p className="text-sm text-muted-foreground">Connect your Google account to send emails from this app as you.</p>

                    <div className="mt-4">
                        {connected ? (
                            <div className="space-y-2">
                                <div className="text-sm text-green-700">Connected as {providerEmail}</div>
                                <div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive">
                                                Disconnect Google
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>Disconnect Google account?</DialogTitle>
                                            <DialogDescription>
                                                Disconnecting your Google account will remove stored tokens and prevent this app from sending emails on your behalf. This action cannot be undone.
                                            </DialogDescription>
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">Cancel</Button>
                                                </DialogClose>

                                                <DialogClose asChild>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => form.post('/settings/google/disconnect')}
                                                    >
                                                        Disconnect
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-sm">Not connected.</div>
                                <a href="/auth/google/redirect">
                                    <Button>Connect with Google</Button>
                                </a>
                                <div className="text-xs text-muted-foreground">You will be asked to grant the app permission to send email on your behalf (offline access).</div>
                            </div>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
