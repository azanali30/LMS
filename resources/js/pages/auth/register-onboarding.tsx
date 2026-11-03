import { Head, Link } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import {
    Mail,
    CheckCircle2,
    Building2,
    ShieldCheck,
    CreditCard,
    ArrowRight,
    ArrowLeft,
    Upload,
    Clock,
    AlertCircle,
    Copy,
    Check,
    FileText,
    Sparkles,
    Calendar,
    Users,
    ChevronRight,
    HelpCircle,
    Lock,
    ExternalLink,
    RefreshCw,
} from 'lucide-react';
import OnboardingLayout from '@/layouts/onboarding-layout';

interface Plan {
    name: string;
    slug: string;
    headline: string;
    target: string;
    monthly_cents: number;
    monthly_formatted: string;
    yearly_cents: number | null;
    yearly_formatted?: string | null;
    yearly_available: boolean;
    is_popular?: boolean;
    max_organizations: number;
    features: string[];
}

interface PaymentMethod {
    id: string;
    name: string;
    badge?: string;
    bank_name?: string;
    account_title?: string;
    account_number?: string;
    iban?: string;
    swift?: string;
    branch?: string;
    till_id?: string;
    instructions?: string;
}

interface SubmissionResult {
    reference: string;
    email: string;
    plan: string;
    submitted_at: string;
}

interface Props {
    plans: Plan[];
    paymentMethods: PaymentMethod[];
    currency?: string;
    trialDays?: number;
    yearlyPricingAvailable?: boolean;
    initialStep?: number;
    initialEmail?: string;
    initialPlan?: string;
    initialInterval?: 'monthly' | 'annual';
    initialMethod?: string;
    registrationToken?: string | null;
    submissionResult?: SubmissionResult | null;
}

