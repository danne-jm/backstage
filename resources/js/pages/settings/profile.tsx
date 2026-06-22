import { Form, Head, usePage } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile() {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Update your name. Other fields are managed by administrators."
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name</Label>

                                <Input
                                    id="first_name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.first_name}
                                    name="first_name"
                                    required
                                    autoComplete="given-name"
                                    placeholder="First name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.first_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last Name</Label>

                                <Input
                                    id="last_name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.last_name}
                                    name="last_name"
                                    required
                                    autoComplete="family-name"
                                    placeholder="Last name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.last_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>

                                <div className="relative">
                                    <Input
                                        id="role"
                                        className="mt-1 block w-full pr-10 bg-muted/30 text-muted-foreground border-muted-foreground/20"
                                        defaultValue={String(auth.user.role || 'Member')}
                                        disabled
                                    />
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="permission">Permissions</Label>

                                <div className="relative">
                                    <Input
                                        id="permission"
                                        className="mt-1 block w-full pr-10 bg-muted/30 text-muted-foreground border-muted-foreground/20"
                                        defaultValue={String(auth.user.permission || 'none')}
                                        disabled
                                    />
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full pr-10 bg-muted/30 text-muted-foreground border-muted-foreground/20"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        disabled
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                                </div>

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
