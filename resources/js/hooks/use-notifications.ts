import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getEcho, type RealtimeConfig } from '@/lib/realtime';

export interface NotificationItem {
    id: string;
    type: string;
    category?: string;
    scope?: string;
    organization_id?: number | null;
    data: {
        type?: string;
        category?: string;
        title?: string;
        message?: string;
        url?: string;
        icon?: string;
        severity?: string;
        balance_due?: number;
        currency?: string;
        reminder_type?: string;
    };
    read_at: string | null;
    created_at: string;
}

interface NotificationsProp {
    unreadCount: number;
    recent: NotificationItem[];
}

export function useNotifications(options?: { pollIntervalMs?: number; scope?: 'organization' | 'platform' }) {
    const pollIntervalMs = options?.pollIntervalMs ?? 30000;
    const explicitScope = options?.scope;
    const page = usePage<{
        auth?: {
            user?: { id: number } | null;
            currentOrganization?: { id: number } | null;
            organizationRole?: string | null;
            isSuperAdmin?: boolean;
        };
        notifications?: NotificationsProp | null;
        realtime?: RealtimeConfig | null;
    }>();

    const userId = page.props.auth?.user?.id ?? null;
    const orgId = explicitScope === 'platform' ? null : (page.props.auth?.currentOrganization?.id ?? null);
    const orgRole = explicitScope === 'platform' ? null : (page.props.auth?.organizationRole ?? null);
    const isSuperAdmin = Boolean(page.props.auth?.isSuperAdmin);
    const isPlatformScope = explicitScope === 'platform' || (!orgId && isSuperAdmin);
    const initialNotifs = page.props.notifications;
    const realtimeConfig = page.props.realtime;

    const [unreadCount, setUnreadCount] = useState<number>(initialNotifs?.unreadCount ?? 0);
    const [recent, setRecent] = useState<NotificationItem[]>(initialNotifs?.recent ?? []);
    const [connected, setConnected] = useState<boolean>(false);

    const seenIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!initialNotifs) {
            return;
        }
        setUnreadCount(initialNotifs.unreadCount ?? 0);
        setRecent(initialNotifs.recent ?? []);
        for (const item of initialNotifs.recent ?? []) {
            seenIdsRef.current.add(item.id);
        }
    }, [initialNotifs]);

    const fetchLatest = useCallback(async () => {
        if (!userId) {
            return;
        }
        try {
            const scopeQuery = isPlatformScope ? '&scope=platform' : '';
            const response = await fetch(`/notifications?limit=15${scopeQuery}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                return;
            }
            const json = (await response.json()) as {
                unread_count: number;
                notifications: NotificationItem[];
            };
            setUnreadCount(json.unread_count ?? 0);
            setRecent(json.notifications ?? []);
            for (const item of json.notifications ?? []) {
                seenIdsRef.current.add(item.id);
            }
        } catch {
            // Silent fallback when offline or transitioning
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            return;
        }

        const echo = getEcho(realtimeConfig);
        const userChannelName = orgId ? `org.${orgId}.user.${userId}` : `App.Models.User.${userId}`;
        const roleChannelName = orgId && orgRole ? `org.${orgId}.role.${orgRole}` : null;
        const platformChannelName = isPlatformScope && isSuperAdmin ? 'platform.super-admin' : null;

        if (echo) {
            const handleIncoming = (payload: {
                id?: string;
                category?: string;
                title?: string;
                message?: string;
                url?: string;
                icon?: string;
                severity?: string;
                browser_notify?: boolean;
                created_at?: string;
            }) => {
                const id = payload.id || `rt-${Date.now()}-${Math.random()}`;
                if (seenIdsRef.current.has(id)) {
                    return;
                }
                seenIdsRef.current.add(id);

                const item: NotificationItem = {
                    id,
                    type: payload.category || 'system',
                    category: payload.category || 'system',
                    organization_id: orgId,
                    data: {
                        category: payload.category || 'system',
                        title: payload.title || 'New Notification',
                        message: payload.message || '',
                        url: payload.url || '/notifications',
                        icon: payload.icon || 'bell',
                        severity: payload.severity || 'info',
                    },
                    read_at: null,
                    created_at: 'Just now',
                };

                setUnreadCount((prev) => prev + 1);
                setRecent((prev) => [item, ...prev.filter((p) => p.id !== id)].slice(0, 15));

                const title = item.data.title || 'Notification';
                const description = item.data.message || '';
                if (payload.severity === 'error') {
                    toast.error(title, { description });
                } else if (payload.severity === 'warning') {
                    toast.warning(title, { description });
                } else if (payload.severity === 'success') {
                    toast.success(title, { description });
                } else {
                    toast.info(title, { description });
                }

                if (
                    payload.browser_notify &&
                    typeof window !== 'undefined' &&
                    'Notification' in window &&
                    window.Notification.permission === 'granted'
                ) {
                    new window.Notification(title, { body: description });
                }
            };

            const userChannel = echo.private(userChannelName);
            userChannel.listen('.notification.created', handleIncoming);
            setConnected(true);

            if (platformChannelName) {
                echo.private(platformChannelName).listen('.notification.created', handleIncoming);
            }

            if (roleChannelName) {
                echo.private(roleChannelName).listen('.domain.updated', () => {
                    router.reload();
                });
            }

            return () => {
                echo.leave(userChannelName);
                if (platformChannelName) {
                    echo.leave(platformChannelName);
                }
                if (roleChannelName) {
                    echo.leave(roleChannelName);
                }
                setConnected(false);
            };
        }

        // Polling fallback when WebSocket / Reverb is not configured
        setConnected(false);
        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                void fetchLatest();
            }
        }, pollIntervalMs);

        return () => {
            window.clearInterval(interval);
        };
    }, [userId, orgId, orgRole, isSuperAdmin, isPlatformScope, realtimeConfig, pollIntervalMs, fetchLatest]);

    const markAsRead = useCallback((id: string, targetUrl?: string) => {
        setRecent((prev) =>
            prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)),
        );
        setUnreadCount((prev) => {
            const target = recent.find((n) => n.id === id);
            return target && !target.read_at ? Math.max(0, prev - 1) : prev;
        });

        router.post(
            `/notifications/${id}/read`,
            isPlatformScope ? { scope: 'platform' } : {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (targetUrl) {
                        router.visit(targetUrl);
                    }
                },
            },
        );
    }, [recent, isPlatformScope]);

    const markAllAsRead = useCallback(() => {
        setRecent((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        setUnreadCount(0);

        router.post('/notifications/read-all', isPlatformScope ? { scope: 'platform' } : {}, { preserveScroll: true });
    }, [isPlatformScope]);

    return {
        unreadCount,
        recent,
        connected,
        markAsRead,
        markAllAsRead,
        refresh: fetchLatest,
    };
}

