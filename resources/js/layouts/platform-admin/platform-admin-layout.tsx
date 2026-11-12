import { Head, Link, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Layers,
    Receipt,
    FileText,
    BarChart3,
    HelpCircle,
    Bell,
    ShieldAlert,
    Settings,
    LogOut,
    ExternalLink,
    Menu,
    X,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Inbox,
} from 'lucide-react';
import { NotificationIcon } from '@/components/notifications/notification-icon';
import { useNotifications } from '@/hooks/use-notifications';

interface PlatformAdminLayoutProps {
    title?: string;
    children: React.ReactNode;
}

export default function PlatformAdminLayout({
    title = 'Platform Control Center',
    children,
}: PlatformAdminLayoutProps) {
    const page = usePage<any>();
    const { auth, flash } = page.props || {};
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    const {
        unreadCount,
        recent: recentNotifs,
        markAsRead,
        markAllAsRead,
    } = useNotifications({ scope: 'platform' });

    const user = auth?.user;
    const currentUrl = page.url || (typeof window !== 'undefined' ? window.location.pathname : '') || '';

    const navItems = [
        { label: 'Overview', href: '/platform-admin/dashboard', icon: LayoutDashboard },
        { label: 'Organizations', href: '/platform-admin/organizations', icon: Building2 },
        { label: 'Users', href: '/platform-admin/users', icon: Users },
        { label: 'Subscriptions', href: '/platform-admin/subscriptions', icon: CreditCard },
        { label: 'Plans & Pricing', href: '/platform-admin/plans', icon: Layers },
        { label: 'Payments', href: '/platform-admin/payments', icon: Receipt },
        { label: 'Invoices', href: '/platform-admin/invoices', icon: FileText },
        { label: 'Analytics', href: '/platform-admin/analytics', icon: BarChart3 },
        { label: 'Support Tickets', href: '/platform-admin/support', icon: HelpCircle },
        { label: 'Announcements', href: '/platform-admin/announcements', icon: Bell },
        { label: 'Audit Logs', href: '/platform-admin/audit-logs', icon: ShieldAlert },
        { label: 'Settings', href: '/platform-admin/settings', icon: Settings },
    ];

    const isCurrent = (href: string) => {
        if (!href || typeof currentUrl !== 'string') return false;
        if (href === '/platform-admin/dashboard') {
            return currentUrl === '/platform-admin/dashboard' || currentUrl === '/platform-admin';
        }
        return currentUrl.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row antialiased">
            <Head title={`${title} — InstitutoPropio Super Admin`} />

            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-40">
                <div className="flex items-center gap-2.5">
                    <img src="/images/logo.png" alt="Logo" className="size-7 object-contain rounded-md" />
                    <span className="font-extrabold text-base tracking-tight">
                        Instituto<span className="text-[#38BDF8]">Propio</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Admin
                    </span>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
                >
                    {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-auto ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div>
                    {/* Brand Header */}
                    <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
                        <Link href="/platform-admin/dashboard" className="flex items-center gap-2.5">
                            <img src="/images/logo.png" alt="Logo" className="size-8 object-contain rounded-lg" />
                            <div>
                                <div className="font-extrabold text-sm tracking-tight text-white leading-tight">
                                    Instituto<span className="text-[#38BDF8]">Propio</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                    Super Admin Portal
                                </div>
                            </div>
                        </Link>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Live
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Platform Navigation
                        </div>
                        {navItems.map((item) => {
                            const active = isCurrent(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                        active
                                            ? 'bg-[#1769E0] text-white shadow-md shadow-blue-600/30'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                    }`}
                                >
                                    <Icon className={`size-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-slate-800/80 bg-[#080E20]">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between mb-2">
                        <div className="truncate pr-2">
                            <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                        </div>
                        <span className="size-2 rounded-full bg-emerald-400 shrink-0" title="Active Platform Session" />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Link
                            href="/dashboard"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Open Customer LMS Dashboard"
                        >
                            <ExternalLink className="size-3.5" />
                            <span>Campus LMS</span>
                        </Link>
                        <Link
                            href="/platform-admin/logout"
                            method="post"
                            as="button"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
                        >
                            <LogOut className="size-3.5" />
                            <span>Sign Out</span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Header Bar */}
                <header className="h-16 px-6 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
                            <span>InstitutoPropio</span>
                            <span>/</span>
                            <span className="text-[#1769E0]">Platform Admin</span>
                            <span>/</span>
                            <span className="text-slate-800 font-extrabold">{title}</span>
                        </div>
                        <h1 className="text-base sm:hidden font-extrabold text-slate-900 tracking-tight">
                            {title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Multi-Tenant Platform Active</span>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setNotifOpen(!notifOpen)}
                                title="Platform Notifications"
                                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            >
                                <Bell className="size-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-40 overflow-hidden">
                                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                            <span className="text-xs font-bold text-slate-900">Platform Notifications</span>
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={markAllAsRead}
                                                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                                            {recentNotifs.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-slate-500">
                                                    <Inbox className="mx-auto size-6 text-slate-400 mb-1" />
                                                    No platform notifications yet.
                                                </div>
                                            ) : (
                                                recentNotifs.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`p-3 text-xs ${!n.read_at ? 'bg-blue-50/50' : ''}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                                                <NotificationIcon
                                                                    icon={n.data?.icon}
                                                                    category={n.category || n.data?.category}
                                                                    className="size-3.5 text-blue-600"
                                                                />
                                                                <span>{n.data?.title || 'Platform Notice'}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 shrink-0">{n.created_at}</span>
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-slate-600">{n.data?.message || ''}</p>
                                                        {!n.read_at && (
                                                            <button
                                                                type="button"
                                                                onClick={() => markAsRead(n.id, n.data?.url)}
                                                                className="mt-1.5 text-[11px] font-semibold text-blue-600 hover:underline"
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="border-t border-slate-200 p-2 text-center">
                                            <Link
                                                href="/platform-admin/notifications"
                                                onClick={() => setNotifOpen(false)}
                                                className="block rounded-lg py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50"
                                            >
                                                View All Platform Notifications &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <Link
                            href="/platform-admin/settings"
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Admin Settings"
                        >
                            <Settings className="size-4" />
                        </Link>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="size-4 text-rose-600 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="p-6 md:p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
