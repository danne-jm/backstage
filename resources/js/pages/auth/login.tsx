import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { route } from 'ziggy-js';

import { Head } from '@inertiajs/react';

// Use a standard HTML form or Inertia's useForm hook, but here we keep the imported Form if it is indeed from inertia (Inertia 2.0 might have it).
// Actually, let's keep Form import but remove wayfinder imports.
import { Form } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                action={route('login')}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={route('password.request')}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                            <div className="mt-2">
                                <div
                                    className="social"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }}
                                >
                                    <a
                                        href={route('gmail.connect')}
                                        className="gg"
                                        tabIndex={6}
                                        style={{
                                            width: '220px',
                                            padding: '8px 12px',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            boxShadow:
                                                '0 1px 2px rgba(0,0,0,0.06)',
                                        }}
                                    >
                                        <i
                                            className="bi bi-google"
                                            aria-hidden="true"
                                            style={{ fontSize: '18px' }}
                                        />
                                        {/* <span style={{ fontSize: '14px', fontWeight: 600 }}>Sign in with Google</span> */}
                                    </a>
                                </div>
                                <style>{`.social .gg:hover { background-color: rgba(255,255,255,0.75); }`}</style>
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
