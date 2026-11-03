import { Head, Link } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Building2,
    Mail,
    ArrowRight,
    Search,
    RefreshCw,
    ExternalLink,
    ShieldCheck,
    Sparkles,
    KeyRound,
    Lock,
    ArrowLeft,
    Check,
} from 'lucide-react';
import OnboardingLayout from '@/layouts/onboarding-layout';

interface RequestItem {
    id: number;
    email: string;
    plan_name: string;
    billing_interval: string;
    amount_formatted: string;
    transaction_reference: string;
    status: 'pending_payment' | 'under_review' | 'awaiting_institution_details' | 'completed' | 'rejected' | string;
    status_label: string;
    badge_style: 'amber' | 'emerald' | 'rose' | 'blue';
    title: string;
    description: string;
    rejection_reason?: string;
    action?: 'resume_registration' | 'complete_account' | 'login' | 'resubmit' | null;
    action_url?: string | null;
    action_label?: string | null;
    completion_url?: string | null;
    submitted_at?: string;
    approved_at?: string;
    completed_at?: string;
    rejected_at?: string;
}

interface Props {
    approvalRequest: RequestItem | null;
    searchEmail?: string;
    verified?: boolean;
}

export default function OnboardingStatus({ approvalRequest, searchEmail = '', verified = false }: Props) {
    const [step, setStep] = useState<'email' | 'otp' | 'details'>(
        verified && approvalRequest ? 'details' : 'email'
    );
    const [email, setEmail] = useState<string>(searchEmail);
    const [otp, setOtp] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [item, setItem] = useState<RequestItem | null>(approvalRequest);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState<number>(0);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const getCsrfToken = () => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    // 1. Request OTP Code
    const handleRequestOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        setNotice(null);

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
            setError('Please enter a valid administrative work email address.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/onboarding/status/request-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ email: cleanEmail }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Unable to send verification code. Please check your email.');
                return;
            }

            setNotice(data.message || 'A 6-digit verification code has been sent to your email.');
            setStep('otp');
            setResendCooldown(60);
        } catch {
            setError('A network error occurred while requesting verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Verify OTP Code
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setNotice(null);

        const cleanCode = otp.trim();
        if (cleanCode.length !== 6) {
            setError('Please enter the 6-digit numeric verification code sent to your email.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/onboarding/status/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    code: cleanCode,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Invalid or expired verification code.');
                return;
            }

            if (data.found && data.application) {
                setItem(data.application);
                setStep('details');
            } else {
                setError('No application records found for this verified email.');
            }
        } catch {
            setError('A network error occurred while verifying code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingLayout title="Track Payment Application Status — InstitutoPropio">
            <div className="bg-[#F8FAFC] py-12 sm:py-16 md:py-20 border-b border-slate-100 min-h-[75vh]">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-2xl text-center">
                        {/* Header Badge */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-[#1769E0]">
                            <ShieldCheck className="size-3.5 text-[#1769E0]" />
                            <span>Secure Application Verification</span>
                        </div>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-4xl">
                            Track Payment Application Status
                        </h1>
                        <p className="mt-2.5 text-xs text-slate-600 sm:text-sm leading-relaxed">
                            Check manual payment verification progress, view finance team feedback, or complete your 30-day trial workspace activation.
                        </p>

                        {/* Error Alert */}
                        {error && (
                            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 text-left shadow-xs">
                                <AlertCircle className="size-4.5 shrink-0 text-rose-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Success Notice */}
                        {notice && (
                            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-800 text-left shadow-xs">
                                <Check className="size-4.5 shrink-0 text-emerald-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{notice}</p>
                                </div>
                            </div>
                        )}

                        {/* STEP 1: Enter Email */}
                        {step === 'email' && (
                            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-sm">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Lock className="size-3.5 text-[#1769E0]" />
                                    <span>Step 1 of 2: Verify Identity</span>
                                </div>
                                <h2 className="mt-1.5 text-lg font-bold text-[#0B1528]">
                                    Enter Your Work Email
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    For your security, application details are protected. We will email you a 6-digit one-time code to confirm ownership.
                                </p>

                                <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="track-email" className="block text-xs font-semibold text-slate-700">
                                            Administrative Email Address <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative mt-1.5">
                                            <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
                                            <input
                                                id="track-email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="director@schoolname.edu"
                                                className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FF7A30] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E] disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="size-4 animate-spin" />
                                                <span>Sending Security Code...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Send Verification Code</span>
                                                <ArrowRight className="size-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                                    Already have login credentials?{' '}
                                    <Link href="/login" className="font-bold text-[#1769E0] hover:underline">
                                        Sign in here &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Enter OTP Code */}
                        {step === 'otp' && (
                            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <KeyRound className="size-3.5 text-[#1769E0]" />
                                        <span>Step 2 of 2: Confirm Code</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email');
                                            setError(null);
                                            setNotice(null);
                                        }}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#1769E0]"
                                    >
                                        <ArrowLeft className="size-3" />
                                        <span>Change Email</span>
                                    </button>
                                </div>

                                <h2 className="mt-1.5 text-lg font-bold text-[#0B1528]">
                                    Enter 6-Digit Code
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    We sent a verification code to <span className="font-semibold text-slate-800">{email}</span>. Enter the code below or click the direct verification link in your email.
                                </p>

                                <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700">
                                            One-Time Security Code <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="mt-1.5">
                                            <input
                                                id="otp-input"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={6}
                                                required
                                                autoFocus
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="123456"
                                                className="h-12 w-full rounded-xl border border-slate-300 bg-white text-center text-xl font-bold tracking-[0.5em] text-[#0B1528] placeholder:text-slate-300 placeholder:tracking-normal transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || otp.length !== 6}
                                        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FF7A30] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E] disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="size-4 animate-spin" />
                                                <span>Verifying...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Verify & View Application Status</span>
                                                <ArrowRight className="size-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                                    <span className="text-slate-500">Didn't receive the code?</span>
                                    <button
                                        type="button"
                                        disabled={resendCooldown > 0 || loading}
                                        onClick={() => handleRequestOtp()}
                                        className="font-bold text-[#1769E0] hover:underline disabled:text-slate-400 disabled:no-underline"
                                    >
                                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Verified Application Status Details */}
                        {step === 'details' && item && (
                            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-sm">
                                {/* Header with Email & Status Badge */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Application Account
                                        </span>
                                        <div className="text-sm font-bold text-[#0B1528] mt-0.5">{item.email}</div>
                                    </div>

                                    {/* Status Badge */}
                                    <div>
                                        {item.status === 'pending_payment' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
                                                <Clock className="size-3.5 text-amber-600" />
                                                Pending Payment Proof
                                            </span>
                                        )}

                                        {item.status === 'under_review' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-[#1769E0] uppercase tracking-wider">
                                                <Clock className="size-3.5 animate-pulse text-[#1769E0]" />
                                                Under Review / In Verification
                                            </span>
                                        )}

                                        {item.status === 'awaiting_institution_details' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                Approved & Ready
                                            </span>
                                        )}

                                        {item.status === 'completed' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                Workspace Activated
                                            </span>
                                        )}

                                        {item.status === 'rejected' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
                                                <AlertCircle className="size-3.5 text-rose-600" />
                                                Payment Proof Rejected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Summary Grid */}
                                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-4">
                                    <div>
                                        <span className="text-slate-400 font-medium">Selected Plan</span>
                                        <p className="font-bold text-slate-800 mt-0.5">{item.plan_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium">Billing Interval</span>
                                        <p className="font-bold text-slate-800 mt-0.5 capitalize">{item.billing_interval}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium">Deposit Amount</span>
                                        <p className="font-bold text-slate-800 mt-0.5">{item.amount_formatted}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium">Transaction Ref</span>
                                        <p className="font-mono font-bold text-slate-800 mt-0.5 truncate">{item.transaction_reference}</p>
                                    </div>
                                </div>

                                {/* Dynamic Status Box & Call-to-Action */}
                                <div className="mt-6 space-y-4">
                                    {/* 1. Pending Payment */}
                                    {item.status === 'pending_payment' && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-xs text-amber-900 leading-relaxed">
                                                <p className="font-bold text-amber-950 text-sm">Payment Proof Required</p>
                                                <p className="mt-1">
                                                    You have started onboarding for the <strong>{item.plan_name}</strong> plan, but manual payment proof has not yet been submitted. Upload your deposit voucher or transfer receipt to submit your application for review.
                                                </p>
                                            </div>

                                            {item.action_url && (
                                                <a
                                                    href={item.action_url}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A30] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                                >
                                                    <span>{item.action_label || 'Resume Application & Submit Proof &rarr;'}</span>
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. Under Review */}
                                    {item.status === 'under_review' && (
                                        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 text-xs leading-relaxed text-slate-600">
                                            <p className="font-bold text-[#0B1528] text-sm">Your payment proof is under active verification.</p>
                                            <p className="mt-1 text-slate-500">
                                                Our finance desk is matching your transaction reference with bank deposit logs. Once verified, you will be able to complete your workspace setup directly from this screen or via the email confirmation link.
                                            </p>
                                            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                                                <Clock className="size-3 text-slate-400" />
                                                <span>Submitted on {item.submitted_at || 'recently'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Approved & Awaiting Institution Details */}
                                    {item.status === 'awaiting_institution_details' && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs leading-relaxed text-emerald-900">
                                                <p className="font-extrabold text-[#0B1528] text-sm">Congratulations! Your payment proof has been approved.</p>
                                                <p className="mt-1 text-emerald-800">
                                                    Your 30-day free trial has been unlocked. Click the button below to choose your administrative password, school name, and custom campus subdomain.
                                                </p>
                                                {item.approved_at && (
                                                    <p className="mt-2 text-[11px] text-emerald-700">
                                                        Approved on {item.approved_at}
                                                    </p>
                                                )}
                                            </div>

                                            {(item.action_url || item.completion_url) && (
                                                <a
                                                    href={item.action_url || item.completion_url || '#'}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A30] py-3.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                                >
                                                    <span>Complete Account & Setup Institution &rarr;</span>
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* 4. Completed / Workspace Activated */}
                                    {item.status === 'completed' && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs leading-relaxed text-emerald-900">
                                                <p className="font-extrabold text-[#0B1528] text-sm">Your institution workspace is fully active.</p>
                                                <p className="mt-1 text-emerald-800">
                                                    Your campus organization has been provisioned and configured. You can sign in using your administrative credentials to manage students, courses, staff, and fees.
                                                </p>
                                            </div>

                                            <Link
                                                href="/login"
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1769E0] py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#1256B8]"
                                            >
                                                <span>Sign In to Your Workspace &rarr;</span>
                                            </Link>
                                        </div>
                                    )}

                                    {/* 5. Rejected */}
                                    {item.status === 'rejected' && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-xs text-rose-900">
                                                <p className="font-bold text-[#0B1528] text-sm">Payment Proof Rejected by Finance Desk:</p>
                                                <p className="mt-1.5 font-mono text-rose-800 bg-white/70 p-3 rounded-xl border border-rose-200">
                                                    {item.rejection_reason || 'Could not verify transaction reference with bank records. Please provide a clear official deposit slip or revised transaction ID.'}
                                                </p>
                                            </div>

                                            <a
                                                href={item.action_url || `/register?email=${encodeURIComponent(item.email)}`}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A30] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                            >
                                                <span>Submit Corrected Payment Proof &rarr;</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Check Another Application Button */}
                                <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email');
                                            setEmail('');
                                            setOtp('');
                                            setItem(null);
                                            setError(null);
                                            setNotice(null);
                                        }}
                                        className="text-xs font-semibold text-slate-500 hover:text-[#1769E0]"
                                    >
                                        &larr; Check a different application
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 text-center text-xs text-slate-500">
                            Looking to start a new institution?{' '}
                            <Link href="/register" className="font-bold text-[#1769E0] hover:underline">
                                Start new registration &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
