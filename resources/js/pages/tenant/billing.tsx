import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    CreditCard,
    Building2,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    FileText,
    ShieldCheck,
    Send,
    Sparkles,
    AlertTriangle,
    BadgeCheck,
    ArrowUpRight,
    Lock,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    max_organizations: number | null;
    organization_limit: string;
    price_cents: number;
    currency: string;
    billing_interval: string;
    features: string[];
}

interface Subscription {
    id: number;
    status: 'trialing' | 'pending' | 'active' | 'past_due' | 'expired' | 'cancelled';
    billing_type: string;
    is_trialing: boolean;
    is_expired: boolean;
    days_remaining: number;
    starts_at: string | null;
    trial_ends_at: string | null;
    ends_at: string | null;
    plan: Plan | null;
}

interface Entitlement {
    owned_organizations_count: number;
    max_organizations_limit: number | null;
    can_create_more: boolean;
}

interface GatewayInfo {
    name: string;
    is_configured: boolean;
}

interface SubscriptionInvoiceItem {
    id: number;
    invoice_number: string;
    amount_cents: number;
    currency: string;
    billing_type: string;
    status: string;
    payment_reference: string | null;
    notes: string | null;
    verified_at: string | null;
    due_date: string | null;
    paid_at: string | null;
    created_at: string;
    plan: Plan | null;
    verifier?: {
        id: number;
        name: string;
    } | null;
}

interface TransactionItem {
    id: number;
    transaction_reference: string;
    gateway: string;
    event_type: string;
    amount_cents: number;
    currency: string;
    status: string;
    processed_at: string | null;
}

interface BillingProps {
    organization: {
        id: number;
        name: string;
        slug: string;
        status: string;
    };
    subscription: Subscription | null;
    entitlement: Entitlement;
    gateway: GatewayInfo;
    invoices: SubscriptionInvoiceItem[];
    transactions: TransactionItem[];
    availablePlans: Plan[];
}

