import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    FileText,
    Search,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink,
} from 'lucide-react';

interface InvoiceItem {
    id: number;
    invoice_number: string;
    organization_name: string;
    plan_name: string;
    user_email: string;
    amount_cents: number;
    amount_formatted: string;
    billing_type: string;
    status: string;
    payment_reference: string | null;
    due_date: string | null;
    paid_at: string | null;
    verified_by_name: string | null;
    created_at: string;
}

interface Props {
    invoices: {
        data: InvoiceItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    counts: { all: number; pending: number; paid: number; cancelled: number };
    filters: { status?: string; search?: string };
}

export default function PlatformInvoicesIndex({
    invoices,
    counts,
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/platform-admin/invoices',
            { search, status: statusFilter },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        router.get(
            '/platform-admin/invoices',
            { search, status },
            { preserveState: true }
        );
    };

    const handleVerify = (id: number, number: string) => {
        if (!confirm(`Confirm that payment for Invoice ${number} has been verified and deposited?`)) {
            return;
        }
        router.post(`/platform-admin/invoices/${id}/verify`);
    };

    return (
        <PlatformAdminLayout title="Platform Billing Invoices">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Billing Invoices</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Track institutional billing invoices, reconciliation timestamps, and receipts.
                    </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 text-xs font-semibold">
                    <button
                        onClick={() => handleStatusFilter('')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            !statusFilter ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        All ({counts.all})
                    </button>
                    <button
                        onClick={() => handleStatusFilter('paid')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            statusFilter === 'paid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Paid ({counts.paid})
                    </button>
                    <button
                        onClick={() => handleStatusFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            statusFilter === 'pending' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Pending ({counts.pending})
                    </button>
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
                            placeholder="Search by invoice number or institution name..."
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

            {/* Invoices Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Invoice #</th>
                                <th className="py-3 px-4">Institution</th>
                                <th className="py-3 px-4">Plan Tier</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Due Date</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        No invoices found matching current criteria.
                                    </td>
                                </tr>
                            ) : (
                                invoices.data.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-800">
                                            {inv.organization_name || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-blue-700">
                                            {inv.plan_name || 'Standard'}
                                        </td>
                                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                            {inv.amount_formatted}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500">
                                            {inv.due_date || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                inv.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : inv.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/platform-admin/invoices/${inv.id}`}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                                                >
                                                    View
                                                </Link>
                                                {inv.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleVerify(inv.id, inv.invoice_number)}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition"
                                                    >
                                                        Mark Paid
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
                {invoices.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Page {invoices.current_page} of {invoices.last_page} ({invoices.total} invoices)
                        </span>
                        <div className="flex items-center gap-1.5">
                            {invoices.links.map((link, idx) => (
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
