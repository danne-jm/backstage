import TextLink from '@/Components/Backstage/text-link';
import { Button } from '@/Components/Shared/ui/button';
import { Spinner } from '@/Components/Shared/ui/spinner';
import AuthLayout from '@/layouts/Shared/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <Form
                action={route('verification.send')}
                method="post"
                className="space-y-6 text-center"
            >
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>

                        <TextLink
                            href={route('logout')}
                            method="post"
                            className="mx-auto block text-sm"
                        >
                            Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
