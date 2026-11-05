import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Building2,
    ArrowLeft,
    ExternalLink,
    CreditCard,
    Users,
    BookOpen,
    ShieldCheck,
    Layers,
    FileText,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
} from 'lucide-react';

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
    title: string | null;
    status: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    amount_cents: number;
    amount_formatted: string;
    status: string;
    due_date: string | null;
    paid_at: string | null;
}

interface PlanOption {
    id: number;
    name: string;
    slug: string;
    price_cents: number;
}

interface AuditLog {
    id: number;
    action: string;
    user_name: string;
    details: any;
    ip_address: string | null;
    created_at: string;
}

interface Props {
    organization: {
        id: number;
        name: string;
        slug: string;
        organization_type: string;
        status: string;
        email: string;
        phone: string;
        address: string;
        timezone: string;
        currency: string;
        creator: { id: number; name: string; email: string } | null;
        subscription: {
            id: number;
            status: string;
            plan_id: number;
            plan_name: string;
            billing_interval: string;
            starts_at: string | null;
            trial_ends_at: string | null;
            ends_at: string | null;
        } | null;
        metrics: {
            members_count: number;
            courses_count: number;
            classes_count: number;
            sections_count: number;
        };
        created_at: string;
        subdomain_url: string;
    };
    members: Member[];
    invoices: Invoice[];
    availablePlans: PlanOption[];
    auditLogs: AuditLog[];
}

export default function PlatformOrganizationShow({
    organization: org,
    members = [],
    invoices = [],
    availablePlans = [],
    auditLogs = [],
}: Props) {
    const { data, setData, post, processing } = useForm({
        plan_id: org.subscription?.plan_id || (availablePlans[0]?.id ?? 1),
        billing_interval: org.subscription?.billing_interval || 'monthly',
        status: org.subscription?.status || 'active',
    });

    const [planMessage, setPlanMessage] = useState<string | null>(null);

    const handlePlanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/platform-admin/organizations/${org.id}/change-plan`, {
            onSuccess: () => setPlanMessage('Subscription plan successfully updated.'),
        });
    };

    return (
        <PlatformAdminLayout title={`Organization: ${org.name}`}>
            {/* Back link */}
            <div className="mb-4">
                <Link
                    href="/platform-admin/organizations"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to Organizations</span>
                </Link>
            </div>

            {/* Institution Header Card */}
            <div className="mb-6 rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="size-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1769E0] shrink-0">
                            <Building2 className="size-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                    {org.name}
                                </h2>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        org.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                >
                                    {org.status}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                                <span className="font-mono text-slate-700">Subdomain: {org.slug}</span>
                                <span>•</span>
                                <span className="capitalize">{org.organization_type}</span>
                                <span>•</span>
                                <span>Created {org.created_at}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={org.subdomain_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                        >
                            <span>Open Campus Portal</span>
                            <ExternalLink className="size-3.5" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Members</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{org.metrics.members_count}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Academic Classes</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{org.metrics.classes_count}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Sections</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{org.metrics.sections_count}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Courses</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{org.metrics.courses_count}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Contact & Owner Info */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                        Owner & Account Details
                    </h3>
                    <div className="space-y-3 text-xs">
                        <div>
                            <span className="text-slate-400 font-medium">Founder / Account Owner:</span>
                            <div className="font-bold text-slate-800 text-sm">{org.creator?.name || 'Platform Administrator'}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium">Work Email:</span>
                            <div className="font-mono text-slate-800">{org.email || org.creator?.email}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium">Phone:</span>
                            <div className="text-slate-800">{org.phone || 'Not configured'}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium">Timezone & Currency:</span>
                            <div className="text-slate-800">{org.timezone} • {org.currency}</div>
                        </div>
                    </div>
                </div>

                {/* Subscription Management Form */}
                <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="size-4 text-[#1769E0]" />
                            <h3 className="text-sm font-bold text-slate-900">Subscription Tier Management</h3>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            Current: {org.subscription?.plan_name || 'No Plan'} ({org.subscription?.status})
                        </span>
                    </div>

                    {planMessage && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>{planMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handlePlanSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Plan Tier</label>
                            <select
                                value={data.plan_id}
                                onChange={(e) => setData('plan_id', Number(e.target.value))}
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            >
                                {availablePlans.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (${(p.price_cents / 100).toFixed(2)}/mo)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Billing Interval</label>
                            <select
                                value={data.billing_interval}
                                onChange={(e) => setData('billing_interval', e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="annual">Annual</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="trialing">Trialing (30-day)</option>
                                <option value="past_due">Past Due</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="sm:col-span-3 flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1256B8] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {processing ? 'Updating...' : 'Save Subscription Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Members Roster */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden mb-8">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="size-4 text-slate-700" />
                        <h3 className="text-sm font-bold text-slate-900">Institution Members ({members.length})</h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-2.5 px-4">Member Name</th>
                                <th className="py-2.5 px-4">Email</th>
                                <th className="py-2.5 px-4">Campus Role</th>
                                <th className="py-2.5 px-4">Title</th>
                                <th className="py-2.5 px-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">
                                        No members found in this institution.
                                    </td>
                                </tr>
                            ) : (
                                members.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                                        <td className="py-3 px-4 font-mono text-slate-600">{m.email}</td>
                                        <td className="py-3 px-4 capitalize font-semibold text-blue-700">{m.role}</td>
                                        <td className="py-3 px-4 text-slate-500">{m.title || '—'}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {m.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoices History */}
            {invoices.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden mb-8">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-slate-700" />
                            <h3 className="text-sm font-bold text-slate-900">Platform Invoices</h3>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-4">Invoice #</th>
                                    <th className="py-2.5 px-4">Amount</th>
                                    <th className="py-2.5 px-4">Due Date</th>
                                    <th className="py-2.5 px-4">Paid At</th>
                                    <th className="py-2.5 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="py-3 px-4 font-bold text-slate-900">{inv.invoice_number}</td>
                                        <td className="py-3 px-4 font-bold text-slate-900">{inv.amount_formatted}</td>
                                        <td className="py-3 px-4 text-slate-500">{inv.due_date || '—'}</td>
                                        <td className="py-3 px-4 text-slate-500">{inv.paid_at || '—'}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                inv.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </PlatformAdminLayout>
    );
}
