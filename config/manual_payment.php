<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Manual Payment Approval System Configuration
    |--------------------------------------------------------------------------
    | Enables admin-verified manual payment processing for SaaS onboarding.
    | Private bank and wallet coordinates are configurable via environment variables
    | to ensure no private account credentials are ever committed to source control.
    */

    'enabled' => env('MANUAL_PAYMENT_ENABLED', true),

    'currency' => env('MANUAL_PAYMENT_CURRENCY', 'USD'),

    'trial_days' => (int) env('MANUAL_PAYMENT_TRIAL_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Annual Pricing Status
    |--------------------------------------------------------------------------
    | Yearly prices are not finalized. When false, UI explicitly communicates
    | that annual billing is pending finalization and prompts Monthly selection.
    */
    'yearly_pricing_available' => env('MANUAL_PAYMENT_YEARLY_AVAILABLE', false),

    /*
    |--------------------------------------------------------------------------
    | Supported Subscription Plans for Manual Onboarding
    |--------------------------------------------------------------------------
    | Starter: $19/mo
    | Growth: $49/mo
    | Professional: $99/mo
    | Unlimited students and teachers across all tiers.
    */
    'plans' => [
        'starter' => [
            'name' => 'Starter',
            'slug' => 'starter',
            'headline' => 'Essential Digital Campus',
            'target' => 'Single Independent Institution / Academy',
            'monthly_cents' => 1900,
            'yearly_cents' => null, // Not finalized
            'yearly_available' => false,
            'max_organizations' => 1,
            'features' => [
                '1 Isolated institution workspace',
                '30-Day free trial (activates upon payment approval)',
                'Unlimited students & teacher accounts',
                'Daily roll call & attendance tracking',
                'Class schedules & timetable builder',
                'Syllabus & curriculum tracking',
                'Tuition fee invoicing & ledger',
            ],
        ],

        'growth' => [
            'name' => 'Growth',
            'slug' => 'growth',
            'headline' => 'Multi-Campus Expansion',
            'target' => 'Expanding Multi-Campus Systems',
            'monthly_cents' => 4900,
            'yearly_cents' => null, // Not finalized
            'yearly_available' => false,
            'is_popular' => true,
            'max_organizations' => 5,
            'features' => [
                'Up to 5 Isolated institution workspaces',
                '30-Day free trial (activates upon payment approval)',
                'Unlimited students & teacher accounts',
                '1-Click campus switcher',
                'Unified executive oversight',
                'Independent terms & fee ledgers per campus',
                'Cross-campus faculty assignments',
                'Priority email & portal support',
            ],
        ],

        'professional' => [
            'name' => 'Professional',
            'slug' => 'professional',
            'headline' => 'Regional Campus Network',
            'target' => 'Regional Education Groups & Chains',
            'monthly_cents' => 9900,
            'yearly_cents' => null, // Not finalized
            'yearly_available' => false,
            'max_organizations' => 10,
            'features' => [
                'Up to 10 Isolated institution workspaces',
                '30-Day free trial (activates upon payment approval)',
                'Unlimited students & teacher accounts',
                'Consolidated portfolio reporting',
                'Cross-school curriculum sharing',
                'Campus audit & reconciliation logs',
                'LMS multimedia courses & certificates',
                'Dedicated onboarding specialist',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configurable Payment Methods
    |--------------------------------------------------------------------------
    | Platform administrators can update account titles, numbers, and branch
    | coordinates in .env without modifying application code.
    */
    'methods' => [
        'bank_transfer' => [
            'id' => 'bank_transfer',
            'name' => 'Bank Wire / Direct Transfer',
            'badge' => 'Recommended for Institutions',
            'bank_name' => env('MANUAL_PAYMENT_BANK_NAME', 'Standard Chartered Bank'),
            'account_title' => env('MANUAL_PAYMENT_BANK_TITLE', 'InstitutoPropio Technologies Inc.'),
            'account_number' => env('MANUAL_PAYMENT_BANK_ACCOUNT', '01-2345678-01'),
            'iban' => env('MANUAL_PAYMENT_BANK_IBAN', 'PK36SCBL0000001234567801'),
            'swift' => env('MANUAL_PAYMENT_BANK_SWIFT', 'SCBLPKKXXXX'),
            'branch' => env('MANUAL_PAYMENT_BANK_BRANCH', 'Main Corporate Campus Branch'),
            'instructions' => 'Transfer the payable amount using online wire or branch deposit to the coordinates above. Please retain the electronic bank statement or deposit slip as your proof of payment.',
        ],

        'jazzcash' => [
            'id' => 'jazzcash',
            'name' => 'JazzCash Mobile Wallet',
            'badge' => 'Instant Mobile Payment',
            'account_title' => env('MANUAL_PAYMENT_JAZZCASH_TITLE', 'InstitutoPropio Operations'),
            'account_number' => env('MANUAL_PAYMENT_JAZZCASH_NUMBER', '0300-1234567'),
            'till_id' => env('MANUAL_PAYMENT_JAZZCASH_TILL', '00293847'),
            'instructions' => 'Transfer the fee via JazzCash mobile app or till number. Note the 12-digit Transaction ID (TID) from the SMS confirmation and attach a screenshot of the completed transfer.',
        ],

        'easypaisa' => [
            'id' => 'easypaisa',
            'name' => 'Easypaisa Mobile Wallet',
            'badge' => 'Instant Mobile Transfer',
            'account_title' => env('MANUAL_PAYMENT_EASYPAISA_TITLE', 'InstitutoPropio Subscriptions'),
            'account_number' => env('MANUAL_PAYMENT_EASYPAISA_NUMBER', '0345-9876543'),
            'instructions' => 'Send funds to the Easypaisa mobile account number above. Keep the TRX ID generated by Easypaisa and upload the transaction receipt screenshot.',
        ],

        'other' => [
            'id' => 'other',
            'name' => 'International Wire / Corporate Invoice',
            'badge' => 'Custom Verification',
            'instructions' => 'For international wires, corporate purchase orders, or bespoke invoicing, contact our finance desk at billing@institutopropio.com. Attach your confirmed wire receipt or voucher.',
        ],
    ],
];
