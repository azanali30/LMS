import { Head, Link, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    ShieldCheck,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    ExternalLink,
    FileText,
    Check,
    X,
    Building2,
    Calendar,
    Download,
} from 'lucide-react';

interface ApprovalRequest {
    id: number;
    email: string;
    plan_slug: string;
    plan_name: string;
    billing_interval: string;
    amount_cents: number;
    amount_formatted: string;
    payment_method: string;
    transaction_reference: string;
    has_receipt: boolean;
    receipt_original_name: string | null;
    receipt_mime: string | null;
    receipt_size_bytes: number | null;
    notes: string | null;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    approved_at: string | null;
    approved_by_name: string | null;
    rejected_at: string | null;
    rejected_by_name: string | null;
    completed_at: string | null;
    created_org_name: string | null;
    created_at: string;
    completion_url: string | null;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    requests: Paginated<ApprovalRequest>;
    counts: {
        pending: number;
        approved: number;
        rejected: number;
        all: number;
    };
    currentStatus: string;
    search: string | null;
}

export default function AdminPaymentApprovals({
    requests,
    counts,
    currentStatus = 'pending',
    search = '',
}: Props) {
    const [searchTerm, setSearchTerm] = useState<string>(search || '');
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/payment-approvals', {
            status: currentStatus,
            search: searchTerm,
        }, { preserveState: true });
    };

    const handleApprove = (id: number) => {
        if (!confirm('Are you sure you want to approve this payment? This will issue a secure completion token and start the 30-day free trial.')) {
            return;
        }

        setActionLoading(id);
        router.post(`/admin/payment-approvals/${id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setActionLoading(null),
        });
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingId) return;

        if (!rejectionReason.trim()) {
            alert('Please specify a rejection reason for the applicant.');
            return;
        }

        setActionLoading(rejectingId);
        router.post(`/admin/payment-approvals/${rejectingId}/reject`, {
            rejection_reason: rejectionReason.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingId(null);
                setRejectionReason('');
            },
            onFinish: () => setActionLoading(null),
        });
    };

    return (
        <TenantLayout title="Platform Administration">
            <Head title="Super Admin — Payment Approvals Panel" />

            {/* Header Banner */}
            <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900 to-purple-950/40 p-6 shadow-xl md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-600/20 text-rose-300">
                        <CreditCard className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tracking-wider text-rose-400 uppercase">
                                Platform Super Admin
                            </span>
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                Protected Operations
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-white sm:text-2xl">
                            Payment Approval Requests
                        </h1>
                        <p className="text-xs text-slate-400">
                            Verify customer deposit slips and authorize 30-day free trial SaaS onboarding workspaces.
                        </p>
                    </div>
                </div>

                <Link
                    href="/admin/dashboard"
                    className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
                >
                    &larr; Return to Platform Metrics
                </Link>
            </div>

            {/* Status KPI Filter Tabs */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { key: 'pending', label: 'Pending Verification', count: counts.pending, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
                        { key: 'approved', label: 'Approved & Issued', count: counts.approved, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                        { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
                        { key: 'all', label: 'All Requests', count: counts.all, color: 'text-slate-300', bg: 'bg-slate-800/60 border-slate-700' },
                    ].map((tab) => {
                        const active = currentStatus === tab.key;
                        return (
                            <Link
                                key={tab.key}
                                href={`/admin/payment-approvals?status=${tab.key}`}
                                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                                    active
                                        ? `${tab.bg} ${tab.color} ring-1 ring-purple-500/40`
                                        : 'border-slate-800 bg-[#0B1220] text-slate-400 hover:border-slate-700 hover:text-white'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className="rounded-full bg-slate-900/80 px-2 py-0.2 text-[10px] font-extrabold">
                                    {tab.count}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search email or txn ID..."
                            className="w-56 rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="cursor-pointer rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* Table Container */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1220] shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            <tr>
                                <th className="px-5 py-3.5">Applicant & Email</th>
                                <th className="px-5 py-3.5">Plan & Amount</th>
                                <th className="px-5 py-3.5">Method & Txn Reference</th>
                                <th className="px-5 py-3.5">Receipt Proof</th>
                                <th className="px-5 py-3.5">Status & Audit</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                            {requests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                                        No payment approval requests found matching the current filter.
                                    </td>
                                </tr>
                            ) : (
                                requests.data.map((req) => (
                                    <tr key={req.id} className="transition hover:bg-slate-900/30">
                                        {/* Email & Date */}
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-white">{req.email}</div>
                                            <div className="text-[11px] text-slate-500">
                                                Submitted: {req.created_at}
                                            </div>
                                            {req.notes && (
                                                <div className="mt-1 max-w-xs text-[10px] italic text-slate-400 truncate" title={req.notes}>
                                                    Notes: "{req.notes}"
                                                </div>
                                            )}
                                        </td>

                                        {/* Plan & Amount */}
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-purple-300">{req.plan_name}</div>
                                            <div className="text-[11px] text-slate-400 font-mono">
                                                {req.amount_formatted} ({req.billing_interval})
                                            </div>
                                        </td>

                                        {/* Method & Txn ID */}
                                        <td className="px-5 py-4">
                                            <div className="text-[11px] font-semibold text-white capitalize">
                                                {req.payment_method.replace('_', ' ')}
                                            </div>
                                            <div className="font-mono text-xs text-amber-300">
                                                {req.transaction_reference}
                                            </div>
                                        </td>

                                        {/* Receipt */}
                                        <td className="px-5 py-4">
                                            {req.has_receipt ? (
                                                <a
                                                    href={`/admin/payment-approvals/${req.id}/receipt`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-purple-300 transition hover:border-purple-500/40 hover:bg-slate-800 hover:text-white"
                                                >
                                                    <FileText className="size-3.5 text-purple-400" />
                                                    <span>View Receipt</span>
                                                    <ExternalLink className="size-3 text-slate-500" />
                                                </a>
                                            ) : (
                                                <span className="text-[11px] text-slate-500">No file attached</span>
                                            )}
                                        </td>

                                        {/* Status & Audit */}
                                        <td className="px-5 py-4">
                                            {req.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                                                    <Clock className="size-3" />
                                                    Pending
                                                </span>
                                            )}

                                            {req.status === 'approved' && (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                                                        <CheckCircle2 className="size-3" />
                                                        Approved
                                                    </span>
                                                    <div className="mt-1 text-[10px] text-slate-500">
                                                        by {req.approved_by_name || 'Admin'} on {req.approved_at}
                                                    </div>
                                                    {req.completed_at ? (
                                                        <div className="text-[10px] text-emerald-400">
                                                            Org Created: {req.created_org_name || 'Active'}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-amber-400">
                                                            Awaiting user completion
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {req.status === 'rejected' && (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                                                        <AlertCircle className="size-3" />
                                                        Rejected
                                                    </span>
                                                    <div className="mt-1 text-[10px] text-slate-500">
                                                        by {req.rejected_by_name || 'Admin'} on {req.rejected_at}
                                                    </div>
                                                    {req.rejection_reason && (
                                                        <div className="mt-0.5 max-w-xs text-[10px] text-rose-300 truncate" title={req.rejection_reason}>
                                                            Reason: {req.rejection_reason}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={actionLoading === req.id}
                                                        className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRejectingId(req.id);
                                                            setRejectionReason('');
                                                        }}
                                                        disabled={actionLoading === req.id}
                                                        className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-600/10 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-600 hover:text-white disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : req.status === 'approved' && req.completion_url ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(req.completion_url || '');
                                                        alert('Completion URL copied to clipboard!');
                                                    }}
                                                    className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                                                >
                                                    Copy Link
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
                        <span className="text-[11px] text-slate-400">
                            Showing page {requests.current_page} of {requests.last_page} ({requests.total} total)
                        </span>
                        <div className="flex items-center gap-1">
                            {requests.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                        link.active
                                            ? 'bg-purple-600 text-white'
                                            : link.url
                                            ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            : 'cursor-not-allowed opacity-30 text-slate-600'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0B1220] p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="size-5 text-rose-400" />
                                <h3 className="text-sm font-bold text-white">Reject Payment Request</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectingId(null)}
                                className="cursor-pointer text-slate-400 hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-400">
                            Please provide a clear reason for rejecting this payment proof. The applicant will receive an automated notification with this explanation and an invitation to resubmit.
                        </p>

                        <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300">
                                    Rejection Reason <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Transaction ID was not found in Standard Chartered account records, or deposit slip was illegible. Please provide a clear screenshot."
                                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 transition focus:border-rose-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectingId(null)}
                                    className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === rejectingId}
                                    className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
