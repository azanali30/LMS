import { Head, Link } from '@inertiajs/react';
import React from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    ArrowLeft,
    Printer,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
} from 'lucide-react';

interface Props {
    invoice: {
        id: number;
        invoice_number: string;
        organization: {
            name: string;
            email: string;
            address: string | null;
        } | null;
        plan: {
            name: string;
            description: string | null;
        } | null;
        user: {
            name: string;
            email: string;
        } | null;
        amount_cents: number;
        amount_formatted: string;
        currency: string;
        status: string;
        billing_type: string;
        payment_reference: string | null;
        notes: string | null;
        due_date: string | null;
        paid_at: string | null;
        created_at: string;
    };
}

export default function PlatformInvoiceShow({ invoice }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <PlatformAdminLayout title={`Invoice: ${invoice.invoice_number}`}>
            {/* Back link & Print action */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Link
                    href="/platform-admin/invoices"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to Invoices</span>
                </Link>

                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
                >
                    <Printer className="size-3.5" />
                    <span>Print Invoice</span>
                </button>
            </div>

            {/* Printable Invoice Card */}
            <div className="max-w-3xl mx-auto rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 shadow-sm">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <img src="/images/logo.png" alt="InstitutoPropio" className="size-8 object-contain rounded-lg" />
                            <div className="font-extrabold text-lg tracking-tight text-slate-900">
                                Instituto<span className="text-[#1769E0]">Propio</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            The Modern Operating System for Educational Campuses
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            SaaS Platform Billing &bull; ISO 27001 Certified
                        </p>
                    </div>

                    <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Official Invoice</span>
                        <div className="text-xl font-mono font-black text-slate-900 mt-0.5">{invoice.invoice_number}</div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            <span>Status: {invoice.status}</span>
                        </div>
                    </div>
                </div>

                {/* Billing Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-xs">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Billed To:
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{invoice.organization?.name || 'Institution Workspace'}</div>
                        <div className="text-slate-600 font-mono mt-1">{invoice.organization?.email || invoice.user?.email}</div>
                        {invoice.organization?.address && (
                            <div className="text-slate-500 mt-1 whitespace-pre-line">{invoice.organization.address}</div>
                        )}
                        <div className="text-slate-500 mt-1">Contact: {invoice.user?.name}</div>
                    </div>

                    <div className="sm:text-right space-y-2">
                        <div>
                            <span className="text-slate-400 font-medium">Issue Date:</span>
                            <div className="font-bold text-slate-800">{invoice.created_at}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium">Due Date:</span>
                            <div className="font-bold text-slate-800">{invoice.due_date || 'Due Upon Receipt'}</div>
                        </div>
                        {invoice.paid_at && (
                            <div>
                                <span className="text-emerald-600 font-medium">Paid On:</span>
                                <div className="font-bold text-emerald-700">{invoice.paid_at}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left text-xs mb-8">
                    <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="py-3 px-4">Item & Description</th>
                            <th className="py-3 px-4 text-center">Period</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td className="py-4 px-4">
                                <div className="font-bold text-slate-900 text-sm">
                                    InstitutoPropio {invoice.plan?.name || 'SaaS'} Subscription License
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {invoice.plan?.description || 'Campus multi-tenant software license and infrastructure.'}
                                </div>
                            </td>
                            <td className="py-4 px-4 text-center text-slate-600 font-medium">
                                Monthly Recurring
                            </td>
                            <td className="py-4 px-4 text-right font-extrabold text-slate-900 text-sm">
                                {invoice.amount_formatted}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Total */}
                <div className="flex justify-end border-t border-slate-200 pt-4 mb-8">
                    <div className="w-64 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal:</span>
                            <span className="font-bold text-slate-800">{invoice.amount_formatted}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax (0%):</span>
                            <span className="font-bold text-slate-800">$0.00</span>
                        </div>
                        <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                            <span>Total Due:</span>
                            <span className="text-[#1769E0]">{invoice.amount_formatted}</span>
                        </div>
                    </div>
                </div>

                {/* Footer notes */}
                <div className="border-t border-slate-100 pt-6 text-[11px] text-slate-400 text-center space-y-1">
                    <p>Thank you for choosing InstitutoPropio as your institution operating system.</p>
                    <p>For questions regarding billing or invoice reconciliation, contact support@institutopropio.com.</p>
                </div>
            </div>
        </PlatformAdminLayout>
    );
}
