import { Head, useForm, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Building2,
    ShieldCheck,
    Lock,
    User,
    Globe,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles,
} from 'lucide-react';

interface OrgType {
    value: string;
    label: string;
}

interface Props {
    token: string;
    email: string;
    plan_slug: string;
    plan_name: string;
    billing_interval: string;
    reservedSubdomains: string[];
    organizationTypes: OrgType[];
}

export default function CompleteAccount({
    token,
    email,
    plan_slug,
    plan_name,
    billing_interval,
    reservedSubdomains = [],
    organizationTypes = [],
}: Props) {
    const form = useForm({
        name: '',
        school_name: '',
        organization_type: 'school',
        subdomain: '',
        password: '',
        password_confirmation: '',
    });

    const [subdomainAuto, setSubdomainAuto] = useState<boolean>(true);

    const handleSchoolNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        form.setData((prev) => {
            const next = { ...prev, school_name: val };
            if (subdomainAuto) {
                const autoSlug = val
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .substring(0, 30);
                next.subdomain = autoSlug;
            }
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/onboarding/complete/${token}`);
    };

    return (
        <div className="relative min-h-screen bg-[#070b14] font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
            <Head title="Complete Account & Setup Institution — InstitutoPropio" />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]"
            />

            <header className="border-b border-slate-800/80 bg-[#0B1220]/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
                            <Building2 className="size-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            InstitutoPropio
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                            Verified Registration Token
                        </span>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="size-3.5" />
                        <span>Payment Approved — Final Step</span>
                    </div>
                    <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        Complete Account & Institution Details
                    </h1>
                    <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                        Set your administrator credentials and claim your official school workspace.
                    </p>
                </div>

                {/* Approved Plan Summary Card */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-4 sm:px-6">
                    <div>
                        <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                            Approved Subscription Tier
                        </span>
                        <div className="text-base font-bold text-white">{plan_name}</div>
                        <span className="text-[11px] text-slate-400">
                            30-Day Free Trial starts immediately upon account activation.
                        </span>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-right">
                        <div className="text-[10px] text-slate-500 uppercase">Registered Work Email</div>
                        <div className="font-mono text-xs font-semibold text-purple-300">{email}</div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Owner Full Name */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300">
                                Owner / Administrator Full Name <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative mt-1.5">
                                <User className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Dr. Sarah Jenkins"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            {form.errors.name && (
                                <p className="mt-1 text-xs text-rose-400">{form.errors.name}</p>
                            )}
                        </div>

                        {/* School Name & Org Type */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300">
                                    Institution Legal Name <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.school_name}
                                    onChange={handleSchoolNameChange}
                                    placeholder="e.g. Oakridge Academy of Science"
                                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                                />
                                {form.errors.school_name && (
                                    <p className="mt-1 text-xs text-rose-400">{form.errors.school_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300">
                                    Institution Type <span className="text-rose-400">*</span>
                                </label>
                                <select
                                    value={form.data.organization_type}
                                    onChange={(e) => form.setData('organization_type', e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3 text-xs text-white transition focus:border-purple-500 focus:outline-none"
                                >
                                    {organizationTypes.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.organization_type && (
                                    <p className="mt-1 text-xs text-rose-400">{form.errors.organization_type}</p>
                                )}
                            </div>
                        </div>

                        {/* Desired Subdomain */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-slate-300">
                                    Desired Institution Subdomain <span className="text-rose-400">*</span>
                                </label>
                                <span className="text-[10px] text-slate-500">
                                    Used for your custom school web portal
                                </span>
                            </div>

                            <div className="relative mt-1.5 flex items-center">
                                <span className="absolute left-3.5 text-slate-500 text-xs">
                                    https://
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={form.data.subdomain}
                                    onChange={(e) => {
                                        setSubdomainAuto(false);
                                        form.setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                    }}
                                    placeholder="oakridge-academy"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-18 pr-44 text-xs font-mono text-purple-300 placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                                />
                                <span className="absolute right-3.5 text-xs text-slate-500">
                                    .institutopropio.com
                                </span>
                            </div>
                            {form.errors.subdomain && (
                                <p className="mt-1 text-xs text-rose-400">{form.errors.subdomain}</p>
                            )}
                        </div>

                        {/* Password & Confirm Password */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300">
                                    Password <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative mt-1.5">
                                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        placeholder="Min. 8 characters"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                                {form.errors.password && (
                                    <p className="mt-1 text-xs text-rose-400">{form.errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300">
                                    Confirm Password <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative mt-1.5">
                                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        value={form.data.password_confirmation}
                                        onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                        placeholder="Repeat password"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                        >
                            {form.processing ? (
                                <>
                                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    <span>Creating Institution Workspace...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Workspace & Activate Trial</span>
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
