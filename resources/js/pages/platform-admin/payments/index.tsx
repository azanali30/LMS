import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Receipt,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    ExternalLink,
    AlertCircle,
    Download,
} from 'lucide-react';

interface PaymentReq {
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
    notes: string | null;
    status: string;
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

interface Props {
    requests: {
        data: PaymentReq[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    counts: { pending: number; approved: number; rejected: number; all: number };
    currentStatus: string;
    search?: string;
}

export default function PlatformPaymentsIndex({
    requests,
    counts,
    currentStatus = 'pending',
    search: initialSearch = '',
}: Props) {
    const [search, setSearch] = useState(initialSearch);
    const [selectedReq, setSelectedReq] = useState<PaymentReq | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/platform-admin/payments',
            { status: currentStatus, search },
            { preserveState: true }
        );
    };

    const handleStatusTab = (status: string) => {
        router.get(
            '/platform-admin/payments',
            { status, search },
            { preserveState: true }
        );
    };

    const handleApprove = (id: number, email: string) => {
        if (!confirm(`Are you sure you want to approve payment proof for '${email}'? A single-use workspace activation link will be issued.`)) {
            return;
        }
        router.post(`/platform-admin/payments/${id}/approve`);
    };

    const handleConfirmReject = () => {
        if (!selectedReq || !rejectionReason.trim()) return;
        router.post(`/platform-admin/payments/${selectedReq.id}/reject`, {
            reason: rejectionReason,
        }, {
            onSuccess: () => {
                setShowRejectModal(false);
                setSelectedReq(null);
                setRejectionReason('');
            },
        });
    };

    return (
        <PlatformAdminLayout title="Payment Approvals Queue">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Manual Payment Verification</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Verify bank transfer receipts, reconcile transaction IDs, and authorize trial activations.
                    </p>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 text-xs font-semibold">
                    <button
                        onClick={() => handleStatusTab('pending')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            currentStatus === 'pending' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Pending ({counts.pending})
                    </button>
                    <button
                        onClick={() => handleStatusTab('approved')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            currentStatus === 'approved' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Approved ({counts.approved})
                    </button>
                    <button
                        onClick={() => handleStatusTab('rejected')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            currentStatus === 'rejected' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Rejected ({counts.rejected})
                    </button>
                    <button
                        onClick={() => handleStatusTab('')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                            !currentStatus ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        All ({counts.all})
                    </button>
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
                            placeholder="Search by applicant email or transaction reference..."
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

            {/* Payments Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Applicant Email</th>
                                <th className="py-3 px-4">Plan & Amount</th>
                                <th className="py-3 px-4">Transaction Reference</th>
                                <th className="py-3 px-4">Receipt Slip</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Verification Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No payment records found in this category.
                                    </td>
                                </tr>
                            ) : (
                                requests.data.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900 font-mono">{req.email}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">Submitted {req.created_at}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-extrabold text-[#1769E0]">{req.plan_name}</div>
                                            <div className="text-[11px] text-slate-700 font-bold">
                                                {req.amount_formatted} ({req.billing_interval})
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                                            {req.transaction_reference}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {req.has_receipt ? (
                                                <a
                                                    href={`/platform-admin/payments/${req.id}/receipt`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] border border-blue-200 transition"
                                                >
                                                    <Download className="size-3.5" />
                                                    <span>View Slip</span>
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">No receipt attached</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                req.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : req.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {req.status}
                                            </span>
                                            {req.rejection_reason && (
                                                <div className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={req.rejection_reason}>
                                                    {req.rejection_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleApprove(req.id, req.email)}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReq(req);
                                                            setShowRejectModal(true);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : req.status === 'approved' && req.completion_url ? (
                                                <a
                                                    href={req.completion_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline"
                                                >
                                                    <span>Setup Link</span>
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            Page {requests.current_page} of {requests.last_page} ({requests.total} records)
                        </span>
                        <div className="flex items-center gap-1.5">
                            {requests.links.map((link, idx) => (
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

            {/* Rejection Modal */}
            {showRejectModal && selectedReq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                <XCircle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Reject Payment Proof</h3>
                                <p className="text-xs text-slate-500">{selectedReq.email}</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Please provide specific feedback for the school applicant. This reason will be included in their formal notification email with a resubmission portal link.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Feedback / Rejection Reason:
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                placeholder="e.g. Deposit reference does not match bank logs, or receipt image is unreadable..."
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedReq(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!rejectionReason.trim()}
                                onClick={handleConfirmReject}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PlatformAdminLayout>
    );
}
