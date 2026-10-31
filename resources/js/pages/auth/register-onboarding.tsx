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
    Users,
    ChevronRight,
    HelpCircle,
    Lock,
    ExternalLink,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

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
        <PublicLayout title="Get Started with InstitutoPropio — SaaS Registration & Onboarding">
            <div className="bg-[#F8FAFC] py-10 sm:py-14 md:py-16 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    {/* Step Indicator Header */}
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

                            {/* Clean Horizontal Progress Stepper */}
                            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    {[
                                        { num: 1, label: 'Work Email' },
                                        { num: 2, label: 'Select Plan' },
                                        { num: 3, label: 'Payment Details' },
                                        { num: 4, label: 'Upload Proof' },
                                    ].map((s, idx) => (
                                        <React.Fragment key={s.num}>
                                            <div className="flex flex-col items-center flex-1">
                                                <div
                                                    className={`flex size-8 sm:size-9 items-center justify-center rounded-full text-xs font-extrabold transition-all ${
                                                        step === s.num
                                                            ? 'border-2 border-[#1769E0] bg-[#1769E0] text-white shadow-md shadow-blue-600/25'
                                                            : step > s.num
                                                            ? 'border border-emerald-500 bg-emerald-50 text-emerald-600'
                                                            : 'border border-slate-200 bg-slate-100 text-slate-400'
                                                    }`}
                                                >
                                                    {step > s.num ? <Check className="size-4 stroke-[3]" /> : s.num}
                                                </div>
                                                <span
                                                    className={`mt-1.5 text-[11px] sm:text-xs font-bold ${
                                                        step === s.num
                                                            ? 'text-[#1769E0]'
                                                            : step > s.num
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
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: Enter Email Only (Two-Column Spacious SaaS Card) */}
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

                                        {emailError && (
                                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800">
                                                <AlertCircle className="size-4.5 shrink-0 text-rose-600 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">{emailError}</p>
                                                    {emailError.includes('already exists') && (
                                                        <Link href="/login" className="mt-1.5 inline-block font-bold text-[#1769E0] underline hover:text-[#1256B8]">
                                                            Log in to your account &rarr;
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {emailNotice && (
                                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800">
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
                                                        onChange={(e) => setEmail(e.target.value)}
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
                                                        <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        <span>Checking Email Availability...</span>
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
                                            Joining with invite?{' '}
                                            <Link href="/register?journey=join" className="font-bold text-[#1769E0] hover:underline">
                                                Join existing campus
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
                                        onClick={() => setStep(1)}
                                        className="ml-2 text-xs font-semibold text-[#1769E0] underline hover:text-[#1256B8]"
                                    >
                                        Change
                                    </button>
                                </div>

                                {/* Billing Interval Toggle */}
                                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setBillingInterval('monthly')}
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
                                        onClick={() => setBillingInterval('annual')}
                                        className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                                            billingInterval === 'annual'
                                                ? 'bg-[#1769E0] text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>Annual Billing</span>
                                        <span className="ml-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                            2 Mos Free
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {billingInterval === 'annual' && !yearlyPricingAvailable && (
                                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                                    <AlertCircle className="size-4 shrink-0 text-amber-600" />
                                    <span>
                                        <strong>Notice:</strong> Yearly billing packages are currently being finalized. Please continue with Monthly billing to start your 30-day trial immediately, or contact sales for custom terms.
                                    </span>
                                </div>
                            )}

                            {/* Plan Cards Grid */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {plans.map((p) => {
                                    const isSelected = selectedPlanSlug === p.slug;
                                    const isPopular = p.is_popular;
                                    return (
                                        <div
                                            key={p.slug}
                                            onClick={() => setSelectedPlanSlug(p.slug)}
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
                                                            ${p.monthly_cents / 100}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium">/ month</span>
                                                    </div>
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
                                                onClick={() => setSelectedPlanSlug(p.slug)}
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
                                            30-Day Free Trial Terms & Policy
                                        </h4>
                                        <p className="text-xs text-emerald-800">
                                            Your 30-day trial begins immediately once payment proof is approved. Unlimited students and teachers across all tiers.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
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
                                        {selectedPlan.name} Plan — ${selectedPlan.monthly_cents / 100}.00 {currency}
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
                                        onClick={() => setStep(2)}
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
                                                onClick={() => setSelectedMethodId(m.id)}
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
                                            Amount Payable: ${selectedPlan.monthly_cents / 100}.00 {currency}
                                        </span>
                                    </div>

                                    {selectedMethod.id === 'bank_transfer' && (
                                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</span>
                                                <div className="mt-0.5 text-xs font-bold text-slate-900">{selectedMethod.bank_name}</div>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Title</span>
                                                <div className="mt-0.5 text-xs font-bold text-slate-900">{selectedMethod.account_title}</div>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Number</span>
                                                    <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.account_number}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(selectedMethod.account_number || '', 'acc')}
                                                    className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                                                    title="Copy account number"
                                                >
                                                    {copiedField === 'acc' ? <Check className="size-4 text-emerald-600 stroke-[3]" /> : <Copy className="size-4" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IBAN</span>
                                                    <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.iban}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(selectedMethod.iban || '', 'iban')}
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
                                                <div className="mt-0.5 text-xs font-bold text-slate-900">{selectedMethod.account_title}</div>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Account Number</span>
                                                    <div className="mt-0.5 font-mono text-xs font-bold text-slate-900">{selectedMethod.account_number}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(selectedMethod.account_number || '', 'mobile')}
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
                                            <p>{selectedMethod.instructions}</p>
                                        </div>
                                    )}

                                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700">
                                        <div className="font-bold text-[#1769E0]">Important Payment Instructions:</div>
                                        <p className="mt-1 text-slate-600 leading-relaxed">{selectedMethod.instructions}</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(4)}
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
                                                    ${selectedPlan.monthly_cents / 100}.00 {currency}
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
                                                    value={`${selectedPlan.name} Plan ($${selectedPlan.monthly_cents / 100}.00 ${currency})`}
                                                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-[#1769E0]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700">
                                                    Payment Method
                                                </label>
                                                <select
                                                    value={selectedMethodId}
                                                    onChange={(e) => setSelectedMethodId(e.target.value)}
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
                                                onClick={() => setStep(3)}
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
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Confirmation / Pending Review Screen */}
                    {step === 5 && submissionResult && (
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
                                    <span className="font-mono font-bold text-[#1769E0]">{submissionResult.reference}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500">Applicant Email:</span>
                                    <span className="font-bold text-slate-900">{submissionResult.email}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500">Subscription Tier:</span>
                                    <span className="font-bold text-slate-900">{submissionResult.plan}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500">Submission Time:</span>
                                    <span className="text-slate-700">{submissionResult.submitted_at}</span>
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
                                    href={`/onboarding/status?email=${encodeURIComponent(submissionResult.email)}`}
                                    className="block w-full rounded-xl bg-[#FF7A30] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                >
                                    Check Approval Status &rarr;
                                </Link>

                                <Link
                                    href="/"
                                    className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Return to Public Homepage
                                </Link>
                            </div>

                            <p className="mt-6 text-xs text-slate-500">
                                Once approved, you will receive an automated email with your secure single-use token to set up your password and institution name.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
