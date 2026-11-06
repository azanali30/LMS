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
    RefreshCw,
    XCircle,
    History,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { openPaddleCheckout } from '@/lib/paddle';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    max_organizations: number | null;
    organization_limit: string;
    price_cents: number;
    price_annual_cents?: number;
    price_monthly_formatted?: string;
    price_annual_formatted?: string;
    price_formatted?: string;
    currency: string;
    billing_interval?: string;
    features: string[];
    is_custom?: boolean;
}

interface Subscription {
    id: number;
    status: 'pending_payment_method' | 'trialing' | 'pending' | 'active' | 'past_due' | 'expired' | 'cancelled';
    billing_type: string;
    billing_interval?: string;
    currency?: string;
    payment_method?: string | null;
    payment_method_status?: string;
    is_pending_payment_method?: boolean;
    is_trialing: boolean;
    is_expired: boolean;
    is_active?: boolean;
    days_remaining: number;
    starts_at: string | null;
    trial_ends_at: string | null;
    ends_at: string | null;
    cancelled_at?: string | null;
    plan: Plan | null;
}

interface Entitlement {
    owned_organizations_count: number;
    max_organizations_limit: number | null;
    can_create_more: boolean;
    limit_text?: string;
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

interface SubscriptionHistoryItem {
    id: number;
    event: string;
    from_status: string | null;
    to_status: string | null;
    billing_interval: string | null;
    created_at: string;
    from_plan?: { name: string } | null;
    to_plan?: { name: string } | null;
    user?: { name: string } | null;
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
    histories?: SubscriptionHistoryItem[];
    availablePlans: Plan[];
    devBypassEnabled?: boolean;
}

export default function SubscriptionBilling({
    organization,
    subscription,
    entitlement,
    gateway,
    invoices,
    transactions,
    histories = [],
    availablePlans,
    devBypassEnabled = false,
}: BillingProps) {
    const { auth } = usePage().props as any;
    const isSuperAdmin = Boolean(auth?.user?.roles?.includes('super-admin') || auth?.user?.is_super_admin);

    const [selectedTab, setSelectedTab] = useState<'overview' | 'invoice_request' | 'history'>('overview');
    const [verifyingInvoiceId, setVerifyingInvoiceId] = useState<number | null>(null);

    // Form: Request Manual Invoice
    const invoiceForm = useForm({
        plan_id: subscription?.plan?.id || (availablePlans[0]?.id ?? ''),
        billing_interval: subscription?.billing_interval || 'monthly',
        notes: '',
    });

    // Form: Change Plan / Interval
    const planForm = useForm({
        plan_id: subscription?.plan?.id || (availablePlans[0]?.id ?? ''),
        billing_interval: subscription?.billing_interval || 'monthly',
    });

    // Form: Admin Verify Payment
    const verifyForm = useForm({
        payment_reference: '',
        notes: '',
    });

    // Form: Dev Trial Activate
    const devForm = useForm({});

    // Form: Cancel Subscription
    const cancelForm = useForm({
        reason: '',
    });

    const [isLaunchingPaddle, setIsLaunchingPaddle] = useState(false);

    const handlePaddleCheckout = async (planId?: number, interval?: string) => {
        setIsLaunchingPaddle(true);
        try {
            const targetPlan = availablePlans.find((p) => p.id === (planId || Number(planForm.data.plan_id)));
            const targetInterval = interval || planForm.data.billing_interval || 'monthly';
            if (!targetPlan) {
                alert('Please select a valid plan.');
                return;
            }

            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/billing/paddle/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    plan_slug: targetPlan.slug,
                    interval: targetInterval,
                    organization_id: organization.id,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to initiate Paddle checkout.');
                return;
            }

            if (data.is_custom) {
                window.location.href = data.contact_url || '/contact';
                return;
            }

            if (!data.checkout?.price_id) {
                alert('Paddle Price ID is pending Sandbox configuration in your .env or Paddle Dashboard. Please contact support.');
                return;
            }

            openPaddleCheckout({
                clientToken: data.checkout.client_token,
                environment: data.checkout.environment,
                priceId: data.checkout.price_id,
                customerEmail: data.checkout.customer?.email,
                customerName: data.checkout.customer?.name,
                customData: data.checkout.custom_data,
            });
        } catch (e: any) {
            alert(e.message || 'Error communicating with billing server.');
        } finally {
            setIsLaunchingPaddle(false);
        }
    };

