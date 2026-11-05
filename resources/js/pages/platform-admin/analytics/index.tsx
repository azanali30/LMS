import { Head } from '@inertiajs/react';
import React from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    BarChart3,
    TrendingUp,
    Users,
    Building2,
    DollarSign,
    CheckCircle2,
    Layers,
    PieChart,
} from 'lucide-react';

interface GrowthMonth {
    label: string;
    users: number;
    organizations: number;
    revenue_cents: number;
    revenue_formatted: string;
}

interface TypeItem {
    type: string;
    count: number;
}

interface SubStatusItem {
    status: string;
    count: number;
}

interface PlanPopItem {
    name: string;
    count: number;
}

interface Props {
    growthHistory: GrowthMonth[];
    typesBreakdown: TypeItem[];
    subscriptionStatuses: SubStatusItem[];
    paymentStats: {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        approvalRate: number;
    };
    plansPopularity: PlanPopItem[];
}

export default function PlatformAnalyticsIndex({
    growthHistory = [],
    typesBreakdown = [],
    subscriptionStatuses = [],
    paymentStats,
    plansPopularity = [],
}: Props) {
    const maxUsers = Math.max(...growthHistory.map((g) => g.users), 5);
    const totalRevenueCents = growthHistory.reduce((acc, g) => acc + g.revenue_cents, 0);

    return (
        <PlatformAdminLayout title="Platform Analytics & Intelligence">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SaaS Performance Intelligence</h2>
                <p className="text-xs text-slate-500 mt-1">
                    Multi-tenant growth metrics, licensing distributions, and payment reconciliation telemetry.
                </p>
            </div>

            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Verification Rate</span>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                        {paymentStats.approvalRate}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        {paymentStats.approved} approved of {paymentStats.total} total submissions
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">12-Month Invoiced Volume</span>
                    <div className="text-2xl font-extrabold text-[#1769E0] mt-1">
                        ${(totalRevenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Aggregated from paid subscription invoices
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Institution Tiers</span>
                    <div className="text-2xl font-extrabold text-purple-600 mt-1">
                        {plansPopularity.reduce((acc, p) => acc + p.count, 0)} licenses
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Distributed across Bronze, Silver, Gold, Premium
                    </div>
                </div>
            </div>

            {/* 12-Month Growth Trend */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">12-Month Growth Velocity</h3>
                        <p className="text-xs text-slate-500">New user accounts registered per month</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        Rolling 12 Months
                    </span>
                </div>

                <div className="flex items-end gap-3 h-52 pt-8 px-2 overflow-x-auto">
                    {growthHistory.map((item, idx) => {
                        const height = Math.max(8, Math.round((item.users / maxUsers) * 100));
                        return (
                            <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 h-full justify-end">
                                <span className="text-[10px] font-bold text-slate-700">{item.users}</span>
                                <div
                                    style={{ height: `${height}%` }}
                                    className="w-full rounded-t-md bg-[#1769E0] hover:bg-blue-700 transition"
                                    title={`${item.label}: ${item.users} users, ${item.organizations} institutions`}
                                />
                                <span className="text-[9px] font-semibold text-slate-400 truncate w-full text-center">
                                    {item.label.split(' ')[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Distributions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Organization Types */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Institution Types</h3>
                    <p className="text-xs text-slate-500 mb-4">Campuses segmented by classification</p>

                    <div className="space-y-3">
                        {typesBreakdown.length === 0 ? (
                            <div className="text-xs text-slate-400">No organizations recorded yet.</div>
                        ) : (
                            typesBreakdown.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                                    <span className="font-semibold text-slate-700">{item.type}</span>
                                    <span className="font-extrabold text-blue-600">{item.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Plan Popularity */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Plan Popularity</h3>
                    <p className="text-xs text-slate-500 mb-4">Subscribers per subscription tier</p>

                    <div className="space-y-3">
                        {plansPopularity.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                                <span className="font-semibold text-slate-700">{p.name}</span>
                                <span className="font-extrabold text-purple-600">{p.count} schools</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subscription Statuses */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Subscription Health</h3>
                    <p className="text-xs text-slate-500 mb-4">Lifecycle distribution across tenants</p>

                    <div className="space-y-3">
                        {subscriptionStatuses.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                                <span className="font-semibold text-slate-700">{s.status}</span>
                                <span className="font-extrabold text-emerald-600">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PlatformAdminLayout>
    );
}
