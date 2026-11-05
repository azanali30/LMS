import { Head, Link } from '@inertiajs/react';
import React from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Building2,
    Users,
    CreditCard,
    DollarSign,
    Clock,
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    Layers,
    BarChart3,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    Receipt,
} from 'lucide-react';

interface Metrics {
    totalOrganizations: number;
    activeOrganizations: number;
    trialOrganizations: number;
    suspendedOrganizations: number;
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalOwners: number;
    activeSubscriptions: number;
    expiringSubscriptions: number;
    mrrFormatted: string;
    totalRevenueFormatted: string;
    pendingPayments: number;
    pendingInvoices: number;
    openTickets: number;
}

interface OrgItem {
    id: number;
    name: string;
    slug: string;
    organization_type: string;
    status: string;
    creator_name: string;
    creator_email: string;
    plan_name: string;
    members_count: number;
    created_at: string;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    email_verified: boolean;
    created_at: string;
}

interface PaymentItem {
    id: number;
    email: string;
    plan_name: string;
    amount_formatted: string;
    payment_method: string;
    status: string;
    transaction_reference: string;
    created_at: string;
}

interface RegistrationMonth {
    month: string;
    count: number;
}

interface PlanDistItem {
    id: number;
    name: string;
    slug: string;
    subscribers_count: number;
}

interface DashboardProps {
    metrics: Metrics;
    recentOrganizations: OrgItem[];
    recentUsers: UserItem[];
    recentPaymentRequests: PaymentItem[];
    monthlyRegistrations: RegistrationMonth[];
    plansDistribution: PlanDistItem[];
}