export default function SubscriptionBilling({
    organization,
    subscription,
    entitlement,
    gateway,
    invoices,
    transactions,
    availablePlans,
}: BillingProps) {
    const { auth } = usePage().props as any;
    const isSuperAdmin = Boolean(auth?.user?.roles?.includes('super-admin') || auth?.user?.is_super_admin);

    const [selectedTab, setSelectedTab] = useState<'overview' | 'invoice_request' | 'history'>('overview');
    const [verifyingInvoiceId, setVerifyingInvoiceId] = useState<number | null>(null);

    // Form: Request Manual Invoice
    const invoiceForm = useForm({
        plan_id: subscription?.plan?.id || (availablePlans[0]?.id ?? ''),
        notes: '',
    });

    // Form: Admin Verify Payment
    const verifyForm = useForm({
        payment_reference: '',
        notes: '',
    });

    const handleInvoiceRequest = (e: React.FormEvent) => {
        e.preventDefault();
        invoiceForm.post('/organizations/billing/invoice', {
            onSuccess: () => {
                invoiceForm.reset('notes');
                setSelectedTab('history');
            },
        });
    };

    const handleAdminVerify = (invoiceId: number, e: React.FormEvent) => {
        e.preventDefault();
        verifyForm.post(`/admin/subscriptions/invoices/${invoiceId}/verify`, {
            onSuccess: () => {
                setVerifyingInvoiceId(null);
                verifyForm.reset();
            },
        });
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'trialing':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">
                        <Sparkles className="size-3.5" />
                        30-Day Free Trial
                    </span>
                );
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-700/10 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" />
                        Active Subscription
                    </span>
                );
            case 'past_due':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-700/10 dark:bg-amber-900/30 dark:text-amber-300">
                        <AlertTriangle className="size-3.5" />
                        Past Due
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-700/10 dark:bg-rose-900/30 dark:text-rose-300">
                        <AlertCircle className="size-3.5" />
                        Trial Expired
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-700/10 dark:bg-slate-800 dark:text-slate-300">
                        <Clock className="size-3.5" />
                        Pending Verification
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {status || 'Unknown'}
                    </span>
                );
        }
    };

    return (
        <TenantLayout title="Subscription & Billing">
            <Head title={`Subscription & Billing — ${organization.name}`} />

            <div className="mx-auto max-w-6xl space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="size-6 text-[#1769E0]" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                SaaS Subscription & Entitlements
                            </h1>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Workspace tier, 30-day trial status, multi-organization limits, and verified invoice management.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {getStatusBadge(subscription?.status)}
                    </div>
                </div>

                {/* Trial Expiry Warning Banner (If Expired or Nearing Expiry) */}
                {subscription?.is_expired && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <div>
                                <h3 className="text-sm font-bold">Your 30-Day Free Trial Has Ended</h3>
                                <p className="mt-1 text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                                    All school data and academic records remain safely preserved. To resume administrative write operations, please request an invoice or complete verification with our platform team.
                                </p>
                                <div className="mt-3">
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedTab('invoice_request')}
                                        className="h-8 bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
                                    >
                                        Request Renewal Invoice
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metric Overview Grid */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {/* Card 1: Current Plan */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                            <BadgeCheck className="size-4 text-[#1769E0]" />
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                {subscription?.plan?.name || 'Standard Trial'}
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {subscription?.plan?.description || '30-day comprehensive workspace trial.'}
                        </p>
                        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500 dark:border-slate-800">
                            No student or teacher seat limits imposed.
                        </div>
                    </div>

                    {/* Card 2: 30-Day Trial Status */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trial Period</span>
                            <Clock className="size-4 text-blue-500" />
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                {subscription?.days_remaining ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">days remaining</span>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex justify-between">
                                <span>Started:</span>
                                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                    {subscription?.starts_at ? new Date(subscription.starts_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Expires:</span>
                                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                    {subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Organization Entitlement */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Organization Limit</span>
                            <Building2 className="size-4 text-emerald-500" />
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                {entitlement.owned_organizations_count}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                                of {entitlement.max_organizations_limit === null ? 'Unlimited' : entitlement.max_organizations_limit} Allowed
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Governed by your highest active owner tier entitlement.
                        </p>
                        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold dark:border-slate-800">
                            {entitlement.can_create_more ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    ✓ Eligible to provision additional schools
                                </span>
                            ) : (
                                <span className="text-amber-600 dark:text-amber-400">
                                    Plan capacity reached. Upgrade for more campuses.
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-200 text-xs font-semibold dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setSelectedTab('overview')}
                        className={`border-b-2 px-5 py-3 transition-colors ${
                            selectedTab === 'overview'
                                ? 'border-[#1769E0] text-[#1769E0]'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Billing Overview & Channels
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('invoice_request')}
                        className={`border-b-2 px-5 py-3 transition-colors ${
                            selectedTab === 'invoice_request'
                                ? 'border-[#1769E0] text-[#1769E0]'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Request Manual Invoice / Contact Sales
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('history')}
                        className={`border-b-2 px-5 py-3 transition-colors ${
                            selectedTab === 'history'
                                ? 'border-[#1769E0] text-[#1769E0]'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Invoice & Transaction History ({invoices.length})
                    </button>
                </div>

                {/* TAB 1: OVERVIEW & CHANNELS */}
                {selectedTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Two Channels Grid */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Channel A: Online Payment Integration */}
                            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="size-5 text-[#1769E0]" />
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                Online Card / Gateway Billing
                                            </h3>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {gateway.name}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        SkillForge supports direct credit card and recurring digital payments via server-side verified webhooks with idempotent transaction replay protection.
                                    </p>

                                    {/* Integration Notice */}
                                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                                        <div className="flex items-start gap-2.5">
                                            <Lock className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <strong className="block font-semibold">Payment Gateway Integration Note:</strong>
                                                <span>
                                                    Live gateway credentials (e.g. Stripe, Razorpay) are pending final administrative selection. No fake test checkouts are displayed. You may proceed via official manual invoice.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        disabled
                                        variant="outline"
                                        className="w-full text-xs font-semibold cursor-not-allowed opacity-60"
                                    >
                                        Online Checkout (Gateway Pending Configuration)
                                    </Button>
                                </div>
                            </div>

                            {/* Channel B: Manual Invoice & Contact Sales */}
                            <div className="flex flex-col justify-between rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/30 to-white p-7 shadow-xs dark:border-blue-900/40 dark:bg-slate-900">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-5 text-[#1769E0]" />
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                Manual Invoice / Wire Transfer
                                            </h3>
                                        </div>
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                            Recommended for Institutions
                                        </span>
                                    </div>

                                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                        Generate an official invoice for institutional purchase orders, wire transfers, or direct purchase agreements. All manual payments are audited and verified by platform administrators.
                                    </p>

                                    <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="size-3.5 text-blue-600" />
                                            <span>Formal institution purchase order documentation</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="size-3.5 text-blue-600" />
                                            <span>Multi-campus billing consolidated in one invoice</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="size-3.5 text-blue-600" />
                                            <span>Dedicated verification audit trail</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        onClick={() => setSelectedTab('invoice_request')}
                                        className="w-full bg-[#1769E0] text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#1256B8]"
                                    >
                                        <span>Request Official Invoice</span>
                                        <ArrowUpRight className="ml-1.5 size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Entitlement Plans Reference */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Available Multi-Tenant Plan Tiers
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Plan capacity applies directly to your master owner account across all campus deployments.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {availablePlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`rounded-2xl border p-4 transition-all ${
                                            subscription?.plan?.id === plan.id
                                                ? 'border-[#1769E0] bg-blue-50/30 ring-1 ring-[#1769E0] dark:bg-blue-950/20'
                                                : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                {plan.name}
                                            </h4>
                                            {subscription?.plan?.id === plan.id && (
                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs font-bold text-[#1769E0]">
                                            {plan.organization_limit}
                                        </div>
                                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                            {plan.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: REQUEST MANUAL INVOICE */}
                {selectedTab === 'invoice_request' && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="max-w-2xl">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Request Official Institutional Invoice
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Submitting this request creates an official pending invoice. A platform administrator will review your organization details and verify payment upon bank transfer.
                            </p>

                            <form onSubmit={handleInvoiceRequest} className="mt-6 space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="plan_select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Select Target Plan Tier *
                                    </Label>
                                    <select
                                        id="plan_select"
                                        value={invoiceForm.data.plan_id}
                                        onChange={(e) => invoiceForm.setData('plan_id', Number(e.target.value))}
                                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#1769E0] focus:ring-1 focus:ring-[#1769E0] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        {availablePlans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} Plan — {plan.organization_limit}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={invoiceForm.errors.plan_id} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="invoice_notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Purchase Order / Institution Notes (Optional)
                                    </Label>
                                    <textarea
                                        id="invoice_notes"
                                        rows={4}
                                        placeholder="Include PO Number, billing department contact, or campus details..."
                                        value={invoiceForm.data.notes}
                                        onChange={(e) => invoiceForm.setData('notes', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-[#1769E0] focus:ring-1 focus:ring-[#1769E0] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                    <InputError message={invoiceForm.errors.notes} />
                                </div>

                                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                                    <p>
                                        <strong>Important Safeguard:</strong> Submitting an invoice request does not automatically activate a paid plan. Subscription activation requires formal verification by an authorized platform administrator.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={invoiceForm.processing}
                                    className="bg-[#1769E0] text-xs font-bold text-white hover:bg-[#1256B8]"
                                >
                                    {invoiceForm.processing ? 'Submitting Invoice Request...' : 'Submit Invoice Request'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 3: INVOICE & TRANSACTION HISTORY */}
                {selectedTab === 'history' && (
                    <div className="space-y-6">
                        {/* Invoices Table */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                    Subscription Invoices
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Official invoices requested and recorded for this institution.
                                </p>
                            </div>

                            {invoices.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    No invoices requested yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-3.5">Invoice #</th>
                                                <th className="px-5 py-3.5">Plan</th>
                                                <th className="px-5 py-3.5">Type</th>
                                                <th className="px-5 py-3.5">Status</th>
                                                <th className="px-5 py-3.5">Due Date</th>
                                                <th className="px-5 py-3.5">Verification</th>
                                                {isSuperAdmin && <th className="px-5 py-3.5 text-right">Admin Action</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {invoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                                                        {inv.invoice_number}
                                                    </td>
                                                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                        {inv.plan?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-5 py-4 capitalize text-slate-500">
                                                        {inv.billing_type.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {inv.status === 'paid' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                <CheckCircle2 className="size-3" /> Paid & Verified
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                                <Clock className="size-3" /> Pending Verification
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500 font-mono">
                                                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-5 py-4 text-[11px] text-slate-500">
                                                        {inv.verified_at ? (
                                                            <div>
                                                                <div className="font-medium text-emerald-600 dark:text-emerald-400">
                                                                    By {inv.verifier?.name || 'Platform Admin'}
                                                                </div>
                                                                <div className="font-mono text-[10px] text-slate-400">
                                                                    Ref: {inv.payment_reference}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">Awaiting review</span>
                                                        )}
                                                    </td>
                                                    {isSuperAdmin && (
                                                        <td className="px-5 py-4 text-right">
                                                            {inv.status === 'pending' && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => setVerifyingInvoiceId(inv.id)}
                                                                    className="h-7 bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700"
                                                                >
                                                                    Verify Payment
                                                                </Button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Super Admin Modal for Manual Payment Verification */}
                        {verifyingInvoiceId && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                                <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <ShieldCheck className="size-5" />
                                        <h3 className="font-bold text-base">Super Admin Payment Verification</h3>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Confirming this payment will mark the invoice paid and activate the subscription.
                                    </p>

                                    <form onSubmit={(e) => handleAdminVerify(verifyingInvoiceId, e)} className="mt-4 space-y-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="pay_ref" className="text-xs text-slate-300">
                                                Bank / Transaction Reference *
                                            </Label>
                                            <Input
                                                id="pay_ref"
                                                type="text"
                                                required
                                                placeholder="e.g. WIRE-8849201"
                                                value={verifyForm.data.payment_reference}
                                                onChange={(e) => verifyForm.setData('payment_reference', e.target.value)}
                                                className="h-9 border-slate-700 bg-slate-800 text-xs text-white"
                                            />
                                            <InputError message={verifyForm.errors.payment_reference} />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="pay_notes" className="text-xs text-slate-300">
                                                Verification Notes (Optional)
                                            </Label>
                                            <Input
                                                id="pay_notes"
                                                type="text"
                                                placeholder="e.g. Verified via institution bank statement"
                                                value={verifyForm.data.notes}
                                                onChange={(e) => verifyForm.setData('notes', e.target.value)}
                                                className="h-9 border-slate-700 bg-slate-800 text-xs text-white"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setVerifyingInvoiceId(null)}
                                                className="text-xs text-slate-400 hover:text-white"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={verifyForm.processing}
                                                className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                                            >
                                                {verifyForm.processing ? 'Verifying...' : 'Authorize & Activate'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
