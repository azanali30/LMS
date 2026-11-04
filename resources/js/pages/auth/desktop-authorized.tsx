import { Head, Link } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import {
    Laptop,
    CheckCircle2,
    ExternalLink,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react';
import OnboardingLayout from '@/layouts/onboarding-layout';

interface Props {
    callbackUrl: string;
    code: string;
    state: string;
    userEmail: string;
}

export default function DesktopAuthorized({
    callbackUrl,
    code,
    state,
    userEmail,
}: Props) {
    const [launched, setLaunched] = useState(false);

    useEffect(() => {
        // Attempt automatic deep link protocol launch
        const timer = setTimeout(() => {
            window.location.href = callbackUrl;
            setLaunched(true);
        }, 800);

        return () => clearTimeout(timer);
    }, [callbackUrl]);

    return (
        <OnboardingLayout title="Desktop Application Connected — InstitutoPropio">
            <div className="bg-[#F8FAFC] py-12 sm:py-16 md:py-20 border-b border-slate-100 min-h-[75vh] flex items-center justify-center">
                <div className="w-full max-w-lg px-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 text-center shadow-xl shadow-slate-900/5">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                            <CheckCircle2 className="size-8" />
                        </div>

                        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-3xl">
                            Desktop App Authorized!
                        </h1>
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm leading-relaxed">
                            Your account <span className="font-semibold text-slate-800">{userEmail}</span> has been linked. You can return to your InstitutoPropio Windows application.
                        </p>

                        <div className="mt-6 space-y-3">
                            <a
                                href={callbackUrl}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#1256B8]"
                            >
                                <ExternalLink className="size-4" />
                                <span>Open InstitutoPropio App</span>
                            </a>

                            <Link
                                href="/dashboard"
                                className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Continue on Web Browser &rarr;
                            </Link>
                        </div>

                        <p className="mt-5 text-[11px] text-slate-400">
                            If your browser prompt asked for permission to open "InstitutoPropio", click "Always allow" and "Open".
                        </p>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