export default function PlatformDashboard({
    metrics,
    recentOrganizations = [],
    recentUsers = [],
    recentPaymentRequests = [],
    monthlyRegistrations = [],
    plansDistribution = [],
}: DashboardProps) {
    const kpis = [
        {
            title: 'Total Institutions',
            value: metrics.totalOrganizations.toLocaleString(),
            sub: `${metrics.activeOrganizations} active • ${metrics.suspendedOrganizations} suspended`,
            icon: Building2,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50 border-blue-100',
            href: '/platform-admin/organizations',
        },
        {
            title: 'Platform Users',
            value: metrics.totalUsers.toLocaleString(),
            sub: `${metrics.totalTeachers} teachers • ${metrics.totalStudents} students`,
            icon: Users,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-50 border-purple-100',
            href: '/platform-admin/users',
        },
        {
            title: 'Monthly Recurring Revenue',
            value: metrics.mrrFormatted,
            sub: `Total Invoiced: ${metrics.totalRevenueFormatted}`,
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50 border-emerald-100',
            href: '/platform-admin/analytics',
        },
        {
            title: 'Active Subscriptions',
            value: metrics.activeSubscriptions.toLocaleString(),
            sub: `${metrics.trialOrganizations} in 30-day trial`,
            icon: CreditCard,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-50 border-amber-100',
            href: '/platform-admin/subscriptions',
        },
    ];

    const maxMonthlyCount = Math.max(...monthlyRegistrations.map((m) => m.count), 5);

    return (
        <PlatformAdminLayout title="Overview Dashboard">
            {/* Header Hero Banner */}
            <div className="mb-8 rounded-3xl bg-linear-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300 mb-3">
                            <ShieldCheck className="size-3.5" />
                            <span>InstitutoPropio SaaS Platform Operations</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Global Campus Network
                        </h2>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                            Monitor live tenant growth, subscription renewals, payments reconciliation, and multi-campus system health across all educational institutions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href="/platform-admin/payments"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1256B8] text-white text-xs font-bold shadow-md transition"
                        >
                            <Receipt className="size-4" />
                            <span>Verify Payments ({metrics.pendingPayments})</span>
                        </Link>
                        <Link
                            href="/platform-admin/organizations"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
                        >
                            <span>Manage Organizations &rarr;</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Critical Action Banner if pending payments exist */}
            {metrics.pendingPayments > 0 && (
                <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold">Action Required: {metrics.pendingPayments} Payment Proof(s) Awaiting Review</div>
                            <div className="text-[11px] text-amber-700">School applicants have submitted bank deposit slips awaiting admin verification.</div>
                        </div>
                    </div>
                    <Link
                        href="/platform-admin/payments"
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0"
                    >
                        Review Queue &rarr;
                    </Link>
                </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <Link
                            key={idx}
                            href={kpi.href}
                            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition group block"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                                <div className={`size-9 rounded-xl border flex items-center justify-center ${kpi.iconBg} ${kpi.iconColor}`}>
                                    <Icon className="size-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                <span>{kpi.sub}</span>
                                <ArrowUpRight className="size-3.5 text-slate-300 group-hover:text-blue-600 transition" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Charts & Distributions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Registrations Bar Graph (6 Months) */}
                <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">User Registrations Trend</h3>
                            <p className="text-xs text-slate-500">Monthly new accounts created across all institutions</p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                            Last 6 Months
                        </span>
                    </div>

                    <div className="flex items-end gap-4 h-48 pt-6 px-2">
                        {monthlyRegistrations.map((m, idx) => {
                            const barHeightPercent = Math.max(8, Math.round((m.count / maxMonthlyCount) * 100));
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                    <span className="text-[11px] font-bold text-slate-700">{m.count}</span>
                                    <div
                                        style={{ height: `${barHeightPercent}%` }}
                                        className="w-full max-w-[40px] rounded-t-lg bg-linear-to-t from-[#1769E0] to-[#38BDF8] transition-all duration-300 hover:opacity-90"
                                        title={`${m.month}: ${m.count} users`}
                                    />
                                    <span className="text-[10px] font-semibold text-slate-500 truncate w-full text-center">
                                        {m.month.split(' ')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Plan Distribution */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900">Active Plan Tiers</h3>
                            <Link href="/platform-admin/plans" className="text-xs text-blue-600 hover:underline font-semibold">
                                View Plans
                            </Link>
                        </div>
                        <p className="text-xs text-slate-500 mb-5">Institutional tier licenses currently subscribed</p>

                        <div className="space-y-3.5">
                            {plansDistribution.map((p) => {
                                return (
                                    <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 capitalize">{p.slug} Tier</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-extrabold text-[#1769E0]">
                                                {p.subscribers_count}
                                            </span>
                                            <span className="text-[10px] text-slate-400 ml-1">institutions</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                        Multi-tenant organization-based licensing
                    </div>
                </div>
            </div>

            {/* Recent Tables (Organizations & Users) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Organizations */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-900">Recent Institutions</h3>
                        </div>
                        <Link href="/platform-admin/organizations" className="text-xs text-blue-600 hover:underline font-semibold">
                            View All &rarr;
                        </Link>
                    </div>

                    {recentOrganizations.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">No organizations found.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentOrganizations.map((org) => (
                                <div key={org.id} className="py-3 flex items-center justify-between">
                                    <div className="truncate pr-3">
                                        <Link
                                            href={`/platform-admin/organizations/${org.id}`}
                                            className="text-xs font-bold text-slate-900 hover:text-blue-600 truncate block"
                                        >
                                            {org.name}
                                        </Link>
                                        <div className="text-[11px] text-slate-400 truncate">
                                            Owner: {org.creator_name} ({org.creator_email})
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            org.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            {org.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Users */}
                <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="size-4 text-purple-600" />
                            <h3 className="text-sm font-bold text-slate-900">Recent Registered Users</h3>
                        </div>
                        <Link href="/platform-admin/users" className="text-xs text-blue-600 hover:underline font-semibold">
                            View All &rarr;
                        </Link>
                    </div>

                    {recentUsers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">No users found.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentUsers.map((u) => (
                                <div key={u.id} className="py-3 flex items-center justify-between">
                                    <div className="truncate pr-3">
                                        <Link
                                            href={`/platform-admin/users/${u.id}`}
                                            className="text-xs font-bold text-slate-900 hover:text-purple-600 truncate block"
                                        >
                                            {u.name}
                                        </Link>
                                        <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                                            {u.role}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PlatformAdminLayout>
    );
}
