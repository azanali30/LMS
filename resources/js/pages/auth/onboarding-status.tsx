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
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import OnboardingLayout from '@/layouts/onboarding-layout';

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
        <OnboardingLayout title="Track Payment Approval Status — InstitutoPropio">
            <div className="bg-[#F8FAFC] py-12 sm:py-16 md:py-20 border-b border-slate-100 min-h-[75vh]">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-[#1769E0]">
                            <Clock className="size-3.5" />
                            <span>Manual Verification Portal</span>
                        </div>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-4xl">
                            Check Payment Approval Status
                        </h1>
                        <p className="mt-2.5 text-xs text-slate-600 sm:text-sm leading-relaxed">
                            Enter the administrative work email you used during registration to track your payment verification and workspace activation progress.
                        </p>

                        {/* Email Lookup Input */}
                        <form onSubmit={handleSearch} className="mt-8 flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your administrative email..."
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#1769E0] focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#FF7A30] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E] disabled:opacity-50"
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
                            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 text-left">
                                <AlertCircle className="size-4.5 shrink-0 text-rose-600" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Status Result Card */}
                        {item && (
                            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application Email</span>
                                        <div className="text-sm font-bold text-[#0B1528] mt-0.5">{item.email}</div>
                                    </div>

                                    {/* Status Badge */}
                                    <div>
                                        {item.status === 'pending' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
                                                <Clock className="size-3.5 animate-pulse text-amber-600" />
                                                Pending Admin Review
                                            </span>
                                        )}

                                        {item.status === 'approved' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                Approved & Ready
                                            </span>
                                        )}

                                        {item.status === 'rejected' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 uppercase tracking-wider">
                                                <AlertCircle className="size-3.5 text-rose-600" />
                                                Payment Rejected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Details */}
                                <div className="my-6 space-y-3">
                                    {item.status === 'pending' && (
                                        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 text-xs leading-relaxed text-slate-600">
                                            <p className="font-bold text-[#0B1528] text-sm">Your payment proof is under active verification.</p>
                                            <p className="mt-1 text-slate-500">
                                                Our finance desk is matching your transaction reference with bank deposit logs. Once verified, you will receive an email with your secure account setup link.
                                            </p>
                                        </div>
                                    )}

                                    {item.status === 'approved' && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs leading-relaxed text-emerald-900">
                                                <p className="font-extrabold text-[#0B1528] text-sm">Congratulations! Your payment proof has been approved.</p>
                                                <p className="mt-1 text-emerald-800">
                                                    Your 30-day free trial has been unlocked. Click the button below to choose your password, school name, and custom campus subdomain.
                                                </p>
                                            </div>

                                            {item.completion_url && (
                                                <a
                                                    href={item.completion_url}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A30] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                                >
                                                    <span>Complete Account & Setup Institution &rarr;</span>
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {item.status === 'rejected' && (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-xs text-rose-900">
                                                <p className="font-bold text-[#0B1528]">Rejection Reason Provided by Finance Team:</p>
                                                <p className="mt-1 font-mono text-rose-800">
                                                    {item.rejection_reason || 'Could not verify transaction with bank records. Please provide a clear official receipt or revised transaction ID.'}
                                                </p>
                                            </div>

                                            <Link
                                                href={`/register?email=${encodeURIComponent(item.email)}`}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A30] py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                            >
                                                <span>Submit Corrected Payment Proof &rarr;</span>
                                            </Link>
                                        </div>
                                    )}
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
