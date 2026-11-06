import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    ClipboardCheck,
    Laptop,
    LogIn,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { login } from '@/routes';

interface LoginDropdownProps {
    variant?: 'utility' | 'main' | 'mobile';
    onCloseMenu?: () => void;
}

export default function LoginDropdown({ variant = 'utility', onCloseMenu }: LoginDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Outside click dismiss
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Escape key dismiss
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = () => {
        setIsOpen(false);
        onCloseMenu?.();
    };

    if (variant === 'mobile') {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <LogIn className="size-3.5 text-[#078675]" />
                    <span>Account Access</span>
                </div>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                    {/* Item 1: Login */}
                    <Link
                        href={login()}
                        onClick={handleSelect}
                        className="group flex items-center justify-between p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#078675]/10 text-[#078675] transition-colors group-hover:bg-[#173A5E] group-hover:text-white dark:bg-blue-950/50 dark:text-blue-400">
                                <LogIn className="size-4" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-900 group-hover:text-[#078675] dark:text-white">
                                    Login
                                </span>
                                <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
                                    Sign in to your existing InstitutoPropio account
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#078675]" />
                    </Link>

                    {/* Item 2: Track Payment Application */}
                    <Link
                        href="/onboarding/status"
                        onClick={handleSelect}
                        className="group flex items-center justify-between p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#078675]/10 text-[#078675] transition-colors group-hover:bg-[#173A5E] group-hover:text-white dark:bg-blue-950/50 dark:text-blue-400">
                                <ClipboardCheck className="size-4" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-900 group-hover:text-[#078675] dark:text-white">
                                    Track Payment Application
                                </span>
                                <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
                                    Check your payment verification and registration status.
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#078675]" />
                    </Link>

                    {/* Item 3: Download Desktop App */}
                    <Link
                        href="/download"
                        onClick={handleSelect}
                        className="group flex items-center justify-between p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-[#078675]/10 group-hover:text-[#078675] dark:bg-slate-800 dark:text-slate-300">
                                <Laptop className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-[#078675] dark:text-white">
                                        Download Desktop App
                                    </span>
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                        Coming Soon
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
                                    Windows desktop client
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#078675]" />
                    </Link>

                    {/* Footer: Register Your School */}
                    <div className="bg-slate-50/70 p-3.5 dark:bg-slate-950/40">
                        <Link
                            href="/register?journey=school"
                            onClick={handleSelect}
                            className="group flex items-center justify-between text-xs font-semibold text-[#078675] hover:text-[#056b5e] dark:text-blue-400"
                        >
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="size-3.5" />
                                Register Your School
                            </span>
                            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Toggle Login Menu"
                className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078675] ${
                    isOpen
                        ? 'bg-[#078675]/10 text-[#078675]'
                        : 'text-slate-600 hover:text-[#078675]'
                }`}
            >
                <LogIn className="size-3.5 text-slate-400 transition-colors group-hover:text-[#078675]" />
                <span>Login</span>
                <ChevronDown
                    className={`size-3 text-slate-400 transition-transform duration-200 group-hover:text-[#078675] ${
                        isOpen ? 'rotate-180 text-[#078675]' : ''
                    }`}
                />
            </button>

            {/* Clean, Minimal Dropdown Panel (RingCentral Styled) */}
            {isOpen && (
                <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all animate-in fade-in-50 zoom-in-95 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
                >
                    <div className="space-y-1 p-1">
                        {/* 1. Login Item */}
                        <Link
                            href={login()}
                            role="menuitem"
                            onClick={handleSelect}
                            className="group flex items-center justify-between rounded-xl p-2.5 transition-all duration-150 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-800/60"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#078675]/10 text-[#078675] shadow-2xs ring-1 ring-[#078675]/20 transition-all group-hover:bg-[#173A5E] group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-900/60">
                                    <LogIn className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#078675] dark:text-white dark:group-hover:text-blue-400">
                                            Login
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                                        Sign in to your existing InstitutoPropio account
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="size-3.5 shrink-0 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#078675] group-hover:opacity-100" />
                        </Link>

                        {/* 2. Track Payment Application Item */}
                        <Link
                            href="/onboarding/status"
                            role="menuitem"
                            onClick={handleSelect}
                            className="group flex items-center justify-between rounded-xl p-2.5 transition-all duration-150 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-800/60"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#078675]/10 text-[#078675] shadow-2xs ring-1 ring-[#078675]/20 transition-all group-hover:bg-[#173A5E] group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-900/60">
                                    <ClipboardCheck className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#078675] dark:text-white dark:group-hover:text-blue-400">
                                            Track Payment Application
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                                        Check your payment verification and registration status.
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="size-3.5 shrink-0 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#078675] group-hover:opacity-100" />
                        </Link>

                        {/* 3. Download Desktop App Item */}
                        <Link
                            href="/download"
                            role="menuitem"
                            onClick={handleSelect}
                            className="group flex items-center justify-between rounded-xl p-2.5 transition-all duration-150 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-800/60"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs ring-1 ring-slate-200/80 transition-all group-hover:bg-[#078675]/10 group-hover:text-[#078675] group-hover:ring-blue-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                    <Laptop className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#078675] dark:text-white dark:group-hover:text-blue-400">
                                            Download Desktop App
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            Coming Soon
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                                        Windows desktop application
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="size-3.5 shrink-0 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#078675] group-hover:opacity-100" />
                        </Link>
                    </div>

                    {/* 3. Separated Footer: Register Your School */}
                    <div className="mt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-xl px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                        <Link
                            href="/register?journey=school"
                            role="menuitem"
                            onClick={handleSelect}
                            className="group flex items-center justify-between text-xs font-semibold text-[#078675] hover:text-[#056b5e] transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="size-3 text-[#078675] dark:text-blue-400" />
                                <span>Register Your School</span>
                            </span>
                            <span className="transition-transform duration-150 group-hover:translate-x-1">&rarr;</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
