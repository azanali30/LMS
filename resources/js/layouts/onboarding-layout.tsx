import { Head, Link, usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { ArrowRight, ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export default function OnboardingLayout({
    children,
    title = 'InstitutoPropio — SaaS Onboarding',
}: OnboardingLayoutProps) {
    const { name } = usePage().props as { name?: string };
    const platformName = name || 'InstitutoPropio';

    // Enforce consistent light theme matching public homepage
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-slate-900 antialiased selection:bg-[#1769E0] selection:text-white">
            {title && <Head title={title} />}

            {/* FOCUSED ONBOARDING TOP BAR (No public marketing mega-menus) */}
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-18 w-full max-w-[1720px] items-center justify-between px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    {/* Brand Logo & Name (matching homepage navbar) */}
                    <Link
                        href="/"
                        className="group flex items-center gap-3 transition-transform hover:scale-[1.01]"
                        aria-label={`${platformName} Home`}
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#1769E0] text-white shadow-md shadow-blue-600/20 ring-2 ring-[#1769E0]/20 transition-all group-hover:bg-[#1256B8]">
                            <AppLogoIcon className="size-5.5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-extrabold tracking-tight text-[#0B1528] sm:text-lg">
                                {platformName}
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-[#1769E0] uppercase">
                                Unified Education SaaS
                            </span>
                        </div>
                    </Link>

                    {/* Right Action: Security Badge & Clean Sign In Link */}
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3.5 py-1 text-xs text-slate-600">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            <span className="font-medium">256-Bit SSL Encrypted Registration</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                            <span className="hidden sm:inline text-slate-500">Already have an institution?</span>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 font-semibold text-slate-700 shadow-xs transition hover:border-[#1769E0] hover:text-[#1769E0]"
                            >
                                <span>Sign In</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN ONBOARDING WORKSPACE */}
            <main className="flex-1">
                {children}
            </main>

            {/* FOCUSED ONBOARDING FOOTER (No giant marketing sitemap) */}
            <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
                <div className="mx-auto flex max-w-[1720px] flex-col items-center justify-between gap-3 px-6 sm:flex-row sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{platformName}</span>
                        <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                            <Lock className="size-3 text-emerald-600" />
                            ISO 27001 & SOC-2 Certified
                        </span>
                        <span className="text-slate-300">•</span>
                        <Link href="/onboarding/status" className="font-medium text-slate-600 hover:text-[#1769E0] transition">
                            Track Existing Application
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link href="/contact" className="font-medium text-slate-600 hover:text-[#1769E0] transition">
                            Finance & Support Desk
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
