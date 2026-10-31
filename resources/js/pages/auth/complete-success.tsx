import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { CheckCircle2, Building2, LogIn, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
    email: string;
    organizationName: string;
    subdomain: string;
}

export default function CompleteSuccess({
    email,
    organizationName,
    subdomain,
}: Props) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#070b14] px-4 font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
            <Head title="Workspace Activated — InstitutoPropio" />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-600/15 blur-[140px]"
            />

            <div className="mx-auto w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#0B1220] p-8 text-center shadow-2xl">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="size-8" />
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="size-3.5" />
                    <span>30-Day Free Trial Active</span>
                </div>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
                    Workspace Ready!
                </h1>

                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Your institution <strong className="text-white">{organizationName}</strong> has been provisioned with tenant isolation. You may now log in to access your administrative dashboard.
                </p>

                <div className="my-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left text-xs">
                    <div className="flex justify-between py-1">
                        <span className="text-slate-500">Registered Email:</span>
                        <span className="font-semibold text-white">{email}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-slate-500">Portal Subdomain:</span>
                        <span className="font-mono font-semibold text-purple-300">{subdomain}.institutopropio.com</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-slate-500">Role:</span>
                        <span className="font-semibold text-emerald-400">Founder & Director (Owner)</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
                    >
                        <LogIn className="size-4" />
                        <span>Log In to Your Account</span>
                        <ArrowRight className="size-4" />
                    </Link>

                    <Link
                        href="/"
                        className="block w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                    >
                        Return to Homepage
                    </Link>
                </div>
            </div>
        </div>
    );
}
