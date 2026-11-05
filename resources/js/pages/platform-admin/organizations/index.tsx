import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Building2,
    Search,
    Filter,
    ExternalLink,
    ShieldAlert,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Users,
    GraduationCap,
    BookOpen,
} from 'lucide-react';

interface OrgItem {
    id: number;
    name: string;
    slug: string;
    organization_type: string;
    status: string;
    email: string;
    phone: string;
    creator: { id: number; name: string; email: string } | null;
    subscription: {
        status: string;
        plan_name: string;
        billing_interval: string;
        ends_at: string | null;
    } | null;
    teachers_count: number;
    students_count: number;
    courses_count: number;
    created_at: string;
    subdomain_url: string;
}

interface Props {
    organizations: {
        data: OrgItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    plans: { id: number; name: string; slug: string }[];
    counts: { all: number; active: number; suspended: number };
    filters: { search?: string; status?: string; type?: string; plan_id?: string };
}

export default function PlatformOrganizationsIndex({
    organizations,
    plans = [],
    counts,
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null);
    const [statusReason, setStatusReason] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/platform-admin/organizations',
            { search, status: statusFilter, type: typeFilter },
            { preserveState: true }
        );
    };

    const handleFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        router.get(
            '/platform-admin/organizations',
            { search, status: newStatus, type: typeFilter },
            { preserveState: true }
        );
    };

    const confirmStatusChange = () => {
        if (!selectedOrg) return;
        const targetStatus = selectedOrg.status === 'active' ? 'suspended' : 'active';
        router.post(
            `/platform-admin/organizations/${selectedOrg.id}/status`,
            { status: targetStatus, reason: statusReason },
            {
                onSuccess: () => {
                    setShowStatusModal(false);
                    setSelectedOrg(null);
                    setStatusReason('');
                },
            }
        );
    };

    return (
        <PlatformAdminLayout title="Organizations & Institutions">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Institutional Tenants</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Total {counts.all} institutions ({counts.active} active, {counts.suspended} suspended)
                    </p>
                </div>

                {/* Status Quick Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 text-xs font-semibold">
                    <button
                        onClick={() => handleFilterChange('')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            !statusFilter ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        All ({counts.all})
                    </button>
                    <button
                        onClick={() => handleFilterChange('active')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Active ({counts.active})
                    </button>
                    <button
                        onClick={() => handleFilterChange('suspended')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            statusFilter === 'suspended' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Suspended ({counts.suspended})
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-6">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="size-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by school name, subdomain slug, or contact email..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#1769E0] text-white text-xs font-bold hover:bg-[#1256B8] transition"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Organizations Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Institution Name</th>
                                <th className="py-3 px-4">Owner / Contact</th>
                                <th className="py-3 px-4">Subscription Plan</th>
                                <th className="py-3 px-4 text-center">Teachers</th>
                                <th className="py-3 px-4 text-center">Students</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        No institutions found matching the search criteria.
                                    </td>
                                </tr>
                            ) : (
                                organizations.data.map((org) => (
                                    <tr key={org.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4">
                                            <div className="font-extrabold text-slate-900">{org.name}</div>
                                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                                <span>{org.slug}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="capitalize">{org.organization_type}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-800">{org.creator?.name || 'N/A'}</div>
                                            <div className="text-[11px] text-slate-400 font-mono">{org.email || org.creator?.email}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                {org.subscription?.plan_name || 'No Active Plan'}
                                            </span>
                                            {org.subscription?.billing_interval && (
                                                <div className="text-[10px] text-slate-400 capitalize mt-1">
                                                    {org.subscription.billing_interval} billing
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                            {org.teachers_count}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                            {org.students_count}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    org.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}
                                            >
                                                {org.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/platform-admin/organizations/${org.id}`}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                                                >
                                                    View Details
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrg(org);
                                                        setShowStatusModal(true);
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                                                        org.status === 'active'
                                                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                    }`}
                                                >
                                                    {org.status === 'active' ? 'Suspend' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {organizations.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Page {organizations.current_page} of {organizations.last_page} ({organizations.total} institutions)
                        </span>
                        <div className="flex items-center gap-1.5">
                            {organizations.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                        link.active
                                            ? 'bg-[#1769E0] text-white'
                                            : !link.url
                                            ? 'text-slate-300 pointer-events-none'
                                            : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Suspend/Activate Confirmation Modal */}
            {showStatusModal && selectedOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${
                                selectedOrg.status === 'active' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                <ShieldAlert className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    {selectedOrg.status === 'active' ? 'Suspend Organization' : 'Reactivate Organization'}
                                </h3>
                                <p className="text-xs text-slate-500">{selectedOrg.name}</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            {selectedOrg.status === 'active'
                                ? 'Suspending this organization will prevent teachers, students, and parents from logging in or conducting school activities until reactivated.'
                                : 'Reactivating this organization will immediately restore full portal access for teachers and students.'}
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Administrative Reason (Logged in Audit Trail):
                            </label>
                            <textarea
                                value={statusReason}
                                onChange={(e) => setStatusReason(e.target.value)}
                                placeholder="e.g. Subscription payment overdue, compliance verification, or requested by school director..."
                                rows={3}
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedOrg(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmStatusChange}
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                                    selectedOrg.status === 'active'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                Confirm {selectedOrg.status === 'active' ? 'Suspension' : 'Activation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PlatformAdminLayout>
    );
}
