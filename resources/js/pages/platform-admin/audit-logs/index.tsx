import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    ShieldAlert,
    Search,
    User,
    Clock,
    Laptop,
    CheckCircle2,
    Eye,
} from 'lucide-react';

interface AuditLogItem {
    id: number;
    action: string;
    user_name: string;
    user_email: string | null;
    target_type: string | null;
    target_id: number | null;
    details: any;
    ip_address: string | null;
    created_at: string;
}

interface Props {
    logs: {
        data: AuditLogItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    distinctActions: string[];
    filters: { action?: string; search?: string };
}

export default function PlatformAuditLogsIndex({
    logs,
    distinctActions = [],
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [actionFilter, setActionFilter] = useState(filters.action || '');
    const [activeDetails, setActiveDetails] = useState<any>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/platform-admin/audit-logs',
            { search, action: actionFilter },
            { preserveState: true }
        );
    };

    const handleActionChange = (act: string) => {
        setActionFilter(act);
        router.get(
            '/platform-admin/audit-logs',
            { search, action: act },
            { preserveState: true }
        );
    };

    return (
        <PlatformAdminLayout title="Platform Audit Trail">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Administrative Audit Logs</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Immutable, cryptographically verifiable record of all platform operations and security actions.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={actionFilter}
                        onChange={(e) => handleActionChange(e.target.value)}
                        className="p-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    >
                        <option value="">All Actions ({logs.total})</option>
                        {distinctActions.map((act) => (
                            <option key={act} value={act}>
                                {act}
                            </option>
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
                            placeholder="Search logs by action name, user email, or IP address..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#1769E0] text-white text-xs font-bold hover:bg-[#1256B8] transition"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Action Event</th>
                                <th className="py-3 px-4">Administrator</th>
                                <th className="py-3 px-4">Target Entity</th>
                                <th className="py-3 px-4">IP Address</th>
                                <th className="py-3 px-4">Timestamp</th>
                                <th className="py-3 px-4 text-right">Payload</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No audit records matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3 px-4">
                                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-800">{log.user_name}</div>
                                            {log.user_email && (
                                                <div className="font-mono text-[11px] text-slate-400">{log.user_email}</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 font-medium">
                                            {log.target_type ? `${log.target_type} #${log.target_id}` : '—'}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                                            {log.ip_address || 'Internal'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 font-medium">
                                            {log.created_at}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {log.details ? (
                                                <button
                                                    onClick={() => setActiveDetails(log)}
                                                    className="px-2 py-1 rounded-md text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition inline-flex items-center gap-1"
                                                >
                                                    <Eye className="size-3" />
                                                    <span>View</span>
                                                </button>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Page {logs.current_page} of {logs.last_page} ({logs.total} records)
                        </span>
                        <div className="flex items-center gap-1.5">
                            {logs.links.map((link, idx) => (
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

            {/* Details Modal */}
            {activeDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900">Audit Event Payload</h3>
                                <p className="font-mono text-xs text-blue-600">{activeDetails.action}</p>
                            </div>
                            <button
                                onClick={() => setActiveDetails(null)}
                                className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-72">
                            {JSON.stringify(activeDetails.details, null, 2)}
                        </pre>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setActiveDetails(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PlatformAdminLayout>
    );
}
