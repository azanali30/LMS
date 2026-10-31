import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
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
    ChevronRight,
    HelpCircle,
    Lock,
    ExternalLink,
} from 'lucide-react';

interface Plan {
    name: string;
    slug: string;
    headline: string;
    target: string;
    monthly_cents: number;
    monthly_formatted: string;
    yearly_cents: number | null;
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

interface Props {
    plans: Plan[];
    paymentMethods: PaymentMethod[];
    currency: string;
    trialDays: number;
    yearlyPricingAvailable: boolean;
    initialEmail?: string;
    initialPlan?: string;
    initialInterval?: string;
}

export default function RegisterOnboarding({
    plans,
    paymentMethods,
    currency = 'USD',
    trialDays = 30,
    yearlyPricingAvailable = false,
    initialEmail = '',
    initialPlan = 'growth',
    initialInterval = 'monthly',
}: Props) {
    // Current Step: 1 = Email, 2 = Plan, 3 = Instructions, 4 = Proof, 5 = Submitted Confirmation
    const [step, setStep] = useState<number>(1);

    // Step 1: Email State
    const [email, setEmail] = useState<string>(initialEmail);
    const [emailLoading, setEmailLoading] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailNotice, setEmailNotice] = useState<string | null>(null);

    // Step 2: Plan & Interval State
    const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>(initialPlan);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
        initialInterval === 'annual' && yearlyPricingAvailable ? 'annual' : 'monthly'
    );

    // Step 3: Payment Method
    const [selectedMethodId, setSelectedMethodId] = useState<string>(
        paymentMethods[0]?.id || 'bank_transfer'
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
    const [submissionResult, setSubmissionResult] = useState<{
        reference: string;
        email: string;
        plan: string;
        submitted_at: string;
    } | null>(null);

    const selectedPlan = plans.find((p) => p.slug === selectedPlanSlug) || plans[0];
    const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0];

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Step 1: Check Email
    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError(null);
        setEmailNotice(null);

        const trimmed = email.trim();
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

            if (res.status === 422) {
                setEmailError(data.message || 'An active account already exists with this email.');
                return;
            }

            if (!res.ok) {
                setEmailError(data.message || 'Could not verify email. Please try again.');
                return;
            }

            if (data.status === 'pending_approval') {
                setEmailNotice('You already have a pending verification request. You can check its live status or continue.');
            } else if (data.status === 'previously_rejected') {
                setEmailNotice(`Notice: A previous submission was rejected (${data.rejection_reason || 'See details'}). You may submit updated payment proof.`);
            }

            // Proceed to Step 2
            setStep(2);
        } catch {
            setEmailError('Network error checking email. Please try again.');
        } finally {
            setEmailLoading(false);
        }
    };

    // Handle File Selection
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
        formData.append('email', email.trim());
        formData.append('plan_slug', selectedPlanSlug);
        formData.append('billing_interval', billingInterval);
        formData.append('payment_method', selectedMethodId);
        formData.append('transaction_reference', txnReference.trim());
        formData.append('receipt', receiptFile);
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
                    setSubmitError(firstErr[0] || 'Validation failed.');
                } else {
                    setSubmitError(data.message || 'Submission failed. Please check your inputs.');
                }
                return;
            }

            setSubmissionResult({
                reference: data.reference,
                email: data.email,
                plan: data.plan,
                submitted_at: data.submitted_at,
            });
            setStep(5);
        } catch {
            setSubmitError('Network failure during submission. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#070b14] font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
            <Head title="Get Started — SaaS Onboarding & Manual Payment Approval" />

            {/* Ambient Glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]"
            />

            {/* Top Navigation Bar */}
            <header className="border-b border-slate-800/80 bg-[#0B1220]/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
                            <Building2 className="size-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            InstitutoPropio
                        </span>
                    </Link>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <Link
                            href="/onboarding/status"
                            className="text-slate-400 hover:text-purple-400 transition"
                        >
                            Track Approval Status &rarr;
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-slate-200 transition hover:border-purple-500/40 hover:text-white"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
                {/* Step Indicator Header */}
                {step < 5 && (
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-300">
                            <Sparkles className="size-3.5" />
                            <span>Official 30-Day Free Trial Onboarding</span>
                        </div>
                        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
                            Register Your Educational Institution
                        </h1>
                        <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                            Step-by-step verified onboarding with manual payment approval and instant multi-campus activation.
                        </p>

                        {/* Visual Progress Breadcrumb */}
                        <div className="mx-auto mt-8 flex max-w-xl items-center justify-between px-2">
                            {[
                                { num: 1, label: 'Work Email' },
                                { num: 2, label: 'Select Plan' },
                                { num: 3, label: 'Instructions' },
                                { num: 4, label: 'Payment Proof' },
                            ].map((s, idx) => (
                                <React.Fragment key={s.num}>
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                                step === s.num
                                                    ? 'border-2 border-purple-400 bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                                                    : step > s.num
                                                    ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                                                    : 'border border-slate-800 bg-slate-900 text-slate-500'
                                            }`}
                                        >
                                            {step > s.num ? <Check className="size-4" /> : s.num}
                                        </div>
                                        <span
                                            className={`mt-1.5 text-[11px] font-semibold ${
                                                step === s.num
                                                    ? 'text-white'
                                                    : step > s.num
                                                    ? 'text-emerald-400'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {s.label}
                                        </span>
                                    </div>
                                    {idx < 3 && (
                                        <div
                                            className={`h-0.5 flex-1 transition-colors ${
                                                step > s.num ? 'bg-emerald-500/40' : 'bg-slate-800'
                                            }`}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 1: Enter Email Only */}
                {step === 1 && (
                    <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl sm:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                                <Mail className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Step 1 — Administrative Email</h2>
                                <p className="text-xs text-slate-400">
                                    Only your primary email is needed to start your application.
                                </p>
                            </div>
                        </div>

                        {emailError && (
                            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                                <AlertCircle className="size-4 shrink-0 text-rose-400" />
                                <div>
                                    <p className="font-semibold">{emailError}</p>
                                    {emailError.includes('already exists') && (
                                        <Link href="/login" className="mt-1 inline-block font-bold underline hover:text-white">
                                            Log in to your account &rarr;
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {emailNotice && (
                            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                                <Clock className="size-4 shrink-0 text-amber-400" />
                                <span>{emailNotice}</span>
                            </div>
                        )}

                        <form onSubmit={handleCheckEmail} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300">
                                    Institution Owner / Work Email <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative mt-1.5">
                                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="director@schoolname.edu"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <p className="mt-1.5 text-[11px] text-slate-500">
                                    We do not ask for passwords or institution details at this stage. You will set them securely after your payment verification.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={emailLoading}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                            >
                                {emailLoading ? (
                                    <>
                                        <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Checking Availability...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Continue to Select Plan</span>
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
                            <p className="text-[11px] text-slate-500">
                                Have an existing invitation?{' '}
                                <Link href="/register?journey=join" className="font-semibold text-purple-400 hover:underline">
                                    Join an existing school
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* STEP 2: Select Subscription Plan */}
                {step === 2 && (
                    <div className="space-y-8">
                        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0B1220] p-4 sm:flex-row sm:px-6">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="font-semibold text-slate-300">Applying as:</span>
                                <span className="rounded-lg bg-slate-800 px-2.5 py-1 font-mono text-purple-300">
                                    {email}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="ml-2 text-[11px] text-purple-400 underline hover:text-purple-300"
                                >
                                    Change
                                </button>
                            </div>

                            {/* Billing Interval Toggle */}
                            <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900 p-1">
                                <button
                                    type="button"
                                    onClick={() => setBillingInterval('monthly')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        billingInterval === 'monthly'
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Monthly Billing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingInterval('annual')}
                                    className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        billingInterval === 'annual'
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span>Yearly Billing</span>
                                    <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                        Pending
                                    </span>
                                </button>
                            </div>
                        </div>

                        {billingInterval === 'annual' && !yearlyPricingAvailable && (
                            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                                <AlertCircle className="size-4 shrink-0 text-amber-400" />
                                <span>
                                    <strong>Notice:</strong> Yearly pricing packages are currently being finalized. Please continue with Monthly billing to start your 30-day trial immediately, or contact sales for custom terms.
                                </span>
                            </div>
                        )}

                        {/* Plan Cards */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {plans.map((p) => {
                                const isSelected = selectedPlanSlug === p.slug;
                                const isPopular = p.is_popular;
                                return (
                                    <div
                                        key={p.slug}
                                        onClick={() => setSelectedPlanSlug(p.slug)}
                                        className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-6 transition-all ${
                                            isSelected
                                                ? 'border-purple-500 bg-gradient-to-b from-purple-950/30 to-[#0B1220] shadow-xl shadow-purple-950/40 ring-2 ring-purple-500/50'
                                                : 'border-slate-800 bg-[#0B1220] hover:border-slate-700 hover:bg-slate-900/60'
                                        }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-purple-500/30 bg-purple-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md">
                                                Most Popular
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-base font-bold text-white">{p.name}</h3>
                                                <div
                                                    className={`flex size-5 items-center justify-center rounded-full border ${
                                                        isSelected
                                                            ? 'border-purple-500 bg-purple-600 text-white'
                                                            : 'border-slate-700 bg-slate-900'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="size-3" />}
                                                </div>
                                            </div>

                                            <p className="mt-1 text-[11px] text-slate-400">{p.headline}</p>

                                            <div className="my-4">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-extrabold text-white">
                                                        ${p.monthly_cents / 100}
                                                    </span>
                                                    <span className="text-xs text-slate-400">/ month</span>
                                                </div>
                                                <span className="mt-1 inline-block rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                                                    {p.max_organizations} {p.max_organizations === 1 ? 'Campus Workspace' : 'Campuses Included'}
                                                </span>
                                            </div>

                                            <div className="space-y-2 border-t border-slate-800/80 pt-4">
                                                <div className="text-[11px] font-bold text-slate-300">Included Features:</div>
                                                {p.features.map((feat, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-purple-400" />
                                                        <span>{feat}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedPlanSlug(p.slug)}
                                            className={`mt-6 w-full rounded-xl py-2 text-xs font-bold transition ${
                                                isSelected
                                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                                    : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                                            }`}
                                        >
                                            {isSelected ? 'Plan Selected' : 'Choose Plan'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Free Trial Banner */}
                        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 sm:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white sm:text-sm">
                                        30-Day Free Trial Terms & Policy
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        Your 30 days begin immediately once your manual payment proof is verified by our finance team. Unlimited students and teachers across all tiers.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
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
                    <div className="space-y-8">
                        {/* Summary Pill */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-5 shadow-xl">
                            <div>
                                <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                                    Selected Subscription Order
                                </span>
                                <h2 className="text-lg font-bold text-white">
                                    {selectedPlan.name} Plan — ${selectedPlan.monthly_cents / 100}.00 {currency}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Order registered for: <strong className="text-white">{email}</strong>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                                    Includes 30-Day Free Trial
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-xs text-purple-400 underline hover:text-purple-300"
                                >
                                    Change Plan
                                </button>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-xl">
                            <h3 className="text-sm font-bold text-white">
                                Step 3 — Select Your Preferred Payment Channel
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                All payment accounts below are verified corporate channels of InstitutoPropio. Select your method to view coordinates.
                            </p>

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                                {paymentMethods.map((m) => {
                                    const active = selectedMethodId === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setSelectedMethodId(m.id)}
                                            className={`flex cursor-pointer flex-col items-start rounded-xl border p-3.5 text-left transition ${
                                                active
                                                    ? 'border-purple-500 bg-purple-500/15 shadow-md shadow-purple-950'
                                                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <CreditCard className={`size-4 ${active ? 'text-purple-400' : 'text-slate-400'}`} />
                                                {active && <Check className="size-3.5 text-purple-400" />}
                                            </div>
                                            <span className="mt-2 text-xs font-bold text-white">{m.name}</span>
                                            {m.badge && (
                                                <span className="mt-1 text-[10px] text-purple-400">{m.badge}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Method Coordinate Display Card */}
                            <div className="mt-6 rounded-xl border border-slate-700/80 bg-slate-900/80 p-5">
                                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="size-4 text-purple-400" />
                                        <span className="text-xs font-bold text-white">
                                            {selectedMethod.name} Coordinates
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-emerald-400">
                                        Amount Payable: ${selectedPlan.monthly_cents / 100}.00 {currency}
                                    </span>
                                </div>

                                {selectedMethod.id === 'bank_transfer' && (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg bg-[#0B1220] p-3">
                                            <span className="text-[10px] text-slate-500 uppercase">Bank Name</span>
                                            <div className="text-xs font-semibold text-white">{selectedMethod.bank_name}</div>
                                        </div>
                                        <div className="rounded-lg bg-[#0B1220] p-3">
                                            <span className="text-[10px] text-slate-500 uppercase">Account Title</span>
                                            <div className="text-xs font-semibold text-white">{selectedMethod.account_title}</div>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
                                            <div>
                                                <span className="text-[10px] text-slate-500 uppercase">Account Number</span>
                                                <div className="font-mono text-xs font-semibold text-white">{selectedMethod.account_number}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(selectedMethod.account_number || '', 'acc')}
                                                className="cursor-pointer rounded p-1 text-slate-400 hover:text-white"
                                                title="Copy account number"
                                            >
                                                {copiedField === 'acc' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
                                            <div>
                                                <span className="text-[10px] text-slate-500 uppercase">IBAN</span>
                                                <div className="font-mono text-xs font-semibold text-white">{selectedMethod.iban}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(selectedMethod.iban || '', 'iban')}
                                                className="cursor-pointer rounded p-1 text-slate-400 hover:text-white"
                                                title="Copy IBAN"
                                            >
                                                {copiedField === 'iban' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                            </button>
                                        </div>
                                        {selectedMethod.swift && (
                                            <div className="rounded-lg bg-[#0B1220] p-3">
                                                <span className="text-[10px] text-slate-500 uppercase">SWIFT / BIC Code</span>
                                                <div className="font-mono text-xs font-semibold text-white">{selectedMethod.swift}</div>
                                            </div>
                                        )}
                                        {selectedMethod.branch && (
                                            <div className="rounded-lg bg-[#0B1220] p-3">
                                                <span className="text-[10px] text-slate-500 uppercase">Branch</span>
                                                <div className="text-xs font-semibold text-white">{selectedMethod.branch}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(selectedMethod.id === 'jazzcash' || selectedMethod.id === 'easypaisa') && (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg bg-[#0B1220] p-3">
                                            <span className="text-[10px] text-slate-500 uppercase">Account Title</span>
                                            <div className="text-xs font-semibold text-white">{selectedMethod.account_title}</div>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
                                            <div>
                                                <span className="text-[10px] text-slate-500 uppercase">Mobile Account Number</span>
                                                <div className="font-mono text-xs font-semibold text-white">{selectedMethod.account_number}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(selectedMethod.account_number || '', 'mobile')}
                                                className="cursor-pointer rounded p-1 text-slate-400 hover:text-white"
                                                title="Copy number"
                                            >
                                                {copiedField === 'mobile' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                            </button>
                                        </div>
                                        {selectedMethod.till_id && (
                                            <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
                                                <div>
                                                    <span className="text-[10px] text-slate-500 uppercase">Till ID</span>
                                                    <div className="font-mono text-xs font-semibold text-white">{selectedMethod.till_id}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(selectedMethod.till_id || '', 'till')}
                                                    className="cursor-pointer rounded p-1 text-slate-400 hover:text-white"
                                                    title="Copy Till ID"
                                                >
                                                    {copiedField === 'till' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedMethod.id === 'other' && (
                                    <div className="rounded-lg bg-[#0B1220] p-4 text-xs text-slate-300">
                                        <p>{selectedMethod.instructions}</p>
                                    </div>
                                )}

                                <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-slate-300">
                                    <div className="font-semibold text-purple-300">Important Instructions:</div>
                                    <p className="mt-1 text-[11px] text-slate-400">{selectedMethod.instructions}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
                                >
                                    <span>I Have Completed Payment &rarr; Upload Proof</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: Submit Payment Proof */}
                {step === 4 && (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl sm:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                                <Upload className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Step 4 — Upload Payment Receipt & Proof</h2>
                                <p className="text-xs text-slate-400">
                                    Attach transaction details so our finance team can verify and approve your registration.
                                </p>
                            </div>
                        </div>

                        {submitError && (
                            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                                <AlertCircle className="size-4 shrink-0 text-rose-400" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitProof} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300">
                                        Selected Plan & Amount
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        disabled
                                        value={`${selectedPlan.name} Plan ($${selectedPlan.monthly_cents / 100}.00 ${currency})`}
                                        className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-xs font-semibold text-purple-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300">
                                        Payment Method
                                    </label>
                                    <select
                                        value={selectedMethodId}
                                        onChange={(e) => setSelectedMethodId(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white transition focus:border-purple-500 focus:outline-none"
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
                                <label className="block text-xs font-semibold text-slate-300">
                                    Transaction ID / Reference Number <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={txnReference}
                                    onChange={(e) => setTxnReference(e.target.value)}
                                    placeholder="e.g. FT2610319802 or TID-9823412 or 032187654"
                                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                                />
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Found on your bank SMS confirmation, electronic deposit voucher, or app screen.
                                </p>
                            </div>

                            {/* Receipt File Upload */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300">
                                    Upload Receipt / Deposit Slip <span className="text-rose-400">*</span>
                                </label>
                                <div className="mt-1.5 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-6 text-center transition hover:border-purple-500">
                                    {receiptPreview ? (
                                        <div className="flex flex-col items-center">
                                            <img
                                                src={receiptPreview}
                                                alt="Receipt preview"
                                                className="max-h-48 rounded-lg border border-slate-700 object-contain shadow-md"
                                            />
                                            <p className="mt-2 text-xs font-semibold text-slate-300">
                                                {receiptFile?.name} ({(receiptFile!.size / 1024).toFixed(1)} KB)
                                            </p>
                                            <label className="mt-2 inline-block cursor-pointer text-xs text-purple-400 underline hover:text-purple-300">
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
                                            <FileText className="size-10 text-purple-400" />
                                            <p className="mt-2 text-xs font-semibold text-slate-300">
                                                {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                                            </p>
                                            <label className="mt-2 inline-block cursor-pointer text-xs text-purple-400 underline hover:text-purple-300">
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
                                            <Upload className="size-8 text-slate-500" />
                                            <p className="mt-2 text-xs font-semibold text-white">
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
                                <label className="block text-xs font-semibold text-slate-300">
                                    Additional Payment Notes (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Deposited via branch teller at campus branch / sender name"
                                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                )}

                {/* STEP 5: Confirmation / Pending Review Screen */}
                {step === 5 && submissionResult && (
                    <div className="mx-auto max-w-lg rounded-2xl border border-purple-500/30 bg-[#0B1220] p-8 text-center shadow-2xl">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                            <Clock className="size-8" />
                        </div>

                        <h2 className="mt-4 text-2xl font-bold text-white">
                            Payment Awaiting Verification
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
                            Thank you! Your payment proof has been successfully received by our administration team.
                            Your subscription and workspace will be activated upon manual finance review.
                        </p>

                        <div className="my-6 space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tracking Reference:</span>
                                <span className="font-mono font-bold text-purple-300">{submissionResult.reference}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Applicant Email:</span>
                                <span className="font-semibold text-white">{submissionResult.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Subscription Tier:</span>
                                <span className="font-semibold text-white">{submissionResult.plan}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Submission Time:</span>
                                <span className="text-slate-300">{submissionResult.submitted_at}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Review Status:</span>
                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                                    Pending Admin Verification
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href={`/onboarding/status?email=${encodeURIComponent(submissionResult.email)}`}
                                className="block w-full rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
                            >
                                Check Approval Status &rarr;
                            </Link>

                            <Link
                                href="/"
                                className="block w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                            >
                                Return to Public Homepage
                            </Link>
                        </div>

                        <p className="mt-6 text-[11px] text-slate-500">
                            Once approved, you will receive an automated email with your secure single-use token to set up your password and institution name.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
