import { Head, Link } from '@inertiajs/react';
import React from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Users,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Building2,
    ExternalLink,
    ShieldCheck,
    Clock,
} from 'lucide-react';

interface OrgMembership {
    id: number;
    name: string;
    slug: string;
    role: string;
    status: string;
    title: string | null;
    subdomain_url: string;
}

interface AuditLog {
    id: number;
    action: string;
    user_name: string;
    details: any;
    created_at: string;
}

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        status: string;
        email_verified_at: string | null;
        two_factor_enabled: boolean;
        created_at: string;
    };
    organizations: OrgMembership[];
    auditLogs: AuditLog[];
}

export default function PlatformUserShow({ user, organizations = [], auditLogs = [] }: Props) {
    return (
        <PlatformAdminLayout title={`User: ${user.name}`}>
            {/* Back link */}
            <div className="mb-4">
                <Link
                    href="/platform-admin/users"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to Users</span>
                </Link>
            </div>

            {/* Profile Overview Card */}
            <div className="mb-8 rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-extrabold text-xl shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                    {user.name}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    user.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                    {user.status}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            user.role === 'super_admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                            {user.role.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                        <span className="text-slate-400 font-medium">Email Verified:</span>
                        <div className="font-bold text-slate-800 mt-0.5">
                            {user.email_verified_at ? `Verified on ${user.email_verified_at}` : 'Unverified'}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-400 font-medium">Two-Factor Authentication:</span>
                        <div className="font-bold text-slate-800 mt-0.5">
                            {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-400 font-medium">Account ID:</span>
                        <div className="font-mono text-slate-800 mt-0.5">#{user.id}</div>
                    </div>
                    <div>
                        <span className="text-slate-400 font-medium">Member Since:</span>
                        <div className="font-bold text-slate-800 mt-0.5">{user.created_at}</div>
                    </div>
                </div>
            </div>

            {/* Organizations Memberships */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden mb-8">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-slate-700" />
                        <h3 className="text-sm font-bold text-slate-900">
                            Associated Campus Organizations ({organizations.length})
                        </h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-2.5 px-4">Campus Name</th>
                                <th className="py-2.5 px-4">Subdomain</th>
                                <th className="py-2.5 px-4">Role</th>
                                <th className="py-2.5 px-4">Title</th>
                                <th className="py-2.5 px-4 text-center">Membership Status</th>
                                <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-400">
                                        This user is not currently affiliated with any campus organizations.
                                    </td>
                                </tr>
                            ) : (
                                organizations.map((org) => (
                                    <tr key={org.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3 px-4 font-bold text-slate-900">{org.name}</td>
                                        <td className="py-3 px-4 font-mono text-slate-600">{org.slug}</td>
                                        <td className="py-3 px-4 capitalize font-semibold text-blue-700">{org.role}</td>
                                        <td className="py-3 px-4 text-slate-500">{org.title || '—'}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {org.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link
                                                href={`/platform-admin/organizations/${org.id}`}
                                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                                            >
                                                Manage Org &rarr;
                                            </Link>
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
