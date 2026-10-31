import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
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
} from 'lucide-react';

interface RequestItem {
    id: number;
    email: string;
    plan_name: string;
    billing_interval: string;
    status: 'pending' | 'approved' | 'rejected';
    amount_formatted: string;
    transaction_reference: string;
    rejection_reason?: string;
    completion_url?: string;
    created_at: string;
}

interface Props {
    approvalRequest: RequestItem | null;
    searchEmail?: string;
}

export default function OnboardingStatus({ approvalRequest, searchEmail = '' }: Props) {
    const [email, setEmail] = useState<string>(searchEmail);
    const [loading, setLoading] = useState<boolean>(false);
    const [item, setItem] = useState<RequestItem | null>(approvalRequest);
    const [searched, setSearched] = useState<boolean>(!!approvalRequest);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/onboarding/status?email=${encodeURIComponent(email.trim())}`, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (res.status === 404) {
                setItem(null);
                setSearched(true);
                setError('No payment approval requests found for this email address.');
                return;
            }

            if (!res.ok) {
                setError('Failed to fetch request status. Please try again.');
                return;
            }

            const data = await res.json();
            if (data.found) {
                setItem({
                    id: data.id,
                    email: data.email,
                    plan_name: 'Selected Plan',
                    billing_interval: 'monthly',
                    status: data.status,
                    amount_formatted: 'Verified Deposit',
                    transaction_reference: 'Recorded Ref',
                    rejection_reason: data.rejection_reason,
                    completion_url: data.completion_url,
                    created_at: 'Recently Submitted',
                });
                setSearched(true);
            } else {
                setItem(null);
                setSearched(true);
                setError('No registration records found for this email.');
            }
        } catch {
            setError('Network error checking status.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#070b14] font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
            <Head title="Track Payment Approval Status — InstitutoPropio" />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]"
            />

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
                        <Link href="/register" className="text-purple-400 hover:text-purple-300">
                            New Registration &rarr;
                        </Link>
                        <Link href="/login" className="text-slate-400 hover:text-white">
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-300">
                        <Clock className="size-3.5" />
                        <span>Manual Verification Portal</span>
                    </div>
                    <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        Check Payment Approval Status
                    </h1>
                    <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                        Enter your administrative work email below to track real-time verification progress.
                    </p>
                </div>

                {/* Email Lookup Input */}
                <form onSubmit={handleSearch} className="mt-8 flex gap-2">
                    <div className="relative flex-1">
                        <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter the email address you registered with..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <RefreshCw className="size-4 animate-spin" />
                        ) : (
                            <Search className="size-4" />
                        )}
                        <span>Check Status</span>
                    </button>
                </form>

                {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                        <AlertCircle className="size-4 shrink-0 text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Status Result Card */}
                {item && (
                    <div className="mt-8 rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase">Application Email</span>
                                <div className="text-sm font-bold text-white">{item.email}</div>
                            </div>

                            {/* Status Badge */}
                            <div>
                                {item.status === 'pending' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider">
                                        <Clock className="size-3.5 animate-pulse text-amber-400" />
                                        Pending Admin Review
                                    </span>
                                )}

                                {item.status === 'approved' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                                        Approved & Ready
                                    </span>
                                )}

                                {item.status === 'rejected' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300 uppercase tracking-wider">
                                        <AlertCircle className="size-3.5 text-rose-400" />
                                        Payment Rejected
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status Details */}
                        <div className="my-6 space-y-3">
                            {item.status === 'pending' && (
                                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-300">
                                    <p className="font-semibold text-white">Your payment proof is under active verification.</p>
                                    <p className="mt-1 text-slate-400">
                                        Our finance desk is matching your transaction reference with bank deposit logs. Once verified, you will receive an email with your secure account setup link.
                                    </p>
                                </div>
                            )}

                            {item.status === 'approved' && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs leading-relaxed text-emerald-300">
                                        <p className="font-bold text-white">Congratulations! Your payment proof has been approved.</p>
                                        <p className="mt-1 text-emerald-400/90">
                                            Your 30-day free trial has been unlocked. Click the button below to choose your password, organization name, and subdomain.
                                        </p>
                                    </div>

                                    {item.completion_url && (
                                        <a
                                            href={item.completion_url}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
                                        >
                                            <span>Complete Account & Setup Institution &rarr;</span>
                                        </a>
                                    )}
                                </div>
                            )}

                            {item.status === 'rejected' && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
                                        <p className="font-bold text-white">Rejection Reason Provided by Finance Team:</p>
                                        <p className="mt-1 font-mono text-rose-200">
                                            {item.rejection_reason || 'Could not verify transaction with bank records. Please provide a clear official receipt or revised transaction ID.'}
                                        </p>
                                    </div>

                                    <Link
                                        href={`/register?email=${encodeURIComponent(item.email)}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500"
                                    >
                                        <span>Submit Corrected Payment Proof &rarr;</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
