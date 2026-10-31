import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    ShieldCheck,
    Building2,
    Users,
    BookOpen,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Activity,
    Plus,
} from 'lucide-react';

interface Metrics {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    pendingApprovals?: number;
}

interface OrgItem {
    id: number;
    name: string;
    slug: string;
    organization_type: string;
    status: string;
    created_at: string;
    members_count: number;
    courses_count: number;
}

interface PlanItem {
    id: number;
    name: string;
    slug: string;
    monthly_price: number;
    subscriptions_count: number;
}

interface SuperAdminDashboardProps {
    metrics: Metrics;
    organizations?: OrgItem[];
    plans?: PlanItem[];
}

export default function SuperAdminDashboard({
    metrics,
    organizations = [],
    plans = [],
}: SuperAdminDashboardProps) {
    const kpiCards = [
        {
            label: 'Total Tenants',
            value: metrics.totalOrganizations.toLocaleString(),
            sub: `${metrics.activeOrganizations} active institutions`,
            icon: Building2,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20',
        },
        {
            label: 'Platform Users',
            value: metrics.totalUsers.toLocaleString(),
            sub: 'Admins, teachers, students, parents',
            icon: Users,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10 border-sky-500/20',
        },
        {
            label: 'Published Courses',
            value: metrics.totalCourses.toLocaleString(),
            sub: 'Curriculum offerings',
            icon: BookOpen,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
        },
        {
            label: 'Total Enrollments',
            value: metrics.totalEnrollments.toLocaleString(),
            sub: 'Course active participants',
            icon: Activity,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
        },
    ];

    return (
        <TenantLayout title="Platform Administration">
            <Head title="Super Admin — Platform Control Center" />

            {/* Platform Control Header */}
            <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900 to-purple-950/40 p-6 shadow-xl md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-600/20 text-rose-300">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tracking-wider text-rose-400 uppercase">
                                Super Administrator Mode
                            </span>
                            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-white">
                            SaaS Fleet Telemetry & Oversight
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/organizations/create"
                        className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500"
                    >
                        <Plus className="size-3.5" />
                        <span>Provision Tenant</span>
                    </Link>
                </div>
            </div>

            {/* Pending Approvals Alert Banner */}
            {(metrics.pendingApprovals ?? 0) > 0 && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                            <CreditCard className="size-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">
                                {metrics.pendingApprovals} Payment Approval Request{metrics.pendingApprovals === 1 ? '' : 's'} Awaiting Verification
                            </div>
                            <div className="text-[11px] text-amber-300/90">
                                Applicants have submitted deposit slips and are waiting for account approval.
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/admin/payment-approvals"
                        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-amber-500"
                    >
                        Review Requests &rarr;
                    </Link>
                </div>
            )}

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={i}
                            className="rounded-2xl border border-slate-800 bg-[#0B1220] p-5 shadow-lg"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-400">
                                    {card.label}
                                </span>
                                <div
                                    className={`size-8 rounded-xl ${card.bg} flex items-center justify-center border`}
                                >
                                    <Icon className={`size-4 ${card.color}`} />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold tracking-tight text-white">
                                {card.value}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400">
                                {card.sub}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Organizations Management Table */}
            <div className="mb-8 rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-5 text-purple-400" />
                        <h3 className="text-sm font-bold text-white">
                            Registered SaaS Organizations
                        </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                        {organizations.length} institutions
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                                <th className="pb-3 font-semibold">
                                    Organization Name
                                </th>
                                <th className="pb-3 font-semibold">
                                    Tenant Slug
                                </th>
                                <th className="pb-3 font-semibold">Type</th>
                                <th className="pb-3 font-semibold">Members</th>
                                <th className="pb-3 font-semibold">Courses</th>
                                <th className="pb-3 font-semibold">Status</th>
                                <th className="pb-3 text-right font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {organizations.map((org) => (
                                <tr
                                    key={org.id}
                                    className="transition hover:bg-slate-900/40"
                                >
                                    <td className="py-3 font-medium text-white">
                                        {org.name}
                                    </td>
                                    <td className="py-3 font-mono text-purple-400">
                                        {org.slug}.lms.app
                                    </td>
                                    <td className="py-3 text-slate-400 capitalize">
                                        {org.organization_type.replace(
                                            /_/g,
                                            ' ',
                                        )}
                                    </td>
                                    <td className="py-3 text-slate-300">
                                        {org.members_count}
                                    </td>
                                    <td className="py-3 text-slate-300">
                                        {org.courses_count}
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                                                org.status === 'active'
                                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                    : 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
                                            }`}
                                        >
                                            {org.status === 'active' ? (
                                                <CheckCircle2 className="size-3" />
                                            ) : (
                                                <AlertCircle className="size-3" />
                                            )}
                                            {org.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => {
                                                window.location.href = `/organizations/${org.id}/switch`;
                                            }}
                                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-purple-500/40 hover:bg-purple-600/30 hover:text-white"
                                        >
                                            Impersonate &rarr;
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Subscription Plans Breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-xl">
                <div className="mb-5 flex items-center gap-2">
                    <CreditCard className="size-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">
                        Monetization & Plan Distribution
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {plans.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                        >
                            <div>
                                <div className="text-xs font-bold text-white">
                                    {p.name}
                                </div>
                                <div className="text-[11px] font-semibold text-purple-400">
                                    ${p.monthly_price}/mo
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-extrabold text-white">
                                    {p.subscriptions_count}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase">
                                    Subscribers
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </TenantLayout>
    );
}
