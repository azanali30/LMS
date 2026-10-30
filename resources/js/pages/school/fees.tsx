import { Head, Link, router, useForm } from '@inertiajs/react';
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
    Plus,
    Search,
    Filter,
    ShieldAlert,
    TrendingUp,
    Send,
    Eye,
    Check,
    X,
    Settings,
    Layers,
    UserCheck,
    HelpCircle,
    Sparkles,
} from 'lucide-react';
import TenantLayout from '@/layouts/tenant-layout';
import type { ClassFeeStructure, FeeInvoice, FeePayment } from '@/types/fee';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    invoices: {
        data: FeeInvoice[];
        links: PaginationLink[];
        total: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
    metrics: {
        totalInvoiced: number;
        totalCollected: number;
        totalOutstanding: number;
        overdueBalance: number;
        collectionRate: number;
        counts: {
            paid: number;
            partiallyPaid: number;
            unpaid: number;
            overdue: number;
            dueToday: number;
            dueSoon: number;
            total: number;
        };
    };
    classes: Array<{
        id: number;
        name: string;
        sections: Array<{ id: number; name: string }>;
    }>;
    sections: Array<{
        id: number;
        name: string;
        school_class_id: number;
        schoolClass?: { id: number; name: string };
    }>;
    academicYears: Array<{
        id: number;
        name: string;
        is_current: boolean;
    }>;
    currentAcademicYear?: {
        id: number;
        name: string;
    } | null;
    classFeeStructures: ClassFeeStructure[];
    currency: string;
    filters: {
        class_id?: string;
        section_id?: string;
        academic_year_id?: string;
        billing_month?: string;
        status?: string;
        search?: string;
    };
}

