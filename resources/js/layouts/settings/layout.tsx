import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { User, ShieldCheck, Palette, UserCog, ArrowLeft } from 'lucide-react';
import TenantLayout from '@/layouts/tenant-layout';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

const sidebarNavItems = [
    {
        title: 'Profile',
        description: 'Personal details and registered email',
        href: edit(),
        icon: User,
    },
    {
        title: 'Security',
        description: 'Password, passkeys & two-factor authentication',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Appearance',
        description: 'Theme engine and display modes',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <TenantLayout title="Account Settings">
            <div className="mx-auto max-w-5xl p-6 sm:p-8">
                {/* Header Banner */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30">
                            <UserCog className="size-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                                Account Settings
                            </h2>
                            <p className="text-xs text-slate-400">
                                Manage your personal profile, credentials, and platform preferences
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-sm transition hover:border-purple-500/40 hover:bg-slate-900 hover:text-white"
                    >
                        <ArrowLeft className="size-3.5 text-slate-400" />
                        <span>Return to Dashboard</span>
                    </Link>
                </div>

                {/* Subnavigation Tabs */}
                <div className="mb-8 flex items-center gap-2.5 overflow-x-auto border-b border-slate-800/80 pb-4">
                    {sidebarNavItems.map((item) => {
                        const isActive = isCurrentOrParentUrl(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={toUrl(item.href)}
                                href={item.href}
                                className={cn(
                                    'group flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200',
                                    isActive
                                        ? 'border border-purple-500/40 bg-gradient-to-r from-purple-600/25 to-indigo-600/15 text-white shadow-sm shadow-purple-950 ring-1 ring-purple-500/20'
                                        : 'border border-slate-800/60 bg-[#0B1220]/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-200'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'size-4 transition-transform group-hover:scale-110',
                                        isActive ? 'text-purple-400' : 'text-slate-400'
                                    )}
                                />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Main Settings Content */}
                <div className="space-y-8">
                    {children}
                </div>
            </div>
        </TenantLayout>
    );
}
