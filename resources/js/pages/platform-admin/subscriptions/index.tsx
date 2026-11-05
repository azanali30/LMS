import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    CreditCard,
    Search,
    Filter,
    ShieldAlert,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
} from 'lucide-react';

interface SubItem {
    id: number;
    organization: { id: number; name: string; slug: string } | null;
    plan: { id: number; name: string; slug: string; price_formatted: string } | null;
    user: { id: number; name: string; email: string } | null;
    status: string;
    billing_interval: string;
    starts_at: string | null;
    trial_ends_at: string | null;
    ends_at: string | null;
    cancelled_at: string | null;
}

interface Props {
    subscriptions: {
        data: SubItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    plans: { id: number; name: string; slug: string }[];
    counts: { all: number; active: number; trialing: number; cancelled: number };
    filters: { status?: string; plan_id?: string; interval?: string; search?: string };
}

export default function PlatformSubscriptionsIndex({
    subscriptions,
    plans = [],
    counts,
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [planFilter, setPlanFilter] = useState(filters.plan_id || '');
    const [intervalFilter, setIntervalFilter] = useState(filters.interval || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/platform-admin/subscriptions',
            { search, status: statusFilter, plan_id: planFilter, interval: intervalFilter },
            { preserveState: true }
        );
    };

    const handleFilterChange = (status: string, plan: string, interval: string) => {
        setStatusFilter(status);
        setPlanFilter(plan);
        setIntervalFilter(interval);
        router.get(
            '/platform-admin/subscriptions',
            { search, status, plan_id: plan, interval },
            { preserveState: true }
        );
    };

    const handleCancel = (subId: number, orgName?: string) => {
        if (!confirm(`Are you sure you want to cancel the subscription for '${orgName || 'this institution'}'?`)) {
            return;
        }
        router.post(`/platform-admin/subscriptions/${subId}/cancel`);
    };

    return (
        <PlatformAdminLayout title="SaaS Subscriptions">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Institutional Subscriptions</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Total {counts.all} subscriptions ({counts.active} active paid, {counts.trialing} in trial, {counts.cancelled} cancelled)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value, planFilter, intervalFilter)}
                        className="p-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="trialing">Trialing</option>
                        <option value="past_due">Past Due</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => handleFilterChange(statusFilter, e.target.value, intervalFilter)}
                        className="p-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    >
                        <option value="">All Plans</option>
                        {plans.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Search */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-6">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="size-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search subscriptions by institution name or slug..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#1769E0] text-white text-xs font-bold hover:bg-[#1256B8] transition"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Subscriptions Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Institution</th>
                                <th className="py-3 px-4">Plan Tier</th>
                                <th className="py-3 px-4">Billing Contact</th>
                                <th className="py-3 px-4">Trial / Expiration</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {subscriptions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No subscription records found.
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.data.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4">
                                            {sub.organization ? (
                                                <Link
                                                    href={`/platform-admin/organizations/${sub.organization.id}`}
                                                    className="font-bold text-slate-900 hover:text-blue-600 block"
                                                >
                                                    {sub.organization.name}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400">Unassigned Org</span>
                                            )}
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                {sub.organization?.slug}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-extrabold text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                {sub.plan?.name || 'Custom Plan'}
                                            </span>
                                            <div className="text-[10px] text-slate-400 capitalize mt-1">
                                                {sub.billing_interval} • {sub.plan?.price_formatted || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-600">
                                            {sub.user?.email || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            {sub.trial_ends_at ? (
                                                <div className="text-[11px] text-amber-700 font-semibold">
                                                    Trial Ends: {sub.trial_ends_at}
                                                </div>
                                            ) : sub.ends_at ? (
                                                <div className="text-[11px] text-slate-600">
                                                    Expires: {sub.ends_at}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Continuous Renewal</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                sub.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : sub.status === 'trialing'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {sub.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleCancel(sub.id, sub.organization?.name)}
                                                    className="px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-[11px] transition"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PlatformAdminLayout>
    );
}