export default function FeesManagementPage({
    invoices,
    metrics,
    classes = [],
    sections = [],
    academicYears = [],
    currentAcademicYear,
    classFeeStructures = [],
    currency = 'USD',
    filters = {},
}: Props) {
    const [activeTab, setActiveTab] = useState<'invoices' | 'structures'>('invoices');

    // Modals
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isClassStructureModalOpen, setIsClassStructureModalOpen] = useState(false);
    const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

    // Selected Invoice for Payment
    const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);

    // Preview Data State for Bulk Generation
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Format money helper
    const formatMoney = (val: number | string | undefined | null) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    // Filter form
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedClass, setSelectedClass] = useState(filters.class_id || '');
    const [selectedSection, setSelectedSection] = useState(filters.section_id || '');
    const [selectedYear, setSelectedYear] = useState(filters.academic_year_id || String(currentAcademicYear?.id || ''));
    const [selectedMonth, setSelectedMonth] = useState(filters.billing_month || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const applyFilters = () => {
        router.get(
            '/school/fees',
            {
                search: searchTerm || undefined,
                class_id: selectedClass || undefined,
                section_id: selectedSection || undefined,
                academic_year_id: selectedYear || undefined,
                billing_month: selectedMonth || undefined,
                status: selectedStatus || undefined,
            },
            { preserveState: true }
        );
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedClass('');
        setSelectedSection('');
        setSelectedMonth('');
        setSelectedStatus('');
        router.get('/school/fees', { academic_year_id: currentAcademicYear?.id });
    };

    // Form: Record Verified Payment
    const paymentForm = useForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        notes: '',
    });

    const openPaymentModal = (invoice: FeeInvoice) => {
        setSelectedInvoice(invoice);
        paymentForm.setData({
            amount: String(invoice.balance_due),
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            reference_number: '',
            notes: '',
        });
        setIsRecordPaymentModalOpen(true);
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        paymentForm.post(`/school/fees/invoices/${selectedInvoice.id}/payments`, {
            onSuccess: () => {
                setIsRecordPaymentModalOpen(false);
                setSelectedInvoice(null);
            },
        });
    };

    // Form: Bulk Invoice Generation
    const generateForm = useForm({
        academic_year_id: currentAcademicYear?.id || (academicYears[0]?.id ?? ''),
        billing_month: new Date().toISOString().slice(0, 7) + '-01',
        due_date: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString().split('T')[0],
        school_class_id: '',
        class_section_id: '',
        include_annual_fee: false,
        include_admission_fee: false,
        notes: '',
    });

    const fetchGenerationPreview = async () => {
        setPreviewLoading(true);
        setPreviewError(null);
        try {
            const res = await fetch('/school/fees/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(generateForm.data),
            });

            if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.message || 'Failed to calculate generation preview.');
            }

            const data = await res.json();
            setPreviewData(data);
        } catch (err: any) {
            setPreviewError(err.message || 'An error occurred while generating preview.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const submitGeneration = (e: React.FormEvent) => {
        e.preventDefault();
        generateForm.post('/school/fees/generate', {
            onSuccess: () => {
                setIsGenerateModalOpen(false);
                setPreviewData(null);
            },
        });
    };

    // Form: Class Fee Structure
    const structureForm = useForm({
        school_class_id: classes[0]?.id || '',
        academic_year_id: currentAcademicYear?.id || (academicYears[0]?.id ?? ''),
        monthly_tuition_fee: '',
        admission_fee: '0',
        annual_fee: '0',
        transport_fee: '0',
        other_recurring_charges: '0',
        due_day: 10,
        late_fee_enabled: false,
        late_fee_amount: '0',
        notes: '',
    });

    const openClassStructureModal = (existing?: ClassFeeStructure) => {
        if (existing) {
            structureForm.setData({
                school_class_id: existing.school_class_id,
                academic_year_id: existing.academic_year_id,
                monthly_tuition_fee: String(existing.monthly_tuition_fee),
                admission_fee: String(existing.admission_fee || 0),
                annual_fee: String(existing.annual_fee || 0),
                transport_fee: String(existing.transport_fee || 0),
                other_recurring_charges: String(existing.other_recurring_charges || 0),
                due_day: existing.due_day || 10,
                late_fee_enabled: existing.late_fee_enabled || false,
                late_fee_amount: String(existing.late_fee_amount || 0),
                notes: existing.notes || '',
            });
        } else {
            structureForm.reset();
        }
        setIsClassStructureModalOpen(true);
    };

    const submitClassStructure = (e: React.FormEvent) => {
        e.preventDefault();
        structureForm.post('/school/fees/class-structure', {
            onSuccess: () => {
                setIsClassStructureModalOpen(false);
            },
        });
    };

    // Automated Reminders Trigger
    const [dryRunReminders, setDryRunReminders] = useState(false);
    const [triggeringReminders, setTriggeringReminders] = useState(false);

    const runRemindersNow = () => {
        setTriggeringReminders(true);
        router.post(
            '/school/fees/reminders/trigger',
            { dry_run: dryRunReminders },
            {
                onFinish: () => {
                    setTriggeringReminders(false);
                    setIsReminderModalOpen(false);
                },
            }
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return {
                    label: 'Paid',
                    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    dot: 'bg-emerald-500',
                };
            case 'partially_paid':
                return {
                    label: 'Partially Paid',
                    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    dot: 'bg-blue-500',
                };
            case 'overdue':
                return {
                    label: 'Overdue',
                    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                    dot: 'bg-rose-500 animate-pulse',
                };
            default:
                return {
                    label: 'Unpaid',
                    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    dot: 'bg-amber-500',
                };
        }
    };

    return (
        <TenantLayout title="Institutional Fee Management">
            <Head title="Fee Management & Billing" />

            <div className="space-y-6">
                {/* Header with Title and Primary Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            <CreditCard className="size-4" />
                            <span>Institutional Finance & Tuition Control</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Fee Management & Billing
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Configure class baseline fee plans, generate idempotent monthly student invoices, track verified collections, and dispatch automated payment reminders.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={() => setIsReminderModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-500"
                        >
                            <Send className="size-3.5" />
                            <span>Send Reminders</span>
                        </button>

                        <a
                            href={`/school/fees/export?${new URLSearchParams(filters as any).toString()}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-500"
                        >
                            <Download className="size-3.5" />
                            <span>Export CSV</span>
                        </a>

                        <button
                            onClick={() => openClassStructureModal()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-sm transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        >
                            <Settings className="size-3.5" />
                            <span>Class Fee Plans</span>
                        </button>

                        <button
                            onClick={() => {
                                setPreviewData(null);
                                setIsGenerateModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:scale-[1.02]"
                        >
                            <Plus className="size-3.5" />
                            <span>Generate Monthly Invoices</span>
                        </button>
                    </div>
                </div>

                {/* Financial Overview Metrics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Total Invoiced
                        </span>
                        <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {currency} {formatMoney(metrics.totalInvoiced)}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {metrics.counts.total} statements in period
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Total Collected
                        </span>
                        <div className="mt-2 text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                            {currency} {formatMoney(metrics.totalCollected)}
                        </div>
                        <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                            Collection Rate: {metrics.collectionRate}%
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Outstanding Dues
                        </span>
                        <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {currency} {formatMoney(metrics.totalOutstanding)}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {metrics.counts.unpaid + metrics.counts.partiallyPaid} open invoices
                        </div>
                    </div>

                    <div className="rounded-2xl border border-rose-500/20 bg-rose-50/40 p-5 shadow-sm dark:border-rose-500/20 dark:bg-rose-950/10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                            Overdue Balance
                        </span>
                        <div className="mt-2 text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                            {currency} {formatMoney(metrics.overdueBalance)}
                        </div>
                        <div className="mt-2 text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                            {metrics.counts.overdue} overdue statements
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Status Breakdown
                        </span>
                        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold">
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {metrics.counts.paid} Paid
                            </span>
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {metrics.counts.partiallyPaid} Partial
                            </span>
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                {metrics.counts.dueSoon} Due Soon
                            </span>
                            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                {metrics.counts.overdue} Overdue
                            </span>
                        </div>
                    </div>
                </div>

                {/* Primary Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                            activeTab === 'invoices'
                                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <FileText className="size-4" />
                        <span>Student Invoices Ledger ({invoices.total})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('structures')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                            activeTab === 'structures'
                                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Layers className="size-4" />
                        <span>Class Baseline Fee Structures ({classFeeStructures.length})</span>
                    </button>
                </div>

                {/* TAB 1: INVOICES LEDGER */}
                {activeTab === 'invoices' && (
                    <div className="space-y-4">
                        {/* Search & Filters Bar */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                                <div className="relative lg:col-span-2">
                                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search student, roll #, admission #, or invoice..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => {
                                            setSelectedClass(e.target.value);
                                            setSelectedSection('');
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">All Sections</option>
                                        {sections
                                            .filter((s) => !selectedClass || String(s.school_class_id) === String(selectedClass))
                                            .map((sec) => (
                                                <option key={sec.id} value={sec.id}>
                                                    {sec.name} ({sec.schoolClass?.name})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partially_paid">Partially Paid</option>
                                        <option value="paid">Paid</option>
                                        <option value="due_soon">Due Soon (3 Days)</option>
                                        <option value="due_today">Due Today</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={applyFilters}
                                        className="flex-1 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700"
                                    >
                                        Filter
                                    </button>
                                    <button
                                        onClick={resetFilters}
                                        className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Invoices Table */}
                        {invoices.data.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                                <FileText className="mx-auto size-10 text-slate-400" />
                                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                    No Fee Invoices Found
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    No fee records matched your search filters. Click "Generate Monthly Invoices" to create billing statements for enrolled students.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-3.5">Invoice #</th>
                                                <th className="px-5 py-3.5">Student</th>
                                                <th className="px-5 py-3.5">Class & Section</th>
                                                <th className="px-5 py-3.5">Billing Month</th>
                                                <th className="px-5 py-3.5">Due Date</th>
                                                <th className="px-5 py-3.5">Total</th>
                                                <th className="px-5 py-3.5">Paid</th>
                                                <th className="px-5 py-3.5">Balance</th>
                                                <th className="px-5 py-3.5">Status</th>
                                                <th className="px-5 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                            {invoices.data.map((invoice) => {
                                                const badge = getStatusBadge(invoice.status);
                                                const isUnpaid = Number(invoice.balance_due) > 0.0001;

                                                return (
                                                    <tr key={invoice.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                                                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                            {invoice.invoice_number}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <Link
                                                                href={`/school/students/${invoice.student_id}`}
                                                                className="font-bold text-slate-900 hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
                                                            >
                                                                {invoice.student?.name}
                                                            </Link>
                                                            <div className="text-[10px] text-slate-400">
                                                                Adm: {invoice.student?.studentProfile?.admission_number || 'N/A'} • Roll: {invoice.studentEnrollment?.roll_number || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                            {invoice.schoolClass?.name} - {invoice.classSection?.name}
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                            {invoice.billing_month ? new Date(invoice.billing_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </td>
                                                        <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                            {invoice.due_date || 'N/A'}
                                                        </td>
                                                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                            {currency} {formatMoney(invoice.total_amount)}
                                                        </td>
                                                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                            {currency} {formatMoney(invoice.paid_amount)}
                                                        </td>
                                                        <td className="px-5 py-4 font-black">
                                                            <span className={isUnpaid ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
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
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {isUnpaid && (
                                                                    <button
                                                                        onClick={() => openPaymentModal(invoice)}
                                                                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition hover:bg-emerald-700"
                                                                        title="Record Verified Payment"
                                                                    >
                                                                        Collect
                                                                    </button>
                                                                )}
                                                                <a
                                                                    href={`/school/fees/invoices/${invoice.id}/download`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                                    title="Print Voucher"
                                                                >
                                                                    <FileText className="size-3.5" />
                                                                </a>
                                                                {invoice.payments && invoice.payments.length > 0 && (
                                                                    <a
                                                                        href={`/school/fees/payments/${invoice.payments[0].id}/download`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="rounded-lg border border-slate-200 bg-white p-1 text-emerald-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800"
                                                                        title="Download Receipt"
                                                                    >
                                                                        <Receipt className="size-3.5" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {invoices.links && invoices.links.length > 3 && (
                                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Showing {invoices.from} to {invoices.to} of {invoices.total} invoices
                                        </span>
                                        <div className="flex gap-1">
                                            {invoices.links.map((link, idx) => (
                                                <button
                                                    key={idx}
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url)}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                                        link.active
                                                            ? 'bg-purple-600 text-white'
                                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: CLASS BASELINE FEE PLANS */}
                {activeTab === 'structures' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Default Class Fee Schedules
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Configure the baseline monthly tuition and fees per class and academic year. Overriding individual students does not alter these baselines, and changing a baseline does not silently modify previously issued invoices.
                                    </p>
                                </div>
                                <button
                                    onClick={() => openClassStructureModal()}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Set Class Plan</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-3.5">Class Level</th>
                                        <th className="px-5 py-3.5">Academic Session</th>
                                        <th className="px-5 py-3.5">Monthly Tuition</th>
                                        <th className="px-5 py-3.5">Transport</th>
                                        <th className="px-5 py-3.5">Other Recurring</th>
                                        <th className="px-5 py-3.5">Admission Fee</th>
                                        <th className="px-5 py-3.5">Annual Fee</th>
                                        <th className="px-5 py-3.5">Due Day</th>
                                        <th className="px-5 py-3.5">Late Fee</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {classes.map((cls) => {
                                        const structure = classFeeStructures.find(
                                            (s) => s.school_class_id === cls.id
                                        );

                                        return (
                                            <tr key={cls.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                                                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                    {cls.name}
                                                </td>
                                                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                    {structure?.academicYear?.name || currentAcademicYear?.name || 'Default Session'}
                                                </td>
                                                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                    {currency} {formatMoney(structure?.monthly_tuition_fee || 0)}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                    {currency} {formatMoney(structure?.transport_fee || 0)}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                    {currency} {formatMoney(structure?.other_recurring_charges || 0)}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                    {currency} {formatMoney(structure?.admission_fee || 0)}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                    {currency} {formatMoney(structure?.annual_fee || 0)}
                                                </td>
                                                <td className="px-5 py-4 font-semibold text-purple-600 dark:text-purple-400">
                                                    {structure?.due_day ? `${structure.due_day}th` : '10th'} of month
                                                </td>
                                                <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                    {structure?.late_fee_enabled ? `${currency} ${formatMoney(structure.late_fee_amount)}` : 'Disabled'}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => openClassStructureModal(structure)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                    >
                                                        <span>Edit Plan</span>
                                                    </button>
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

            {/* MODAL 1: RECORD VERIFIED PAYMENT */}
            {isRecordPaymentModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0e1626]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Record Verified Payment
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Invoice #{selectedInvoice.invoice_number} • {selectedInvoice.student?.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsRecordPaymentModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={submitPayment} className="mt-4 space-y-4">
                            <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs dark:border-purple-900/40 dark:bg-purple-950/20">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-slate-500">Total Invoiced:</span>
                                    <span className="text-slate-900 dark:text-white">{currency} {formatMoney(selectedInvoice.total_amount)}</span>
                                </div>
                                <div className="flex justify-between font-semibold mt-1">
                                    <span className="text-slate-500">Currently Paid:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">{currency} {formatMoney(selectedInvoice.paid_amount)}</span>
                                </div>
                                <div className="flex justify-between font-bold mt-1 text-sm border-t border-purple-200/60 pt-1 dark:border-purple-800/40">
                                    <span className="text-slate-700 dark:text-slate-200">Remaining Balance:</span>
                                    <span className="text-rose-600 dark:text-rose-400">{currency} {formatMoney(selectedInvoice.balance_due)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Payment Amount ({currency}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={selectedInvoice.balance_due}
                                        required
                                        value={paymentForm.data.amount}
                                        onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                    {paymentForm.errors.amount && (
                                        <span className="text-[10px] text-rose-500">{paymentForm.errors.amount}</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Payment Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={paymentForm.data.payment_date}
                                        onChange={(e) => paymentForm.setData('payment_date', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Payment Method *
                                    </label>
                                    <select
                                        value={paymentForm.data.payment_method}
                                        onChange={(e) => paymentForm.setData('payment_method', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="cash">Cash (Counters)</option>
                                        <option value="bank_transfer">Bank Transfer / Deposit</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="card">Debit / Credit Card</option>
                                        <option value="online">Online Payment</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Reference / Cheque / Txn #
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TR-982173"
                                        value={paymentForm.data.reference_number}
                                        onChange={(e) => paymentForm.setData('reference_number', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Notes / Audit Rationale
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Verified deposit against voucher copy..."
                                    value={paymentForm.data.notes}
                                    onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsRecordPaymentModalOpen(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {paymentForm.processing ? 'Saving...' : 'Record Verified Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: BULK MONTHLY INVOICE GENERATION WITH PREVIEW */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0e1626]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Generate Monthly Fee Invoices
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Bulk-generate idempotent invoices for active students with live preview.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsGenerateModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={submitGeneration} className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Academic Session *
                                    </label>
                                    <select
                                        value={generateForm.data.academic_year_id}
                                        onChange={(e) => generateForm.setData('academic_year_id', Number(e.target.value))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {academicYears.map((y) => (
                                            <option key={y.id} value={y.id}>
                                                {y.name} {y.is_current ? '(Active)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Billing Month *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={generateForm.data.billing_month}
                                        onChange={(e) => generateForm.setData('billing_month', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Payment Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={generateForm.data.due_date}
                                        onChange={(e) => generateForm.setData('due_date', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Target Class (Optional)
                                    </label>
                                    <select
                                        value={generateForm.data.school_class_id}
                                        onChange={(e) => {
                                            generateForm.setData({
                                                ...generateForm.data,
                                                school_class_id: e.target.value,
                                                class_section_id: '',
                                            });
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">All Institution Classes</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Target Section (Optional)
                                    </label>
                                    <select
                                        value={generateForm.data.class_section_id}
                                        onChange={(e) => generateForm.setData('class_section_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">All Sections</option>
                                        {sections
                                            .filter((s) => !generateForm.data.school_class_id || String(s.school_class_id) === String(generateForm.data.school_class_id))
                                            .map((sec) => (
                                                <option key={sec.id} value={sec.id}>
                                                    {sec.name} ({sec.schoolClass?.name})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={generateForm.data.include_admission_fee}
                                        onChange={(e) => generateForm.setData('include_admission_fee', e.target.checked)}
                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Include One-time Admission Fee (if assigned)</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={generateForm.data.include_annual_fee}
                                        onChange={(e) => generateForm.setData('include_annual_fee', e.target.checked)}
                                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Include Annual Development Fee</span>
                                </label>
                            </div>

                            {/* Preview Trigger Button */}
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                        Preview Before Bulk Creation
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Detects eligible students and checks existing statements to ensure zero duplicate billing.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchGenerationPreview}
                                    disabled={previewLoading}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3.5 py-1.5 text-xs font-bold text-purple-700 shadow-xs hover:bg-purple-50 dark:border-purple-800 dark:bg-slate-800 dark:text-purple-300"
                                >
                                    <Eye className="size-3.5" />
                                    <span>{previewLoading ? 'Inspecting...' : 'Preview Invoices'}</span>
                                </button>
                            </div>

                            {previewError && (
                                <div className="rounded-xl border border-rose-500/20 bg-rose-50/50 p-3 text-xs text-rose-700 dark:text-rose-400">
                                    {previewError}
                                </div>
                            )}

                            {previewData && (
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                        <div className="rounded-lg bg-white p-2 shadow-xs dark:bg-slate-800">
                                            <span className="text-[10px] text-slate-400 uppercase">Total Enrolled</span>
                                            <div className="font-extrabold text-slate-900 dark:text-white">
                                                {previewData.summary.total_enrolled}
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-emerald-50 p-2 shadow-xs dark:bg-emerald-950/30">
                                            <span className="text-[10px] text-emerald-600 uppercase">To Generate</span>
                                            <div className="font-extrabold text-emerald-700 dark:text-emerald-400">
                                                {previewData.summary.new_to_generate}
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-amber-50 p-2 shadow-xs dark:bg-amber-950/30">
                                            <span className="text-[10px] text-amber-600 uppercase">Already Billed</span>
                                            <div className="font-extrabold text-amber-700 dark:text-amber-400">
                                                {previewData.summary.already_generated} (Skip)
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-purple-50 p-2 shadow-xs dark:bg-purple-950/30">
                                            <span className="text-[10px] text-purple-600 uppercase">Projected Total</span>
                                            <div className="font-extrabold text-purple-700 dark:text-purple-400">
                                                {currency} {formatMoney(previewData.summary.projected_total)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-800">
                                        <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Student Preview (first 10 of {previewData.students.length}):
                                        </div>
                                        {previewData.students.slice(0, 10).map((st: any) => (
                                            <div key={st.student_id} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/50">
                                                <span>{st.student_name} ({st.class_name} - {st.section_name})</span>
                                                {st.already_generated ? (
                                                    <span className="text-amber-600 font-semibold text-[10px]">Already Invoiced (Skipped)</span>
                                                ) : (
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {currency} {formatMoney(st.total_amount)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={generateForm.processing}
                                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {generateForm.processing ? 'Generating Invoices...' : 'Confirm & Generate Invoices'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: CLASS BASELINE FEE STRUCTURE */}
            {isClassStructureModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0e1626]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Configure Class Default Fee Plan
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Set baseline fees. Overriding individual students remains supported.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsClassStructureModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={submitClassStructure} className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        School Class *
                                    </label>
                                    <select
                                        required
                                        value={structureForm.data.school_class_id}
                                        onChange={(e) => structureForm.setData('school_class_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Academic Session *
                                    </label>
                                    <select
                                        required
                                        value={structureForm.data.academic_year_id}
                                        onChange={(e) => structureForm.setData('academic_year_id', Number(e.target.value))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {academicYears.map((y) => (
                                            <option key={y.id} value={y.id}>
                                                {y.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Monthly Tuition ({currency}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={structureForm.data.monthly_tuition_fee}
                                        onChange={(e) => structureForm.setData('monthly_tuition_fee', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Transport Fee ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={structureForm.data.transport_fee}
                                        onChange={(e) => structureForm.setData('transport_fee', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Other Recurring ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={structureForm.data.other_recurring_charges}
                                        onChange={(e) => structureForm.setData('other_recurring_charges', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Admission Fee (One-Time)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={structureForm.data.admission_fee}
                                        onChange={(e) => structureForm.setData('admission_fee', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Annual / Registration
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={structureForm.data.annual_fee}
                                        onChange={(e) => structureForm.setData('annual_fee', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Due Day (1-31) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        required
                                        value={structureForm.data.due_day}
                                        onChange={(e) => structureForm.setData('due_day', parseInt(e.target.value) || 10)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsClassStructureModalOpen(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={structureForm.processing}
                                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {structureForm.processing ? 'Saving...' : 'Save Default Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: AUTOMATED REMINDERS TRIGGER */}
            {isReminderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0e1626]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Automated Fee Reminders
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Evaluates 10-day advance, due-today, and 10-day overdue rules.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsReminderModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-purple-900 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-300 leading-relaxed">
                                <strong>Reminder Dispatch Rules:</strong>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li><strong>10 Days Before Due:</strong> Advance courtesy notification.</li>
                                    <li><strong>Due Today:</strong> Action notice on the exact due date.</li>
                                    <li><strong>10 Days Overdue:</strong> Urgent notice for any unpaid balance.</li>
                                </ul>
                            </div>

                            <p>
                                Reminders are delivered through in-app notification centers and email (when recipient email is configured). Guardian copies are dispatched automatically when linked parent records exist.
                            </p>

                            <label className="flex items-center gap-2 cursor-pointer pt-2">
                                <input
                                    type="checkbox"
                                    checked={dryRunReminders}
                                    onChange={(e) => setDryRunReminders(e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    Dry Run Mode (Simulate without sending real notifications)
                                </span>
                            </label>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsReminderModalOpen(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={runRemindersNow}
                                    disabled={triggeringReminders}
                                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {triggeringReminders ? 'Evaluating...' : dryRunReminders ? 'Run Simulation' : 'Dispatch Reminders Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
