import { Head, useForm, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    ShieldCheck,
    Lock,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Laptop,
} from 'lucide-react';

interface Props {
    status?: string;
}

export default function PlatformAdminLogin({ status }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/platform-admin/login');
    };

    return (
        <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#1769E0] selection:text-white">
            <Head title="Platform Super Admin Login — InstitutoPropio" />

            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl mb-4">
                        <img src="/images/logo.png" alt="InstitutoPropio" className="size-10 object-contain rounded-xl" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Instituto<span className="text-[#38BDF8]">Propio</span>
                    </h1>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#38BDF8] text-xs font-bold tracking-wide uppercase">
                        <ShieldCheck className="size-3.5" />
                        <span>Platform Administration Portal</span>
                    </div>
                </div>

                {/* Login Card */}
                <div className="rounded-3xl border border-slate-800 bg-[#0F172A]/90 p-7 sm:p-9 shadow-2xl backdrop-blur-md">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-white tracking-tight">Super Administrator Sign In</h2>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Restricted access. Please authenticate using authorized platform owner credentials.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="email">
                                Administrator Work Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail className="size-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="admin@institutopropio.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-blue-500/20 transition"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                                    <AlertCircle className="size-3.5" />
                                    <span>{errors.email}</span>
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="password">
                                Master Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="size-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1769E0] focus:ring-2 focus:ring-blue-500/20 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                                    <AlertCircle className="size-3.5" />
                                    <span>{errors.password}</span>
                                </p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="size-4 rounded border-slate-700 bg-slate-900 text-[#1769E0] focus:ring-0 focus:ring-offset-0"
                                />
                                <span>Remember this workstation</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1769E0] hover:bg-[#1256B8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
                        >
                            <span>{processing ? 'Authenticating...' : 'Sign In to Super Admin'}</span>
                            <ArrowRight className="size-4" />
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                        <p className="text-[11px] text-slate-500 leading-normal">
                            All platform administrative sessions are cryptographically verified and recorded in immutable audit logs.
                        </p>
                    </div>
                </div>

                {/* Footer Backlink */}
                <div className="text-center mt-6">
                    <Link
                        href="/login"
                        className="text-xs text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1.5"
                    >
                        <span>&larr; Return to Customer LMS Portal</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
