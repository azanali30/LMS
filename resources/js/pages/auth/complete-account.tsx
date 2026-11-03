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
import OnboardingLayout from '@/layouts/onboarding-layout';

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
    reservedSubdomains?: string[];
    organizationTypes?: OrgType[];
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
        <OnboardingLayout title="Complete Account & Setup Institution — InstitutoPropio">
            <div className="bg-[#F8FAFC] py-12 sm:py-16 md:py-20 border-b border-slate-100 min-h-[75vh]">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-2xl text-center mb-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>Payment Approved — Final Step</span>
                        </div>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-4xl">
                            Complete Account & Institution Details
                        </h1>
                        <p className="mt-2 text-xs text-slate-600 sm:text-sm leading-relaxed">
                            Set your administrator credentials and claim your official school workspace.
                        </p>
                    </div>

                    {/* Approved Plan Summary Bar */}
                    <div className="mx-auto max-w-2xl mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-5 shadow-xs">
                        <div>
                            <span className="text-[10px] font-bold tracking-wider text-[#1769E0] uppercase">
                                Approved Subscription Tier
                            </span>
                            <div className="text-base font-bold text-[#0B1528]">{plan_name}</div>
                            <span className="text-xs text-slate-600">
                                30-Day Free Trial starts immediately upon account activation.
                            </span>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-right shadow-xs">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Work Email</div>
                            <div className="font-mono text-xs font-bold text-[#1769E0]">{email}</div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Owner Full Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700">
                                    Owner / Administrator Full Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative mt-1.5">
                                    <User className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. Dr. Sarah Jenkins"
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                    />
                                </div>
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-rose-600">{form.errors.name}</p>
                                )}
                            </div>

                            {/* School Name & Org Type */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">
                                        Institution Legal Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.school_name}
                                        onChange={handleSchoolNameChange}
                                        placeholder="e.g. Oakridge Academy of Science"
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                    />
                                    {form.errors.school_name && (
                                        <p className="mt-1 text-xs text-rose-600">{form.errors.school_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700">
                                        Institution Type <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={form.data.organization_type}
                                        onChange={(e) => form.setData('organization_type', e.target.value)}
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                    >
                                        {organizationTypes.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.organization_type && (
                                        <p className="mt-1 text-xs text-rose-600">{form.errors.organization_type}</p>
                                    )}
                                </div>
                            </div>

                            {/* Desired Subdomain */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Desired Institution Subdomain <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        Used for your custom school web portal
                                    </span>
                                </div>

                                <div className="relative mt-1.5 flex items-center">
                                    <span className="absolute left-3.5 text-slate-400 text-xs font-medium">
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
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-18 pr-44 text-sm font-mono text-[#1769E0] placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                    />
                                    <span className="absolute right-3.5 text-xs text-slate-500 font-semibold">
                                        .institutopropio.com
                                    </span>
                                </div>
                                {form.errors.subdomain && (
                                    <p className="mt-1 text-xs text-rose-600">{form.errors.subdomain}</p>
                                )}
                            </div>

                            {/* Password & Confirm Password */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative mt-1.5">
                                        <Lock className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            value={form.data.password}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                        />
                                    </div>
                                    {form.errors.password && (
                                        <p className="mt-1 text-xs text-rose-600">{form.errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700">
                                        Confirm Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative mt-1.5">
                                        <Lock className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            value={form.data.password_confirmation}
                                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                            placeholder="Repeat password"
                                            className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FF7A30] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E] disabled:opacity-50"
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
                </div>
            </div>
        </OnboardingLayout>
    );
}
