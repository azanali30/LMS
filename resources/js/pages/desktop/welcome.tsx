import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    LogIn,
    ShieldCheck,
    Building2,
    RotateCcw,
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    RefreshCw,
    KeyRound,
} from 'lucide-react';

interface DesktopWelcomeProps {
    appName?: string;
    webUrl?: string;
    isDesktop?: boolean;
}

// PKCE Helper Functions (RFC 7636 compliant S256)
function generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    return Array.from(values, (val) => charset[val % charset.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
    let str = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function createPkceChallenge(verifier: string): Promise<string> {
    const hashed = await sha256(verifier);
    return base64UrlEncode(hashed);
}

declare global {
    interface Window {
        handleDesktopDeepLink?: (url: string) => void;
        __TAURI__?: {
            opener?: {
                openUrl: (url: string) => Promise<void>;
            };
            event?: {
                listen: (event: string, handler: (e: { payload: string }) => void) => Promise<() => void>;
            };
            core?: {
                invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>;
            };
        };
    }
}

export default function DesktopWelcome({
    appName = 'InstitutoPropio',
    webUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: DesktopWelcomeProps) {
    const [status, setStatus] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [manualCode, setManualCode] = useState<string>('');
    const [showManual, setShowManual] = useState<boolean>(false);
    const [authConnectUrl, setAuthConnectUrl] = useState<string>('');
    const isConsumingRef = useRef<boolean>(false);

    // Open external browser securely
    const openExternal = async (url: string) => {
        try {
            if (window.__TAURI__?.opener?.openUrl) {
                await window.__TAURI__.opener.openUrl(url);
                return;
            }
        } catch (e) {
            console.warn('Tauri opener failed, using window.open fallback:', e);
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Consume Authorization Code via Top-Level Navigation (First-Party Cookie Handshake)
    const consumeCode = useCallback((code: string, stateParam?: string | null) => {
        if (isConsumingRef.current) {
            return;
        }

        const storedState = sessionStorage.getItem('pkce_state') || localStorage.getItem('pkce_state');
        const verifier = sessionStorage.getItem('pkce_verifier') || localStorage.getItem('pkce_verifier');

        if (!verifier) {
            setErrorMessage("Session verifier not found. Please click 'Sign In' to initiate a fresh login session.");
            setStatus('error');
            return;
        }

        if (stateParam && storedState && stateParam !== storedState) {
            setErrorMessage("Security state validation mismatch (CSRF defense). Please click 'Sign In' to retry.");
            setStatus('error');
            return;
        }

        isConsumingRef.current = true;
        setStatus('success');

        // Clear stored verifier and state
        sessionStorage.removeItem('pkce_verifier');
        sessionStorage.removeItem('pkce_state');
        localStorage.removeItem('pkce_verifier');
        localStorage.removeItem('pkce_state');

        // Top-level document navigation to /desktop/consume sets first-party session cookie and redirects to /dashboard
        const baseUrl = webUrl || window.location.origin;
        const consumeUrl = `${baseUrl}/desktop/consume?code=${encodeURIComponent(code)}&code_verifier=${encodeURIComponent(verifier)}&state=${encodeURIComponent(stateParam || storedState || '')}`;

        window.location.href = consumeUrl;
    }, [webUrl]);

    // Handle deep link URL strings
    const handleDeepLink = useCallback((urlStr: string) => {
        if (!urlStr) return;
        try {
            const parsed = new URL(urlStr.replace('institutopropio://', 'https://placeholder.internal/'));
            const code = parsed.searchParams.get('code');
            const state = parsed.searchParams.get('state');

            if (code) {
                consumeCode(code, state);
            }
        } catch (err) {
            console.error('Failed to parse deep link URL:', err);
            setErrorMessage('Received an invalid authentication callback format.');
            setStatus('error');
        }
    }, [consumeCode]);

    // Start PKCE Browser Login
    const handleSignIn = async () => {
        try {
            setErrorMessage('');
            const verifier = generateRandomString(64);
            const state = generateRandomString(32);
            const challenge = await createPkceChallenge(verifier);

            sessionStorage.setItem('pkce_verifier', verifier);
            sessionStorage.setItem('pkce_state', state);
            localStorage.setItem('pkce_verifier', verifier);
            localStorage.setItem('pkce_state', state);

            const baseUrl = webUrl || window.location.origin;
            const connectUrl = `${baseUrl}/desktop/connect?code_challenge=${encodeURIComponent(challenge)}&state=${encodeURIComponent(state)}`;

            setAuthConnectUrl(connectUrl);
            setStatus('waiting');

            await openExternal(connectUrl);
        } catch (err: any) {
            console.error('Failed to start login flow:', err);
            setErrorMessage(err.message || 'Failed to start login flow.');
            setStatus('error');
        }
    };

    // Retry Browser Launch
    const handleRetryBrowser = async () => {
        if (authConnectUrl) {
            await openExternal(authConnectUrl);
        } else {
            handleSignIn();
        }
    };

    // Cancel Authentication
    const handleCancel = () => {
        setStatus('idle');
        setErrorMessage('');
        sessionStorage.removeItem('pkce_verifier');
        sessionStorage.removeItem('pkce_state');
        localStorage.removeItem('pkce_verifier');
        localStorage.removeItem('pkce_state');
    };

    // Handle Manual Code Submission
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = manualCode.trim();
        if (trimmed.length !== 64) {
            setErrorMessage('Authorization code must be exactly 64 characters long.');
            setStatus('error');
            return;
        }
        consumeCode(trimmed);
    };

    // Mount deep link listeners
    useEffect(() => {
        // 1. Expose global deep-link receiver for Rust eval / Tauri single-instance
        window.handleDesktopDeepLink = (url: string) => {
            console.log('Received deep link via window.handleDesktopDeepLink:', url);
            handleDeepLink(url);
        };

        // 2. Attach Tauri event listener if running inside Tauri
        let unlisten: (() => void) | undefined;
        if (window.__TAURI__?.event?.listen) {
            window.__TAURI__.event.listen('deep-link-received', (event) => {
                console.log('Received deep link via Tauri event:', event.payload);
                handleDeepLink(event.payload);
            }).then((u) => {
                unlisten = u;
            }).catch((err) => {
                console.warn('Tauri event listen failed:', err);
            });
        }

        // 3. Check for cold-start CLI deep link
        if (window.__TAURI__?.core?.invoke) {
            window.__TAURI__.core.invoke('get_cli_deep_link')
                .then((cliLink) => {
                    if (cliLink) {
                        console.log('Received cold-start CLI deep link:', cliLink);
                        handleDeepLink(cliLink);
                    }
                })
                .catch(() => {});
        }

        // 4. Check URL search params for direct code (e.g. if redirected with query params)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.has('code')) {
                consumeCode(params.get('code')!, params.get('state'));
            }
        }

        return () => {
            if (unlisten) unlisten();
            delete window.handleDesktopDeepLink;
        };
    }, [handleDeepLink, consumeCode]);

    return (
        <div className="flex min-h-screen flex-col bg-[#F5F8F7] font-sans text-[#172B3D] selection:bg-[#078675] selection:text-white">
            <Head title={`Welcome — ${appName} Desktop`} />

            {/* Desktop Window Titlebar Bar */}
            <header className="flex h-13 items-center justify-between border-b border-slate-200 bg-white px-6">
                <div className="flex items-center gap-2.5">
                    <img
                        src="/images/logo-emblem.png"
                        alt="InstitutoPropio Emblem"
                        className="size-6 object-contain"
                        onError={(e) => {
                            // Fallback if image fails
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <span className="text-sm font-extrabold tracking-tight text-[#173A5E]">
                        InstitutoPropio
                    </span>
                    <span className="rounded-full border border-[#078675]/20 bg-[#078675]/10 px-2 py-0.5 text-[10px] font-bold text-[#078675]">
                        Windows Client
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={webUrl || '/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1 text-xs font-semibold text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-[#173A5E] transition"
                        title="Open marketing website in browser"
                    >
                        <ExternalLink className="size-3.5" />
                        <span>Website</span>
                    </a>
                </div>
            </header>

            {/* Main Center Area */}
            <main className="flex flex-1 items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xl shadow-[#173A5E]/5 text-center">
                    {/* Logo */}
                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-slate-100 bg-[#F5F8F7] p-3 shadow-inner">
                        <img
                            src="/images/logo.png"
                            alt="InstitutoPropio Logo"
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>

                    {/* Welcoming Heading & Subtitle */}
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                        Welcome to InstitutoPropio
                    </h1>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500">
                        Your unified campus and e-learning platform.
                    </p>

                    {/* Waiting Banner */}
                    {status === 'waiting' && (
                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-900 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 font-bold text-amber-950">
                                <RefreshCw className="size-4 animate-spin text-amber-600" />
                                <span>Awaiting Authentication in Browser</span>
                            </div>
                            <p className="mt-1 text-slate-600">
                                Please sign in on the browser page that just opened. Once authorized, your desktop app will automatically connect.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={handleRetryBrowser}
                                    className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                                >
                                    Re-open Browser
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success Banner */}
                    {status === 'success' && (
                        <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left text-xs text-emerald-900 animate-in fade-in duration-200">
                            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                            <div>
                                <span className="font-bold">✓ Authorization verified!</span> Launching your institution workspace...
                            </div>
                        </div>
                    )}

                    {/* Error Banner */}
                    {status === 'error' && (
                        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-left text-xs text-rose-900 animate-in fade-in duration-200">
                            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                            <div>
                                <span className="font-bold">Authentication Notice:</span>{' '}
                                {errorMessage || 'Could not complete desktop login. Please try again.'}
                            </div>
                        </div>
                    )}

                    {/* Primary Sign In Button */}
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleSignIn}
                            disabled={status === 'waiting' || status === 'success'}
                            className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#173A5E] via-[#078675] to-[#26965B] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#078675]/20 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 transition"
                        >
                            <LogIn className="size-4.5 transition-transform group-hover:translate-x-0.5" />
                            <span>Sign In</span>
                        </button>
                    </div>

                    {/* Manual Fallback Toggle */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowManual(!showManual)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-[#078675] transition"
                        >
                            {showManual
                                ? 'Hide manual code entry'
                                : 'Having trouble with callback? Enter code manually'}
                        </button>

                        {showManual && (
                            <form onSubmit={handleManualSubmit} className="mt-3 space-y-2 text-left">
                                <label className="block text-[11px] font-bold text-[#173A5E]">
                                    Single-Use Authorization Code (64 characters):
                                </label>
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Paste 64-character code"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#078675] focus:outline-none focus:ring-1 focus:ring-[#078675]"
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <button
                                    type="submit"
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#173A5E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#122e4b] transition"
                                >
                                    <KeyRound className="size-3.5" />
                                    <span>Verify & Connect</span>
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Security & Tenant Badge Footer */}
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Multi-Tenant Campus Isolation</span>
                        </span>
                        <span>Version 1.0.0</span>
                    </div>
                </div>
            </main>
        </div>
    );
}

