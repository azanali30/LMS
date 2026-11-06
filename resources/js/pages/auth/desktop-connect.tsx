import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Laptop,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    Building2,
    UserCheck,
    RefreshCw,
    X,
} from 'lucide-react';
import OnboardingLayout from '@/layouts/onboarding-layout';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    organization: {
        id: number;
        name: string;
        slug: string;
        role?: string;
    } | null;
    codeChallenge: string;
    state: string;
    webUrl: string;
}

export default function DesktopConnect({
    user,
    organization,
    codeChallenge,
    state,
    webUrl,
}: Props) {
    const { post, processing } = useForm({
        code_challenge: codeChallenge,
        state: state,
    });

    const handleAuthorize = (e: React.FormEvent) => {
        e.preventDefault();
        post('/desktop/authorize');
    };

    return (
        <OnboardingLayout title="Authorize Desktop Application — InstitutoPropio">
            <div className="bg-[#F8FAFC] py-12 sm:py-16 md:py-20 border-b border-slate-100 min-h-[75vh] flex items-center justify-center">
                <div className="w-full max-w-lg px-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 text-left shadow-xl shadow-slate-900/5">
                        {/* Eyebrow badge */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-[#078675]">
                            <Laptop className="size-3.5 text-[#078675]" />
                            <span>Windows Desktop Client</span>
                        </div>

                        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                            Authorize Desktop Access
                        </h1>
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm leading-relaxed">
                            <span className="font-semibold text-slate-800">InstitutoPropio for Windows</span> is requesting access to connect directly to your campus workspace.
                        </p>

                        {/* User & Organization Card */}
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4.5 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-500">Authenticated Account</span>
                                <span className="font-bold text-slate-900">{user.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-500">Work Email</span>
                                <span className="font-mono text-slate-800">{user.email}</span>
                            </div>
                            {organization && (
                                <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2.5">
                                    <span className="font-medium text-slate-500">Campus Workspace</span>
                                    <div className="flex items-center gap-1.5 font-bold text-[#078675]">
                                        <Building2 className="size-3.5" />
                                        <span>{organization.name}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2.5">
                                <span className="font-medium text-slate-500">Access Permissions</span>
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 capitalize">
                                    <ShieldCheck className="size-3.5 text-emerald-600" />
                                    <span>{organization?.role || user.role} Privileges</span>
                                </span>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 leading-relaxed">
                            <ShieldCheck className="size-4 shrink-0 text-[#078675] mt-0.5" />
                            <p>
                                A single-use, cryptographically verified session token will be granted to your desktop application. No passwords or credentials are ever stored locally.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <form onSubmit={handleAuthorize} className="mt-6 space-y-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E49A2E] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#E49A2E]/20 transition hover:bg-[#d08a24] disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="size-4 animate-spin" />
                                        <span>Authorizing Desktop App...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Authorize Desktop App</span>
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </button>

                            <Link
                                href="/dashboard"
                                className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Cancel & Return to Web
                            </Link>
                        </form>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
