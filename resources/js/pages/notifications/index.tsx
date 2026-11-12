import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Bell, CheckCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import TenantLayout from '@/layouts/tenant-layout';
import { NotificationIcon } from '@/components/notifications/notification-icon';
import type { NotificationItem } from '@/hooks/use-notifications';

interface PreferenceRow {
    category: string;
    label: string;
    in_app: boolean;
    browser: boolean;
    email: boolean;
    mandatory_critical: boolean;
}

interface PaginatedNotifications {
    data: Array<NotificationItem & { created_at_iso?: string | null }>;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
}

interface NotificationsPageProps {
    notificationsList: PaginatedNotifications;
    unreadCount: number;
    filters: {
        category: string;
        status: string;
    };
    categories: Record<string, string>;
    preferences: PreferenceRow[];
    isPlatformScope: boolean;
}

export default function NotificationsIndex({
    notificationsList,
    unreadCount,
    filters,
    categories,
    preferences: initialPreferences,
    isPlatformScope,
}: NotificationsPageProps) {
    const [tab, setTab] = useState<'history' | 'preferences'>('history');
    const [prefs, setPrefs] = useState<PreferenceRow[]>(initialPreferences);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported';
        }
        return window.Notification.permission;
    });

    const basePath = isPlatformScope ? '/platform-admin/notifications' : '/notifications';
    const scopePayload = isPlatformScope ? { scope: 'platform' } : {};

    const applyFilter = (next: Partial<{ category: string; status: string }>) => {
        const category = next.category ?? filters.category;
        const status = next.status ?? filters.status;
        router.get(
            basePath,
            {
                ...(category && category !== 'all' ? { category } : {}),
                ...(status && status !== 'all' ? { status } : {}),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const requestBrowserPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }
        const result = await window.Notification.requestPermission();
        setBrowserPerm(result);
    };

    const togglePref = (category: string, channel: 'in_app' | 'browser' | 'email') => {
        setPrefs((prev) =>
            prev.map((row) => {
                if (row.category !== category) {
                    return row;
                }
                return { ...row, [channel]: !row[channel] };
            }),
        );
    };

    const savePreferences = () => {
        setSavingPrefs(true);
        router.put(
            '/notifications/preferences',
            {
                ...scopePayload,
                preferences: prefs.map((p) => ({
                    category: p.category,
                    in_app: p.in_app,
                    browser: p.browser,
                    email: p.email,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingPrefs(false),
            },
        );
    };

    const markRead = (id: string) => {
        router.post(`/notifications/${id}/read`, scopePayload, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post('/notifications/read-all', scopePayload, { preserveScroll: true });
    };

    const deleteNotification = (id: string) => {
        router.delete(`/notifications/${id}`, { data: scopePayload, preserveScroll: true });
    };

    const Layout = isPlatformScope ? PlatformAdminLayout : TenantLayout;

    return (
        <Layout title="Notification Center">
            <Head title="Notification Center" />

            <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Notification Center
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Stay updated on fees, timetable reminders, attendance, academics, and workspace activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTab('history')}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                tab === 'history'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                            }`}
                        >
                            <Bell className="size-3.5" />
                            History {unreadCount > 0 ? `(${unreadCount})` : ''}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('preferences')}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                tab === 'preferences'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                            }`}
                        >
                            <SlidersHorizontal className="size-3.5" />
                            Preferences
                        </button>
                    </div>
                </div>

                {tab === 'history' ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => applyFilter({ category: 'all' })}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                        filters.category === 'all'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    All Categories
                                </button>
                                {Object.entries(categories).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => applyFilter({ category: key })}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                            filters.category === key
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={filters.status}
                                    onChange={(e) => applyFilter({ status: e.target.value })}
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="all">All Status</option>
                                    <option value="unread">Unread Only</option>
                                    <option value="read">Read Only</option>
                                </select>

                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllRead}
                                        className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-300"
                                    >
                                        <CheckCheck className="size-3.5" />
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/70">
                            {notificationsList.data.length === 0 ? (
                                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                    No notifications found for the selected filter.
                                </div>
                            ) : (
                                notificationsList.data.map((n) => {
                                    const isUnread = !n.read_at;
                                    const categoryLabel =
                                        categories[n.category || n.data?.category || 'system'] || 'System';

                                    return (
                                        <div
                                            key={n.id}
                                            className={`flex items-start justify-between gap-4 p-4 transition ${
                                                isUnread ? 'bg-purple-50/40 dark:bg-purple-950/15' : ''
                                            }`}
                                        >
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
                                                    <NotificationIcon
                                                        icon={n.data?.icon}
                                                        category={n.category || n.data?.category}
                                                        className="size-4"
                                                    />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {n.data?.title || 'Notification'}
                                                        </span>
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {categoryLabel}
                                                        </span>
                                                        {isUnread && (
                                                            <span className="size-2 rounded-full bg-purple-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                                        {n.data?.message || ''}
                                                    </p>
                                                    <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                                                        <span>{n.created_at}</span>
                                                        {n.data?.url && (
                                                            <Link
                                                                href={n.data.url}
                                                                onClick={() => isUnread && markRead(n.id)}
                                                                className="font-semibold text-purple-600 hover:underline dark:text-purple-400"
                                                            >
                                                                Open destination &rarr;
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                {isUnread && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markRead(n.id)}
                                                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => deleteNotification(n.id)}
                                                    title="Delete notification"
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Delivery Channel Preferences
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Critical fee, security, and account notifications always remain enabled in-app.
                                </p>
                            </div>
                            {browserPerm !== 'unsupported' && browserPerm !== 'granted' && (
                                <button
                                    type="button"
                                    onClick={requestBrowserPermission}
                                    className="rounded-xl border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-300"
                                >
                                    Enable Browser Notifications
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                        <th className="py-2 pr-4 font-semibold">Category</th>
                                        <th className="px-4 py-2 text-center font-semibold">In-App</th>
                                        <th className="px-4 py-2 text-center font-semibold">Browser</th>
                                        <th className="px-4 py-2 text-center font-semibold">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {prefs.map((row) => (
                                        <tr key={row.category}>
                                            <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">
                                                {row.label}
                                                {row.mandatory_critical && (
                                                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                        Critical enforced
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.in_app}
                                                    onChange={() => togglePref(row.category, 'in_app')}
                                                    className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.browser}
                                                    onChange={() => togglePref(row.category, 'browser')}
                                                    className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={row.email}
                                                    onChange={() => togglePref(row.category, 'email')}
                                                    className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                disabled={savingPrefs}
                                onClick={savePreferences}
                                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
                            >
                                {savingPrefs ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

