<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Product Name & Brand Identity
    |--------------------------------------------------------------------------
    */

    'product_name' => 'InstitutoPropio',

    /*
    |--------------------------------------------------------------------------
    | Free Trial Settings
    |--------------------------------------------------------------------------
    |
    | InstitutoPropio provides a 30-day free trial on initial school registration.
    | A payment method must be verified before trial activation. In production,
    | registrations stay in 'pending_payment_method' until verified via webhook.
    |
    */

    'trial_days' => 30,

    'trial_requires_payment_method' => true,

    /*
    |--------------------------------------------------------------------------
    | Development-Only Trial Bypass
    |--------------------------------------------------------------------------
    |
    | For local testing and automated feature tests ONLY.
    | MUST NEVER BE USABLE IN PRODUCTION.
    |
    */

    'allow_dev_trial_bypass' => env('ALLOW_DEV_TRIAL_BYPASS', false),

    /*
    |--------------------------------------------------------------------------
    | Trial Grace Period & Expiry Policy
    |--------------------------------------------------------------------------
    |
    | When a trial expires, the subscription transitions to 'expired'.
    | The expiry policy applies 'read_only' access to protect existing school,
    | student, curriculum, and financial records from deletion.
    |
    */

    'trial_grace_days' => (int) env('TRIAL_GRACE_PERIOD_DAYS', 0),

    'expiry_policy' => env('SUBSCRIPTION_EXPIRY_POLICY', 'read_only'),

    /*
    |--------------------------------------------------------------------------
    | Trial Reminders
    |--------------------------------------------------------------------------
    |
    | Days before trial expiration to send automatic billing reminders:
    | 7 days, 3 days, 1 day, and 0 days (day of expiry).
    |
    */

    'reminder_intervals' => [7, 3, 1, 0],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | Future payment gateway integration is prepared through provider-independent
    | contracts. Until live provider credentials are configured, the placeholder
    | driver cleanly communicates pending payment method status and routes users
    | to manual invoice processing without falsifying payment method verification.
    |
    */

    'default_gateway' => env('PAYMENT_GATEWAY', 'placeholder'),

    'gateways' => [
        'placeholder' => [
            'name' => 'Pending Payment Provider Integration',
            'configured' => false,
        ],
        'stripe' => [
            'name' => 'Stripe',
            'key' => env('STRIPE_KEY'),
            'secret' => env('STRIPE_SECRET'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
            'configured' => (bool) env('STRIPE_SECRET'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    */

    'currency' => env('BILLING_CURRENCY', 'USD'),

];
