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
    | Currency & Default Monetary Units
    |--------------------------------------------------------------------------
    | All monetary calculations must use integer minor units (cents) to avoid
    | floating-point arithmetic errors.
    */
    'currency' => env('BILLING_CURRENCY', 'USD'),

    /*
    |--------------------------------------------------------------------------
    | Free Trial Configuration
    |--------------------------------------------------------------------------
    | Free trial length in days. In production, activation strictly requires
    | verified payment method via future payment provider.
    */
    'trial_days' => (int) env('TRIAL_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Annual Discount Factor
    |--------------------------------------------------------------------------
    | Annual billing offers ~16.67% discount, equivalent to two months free:
    | Annual Price = 10 * Monthly Price (12 months of service for price of 10).
    */
    'annual_months_billed' => 10,

    /*
    |--------------------------------------------------------------------------
    | Official Subscription Plans (USD Minor Units / Cents)
    |--------------------------------------------------------------------------
    | Starter: $19/mo ($190/yr) - 1 institution
    | Growth: $49/mo ($490/yr) - Up to 5 institutions
    | Professional: $99/mo ($990/yr) - Up to 10 institutions
    | Enterprise: Custom/Contact Sales - Unlimited institutions
    |
    | Students & Teachers are strictly UNLIMITED on all plans.
    */
    'plans' => [
        'starter' => [
            'name' => 'Starter',
            'slug' => 'starter',
            'headline' => 'Essential Digital Campus',
            'target' => 'Single Independent Institution / Academy',
            'description' => 'Everything a single independent school or academy needs to run daily campus operations, academic schedules, admissions, and tuition invoicing.',
            'price_monthly_cents' => 1900,   // $19.00 USD
            'price_annual_cents' => 19000,   // $190.00 USD (2 months free)
            'currency' => 'USD',
            'max_organizations' => 1,        // 1 institution
            'max_students' => 0,             // Unlimited
            'max_teachers' => 0,             // Unlimited
            'max_courses' => 0,              // Unlimited
            'is_active' => true,
            'is_popular' => false,
            'cta_text' => 'Start 30-Day Free Trial',
            'cta_href' => '/register?journey=school&plan=starter',
            'features' => [
                '1 Isolated institution workspace',
                '30-Day free trial (payment method required)',
                'Unlimited students & teacher accounts',
                'Student admission & class rosters',
                'Daily roll call & substitute tracking',
                'Weekly timetable & room scheduling',
                'Curriculum syllabus & progress tracking',
                'Fee structures & PDF invoices/receipts',
                'Gradebook & exam marks recording',
                'Standard email & portal support',
            ],
        ],

        'growth' => [
            'name' => 'Growth',
            'slug' => 'growth',
            'headline' => 'Multi-Campus Expansion',
            'target' => 'Expanding Multi-Campus School Systems',
            'badge' => 'Most Popular',
            'badge_color' => 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
            'description' => 'Designed for growing educational groups operating up to 5 branch institutions with centralized executive oversight and 1-click campus switching.',
            'price_monthly_cents' => 4900,   // $49.00 USD
            'price_annual_cents' => 49000,   // $490.00 USD (2 months free)
            'currency' => 'USD',
            'max_organizations' => 5,        // Up to 5 institutions
            'max_students' => 0,             // Unlimited
            'max_teachers' => 0,             // Unlimited
            'max_courses' => 0,              // Unlimited
            'is_active' => true,
            'is_popular' => true,
            'cta_text' => 'Start 30-Day Free Trial',
            'cta_href' => '/register?journey=school&plan=growth',
            'features' => [
                'Up to 5 Isolated institution workspaces',
                '30-Day free trial (payment method required)',
                'Unlimited students & teacher accounts',
                'Instant 1-click institution switcher',
                'Unified executive owner oversight',
                'Independent academic years & terms per school',
                'Separate campus fee structures & bank accounts',
                'Cross-campus faculty assignments',
                'All Starter features included',
                'Priority email & ticketing support',
            ],
        ],

        'professional' => [
            'name' => 'Professional',
            'slug' => 'professional',
            'headline' => 'Regional Campus Network',
            'target' => 'Regional Education Groups & Chains',
            'badge' => 'Comprehensive',
            'badge_color' => 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
            'description' => 'Engineered for regional academy chains and school networks managing up to 10 institutions with portfolio reporting and shared curricula.',
            'price_monthly_cents' => 9900,   // $99.00 USD
            'price_annual_cents' => 99000,   // $990.00 USD (2 months free)
            'currency' => 'USD',
            'max_organizations' => 10,       // Up to 10 institutions
            'max_students' => 0,             // Unlimited
            'max_teachers' => 0,             // Unlimited
            'max_courses' => 0,              // Unlimited
            'is_active' => true,
            'is_popular' => false,
            'cta_text' => 'Start 30-Day Free Trial',
            'cta_href' => '/register?journey=school&plan=professional',
            'features' => [
                'Up to 10 Isolated institution workspaces',
                '30-Day free trial (payment method required)',
                'Unlimited students & teacher accounts',
                'Consolidated executive portfolio reporting',
                'Cross-school curriculum sharing & templates',
                'Delegated campus administration roles',
                'Multi-institution fee audit & reconciliation',
                'LMS multimedia course creation & certificates',
                'All Growth features included',
                'Dedicated onboarding specialist',
            ],
        ],

        'enterprise' => [
            'name' => 'Enterprise',
            'slug' => 'enterprise',
            'headline' => 'Unlimited Trust & District',
            'target' => 'National Trusts, Districts & Franchises',
            'badge' => 'Bespoke Scale',
            'badge_color' => 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
            'description' => 'For national educational trusts, university campus networks, and government school districts requiring unlimited institutions and dedicated private infrastructure.',
            'price_monthly_cents' => null,   // Custom / Contact Sales
            'price_annual_cents' => null,    // Custom / Contact Sales
            'currency' => 'USD',
            'max_organizations' => null,     // Unlimited institutions
            'max_students' => 0,             // Unlimited
            'max_teachers' => 0,             // Unlimited
            'max_courses' => 0,              // Unlimited
            'is_active' => true,
            'is_popular' => false,
            'is_custom' => true,
            'cta_text' => 'Contact Sales',
            'cta_href' => '/contact?subject=Enterprise+Inquiry',
            'features' => [
                'Unlimited isolated institution workspaces',
                'Unlimited students & teacher accounts',
                'Dedicated private cloud infrastructure',
                'Custom domain names & Single Sign-On (SSO)',
                '99.9% Uptime SLA & 24/7 emergency telephone support',
                'Tailored faculty & staff onboarding workshops',
                'Bespoke data compliance, audit logs & export',
                'Custom payment gateway & billing integrations',
                'Executive account director & roadmap influence',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Legacy Plan Slug Aliases & Backward Compatibility Mapping
    |--------------------------------------------------------------------------
    | Ensures existing database records, subscriptions, tests, and links
    | referencing historical slugs resolve seamlessly to new official tiers.
    */
    'legacy_aliases' => [
        'bronze' => 'starter',
        'silver' => 'growth',
        'gold' => 'professional',
        'premium' => 'enterprise',
        'starter-academy' => 'starter',
        'pro-campus' => 'growth',
        'enterprise-campus' => 'enterprise',
    ],

];
