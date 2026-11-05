import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Users,
    Search,
    Filter,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    AlertCircle,
    UserCheck,
} from 'lucide-react';

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    email_verified: boolean;
    organizations_count: number;
    primary_organization?: string;
    created_at: string;
}

interface Props {
    users: {
        data: UserItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    roles: string[];
    counts: { all: number; active: number; suspended: number; super_admins: number };
    filters: { search?: string; role?: string; status?: string };
}

export default function PlatformUsersIndex({
    users,
    roles = [],
    counts,
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [reason, setReason] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/platform-admin/users',
            { search, role: roleFilter, status: statusFilter },
            { preserveState: true }
        );
    };

    const handleFilterChange = (role: string, status: string) => {
        setRoleFilter(role);
        setStatusFilter(status);
        router.get(
            '/platform-admin/users',
            { search, role, status },
            { preserveState: true }
        );
    };

    const confirmStatusChange = () => {
        if (!selectedUser) return;
        const targetStatus = selectedUser.status === 'active' ? 'suspended' : 'active';
        router.post(
            `/platform-admin/users/${selectedUser.id}/status`,
            { status: targetStatus, reason },
            {
                onSuccess: () => {
                    setShowModal(false);
                    setSelectedUser(null);
                    setReason('');
                },
            }
        );
    };

    return (
        <PlatformAdminLayout title="User Management">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Users</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Total {counts.all} accounts ({counts.active} active, {counts.suspended} suspended, {counts.super_admins} super admins)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(roleFilter, e.target.value)}
                        className="p-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(e) => handleFilterChange(e.target.value, statusFilter)}
                        className="p-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    >
                        <option value="">All Roles</option>
                        {roles.map((r) => (
                            <option key={r} value={r}>
                                {r.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Search Input */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-6">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="size-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search user by name or email address..."
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

            {/* Users Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">User Name</th>
                                <th className="py-3 px-4">Email</th>
                                <th className="py-3 px-4">Platform Role</th>
                                <th className="py-3 px-4">Associated Campus</th>
                                <th className="py-3 px-4 text-center">Verification</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        No users found matching the query.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                                        <td className="py-3.5 px-4 font-mono text-slate-700">{u.email}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                u.role === 'super_admin'
                                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            {u.primary_organization || (u.organizations_count > 0 ? `${u.organizations_count} campuses` : '—')}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {u.email_verified ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                                    <CheckCircle2 className="size-3.5" />
                                                    <span>Verified</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                                    <span>Pending</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    u.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}
                                            >
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/platform-admin/users/${u.id}`}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                                                >
                                                    View
                                                </Link>
                                                {u.role !== 'super_admin' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setShowModal(true);
                                                        }}
                                                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                                                            u.status === 'active'
                                                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Page {users.current_page} of {users.last_page} ({users.total} users)
                        </span>
                        <div className="flex items-center gap-1.5">
                            {users.links.map((link, idx) => (
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

            {/* Suspend Confirmation Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${
                                selectedUser.status === 'active' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                <ShieldAlert className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    {selectedUser.status === 'active' ? 'Suspend User Account' : 'Activate User Account'}
                                </h3>
                                <p className="text-xs text-slate-500">{selectedUser.name} ({selectedUser.email})</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            {selectedUser.status === 'active'
                                ? 'Suspending this user account will revoke their active sessions and prevent them from signing into any school workspaces.'
                                : 'Activating this user account will restore their standard portal login permissions.'}
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Administrative Reason:
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this account is being suspended/activated..."
                                rows={3}
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedUser(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmStatusChange}
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                                    selectedUser.status === 'active'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                Confirm {selectedUser.status === 'active' ? 'Suspension' : 'Activation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PlatformAdminLayout>
    );
}
