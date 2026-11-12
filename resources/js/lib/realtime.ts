import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export interface RealtimeConfig {
    driver?: string;
    enabled?: boolean;
    key?: string | null;
    host?: string | null;
    port?: number | string | null;
    scheme?: string | null;
}

declare global {
    interface Window {
        Pusher?: typeof Pusher;
        Echo?: Echo<'reverb'>;
    }
}

let echoInstance: Echo<'reverb'> | null = null;
let echoKey: string | null = null;

function getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (typeof document !== 'undefined') {
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
            headers['X-CSRF-TOKEN'] = metaToken;
        }
    }

    const xsrfCookie = getCookieValue('XSRF-TOKEN');
    if (xsrfCookie) {
        headers['X-XSRF-TOKEN'] = xsrfCookie;
    }

    return headers;
}

export function getEcho(config?: RealtimeConfig | null): Echo<'reverb'> | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const key = config?.key || import.meta.env.VITE_REVERB_APP_KEY;
    const enabled = Boolean(config?.enabled ?? (key ? true : false));

    if (!enabled || !key) {
        return null;
    }

    if (echoInstance && echoKey === key) {
        return echoInstance;
    }

    window.Pusher = Pusher;

    const scheme = String(config?.scheme || import.meta.env.VITE_REVERB_SCHEME || 'https');
    const host = String(config?.host || import.meta.env.VITE_REVERB_HOST || window.location.hostname);
    const port = Number(config?.port || import.meta.env.VITE_REVERB_PORT || (scheme === 'https' ? 443 : 80));

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                fetch('/broadcasting/auth', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...getCsrfHeaders(),
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                    .then(async (res) => {
                        if (!res.ok) {
                            throw new Error(`Broadcast auth failed (${res.status})`);
                        }
                        const data = await res.json();
                        callback(null, data);
                    })
                    .catch((err) => {
                        callback(err instanceof Error ? err : new Error('Broadcast auth error'), null);
                    });
            },
        }),
    });

    echoKey = key;
    window.Echo = echoInstance;

    return echoInstance;
}