    const handleInvoiceRequest = (e: React.FormEvent) => {
        e.preventDefault();
        invoiceForm.post('/organizations/billing/invoice', {
            onSuccess: () => {
                invoiceForm.reset('notes');
                setSelectedTab('history');
            },
        });
    };

    const handlePlanChange = (e: React.FormEvent) => {
        e.preventDefault();
        planForm.post('/organizations/billing/plan', {
            preserveScroll: true,
        });
    };

    const handleDevTrialBypass = (e: React.FormEvent) => {
        e.preventDefault();
        devForm.post('/organizations/billing/dev-trial-activate', {
            preserveScroll: true,
        });
    };

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (confirm('Are you sure you want to cancel your subscription? Your school and student records will remain completely preserved under read-only policy.')) {
            cancelForm.post('/organizations/billing/cancel');
        }
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
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-700/10 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" />
                        Active Subscription
                    </span>
                );
            case 'pending_payment_method':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-700/10 dark:bg-amber-900/30 dark:text-amber-300">
                        <Clock className="size-3.5" />
                        Pending Payment Method
                    </span>
                );
            case 'trialing':
            case 'trial':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#078675] ring-1 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">
                        <Sparkles className="size-3.5" />
                        30-Day Free Trial
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-700/10 dark:bg-rose-900/30 dark:text-rose-300">
                        <AlertCircle className="size-3.5" />
                        Trial Expired
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-700/10 dark:bg-slate-800 dark:text-slate-300">
                        <XCircle className="size-3.5" />
                        Cancelled
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
                            <CreditCard className="size-6 text-[#078675]" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                SaaS Subscription & Entitlements
                            </h1>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Manage your InstitutoPropio plan, billing interval, institution quotas, and invoices.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {getStatusBadge(subscription?.status)}
                    </div>
                </div>

                {/* Banner: Pending Payment Method Verification */}
                {subscription?.is_pending_payment_method && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <h3 className="text-sm font-bold">Payment Method Setup Required</h3>
                                    <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                                        Your 30-day free trial will activate automatically upon payment method verification by our secure payment provider. You will not be charged a single penny during your 30-day trial period.
                                    </p>
                                </div>
                            </div>
                            {devBypassEnabled && (
                                <form onSubmit={handleDevTrialBypass} className="shrink-0">
                                    <Button
                                        size="sm"
                                        type="submit"
                                        disabled={devForm.processing}
                                        className="h-8 bg-amber-700 text-xs font-bold text-white hover:bg-amber-800 shadow-xs cursor-pointer"
                                    >
                                        {devForm.processing ? 'Simulating...' : 'Simulate Verification (Dev Test Only)'}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Trial Expiry Warning Banner (If Expired) */}
                {subscription?.is_expired && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <div>
                                <h3 className="text-sm font-bold">Your 30-Day Free Trial Has Ended</h3>
                                <p className="mt-1 text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                                    All school data and academic records remain safely preserved under our read-only policy. To resume administrative write operations, please request an invoice or choose an active plan.
                                </p>
                                <div className="mt-3">
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedTab('invoice_request')}
                                        className="h-8 bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
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
                    {/* Card 1: Current Plan & Interval */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                            <BadgeCheck className="size-4 text-[#078675]" />
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                {subscription?.plan?.name || 'Starter'}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {subscription?.billing_interval || 'Monthly'}
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {subscription?.plan?.description || 'InstitutoPropio essential workspace.'}
                        </p>
                        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold text-emerald-600 dark:border-slate-800 dark:text-emerald-400">
                            ✓ Unlimited students & teachers included.
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
                                    {subscription?.starts_at ? new Date(subscription.starts_at).toLocaleDateString() : 'Pending'}
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

                    {/* Card 3: Institution Entitlement */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Institution Limit</span>
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
                        className={`cursor-pointer border-b-2 px-5 py-3 transition-colors ${
                            selectedTab === 'overview'
                                ? 'border-[#078675] text-[#078675]'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Plan & Billing Overview
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('invoice_request')}
                        className={`cursor-pointer border-b-2 px-5 py-3 transition-colors ${
                            selectedTab === 'invoice_request'
                                ? 'border-[#078675] text-[#078675]'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Request Official Invoice
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('history')}
                        className={`cursor-pointer border-b-2 px-5 py-3 transition-colors ${
                            selectedTab === 'history'
                                ? 'border-[#078675] text-[#078675]'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        Invoices & Audit History ({invoices.length + histories.length})
                    </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {selectedTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Plan Upgrade / Downgrade Section */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Modify Subscription Plan & Billing Interval
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Upgrade your tier to increase campus capacity or switch to annual billing to save ~16.67% (2 months free).
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handlePlanChange} className="mt-6 space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Subscription Tier
                                        </Label>
                                        <select
                                            value={planForm.data.plan_id}
                                            onChange={(e) => planForm.setData('plan_id', Number(e.target.value))}
                                            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#078675] focus:ring-1 focus:ring-[#078675] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            {availablePlans.map((plan) => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} — {plan.organization_limit} ({planForm.data.billing_interval === 'annual' ? plan.price_annual_formatted + '/yr' : plan.price_monthly_formatted + '/mo'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Billing Cadence
                                        </Label>
                                        <select
                                            value={planForm.data.billing_interval}
                                            onChange={(e) => planForm.setData('billing_interval', e.target.value as any)}
                                            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#078675] focus:ring-1 focus:ring-[#078675] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="monthly">Monthly Billing</option>
                                            <option value="annual">Annual Billing (2 Months Free / ~17% Off)</option>
                                        </select>
                                    </div>
                                </div>

                                <InputError message={planForm.errors.plan_id} />

                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        type="submit"
                                        disabled={planForm.processing}
                                        className="bg-[#078675] text-xs font-bold text-white hover:bg-[#056b5e] cursor-pointer"
                                    >
                                        {planForm.processing ? 'Updating Plan...' : 'Save Subscription Changes'}
                                    </Button>

                                    {subscription && subscription.status !== 'cancelled' && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleCancel}
                                            className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                                        >
                                            Cancel Subscription
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Payment Provider & Manual Channels */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Card A: Online Payment Architecture */}
                            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="size-5 text-[#078675]" />
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                Online Card & Gateway Billing
                                            </h3>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {gateway.name}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        InstitutoPropio supports direct credit card and recurring digital payments via server-side verified webhooks with idempotent transaction replay protection.
                                    </p>

                                    {/* Paddle Checkout Trigger */}
                                    <div className="mt-5 space-y-3">
                                        <Button
                                            type="button"
                                            disabled={isLaunchingPaddle}
                                            onClick={() => handlePaddleCheckout()}
                                            className="w-full bg-[#E49A2E] text-xs font-bold text-white shadow-md hover:bg-[#d08a24] cursor-pointer"
                                        >
                                            <CreditCard className="mr-2 size-4" />
                                            <span>
                                                {isLaunchingPaddle
                                                    ? 'Preparing Secure Checkout...'
                                                    : 'Subscribe Online via Paddle (Card / PayPal)'}
                                            </span>
                                        </Button>

                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                                            <ShieldCheck className="mr-1 inline-block size-3.5 text-[#078675]" />
                                            <span>
                                                Order process & checkout conducted by <strong>Paddle.com</strong>, our Merchant of Record.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card B: Manual Invoice & Wire Transfer */}
                            <div className="flex flex-col justify-between rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/30 to-white p-7 shadow-xs dark:border-blue-900/40 dark:bg-slate-900">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-5 text-[#078675]" />
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                Manual Invoice / Wire Transfer
                                            </h3>
                                        </div>
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                            Recommended for Institutions
                                        </span>
                                    </div>

                                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                        Generate an official invoice for institutional purchase orders, wire transfers, or direct billing agreements. All manual payments are audited and verified by platform administrators.
                                    </p>

                                    <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="size-3.5 text-[#078675]" />
                                            <span>Formal institution purchase order documentation</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="size-3.5 text-[#078675]" />
                                            <span>Multi-campus billing consolidated in one invoice</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="size-3.5 text-[#078675]" />
                                            <span>Dedicated verification audit trail</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        onClick={() => setSelectedTab('invoice_request')}
                                        className="w-full bg-[#078675] text-xs font-bold text-white shadow-md shadow-[#078675]/20 hover:bg-[#056b5e] cursor-pointer"
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
                                Available InstitutoPropio Plan Tiers
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
                                                ? 'border-[#078675] bg-blue-50/30 ring-1 ring-[#078675] dark:bg-blue-950/20'
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
                                        <div className="mt-2 text-xs font-bold text-[#078675]">
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
                                Submitting this request creates an official pending invoice. An InstitutoPropio administrator will review your organization details and verify payment upon bank transfer.
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
                                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#078675] focus:ring-1 focus:ring-[#078675] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Billing Cadence *
                                    </Label>
                                    <select
                                        value={invoiceForm.data.billing_interval}
                                        onChange={(e) => invoiceForm.setData('billing_interval', e.target.value as any)}
                                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#078675] focus:ring-1 focus:ring-[#078675] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="annual">Annual (~16.67% Discount / 2 Months Free)</option>
                                    </select>
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
                                        className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-[#078675] focus:ring-1 focus:ring-[#078675] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                                    className="bg-[#078675] text-xs font-bold text-white hover:bg-[#056b5e] cursor-pointer"
                                >
                                    {invoiceForm.processing ? 'Submitting Invoice Request...' : 'Submit Invoice Request'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 3: INVOICE & AUDIT HISTORY */}
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
                                                <th className="px-5 py-3.5">Amount</th>
                                                <th className="px-5 py-3.5">Status</th>
                                                <th className="px-5 py-3.5">Due Date</th>
                                                <th className="px-5 py-3.5">Verification</th>
                                                {isSuperAdmin && <th className="px-5 py-3.5 text-right">Admin Action</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {invoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                                                        {inv.invoice_number}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                        {inv.plan?.name || 'Custom'}
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                        ${(inv.amount_cents / 100).toFixed(2)} {inv.currency}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {inv.status === 'paid' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                                <Check className="size-3" /> Paid
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
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
                                                                    className="h-7 bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
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

                        {/* Subscription Lifecycle History */}
                        {histories.length > 0 && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <History className="size-4 text-[#078675]" />
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                            Subscription Audit Trail
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Recorded lifecycle transitions, upgrades, and status updates.
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-3">Event</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3">Plan</th>
                                                <th className="px-5 py-3">Interval</th>
                                                <th className="px-5 py-3">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {histories.map((h) => (
                                                <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                                        {h.event.replace(/_/g, ' ')}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {h.to_status || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                                        {h.to_plan?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-5 py-3 capitalize text-slate-500">
                                                        {h.billing_interval || 'Monthly'}
                                                    </td>
                                                    <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                                                        {new Date(h.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

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
                                                className="text-xs text-slate-400 hover:text-white cursor-pointer"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={verifyForm.processing}
                                                className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
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
