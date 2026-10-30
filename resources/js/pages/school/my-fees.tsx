import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    CreditCard,
    DollarSign,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    Download,
    Receipt,
    Bus,
    Award,
    ShieldAlert,
    ChevronRight,
    Users,
    ArrowUpRight,
    Sparkles,
} from 'lucide-react';
import TenantLayout from '@/layouts/tenant-layout';
import type { FeeInvoice, FeePayment, StudentFeeStructure } from '@/types/fee';

interface Props {
    student: {
        id: number;
        name: string;
        email: string;
        studentProfile?: {
            admission_number?: string;
            admission_date?: string;
            phone?: string;
        };
    } | null;
    activeEnrollment?: {
        id: number;
        roll_number?: string;
        classSection?: {
            id: number;
            name: string;
            schoolClass?: {
                id: number;
                name: string;
            };
        };
        academicYear?: {
            id: number;
            name: string;
        };
    } | null;
    feeStructure?: StudentFeeStructure | null;
    invoices: FeeInvoice[];
    payments: FeePayment[];
    metrics: {
        monthlyTuitionFee: number;
        transportFee: number;
        otherRecurringCharges: number;
        discountAmount: number;
        discountType: string;
        discountReason?: string | null;
        netMonthlyFee: number;
        totalInvoiced: number;
        totalPaid: number;
        totalOutstanding: number;
        nextDueDate?: string | null;
        currentStatus: 'paid' | 'partially_paid' | 'due_soon' | 'due_today' | 'overdue' | 'unpaid';
    };
    currency: string;
    isParent?: boolean;
    linkedChildren?: Array<{
        student_id: number;
        student: {
            id: number;
            name: string;
            studentProfile?: {
                admission_number?: string;
            };
            studentEnrollments?: Array<{
                classSection?: {
                    name: string;
                    schoolClass?: {
                        name: string;
                    };
                };
            }>;
        };
    }>;
}

