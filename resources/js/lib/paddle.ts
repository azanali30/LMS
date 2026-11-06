/**
 * Official Paddle Billing v2 Frontend Integration for InstitutoPropio
 */

declare global {
    interface Window {
        Paddle?: {
            Environment: {
                set: (env: 'sandbox' | 'production' | string) => void;
            };
            Initialize: (options: {
                token: string;
                eventCallback?: (data: any) => void;
            }) => void;
            Checkout: {
                open: (options: {
                    settings?: {
                        displayMode?: 'overlay' | 'inline';
                        theme?: 'light' | 'dark';
                        locale?: string;
                        successUrl?: string;
                    };
                    items?: Array<{
                        priceId: string;
                        quantity?: number;
                    }>;
                    customer?: {
                        email?: string;
                        name?: string;
                    };
                    customData?: Record<string, any>;
                }) => void;
            };
        };
    }
}

let isPaddleInitialized = false;

/**
 * Initialize Paddle Billing v2 with the client-side token and environment.
 */
export function initPaddle(clientToken: string, environment: string = 'sandbox'): boolean {
    if (typeof window === 'undefined' || !window.Paddle) {
        console.warn('Paddle.js is not loaded on window.');
        return false;
    }

    if (isPaddleInitialized) {
        return true;
    }

    try {
        const env = environment.toLowerCase() === 'live' || environment.toLowerCase() === 'production'
            ? 'production'
            : 'sandbox';

        window.Paddle.Environment.set(env);
        window.Paddle.Initialize({
            token: clientToken,
            eventCallback: (event) => {
                if (event?.name === 'checkout.completed') {
                    // Refresh or redirect back to billing on completed checkout
                    window.location.reload();
                }
            },
        });

        isPaddleInitialized = true;
        return true;
    } catch (err) {
        console.error('Failed to initialize Paddle.js:', err);
        return false;
    }
}

/**
 * Open Paddle Billing checkout overlay using verified backend parameters.
 */
export function openPaddleCheckout(params: {
    clientToken?: string;
    environment?: string;
    priceId: string;
    customerEmail?: string;
    customerName?: string;
    customData?: Record<string, any>;
    successUrl?: string;
}): boolean {
    if (typeof window === 'undefined' || !window.Paddle) {
        alert('Paddle billing is currently loading. Please try again in a moment.');
        return false;
    }

    if (params.clientToken) {
        initPaddle(params.clientToken, params.environment || 'sandbox');
    }

    try {
        window.Paddle.Checkout.open({
            settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: params.successUrl || window.location.href,
            },
            items: [
                {
                    priceId: params.priceId,
                    quantity: 1,
                },
            ],
            customer: {
                email: params.customerEmail,
                name: params.customerName,
            },
            customData: params.customData,
        });

        return true;
    } catch (err) {
        console.error('Error launching Paddle checkout:', err);
        alert('Unable to launch Paddle checkout. Please contact support.');
        return false;
    }
}

