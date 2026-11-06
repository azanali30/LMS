import { Form, Head, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import PasskeyVerify from '@/components/passkey-verify';

import { Building2 } from 'lucide-react';
import { useState } from 'react';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const { props } = usePage();
    const tenant = (props as { tenant?: { name?: string; primary_color?: string | null } | null }).tenant;

    const [schoolSlug, setSchoolSlug] = useState('');
    const [subdomainError, setSubdomainError] = useState('');

    const handleGoToSchool = (e: React.FormEvent) => {
        e.preventDefault();
        const slug = schoolSlug.trim().toLowerCase();
        if (!slug) {
            setSubdomainError('Please enter your school subdomain slug (e.g. greenvalley).');
            return;
        }

        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const protocol = window.location.protocol;
            // If running on a domain with dots (e.g. institutopropio.com or lms.test)
            if (host.includes('.')) {
                window.location.href = `${protocol}//${slug}.${host}/login`;
            } else {
                // Local development fallback
                window.location.href = `${protocol}//${slug}.${host}/login`;
            }
        }
    };

    return (
        <>
            <Head title={tenant?.name ? `${tenant.name} - Log in` : 'Log in'} />

            {tenant?.name && (
                <div className="mb-4 flex items-center justify-center gap-1.5 rounded-lg border border-[#078675]/20 bg-[#078675]/10 px-3 py-1.5 text-xs font-semibold text-[#078675] dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                    <span>School Portal: <strong>{tenant.name}</strong></span>
                </div>
            )}

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className="h-10 focus-visible:ring-[#078675] focus-visible:border-[#078675]"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-semibold text-[#078675] hover:text-[#056b5e] dark:text-blue-400"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="h-10 focus-visible:ring-[#078675] focus-visible:border-[#078675]"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2.5 pt-0.5">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="data-[state=checked]:border-[#078675] data-[state=checked]:bg-[#173A5E]"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-xs font-normal text-muted-foreground select-none"
                                >
                                    Remember my session on this device
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-10 w-full cursor-pointer bg-[#173A5E] font-semibold text-white shadow-md shadow-[#078675]/20 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                                style={tenant?.primary_color ? { backgroundColor: tenant.primary_color } : undefined}
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner className="size-4" />}
                                {processing
                                    ? 'Signing in...'
                                    : (tenant?.name ? `Sign in to ${tenant.name}` : 'Sign in to account')}
                            </Button>
                        </div>

                        <div className="text-center text-xs text-muted-foreground">
                            Don't have an account yet?{' '}
                            <TextLink
                                href={register()}
                                tabIndex={5}
                                className="font-bold text-[#E49A2E] hover:text-[#d08a24]"
                            >
                                Get Started Free
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {!tenant && (
                <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                        <Building2 className="size-3.5 text-[#078675]" />
                        <span>Accessing Your School or Academy?</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                        If your school has its own custom portal, enter your school slug below:
                    </p>
                    <form onSubmit={handleGoToSchool} className="flex gap-2">
                        <input
                            type="text"
                            value={schoolSlug}
                            onChange={(e) => {
                                setSchoolSlug(e.target.value);
                                setSubdomainError('');
                            }}
                            placeholder="e.g. greenvalley"
                            className="h-8.5 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#078675] focus:ring-1 focus:ring-[#078675] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                            type="submit"
                            className="h-8.5 rounded-lg bg-[#173A5E] px-3 text-xs font-semibold text-white hover:bg-[#056b5e] transition-colors"
                        >
                            Go &rarr;
                        </button>
                    </form>
                    {subdomainError && (
                        <p className="mt-1.5 text-[11px] font-medium text-rose-500">{subdomainError}</p>
                    )}
                </div>
            )}

            {status && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-center text-xs font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Enter your credentials to access your learning dashboard',
};
