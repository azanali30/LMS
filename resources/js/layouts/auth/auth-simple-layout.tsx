import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    // Enforce consistent light theme for auth pages matching public website
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    }, []);

    const { name, tenant } = usePage().props as {
        name?: string;
        tenant?: {
            name?: string;
            slug?: string;
            logo_path?: string | null;
            primary_color?: string | null;
            accent_color?: string | null;
            organization_type?: string;
        } | null;
    };
    const platformName = (name as string) || 'InstitutoPropio';
    const isTenant = Boolean(tenant && tenant.name);
    const displayName = isTenant ? tenant!.name : platformName;
    const brandColor = tenant?.primary_color || '#078675';

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-slate-50/70 p-4 sm:p-6 md:p-10 dark:bg-[#070D18]">
            {/* Ambient background glows */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#078675]/100/10 blur-3xl dark:bg-[#078675]/15"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-1/4 -bottom-32 -z-10 h-80 w-80 rounded-full bg-[#078675]/100/8 blur-3xl dark:bg-[#078675]/10"
            />

            {/* Back to Home link */}
            <div className="mb-6 w-full max-w-md">
                <Link
                    href={home()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#078675] dark:text-slate-400 dark:hover:text-white"
                >
                    <ArrowLeft className="size-3.5" />
                    {isTenant ? 'Back to main website' : 'Back to public website'}
                </Link>
            </div>

            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-8 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <Link
                            href={home()}
                            className="group mb-4 flex items-center gap-3 transition-transform hover:scale-[1.01]"
                        >
                            {tenant?.logo_path ? (
                                <img
                                    src={tenant.logo_path}
                                    alt={displayName}
                                    className="h-11 w-11 rounded-xl object-contain ring-2 ring-slate-200 shadow-md dark:ring-slate-700"
                                />
                            ) : (
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md shadow-[#078675]/20 ring-2 ring-blue-500/20 font-bold text-lg"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    {isTenant ? displayName!.charAt(0).toUpperCase() : <AppLogoIcon className="size-6 text-white" />}
                                </div>
                            )}
                            <div className="flex flex-col text-left">
                                <span className="font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                                    {displayName}
                                </span>
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                                    style={{ color: brandColor }}
                                >
                                    <Sparkles className="size-3" />
                                    {isTenant ? (tenant?.organization_type ? `${tenant.organization_type.replace('_', ' ')} Portal` : 'School Portal') : 'Unified Education SaaS'}
                                </span>
                            </div>
                        </Link>

                        <div className="space-y-1.5">
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {children}

                    <div className="mt-8 border-t border-slate-100 pt-5 dark:border-slate-800">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>256-Bit SSL Encrypted · Single Sign-On Portal</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
