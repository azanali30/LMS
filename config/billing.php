<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Free Trial Settings
    |--------------------------------------------------------------------------
    |
    | SkillForge LMS provides a 30-day free trial on initial school registration.
    | The school workspace is immediately activated during the trial period.
    |
    */

    'trial_days' => 30,

    /*
    |--------------------------------------------------------------------------
    | Trial Grace Period & Expiry Policy
    |--------------------------------------------------------------------------
    |
    | The trial-expiry grace period and exact price/currency remain configurable
    | until finalized by business leadership.
    | Policies: 'read_only' (allow inspection, block new data creation) or 'locked'
    |
    */

    'trial_grace_days' => (int) env('TRIAL_GRACE_PERIOD_DAYS', 0),

    'expiry_policy' => env('SUBSCRIPTION_EXPIRY_POLICY', 'read_only'),

    /*
    |--------------------------------------------------------------------------
    | Trial Reminders
    |--------------------------------------------------------------------------
    |
    | Days before trial expiration to send automatic billing reminders.
    |
    */

    'reminder_intervals' => [7, 3, 1, 0],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | Online payment gateway configuration placeholders. Until credentials are
    | finalized and provided, the placeholder driver cleanly indicates that online
    | checkout is awaiting configuration and routes users to manual invoice requests.
    |
    */

    'default_gateway' => env('PAYMENT_GATEWAY', 'placeholder'),

    'gateways' => [
        'placeholder' => [
            'name' => 'Gateway Integration Placeholder',
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