export default function MyFeesPage({
    student,
    activeEnrollment,
    feeStructure,
    invoices = [],
    payments = [],
    metrics,
    currency = 'USD',
    isParent = false,
    linkedChildren = [],
}: Props) {
    const [selectedTab, setSelectedTab] = useState<'invoices' | 'payments' | 'structure'>('invoices');

    const formatMoney = (val: number | string | undefined | null) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return {
                    label: 'Paid in Full',
                    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    dot: 'bg-emerald-500',
                    icon: CheckCircle2,
                };
            case 'partially_paid':
                return {
                    label: 'Partially Paid',
                    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    dot: 'bg-blue-500',
                    icon: Clock,
                };
            case 'due_today':
                return {
                    label: 'Due Today',
                    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    dot: 'bg-amber-500 animate-pulse',
                    icon: AlertCircle,
                };
            case 'due_soon':
                return {
                    label: 'Due Soon',
                    bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                    dot: 'bg-indigo-500',
                    icon: Calendar,
                };
            case 'overdue':
                return {
                    label: 'Payment Overdue',
                    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                    dot: 'bg-rose-500 animate-pulse',
                    icon: ShieldAlert,
                };
            default:
                return {
                    label: 'Unpaid',
                    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    dot: 'bg-amber-500',
                    icon: Clock,
                };
        }
    };

    const statusBadge = getStatusBadge(metrics.currentStatus);

    return (
        <TenantLayout title={isParent ? "Children Fees & Payments" : "My Fees & Payments"}>
            <Head title={isParent ? "Children Fees & Payments" : "My Fees & Payments"} />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            <CreditCard className="size-4" />
                            <span>Institutional Student Billing Portal</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {isParent ? 'Children Fees & Tuition Statements' : 'My Fees & Payments'}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            View official academic tuition vouchers, verified payment history, and outstanding institutional dues.
                        </p>
                    </div>

                    {/* Linked Children Switcher for Parents */}
                    {isParent && linkedChildren.length > 1 && (
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <Users className="size-4 text-purple-600 ml-2 dark:text-purple-400" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Child:</span>
                            <select
                                value={student?.id || ''}
                                onChange={(e) => router.get('/school/my-fees', { student_id: e.target.value })}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                                {linkedChildren.map((child) => (
                                    <option key={child.student_id} value={child.student_id}>
                                        {child.student.name} ({child.student.studentProfile?.admission_number || 'Enrolled'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Scope clarification notice */}
                <div className="flex items-center gap-2.5 rounded-xl border border-purple-200/80 bg-purple-50/60 px-4 py-2.5 text-xs text-purple-900 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-300">
                    <Sparkles className="size-4 shrink-0 text-purple-600 dark:text-purple-400" />
                    <span>
                        <strong>Note:</strong> Institutional tuition fee billing represents official academy / school charges. Online LMS course catalogs are separate and independent.
                    </span>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Current Outstanding Balance Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Outstanding Balance
                            </span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusBadge.bg}`}>
                                <span className={`size-1.5 rounded-full ${statusBadge.dot}`} />
                                {statusBadge.label}
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                {currency} {formatMoney(metrics.totalOutstanding)}
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {metrics.totalOutstanding > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                    Next Due: {metrics.nextDueDate || 'Immediate'}
                                </span>
                            ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="size-3.5" /> All dues cleared!
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Net Monthly Tuition Plan */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-[#0B1220]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Net Monthly Fee Plan
                        </span>
                        <div className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {currency} {formatMoney(metrics.netMonthlyFee)}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Base: {currency} {formatMoney(metrics.monthlyTuitionFee)}</span>
                            {metrics.discountAmount > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                    -{currency} {formatMoney(metrics.discountAmount)} Off
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Total Amount Paid */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-[#0B1220]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Total Settled & Paid
                        </span>
                        <div className="mt-3 text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                            {currency} {formatMoney(metrics.totalPaid)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Across {payments.length} verified transaction{payments.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    {/* Lifetime Invoiced */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-[#0B1220]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Total Invoiced to Date
                        </span>
                        <div className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {currency} {formatMoney(metrics.totalInvoiced)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {invoices.length} billing statement{invoices.length === 1 ? '' : 's'} issued
                        </div>
                    </div>
                </div>

                {/* Student Enrollment Card */}
                {student && (
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-transparent p-5 dark:border-slate-800 dark:bg-[#0B1220]/60">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-base font-extrabold text-white shadow-md shadow-purple-500/20">
                                    {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {student.name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span>Admission #{student.studentProfile?.admission_number || 'N/A'}</span>
                                        <span>•</span>
                                        <span>Roll #{activeEnrollment?.roll_number || 'N/A'}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                                            {activeEnrollment?.classSection?.schoolClass?.name || 'Class'} ({activeEnrollment?.classSection?.name || 'Section'})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {invoices.length > 0 && (
                                    <a
                                        href={`/school/fees/invoices/${invoices[0].id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-sm transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                    >
                                        <Download className="size-3.5" />
                                        <span>Download Latest Voucher</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setSelectedTab('invoices')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                            selectedTab === 'invoices'
                                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <FileText className="size-4" />
                        <span>Fee Invoices & Vouchers ({invoices.length})</span>
                    </button>
                    <button
                        onClick={() => setSelectedTab('payments')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                            selectedTab === 'payments'
                                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Receipt className="size-4" />
                        <span>Payment Receipts ({payments.length})</span>
                    </button>
                    <button
                        onClick={() => setSelectedTab('structure')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                            selectedTab === 'structure'
                                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Award className="size-4" />
                        <span>Assigned Fee Structure & Concessions</span>
                    </button>
                </div>

                {/* TAB 1: INVOICES & VOUCHERS */}
                {selectedTab === 'invoices' && (
                    <div className="space-y-4">
                        {invoices.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                                <FileText className="mx-auto size-10 text-slate-400" />
                                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                    No Fee Invoices Issued Yet
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    No monthly fee vouchers have been generated for this student yet. Monthly billing statements will appear here upon institutional generation.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-3.5">Invoice #</th>
                                                <th className="px-5 py-3.5">Billing Month</th>
                                                <th className="px-5 py-3.5">Issue Date</th>
                                                <th className="px-5 py-3.5">Due Date</th>
                                                <th className="px-5 py-3.5">Total Amount</th>
                                                <th className="px-5 py-3.5">Paid Amount</th>
                                                <th className="px-5 py-3.5">Balance Due</th>
                                                <th className="px-5 py-3.5">Status</th>
                                                <th className="px-5 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                            {invoices.map((invoice) => {
                                                const badge = getStatusBadge(invoice.status);
                                                const formattedMonth = invoice.billing_month
                                                    ? new Date(invoice.billing_month).toLocaleDateString('en-US', {
                                                          month: 'long',
                                                          year: 'numeric',
                                                      })
                                                    : 'N/A';

                                                return (
                                                    <tr key={invoice.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                                                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                            {invoice.invoice_number}
                                                        </td>
                                                        <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                                            {formattedMonth}
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                            {invoice.issue_date || 'N/A'}
                                                        </td>
                                                        <td className="px-5 py-4 font-semibold text-rose-600 dark:text-rose-400">
                                                            {invoice.due_date || 'N/A'}
                                                        </td>
                                                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                            {currency} {formatMoney(invoice.total_amount)}
                                                        </td>
                                                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                            {currency} {formatMoney(invoice.paid_amount)}
                                                        </td>
                                                        <td className="px-5 py-4 font-black">
                                                            <span className={Number(invoice.balance_due) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                                                                {currency} {formatMoney(invoice.balance_due)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.bg}`}>
                                                                <span className={`size-1.5 rounded-full ${badge.dot}`} />
                                                                {badge.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <a
                                                                href={`/school/fees/invoices/${invoice.id}/download`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-xs transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-500 dark:hover:bg-purple-900/30"
                                                            >
                                                                <Download className="size-3" />
                                                                <span>Voucher</span>
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: VERIFIED PAYMENT RECEIPTS */}
                {selectedTab === 'payments' && (
                    <div className="space-y-4">
                        {payments.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                                <Receipt className="mx-auto size-10 text-slate-400" />
                                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                    No Payment Receipts Found
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    Payments recorded and verified by institution administration will be archived here with downloadable official receipts.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-3.5">Receipt #</th>
                                                <th className="px-5 py-3.5">Payment Date</th>
                                                <th className="px-5 py-3.5">Method</th>
                                                <th className="px-5 py-3.5">Reference / Txn</th>
                                                <th className="px-5 py-3.5">Amount Paid</th>
                                                <th className="px-5 py-3.5">Received By</th>
                                                <th className="px-5 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                            {payments.map((payment) => (
                                                <tr key={payment.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                                                    <td className="px-5 py-4 font-bold text-purple-600 dark:text-purple-400">
                                                        {payment.payment_number}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                        {payment.payment_date || 'N/A'}
                                                    </td>
                                                    <td className="px-5 py-4 font-semibold capitalize text-slate-800 dark:text-slate-200">
                                                        {payment.payment_method.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                        {payment.reference_number || '-'}
                                                    </td>
                                                    <td className="px-5 py-4 font-black text-emerald-600 dark:text-emerald-400">
                                                        {currency} {formatMoney(payment.amount)}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                        {payment.receiver?.name || 'Accounts Staff'}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <a
                                                            href={`/school/fees/payments/${payment.id}/download`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/30"
                                                        >
                                                            <Receipt className="size-3" />
                                                            <span>Official Receipt</span>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: ASSIGNED FEE STRUCTURE & CONCESSIONS */}
                {selectedTab === 'structure' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Breakdown Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                Monthly Recurring Breakdown
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                                            <CreditCard className="size-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">Monthly Tuition</div>
                                            <div className="text-[10px] text-slate-400">Core academic instruction</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                        {currency} {formatMoney(metrics.monthlyTuitionFee)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                                            <Bus className="size-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">Transport Charges</div>
                                            <div className="text-[10px] text-slate-400">Institutional transit / bus</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                        {currency} {formatMoney(metrics.transportFee)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                                            <Award className="size-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">Lab & Amenities</div>
                                            <div className="text-[10px] text-slate-400">Sports, IT & library dues</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                        {currency} {formatMoney(metrics.otherRecurringCharges)}
                                    </span>
                                </div>

                                {metrics.discountAmount > 0 && (
                                    <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                                        <div>
                                            <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                                Scholarship / Concession
                                            </div>
                                            <div className="text-[10px] text-amber-700 dark:text-amber-400">
                                                {metrics.discountReason || 'Authorized Institutional Concession'}
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                                            -{currency} {formatMoney(metrics.discountAmount)}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                        Net Monthly Payable:
                                    </span>
                                    <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                                        {currency} {formatMoney(metrics.netMonthlyFee)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Policy Details */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                Institutional Billing Policy
                            </h3>
                            <div className="space-y-4 text-xs">
                                <div>
                                    <span className="text-slate-400">Billing Due Day Policy:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {feeStructure?.due_day ? `${feeStructure.due_day}th of every billing cycle` : '10th of every calendar month'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Billing Frequency:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white capitalize">
                                        {feeStructure?.payment_frequency || 'Monthly'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Fee Category:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white capitalize">
                                        {feeStructure?.fee_category || 'General Enrollment'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Payment Channels:</span>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Submit payments via verified Bank Deposit Slip, Accounts Office Cashier, or online institutional bank transfer with voucher invoice number reference.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
