import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Lock } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="off"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="role">Role</Label>

                                    <div
                                        id="role"
                                        className="pointer-events-none mt-1 flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs select-none md:text-sm"
                                        aria-hidden
                                        tabIndex={-1}
                                    >
                                        <span className="truncate">
                                            {String(auth.user.role ?? '')}
                                        </span>

                                        <Lock
                                            className="ml-2 text-muted-foreground"
                                            size={16}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="permissions">
                                        Permissions
                                    </Label>

                                    <div
                                        id="permissions"
                                        className="pointer-events-none mt-1 flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs select-none md:text-sm"
                                        aria-hidden
                                        tabIndex={-1}
                                    >
                                        <span className="truncate">
                                            {Array.isArray(
                                                auth.user.permissions,
                                            )
                                                ? auth.user.permissions.join(
                                                      ', ',
                                                  )
                                                : typeof auth.user
                                                        .permissions ===
                                                    'string'
                                                  ? auth.user.permissions
                                                  : ''}
                                        </span>

                                        <Lock
                                            className="ml-2 text-muted-foreground"
                                            size={16}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <div
                                        id="email"
                                        className="pointer-events-none mt-1 flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs select-none md:text-sm"
                                        aria-hidden
                                        tabIndex={-1}
                                    >
                                        <span className="truncate">
                                            {auth.user.email ?? ''}
                                        </span>

                                        <Lock
                                            className="ml-2 text-muted-foreground"
                                            size={16}
                                        />
                                    </div>

                                    {/* Hidden field so the form still submits the user's email value */}
                                    <input
                                        type="hidden"
                                        name="email"
                                        value={auth.user.email ?? ''}
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
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
                            </>
                        )}
                    </Form>
                </div>

                {/* <DeleteUser /> */}

                {/* <DeleteUser /> */}
            </SettingsLayout>
        </AppLayout>
    );
}