export default function RegisterOnboarding({
    plans = [],
    paymentMethods = [],
    currency = 'USD',
    trialDays = 30,
    yearlyPricingAvailable = true,
    initialStep = 1,
    initialEmail = '',
    initialPlan = 'growth',
    initialInterval = 'monthly',
    initialMethod = 'bank_transfer',
    registrationToken = null,
    submissionResult = null,
}: Props) {
    // Current Step: 1 = Email, 2 = Plan, 3 = Payment Instructions, 4 = Proof, 5 = Submitted Confirmation
    const [step, setStep] = useState<number>(initialStep || 1);
    const [token, setToken] = useState<string | null>(registrationToken || null);

    // Step 1: Email State
    const [email, setEmail] = useState<string>(initialEmail || '');
    const [emailLoading, setEmailLoading] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailActionUrl, setEmailActionUrl] = useState<string | null>(null);
    const [emailActionLabel, setEmailActionLabel] = useState<string | null>(null);
    const [emailNotice, setEmailNotice] = useState<string | null>(null);

    // Step 2: Plan & Interval State
    const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>(initialPlan || 'growth');
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
        initialInterval === 'annual' && yearlyPricingAvailable ? 'annual' : 'monthly'
    );

    // Step 3: Payment Method
    const [selectedMethodId, setSelectedMethodId] = useState<string>(
        initialMethod || paymentMethods[0]?.id || 'bank_transfer'
    );
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Step 4: Submission State
    const [txnReference, setTxnReference] = useState<string>('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Step 5: Success Response
    const [result, setResult] = useState<SubmissionResult | null>(submissionResult || null);

    // Helpers
    const selectedPlan = plans.find((p) => p.slug === selectedPlanSlug) || plans[0] || {
        name: 'Starter',
        slug: 'starter',
        headline: 'Essential Digital Campus',
        monthly_cents: 1900,
        yearly_cents: 19000,
        yearly_available: true,
        max_organizations: 1,
        features: [],
    };

    const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0] || {
        id: 'bank_transfer',
        name: 'Bank Wire / ACH Transfer',
    };

    // Calculate price for selected interval
    const isAnnual = billingInterval === 'annual' && selectedPlan.yearly_available && selectedPlan.yearly_cents;
    const currentPriceCents = isAnnual ? selectedPlan.yearly_cents! : selectedPlan.monthly_cents;
    const currentPriceDisplay = `$${(currentPriceCents / 100).toFixed(0)}`;

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Sync browser URL query string without page reload
    const syncBrowserUrl = (newStep: number) => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (newStep === 1) {
                url.searchParams.delete('step');
            } else {
                url.searchParams.set('step', String(newStep));
            }
            window.history.replaceState({}, '', url.toString());
        }
    };

    // Server-side progress update helper
    const persistProgress = async (
        targetStep: number,
        extraData: Record<string, any> = {}
    ) => {
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/onboarding/save-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    step: targetStep,
                    registration_token: token,
                    email: email.trim(),
                    plan_slug: selectedPlanSlug,
                    billing_interval: billingInterval,
                    payment_method: selectedMethodId,
                    ...extraData,
                }),
            });
            const data = await res.json();
            if (data.registration_token) {
                setToken(data.registration_token);
            }
        } catch {
            // Silently allow local progression if background save has transient network issue
        }
    };

    // Navigate to step
    const goToStep = async (newStep: number, extraData: Record<string, any> = {}) => {
        setStep(newStep);
        syncBrowserUrl(newStep);
        await persistProgress(newStep, extraData);
    };

    // Step 1: Check Email and initiate/resume draft application
    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError(null);
        setEmailActionUrl(null);
        setEmailActionLabel(null);
        setEmailNotice(null);

        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !trimmed.includes('@')) {
            setEmailError('Please enter a valid administrative email address.');
            return;
        }

        setEmailLoading(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/onboarding/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ email: trimmed }),
            });

            const data = await res.json();

            // Strict duplicate prevention: 422 returned for existing user or pending application
            if (res.status === 422 || !res.ok) {
                setEmailError(
                    data.message ||
                    'This email address is already registered or has a pending application. Please sign in or track your existing application.'
                );

                if (data.status === 'registered' || data.action === 'login') {
                    setEmailActionUrl('/login');
                    setEmailActionLabel('Sign In to Your Institution Account →');
                } else if (data.status === 'pending_approval' || data.action === 'track') {
                    setEmailActionUrl(data.action_url || `/onboarding/status?email=${encodeURIComponent(trimmed)}`);
                    setEmailActionLabel('Track Your Pending Application Status →');
                } else if (data.status === 'approved_ready' || data.action === 'complete') {
                    setEmailActionUrl(data.completion_url || '/register');
                    setEmailActionLabel('Complete Your Approved Account Setup →');
                }
                return;
            }

            // Available: Save token and step
            if (data.registration_token) {
                setToken(data.registration_token);
            }
            if (data.notice) {
                setEmailNotice(data.notice);
            }
            if (data.plan_slug) {
                setSelectedPlanSlug(data.plan_slug);
            }
            if (data.billing_interval) {
                setBillingInterval(data.billing_interval);
            }

            // Advance to Step 2
            setStep(2);
            syncBrowserUrl(2);
        } catch {
            setEmailError('Network error checking email availability. Please check your connection and try again.');
        } finally {
            setEmailLoading(false);
        }
    };

    // Step 2 Continue: Save plan & advance to Step 3
    const handleContinueToStep3 = async () => {
        await goToStep(3, {
            plan_slug: selectedPlanSlug,
            billing_interval: billingInterval,
        });
    };

    // Step 3 Continue: Save method & advance to Step 4
    const handleContinueToStep4 = async () => {
        await goToStep(4, {
            payment_method: selectedMethodId,
        });
    };

    // Handle File Selection with validation
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setSubmitError('Receipt file size must not exceed 5MB.');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setSubmitError('Permitted formats: JPG, PNG, WEBP, or PDF.');
            return;
        }

        setSubmitError(null);
        setReceiptFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setReceiptPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setReceiptPreview(null);
        }
    };

    // Step 4: Submit Payment Proof
    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!txnReference.trim()) {
            setSubmitError('Please provide your Bank or Mobile Wallet Transaction ID / Reference Number.');
            return;
        }

        if (!receiptFile) {
            setSubmitError('Please attach an official payment receipt or transfer screenshot.');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('email', email.trim().toLowerCase());
        formData.append('plan_slug', selectedPlanSlug);
        formData.append('billing_interval', billingInterval);
        formData.append('payment_method', selectedMethodId);
        formData.append('transaction_reference', txnReference.trim());
        formData.append('receipt', receiptFile);
        if (token) {
            formData.append('registration_token', token);
        }
        if (notes.trim()) {
            formData.append('notes', notes.trim());
        }

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/onboarding/submit-payment', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors)[0] as string[];
                    setSubmitError(firstErr[0] || 'Validation failed. Please review your entries.');
                } else {
                    setSubmitError(data.message || 'Submission failed. Please check your inputs.');
                }
                return;
            }

            setResult({
                reference: data.reference,
                email: data.email,
                plan: data.plan,
                submitted_at: data.submitted_at,
            });
            setStep(5);
            syncBrowserUrl(5);
        } catch {
            setSubmitError('Network failure during submission. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <OnboardingLayout title="Get Started with InstitutoPropio — SaaS Registration & Onboarding">
            <div className="py-10 sm:py-14 md:py-16">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    {/* Step Indicator Header (Steps 1 to 4) */}
                    {step < 5 && (
                        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-[#1769E0]">
                                <Sparkles className="size-3.5" />
                                <span>Official 30-Day Free Trial • Instant Multi-Campus Activation</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-4xl md:text-5xl">
                                Get Started with InstitutoPropio
                            </h1>
                            <p className="mt-3 text-sm text-slate-600 sm:text-base leading-relaxed">
                                Join modern educational institutions worldwide. Complete our verified 4-step onboarding to activate your isolated school workspace with zero upfront setup fees.
                            </p>

                            {/* Clean Horizontal Progress Stepper with Step Navigation */}
                            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    {[
                                        { num: 1, label: 'Work Email' },
                                        { num: 2, label: 'Select Plan' },
                                        { num: 3, label: 'Payment Details' },
                                        { num: 4, label: 'Upload Proof' },
                                    ].map((s, idx) => {
                                        const isCompleted = step > s.num;
                                        const isCurrent = step === s.num;
                                        const isClickable = isCompleted && step < 5;

                                        return (
                                            <React.Fragment key={s.num}>
                                                <div
                                                    onClick={() => isClickable && goToStep(s.num)}
                                                    className={`flex flex-col items-center flex-1 transition-all ${
                                                        isClickable ? 'cursor-pointer hover:opacity-85' : ''
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex size-8 sm:size-9 items-center justify-center rounded-full text-xs font-extrabold transition-all ${
                                                            isCurrent
                                                                ? 'border-2 border-[#1769E0] bg-[#1769E0] text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-500/20'
                                                                : isCompleted
                                                                ? 'border border-emerald-500 bg-emerald-50 text-emerald-600'
                                                                : 'border border-slate-200 bg-slate-100 text-slate-400'
                                                        }`}
                                                    >
                                                        {isCompleted ? <Check className="size-4 stroke-[3]" /> : s.num}
                                                    </div>
                                                    <span
                                                        className={`mt-1.5 text-[11px] sm:text-xs font-bold ${
                                                            isCurrent
                                                                ? 'text-[#1769E0]'
                                                                : isCompleted
                                                                ? 'text-emerald-700'
                                                                : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {s.label}
                                                    </span>
                                                </div>
                                                {idx < 3 && (
                                                    <div
                                                        className={`h-0.5 w-6 sm:w-12 md:w-16 -mt-5 transition-colors ${
                                                            step > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                                                        }`}
                                                    />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: Enter Administrative Email */}
                    {step === 1 && (
                        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-12">
                                {/* Left Column: Email Form */}
                                <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
                                    <div>
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0]">
                                                <Mail className="size-5.5" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-[#0B1528]">Step 1 — Administrative Email</h2>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Only your primary work email is needed to start your application.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Duplicate Email Warning Alert */}
                                        {emailError && (
                                            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-900 shadow-xs">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
                                                    <div className="space-y-2">
                                                        <p className="font-bold text-sm text-rose-950">Registration Notice</p>
                                                        <p className="leading-relaxed text-rose-800">{emailError}</p>

                                                        {emailActionUrl && emailActionLabel && (
                                                            <div className="pt-1">
                                                                <Link
                                                                    href={emailActionUrl}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1769E0] px-3.5 py-1.5 font-bold text-white shadow-xs transition hover:bg-[#1256B8]"
                                                                >
                                                                    <span>{emailActionLabel}</span>
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {emailNotice && (
                                            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
                                                <Clock className="size-4.5 shrink-0 text-amber-600 mt-0.5" />
                                                <span>{emailNotice}</span>
                                            </div>
                                        )}

                                        <form onSubmit={handleCheckEmail} className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700">
                                                    Institution Owner / Work Email <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative mt-2">
                                                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
                                                    <input
                                                        type="email"
                                                        required
                                                        autoFocus
                                                        value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value);
                                                            setEmailError(null);
                                                            setEmailActionUrl(null);
                                                        }}
                                                        placeholder="director@schoolname.edu"
                                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                                    We do not ask for passwords or institution details at this stage. You will set them securely after your payment verification.
                                                </p>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={emailLoading}
                                                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FF7A30] font-bold text-sm text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E] disabled:opacity-50"
                                            >
                                                {emailLoading ? (
                                                    <>
                                                        <RefreshCw className="size-4 animate-spin" />
                                                        <span>Verifying Work Email...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Continue to Select Plan</span>
                                                        <ArrowRight className="size-4" />
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="mt-8 border-t border-slate-100 pt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                                        <span>
                                            Already registered?{' '}
                                            <Link href="/login" className="font-bold text-[#1769E0] hover:underline">
                                                Sign In
                                            </Link>
                                        </span>
                                        <span>
                                            Have an application?{' '}
                                            <Link href="/onboarding/status" className="font-bold text-[#1769E0] hover:underline">
                                                Track Status
                                            </Link>
                                        </span>
                                    </div>
                                </div>

                                {/* Right Column: Benefits & Trust Panel */}
                                <div className="border-t border-slate-200 bg-[#F7F9FC] p-6 sm:p-10 lg:col-span-5 lg:border-t-0 lg:border-l flex flex-col justify-between">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                                            Why InstitutoPropio?
                                        </span>
                                        <h3 className="mt-2 text-lg font-extrabold tracking-tight text-[#0B1528]">
                                            The Modern Operating System for Educational Campuses
                                        </h3>
                                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                                            Say goodbye to fragmented paper registers and disconnected software. Run admissions, attendance, timetables, and billing on one platform.
                                        </p>

                                        <div className="mt-6 space-y-4">
                                            {[
                                                {
                                                    icon: ShieldCheck,
                                                    title: 'Cryptographic Tenant Isolation',
                                                    desc: 'Every institution operates in its own dedicated database scope with zero data bleeding.',
                                                },
                                                {
                                                    icon: Users,
                                                    title: 'Unlimited Students & Teachers',
                                                    desc: 'Every plan includes unlimited student and teacher accounts without per-seat penalty fees.',
                                                },
                                                {
                                                    icon: Clock,
                                                    title: '30-Day Free Trial',
                                                    desc: 'Full operational access to academic terms, fee vouchers, and gradebooks from day one.',
                                                },
                                            ].map((b, i) => {
                                                const Icon = b.icon;
                                                return (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-[#1769E0]">
                                                            <Icon className="size-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900">{b.title}</div>
                                                            <div className="text-[11px] text-slate-500 leading-relaxed">{b.desc}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                            <span>Already submitted payment?</span>
                                            <Link href="/onboarding/status" className="font-bold text-[#1769E0] hover:underline">
                                                Track Status &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Select Subscription Plan */}
                    {step === 2 && (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Top Summary & Toggle Bar */}
                            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:px-6 shadow-xs">
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <span className="font-medium">Applying as:</span>
                                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono font-bold text-[#1769E0]">
                                        {email}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => goToStep(1)}
                                        className="ml-2 text-xs font-semibold text-[#1769E0] underline hover:text-[#1256B8]"
                                    >
                                        Change Email
                                    </button>
                                </div>

                                {/* Billing Interval Toggle */}
                                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBillingInterval('monthly');
                                            persistProgress(2, { billing_interval: 'monthly' });
                                        }}
                                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                                            billingInterval === 'monthly'
                                                ? 'bg-[#1769E0] text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Monthly Billing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBillingInterval('annual');
                                            persistProgress(2, { billing_interval: 'annual' });
                                        }}
                                        className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                                            billingInterval === 'annual'
                                                ? 'bg-[#1769E0] text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>Annual Billing</span>
                                        <span className="ml-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                            2 Mos Free (~17% Off)
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Plan Cards Grid */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {plans.map((p) => {
                                    const isSelected = selectedPlanSlug === p.slug;
                                    const isPopular = p.is_popular;
                                    const displayPrice = billingInterval === 'annual' && p.yearly_cents
                                        ? `$${(p.yearly_cents / 100).toFixed(0)}`
                                        : `$${(p.monthly_cents / 100).toFixed(0)}`;
                                    const displayInterval = billingInterval === 'annual' ? '/ year' : '/ month';

                                    return (
                                        <div
                                            key={p.slug}
                                            onClick={() => {
                                                setSelectedPlanSlug(p.slug);
                                                persistProgress(2, { plan_slug: p.slug });
                                            }}
                                            className={`relative flex cursor-pointer flex-col justify-between rounded-3xl border p-7 transition-all duration-200 ${
                                                isSelected
                                                    ? 'border-[#1769E0] ring-2 ring-[#1769E0]/20 bg-white shadow-lg'
                                                    : 'border-slate-200 bg-[#F7F9FC] hover:border-slate-300 hover:bg-white hover:shadow-md'
                                            }`}
                                        >
                                            {isPopular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF7A30] px-3.5 py-0.5 text-[10px] font-extrabold text-white shadow-md shadow-orange-500/20">
                                                    Most Popular Choice
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-black text-[#0B1528]">{p.name}</h3>
                                                    <div
                                                        className={`flex size-5 items-center justify-center rounded-full border ${
                                                            isSelected
                                                                ? 'border-[#1769E0] bg-[#1769E0] text-white'
                                                                : 'border-slate-300 bg-white'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="size-3 stroke-[3]" />}
                                                    </div>
                                                </div>

                                                <p className="mt-1 text-xs text-slate-500">{p.headline}</p>

                                                <div className="my-5 border-y border-slate-100 py-4">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-extrabold text-[#0B1528]">
                                                            {displayPrice}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium">{displayInterval}</span>
                                                    </div>
                                                    {billingInterval === 'annual' && p.yearly_cents && (
                                                        <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                                                            Equivalent to ${(p.yearly_cents / 1200).toFixed(2)}/mo
                                                        </p>
                                                    )}
                                                    <span className="mt-2 inline-block rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#1769E0]">
                                                        {p.max_organizations} {p.max_organizations === 1 ? 'Campus Workspace' : 'Campuses Included'}
                                                    </span>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <div className="text-xs font-bold text-slate-800">Included Features:</div>
                                                    {p.features.map((feat, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#1769E0]" />
                                                            <span>{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPlanSlug(p.slug);
                                                    persistProgress(2, { plan_slug: p.slug });
                                                }}
                                                className={`mt-6 w-full rounded-xl py-2.5 text-xs font-bold transition ${
                                                    isSelected
                                                        ? 'bg-[#1769E0] text-white shadow-md shadow-blue-500/20'
                                                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#1769E0]'
                                                }`}
                                            >
                                                {isSelected ? 'Plan Selected' : 'Choose Plan'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Free Trial Banner & Actions */}
                            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:flex-row shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-emerald-950 sm:text-sm">
                                            30-Day Free Trial Included
                                        </h4>
                                        <p className="text-xs text-emerald-800">
                                            Your 30-day trial begins immediately once payment proof is approved. Unlimited students and teachers across all tiers.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(1)}
                                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContinueToStep3}
                                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#FF7A30] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                    >
                                        <span>Continue to Payment Instructions</span>
                                        <ArrowRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Manual Payment Instructions */}
                    {step === 3 && (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Selected Order Summary Pill */}
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-5 shadow-xs">
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider text-[#1769E0] uppercase">
                                        Selected Subscription Order
                                    </span>
                                    <h2 className="text-lg font-bold text-[#0B1528]">
                                        {selectedPlan.name} Plan — {currentPriceDisplay}.00 {currency} ({billingInterval === 'annual' ? 'Annual Billing' : 'Monthly Billing'})
                                    </h2>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Order registered for: <strong className="text-slate-900">{email}</strong>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="rounded-xl border border-emerald-200 bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                        Includes 30-Day Free Trial
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => goToStep(2)}
                                        className="text-xs font-semibold text-[#1769E0] underline hover:text-[#1256B8]"
                                    >
                                        Change Plan
                                    </button>
                                </div>
                            </div>

                            {/* Payment Method Selector & Coordinates Card */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
                                <h3 className="text-base font-bold text-[#0B1528]">
                                    Step 3 — Select Your Preferred Payment Channel
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    All payment channels below are official, verified corporate accounts of InstitutoPropio. Select your method to view coordinates.
                                </p>

                                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    {paymentMethods.map((m) => {
                                        const active = selectedMethodId === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMethodId(m.id);
                                                    persistProgress(3, { payment_method: m.id });
                                                }}
                                                className={`flex cursor-pointer flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                                                    active
                                                        ? 'border-[#1769E0] bg-blue-50/80 ring-2 ring-[#1769E0]/20 shadow-xs'
                                                        : 'border-slate-200 bg-[#F7F9FC] hover:border-slate-300 hover:bg-white'
                                                }`}
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    <CreditCard className={`size-4.5 ${active ? 'text-[#1769E0]' : 'text-slate-400'}`} />
                                                    {active && <Check className="size-4 text-[#1769E0] stroke-[3]" />}
                                                </div>
                                                <span className={`mt-2.5 text-xs font-bold ${active ? 'text-[#1769E0]' : 'text-slate-900'}`}>{m.name}</span>
                                                {m.badge && (
                                                    <span className="mt-1 rounded-md bg-blue-100/70 px-1.5 py-0.5 text-[10px] font-bold text-[#1769E0]">{m.badge}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Method Coordinates Display Box */}
                                <div className="mt-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 sm:p-8">
                                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="size-5 text-[#1769E0]" />
                                            <span className="text-sm font-bold text-[#0B1528]">
                                                {selectedMethod.name} Coordinates
                                            </span>
                                        </div>
                                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                                            Amount Payable: {currentPriceDisplay}.00 {currency}
                                        </span>
                                    </div>

                                    {selectedMethod.id === 'bank_transfer' && (
                                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</span>
                                                <div className="mt-0.5 text-xs font-bold text-slate-900">{selectedMethod.bank_name || 'Standard Chartered Bank'}</div>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Title</span>
                                                <div className="mt-0.5 text-xs font-bold text-slate-900">{selectedMethod.account_title || 'InstitutoPropio Technologies Inc.'}</div>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Number</span>
                                                    <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.account_number || '01-8934201-01'}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(selectedMethod.account_number || '01-8934201-01', 'acc')}
                                                    className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                                                    title="Copy account number"
                                                >
                                                    {copiedField === 'acc' ? <Check className="size-4 text-emerald-600 stroke-[3]" /> : <Copy className="size-4" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IBAN</span>
                                                    <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.iban || 'PK36SCBL0000001893420101'}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(selectedMethod.iban || 'PK36SCBL0000001893420101', 'iban')}
                                                    className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                                                    title="Copy IBAN"
                                                >
                                                    {copiedField === 'iban' ? <Check className="size-4 text-emerald-600 stroke-[3]" /> : <Copy className="size-4" />}
                                                </button>
                                            </div>
                                            {selectedMethod.swift && (
                                                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SWIFT / BIC Code</span>
                                                    <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.swift}</div>
                                                </div>
                                            )}
                                            {selectedMethod.branch && (
                                                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch</span>
                                                    <div className="mt-0.5 text-xs font-bold text-slate-900">{selectedMethod.branch}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(selectedMethod.id === 'jazzcash' || selectedMethod.id === 'easypaisa') && (
                                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Title</span>
                                                <div className="mt-0.5 text-xs font-bold text-slate-900">{selectedMethod.account_title || 'InstitutoPropio Finance'}</div>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Account Number</span>
                                                    <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.account_number || '0300-1234567'}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(selectedMethod.account_number || '0300-1234567', 'mobile')}
                                                    className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                                                    title="Copy mobile number"
                                                >
                                                    {copiedField === 'mobile' ? <Check className="size-4 text-emerald-600 stroke-[3]" /> : <Copy className="size-4" />}
                                                </button>
                                            </div>
                                            {selectedMethod.till_id && (
                                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Till ID</span>
                                                        <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.till_id}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(selectedMethod.till_id || '', 'till')}
                                                        className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                                                        title="Copy Till ID"
                                                    >
                                                        {copiedField === 'till' ? <Check className="size-4 text-emerald-600 stroke-[3]" /> : <Copy className="size-4" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedMethod.id === 'other' && (
                                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 leading-relaxed">
                                            <p>{selectedMethod.instructions || 'Please contact our finance desk for bespoke wire or invoice instructions.'}</p>
                                        </div>
                                    )}

                                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700">
                                        <div className="font-bold text-[#1769E0]">Important Payment Instructions:</div>
                                        <p className="mt-1 text-slate-600 leading-relaxed">
                                            {selectedMethod.instructions || 'Please use your institution email address as the payment transfer remarks. Save your transaction receipt or reference ID to upload in the next step.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(2)}
                                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContinueToStep4}
                                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#FF7A30] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                    >
                                        <span>I Have Completed Payment &rarr; Upload Proof</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Submit Payment Proof (Spacious Two-Column Layout) */}
                    {step === 4 && (
                        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-12">
                                {/* Left Column: Order Summary & Review */}
                                <div className="border-b border-slate-200 bg-[#F7F9FC] p-6 sm:p-10 lg:col-span-5 lg:border-b-0 lg:border-r flex flex-col justify-between">
                                    <div>
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0]">
                                            <Upload className="size-5.5" />
                                        </div>
                                        <h2 className="mt-4 text-xl font-bold text-[#0B1528]">Step 4 — Upload Payment Receipt</h2>
                                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                            Attach your deposit voucher or transfer screenshot so our finance team can verify and approve your registration.
                                        </p>

                                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
                                            <div className="text-xs font-bold text-[#0B1528] border-b border-slate-100 pb-2">
                                                Application Summary
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Applicant:</span>
                                                <span className="font-semibold text-slate-900">{email}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Plan:</span>
                                                <span className="font-bold text-[#1769E0]">{selectedPlan.name}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Billing:</span>
                                                <span className="capitalize text-slate-800 font-medium">{billingInterval}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Amount Due:</span>
                                                <span className="font-extrabold text-slate-900">
                                                    {currentPriceDisplay}.00 {currency}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Channel:</span>
                                                <span className="font-semibold text-slate-800">{selectedMethod.name}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700">
                                            <ShieldCheck className="size-4 shrink-0 text-[#1769E0] mt-0.5" />
                                            <span>
                                                Submissions are reviewed by our operations desk in real time. Once verified, you will receive an automated invitation to activate your school.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-xs text-slate-500">
                                        Need help? <Link href="/contact" className="font-bold text-[#1769E0] hover:underline">Contact verification support</Link>
                                    </div>
                                </div>

                                {/* Right Column: Proof Upload Form */}
                                <div className="p-6 sm:p-10 lg:col-span-7">
                                    {submitError && (
                                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800">
                                            <AlertCircle className="size-4.5 shrink-0 text-rose-600 mt-0.5" />
                                            <span>{submitError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmitProof} className="space-y-5">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700">
                                                    Selected Plan & Fee
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    disabled
                                                    value={`${selectedPlan.name} Plan (${currentPriceDisplay}.00 ${currency})`}
                                                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-[#1769E0]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700">
                                                    Payment Method
                                                </label>
                                                <select
                                                    value={selectedMethodId}
                                                    onChange={(e) => {
                                                        setSelectedMethodId(e.target.value);
                                                        persistProgress(4, { payment_method: e.target.value });
                                                    }}
                                                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                                >
                                                    {paymentMethods.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700">
                                                Transaction ID / Reference Number <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={txnReference}
                                                onChange={(e) => setTxnReference(e.target.value)}
                                                placeholder="e.g. FT2610319802 or TID-9823412 or 032187654"
                                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                            />
                                            <p className="mt-1.5 text-xs text-slate-500">
                                                Found on your bank SMS confirmation, electronic deposit voucher, or mobile receipt.
                                            </p>
                                        </div>

                                        {/* Receipt File Upload */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700">
                                                Upload Receipt / Deposit Slip <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="mt-1.5 rounded-2xl border-2 border-dashed border-slate-300 bg-[#F8FAFC] p-6 text-center transition hover:border-[#1769E0] hover:bg-blue-50/20">
                                                {receiptPreview ? (
                                                    <div className="flex flex-col items-center">
                                                        <img
                                                            src={receiptPreview}
                                                            alt="Receipt preview"
                                                            className="max-h-48 rounded-xl border border-slate-200 object-contain shadow-xs"
                                                        />
                                                        <p className="mt-2.5 text-xs font-bold text-slate-800">
                                                            {receiptFile?.name} ({(receiptFile!.size / 1024).toFixed(1)} KB)
                                                        </p>
                                                        <label className="mt-2 inline-block cursor-pointer text-xs font-bold text-[#1769E0] hover:underline">
                                                            Replace Image
                                                            <input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                                                onChange={handleFileChange}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                ) : receiptFile ? (
                                                    <div className="flex flex-col items-center">
                                                        <FileText className="size-10 text-[#1769E0]" />
                                                        <p className="mt-2.5 text-xs font-bold text-slate-800">
                                                            {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                                                        </p>
                                                        <label className="mt-2 inline-block cursor-pointer text-xs font-bold text-[#1769E0] hover:underline">
                                                            Change File
                                                            <input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                                                onChange={handleFileChange}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="flex cursor-pointer flex-col items-center justify-center">
                                                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1769E0]">
                                                            <Upload className="size-6" />
                                                        </div>
                                                        <p className="mt-3 text-xs font-bold text-slate-800">
                                                            Click to upload or drag & drop receipt
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            PNG, JPG, WEBP, or PDF (Max 5MB)
                                                        </p>
                                                        <input
                                                            type="file"
                                                            required
                                                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                                                            onChange={handleFileChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700">
                                                Additional Payment Notes (Optional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="e.g. Deposited via branch teller / depositor name"
                                                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                                            <button
                                                type="button"
                                                onClick={() => goToStep(3)}
                                                className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#FF7A30] px-7 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E] disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <RefreshCw className="size-4 animate-spin" />
                                                        <span>Submitting for Verification...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="size-4" />
                                                        <span>Submit Payment for Approval</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Confirmation / Pending Review Screen */}
                    {step === 5 && result && (
                        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-sm">
                            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <Clock className="size-8" />
                            </div>

                            <h2 className="mt-5 text-2xl font-extrabold text-[#0B1528]">
                                Payment Awaiting Verification
                            </h2>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                                Thank you! Your payment proof has been successfully received by our administration team.
                                Your subscription and workspace will be activated upon manual finance review.
                            </p>

                            <div className="my-6 space-y-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 text-left text-xs">
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500">Tracking Reference:</span>
                                    <span className="font-mono font-bold text-[#1769E0]">{result.reference}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500">Applicant Email:</span>
                                    <span className="font-bold text-slate-900">{result.email}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500">Subscription Tier:</span>
                                    <span className="font-bold text-slate-900">{result.plan}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500">Submission Time:</span>
                                    <span className="text-slate-700">{result.submitted_at}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-slate-500">Review Status:</span>
                                    <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                                        Pending Admin Verification
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href={`/onboarding/status?email=${encodeURIComponent(result.email)}`}
                                    className="block w-full rounded-xl bg-[#FF7A30] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                >
                                    Check Live Approval Status &rarr;
                                </Link>

                                <Link
                                    href="/"
                                    className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Return to Public Homepage
                                </Link>
                            </div>

                            <p className="mt-6 text-xs text-slate-500 leading-relaxed">
                                Once approved, you will receive an automated email with your secure single-use token to set up your password and institution name.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </OnboardingLayout>
    );
}
