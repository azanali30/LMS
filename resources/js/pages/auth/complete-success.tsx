import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { CheckCircle2, Building2, LogIn, Sparkles, ArrowRight } from 'lucide-react';
import OnboardingLayout from '@/layouts/onboarding-layout';

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
        <OnboardingLayout title="Workspace Activated — InstitutoPropio">
            <div className="bg-[#F8FAFC] py-16 sm:py-20 md:py-24 border-b border-slate-100 min-h-[75vh] flex items-center justify-center">
                <div className="mx-auto w-full max-w-md px-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle2 className="size-8" />
                        </div>

                        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
                            <Sparkles className="size-3.5 text-emerald-600" />
                            <span>30-Day Free Trial Active</span>
                        </div>

                        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#173A5E]">
                            Workspace Ready!
                        </h1>

                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Your institution <strong className="text-slate-900">{organizationName}</strong> has been provisioned with tenant isolation. You may now log in to access your administrative dashboard.
                        </p>

                        <div className="my-6 space-y-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-left text-xs">
                            <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                <span className="text-slate-500">Registered Email:</span>
                                <span className="font-semibold text-slate-900">{email}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                <span className="text-slate-500">Portal Subdomain:</span>
                                <span className="font-mono font-bold text-[#078675]">{subdomain}.institutopropio.com</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-slate-500">Role:</span>
                                <span className="font-bold text-emerald-700">Founder & Director (Owner)</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E49A2E] py-3 text-xs font-bold text-white shadow-md shadow-[#E49A2E]/20 transition hover:bg-[#d08a24]"
                            >
                                <LogIn className="size-4" />
                                <span>Log In to Your Account</span>
                                <ArrowRight className="size-4" />
                            </Link>

                            <Link
                                href="/"
                                className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Return to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
