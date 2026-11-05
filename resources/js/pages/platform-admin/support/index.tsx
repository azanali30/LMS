import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    HelpCircle,
    Search,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    Building2,
} from 'lucide-react';

interface TicketItem {
    id: number;
    ticket_number: string;
    subject: string;
    priority: string;
    status: string;
    organization_name: string | null;
    user_name: string | null;
    user_email: string | null;
    assignee_name: string | null;
    messages_count: number;
    created_at: string;
}

interface Props {
    tickets: {
        data: TicketItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    counts: { all: number; open: number; in_progress: number; waiting_response: number; resolved: number };
    filters: { status?: string; priority?: string; search?: string };
}

export default function PlatformSupportIndex({
    tickets,
    counts,
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/platform-admin/support',
            { search, status: statusFilter, priority: priorityFilter },
            { preserveState: true }
        );
    };

    const handleFilterChange = (status: string, priority: string) => {
        setStatusFilter(status);
        setPriorityFilter(priority);
        router.get(
            '/platform-admin/support',
            { search, status, priority },
            { preserveState: true }
        );
    };

    return (
        <PlatformAdminLayout title="Support Tickets">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Institutional Support Desk</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Respond to customer help requests, internal technical escalations, and institution inquiries.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value, priorityFilter)}
                        className="p-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    >
                        <option value="">All Statuses ({counts.all})</option>
                        <option value="open">Open ({counts.open})</option>
                        <option value="in_progress">In Progress ({counts.in_progress})</option>
                        <option value="waiting_response">Waiting Response ({counts.waiting_response})</option>
                        <option value="resolved">Resolved ({counts.resolved})</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => handleFilterChange(statusFilter, e.target.value)}
                        className="p-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    >
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
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
                            placeholder="Search tickets by subject, ticket number, or user email..."
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

            {/* Tickets Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Ticket ID</th>
                                <th className="py-3 px-4">Subject & Institution</th>
                                <th className="py-3 px-4">Requester</th>
                                <th className="py-3 px-4 text-center">Priority</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tickets.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No support tickets currently found.
                                    </td>
                                </tr>
                            ) : (
                                tickets.data.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                            {t.ticket_number}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900 text-xs">{t.subject}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <span>{t.organization_name || 'Independent User'}</span>
                                                <span>•</span>
                                                <span>{t.created_at}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-slate-800">{t.user_name || 'User'}</div>
                                            <div className="font-mono text-[11px] text-slate-400">{t.user_email}</div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                t.priority === 'urgent'
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : t.priority === 'high'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                t.status === 'open'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : t.status === 'in_progress'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : t.status === 'resolved'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {t.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <Link
                                                href={`/platform-admin/support/${t.id}`}
                                                className="px-2.5 py-1 rounded-lg bg-[#1769E0] text-white hover:bg-[#1256B8] font-bold text-[11px] transition shadow-xs"
                                            >
                                                Reply &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {tickets.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Page {tickets.current_page} of {tickets.last_page} ({tickets.total} tickets)
                        </span>
                        <div className="flex items-center gap-1.5">
                            {tickets.links.map((link, idx) => (
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
        </PlatformAdminLayout>
    );
}
