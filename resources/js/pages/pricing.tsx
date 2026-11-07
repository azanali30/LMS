import { Link } from '@inertiajs/react';
import React, { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import {
    ArrowRight,
    Building2,
    Check,
    ChevronDown,
    CreditCard,
    Globe2,
    HelpCircle,
    Info,
    Layers,
    Mail,
    Minus,
    PhoneCall,
    Shield,
    ShieldCheck,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanProp {
    id?: number;
    name: string;
    slug: string;
    description: string;
    price_cents: number;
    price_annual_cents: number;
    price_monthly_formatted?: string;
    price_annual_formatted?: string;
    currency: string;
    max_organizations: number | null;
    organization_limit: string;
    features: string[];
    is_popular?: boolean;
    is_custom?: boolean;
}

interface PricingPageProps {
    plans?: PlanProp[];
    currency?: string;
    trialDays?: number;
}

export default function PricingPage({
    plans: serverPlans = [],
    currency = 'USD',
    trialDays = 30,
}: PricingPageProps) {
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    // Fallback official InstitutoPropio plans if not passed via props
    const defaultPlans: PlanProp[] = [
        {
            name: 'Bronze (Starter)',
            slug: 'starter',
            description:
                'Essential digital campus operating system for a single independent school, academy, or specialized training institute.',
            price_cents: 1900,
            price_annual_cents: 19000,
            price_monthly_formatted: '$19',
            price_annual_formatted: '$190',
            currency: 'USD',
            max_organizations: 1,
            organization_limit: '1 Institution (Bronze)',
            features: [
                '1 Isolated institution workspace',
                '30-Day free trial included',
                'Unlimited students & teacher accounts',
                'Student admission & class rosters',
                'Daily roll call & substitute tracking',
                'Weekly timetable & room scheduling',
                'Curriculum syllabus & topic tracking',
                'Fee structures & PDF invoices/receipts',
                'Gradebook & exam marks recording',
                'Standard email & portal support',
            ],
            is_popular: false,
            is_custom: false,
        },
        {
            name: 'Silver (Growth)',
            slug: 'growth',
            description:
                'Multi-campus expansion system for educational groups operating up to 5 branch institutions with centralized oversight.',
            price_cents: 4900,
            price_annual_cents: 49000,
            price_monthly_formatted: '$49',
            price_annual_formatted: '$490',
            currency: 'USD',
            max_organizations: 5,
            organization_limit: 'Up to 5 Institutions (Silver)',
            features: [
                'Up to 5 Isolated institution workspaces',
                '30-Day free trial included',
                'Unlimited students & teacher accounts',
                'Instant 1-click institution switcher',
                'Unified executive owner oversight',
                'Independent academic years & terms per school',
                'Separate campus fee structures & bank accounts',
                'Cross-campus faculty assignments',
                'All Starter capabilities included',
                'Priority email & ticketing support',
            ],
            is_popular: true,
            is_custom: false,
        },
        {
            name: 'Gold (Professional)',
            slug: 'professional',
            description:
                'Regional campus network architecture managing up to 10 institutions with consolidated portfolio reporting and shared curricula.',
            price_cents: 9900,
            price_annual_cents: 99000,
            price_monthly_formatted: '$99',
            price_annual_formatted: '$990',
            currency: 'USD',
            max_organizations: 10,
            organization_limit: 'Up to 10 Institutions (Gold)',
            features: [
                'Up to 10 Isolated institution workspaces',
                '30-Day free trial included',
                'Unlimited students & teacher accounts',
                'Consolidated executive portfolio reporting',
                'Cross-school curriculum sharing & templates',
                'Delegated campus administration roles',
                'Multi-institution fee audit & reconciliation',
                'LMS multimedia course creation & certificates',
                'All Growth capabilities included',
                'Dedicated onboarding specialist',
            ],
            is_popular: false,
            is_custom: false,
        },
        {
            name: 'Premium (Enterprise)',
            slug: 'enterprise',
            description:
                'For national educational trusts, school franchises, and university networks requiring unlimited institutions and bespoke SLAs.',
            price_cents: 0,
            price_annual_cents: 0,
            price_monthly_formatted: 'Custom',
            price_annual_formatted: 'Custom',
            currency: 'USD',
            max_organizations: null,
            organization_limit: 'Unlimited Institutions (Premium)',
            features: [
                'Unlimited isolated institution workspaces',
                'Unlimited students & teacher accounts',
                'Dedicated private cloud infrastructure',
                'Custom domain names & Single Sign-On (SSO)',
                '99.9% Uptime SLA & 24/7 dedicated telephone support',
                'Tailored faculty & staff onboarding workshops',
                'Bespoke data compliance, audit logs & export',
                'Custom payment gateway & billing integrations',
                'Executive account director & roadmap influence',
            ],
            is_popular: false,
            is_custom: true,
        },
    ];

    const displayPlans = serverPlans.length > 0 ? serverPlans : defaultPlans;

    const comparisonCategories = [
        {
            title: 'Multi-Tenant Scale & Institutions',
            items: [
                {
                    name: 'Institution Workspaces Allowed',
                    starter: '1 Institution',
                    growth: 'Up to 5 Institutions',
                    professional: 'Up to 10 Institutions',
                    enterprise: 'Unlimited',
                },
                {
                    name: 'Students & Teachers Allowed',
                    starter: 'Unlimited',
                    growth: 'Unlimited',
                    professional: 'Unlimited',
                    enterprise: 'Unlimited',
                },
                {
                    name: 'Strict Tenant Data Isolation',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: '1-Click Instant Institution Switcher',
                    starter: false,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Custom Domain Subdomain Support',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
            ],
        },
        {
            title: 'Academic & Institutional Operations',
            items: [
                {
                    name: 'Academic Years & Terms Configuration',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Grade Cohorts & Classroom Sections',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Weekly Timetable Matrix Scheduling',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Curriculum Syllabi Progress Tracking',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Rapid Daily Attendance Roll Call',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Gradebook & Student Term Marksheets',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Cross-Campus Curriculum Templates',
                    starter: false,
                    growth: false,
                    professional: true,
                    enterprise: true,
                },
            ],
        },
        {
            title: 'Fee Billing & Financial Invoicing',
            items: [
                {
                    name: 'Custom Grade-Level Fee Structures',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Automated Batch Monthly Invoices',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Printable Fee Deposit Vouchers (PDF)',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Partial Payment & Arrears Ledgers',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Consolidated Portfolio Revenue Reports',
                    starter: false,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
            ],
        },
        {
            title: 'Support, Security & Governance',
            items: [
                {
                    name: 'Cryptographic Database Query Scoping',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Role-Based Access Control (Admin, Faculty, Student)',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Support Level',
                    starter: 'Standard Email',
                    growth: 'Priority Ticketing',
                    professional: 'Dedicated Specialist',
                    enterprise: '24/7 Phone & SLA',
                },
                {
                    name: '99.9% Guaranteed Uptime SLA',
                    starter: false,
                    growth: false,
                    professional: false,
                    enterprise: true,
                },
            ],
        },
    ];

    const faqs = [
        {
            q: 'How does the 30-day free trial work?',
            a: 'Every new institution owner can start with an unrestricted 30-day free trial on our Starter, Growth, or Professional plans. A verified payment method is registered upfront to ensure uninterrupted continuity, but your payment is held without penalty during your trial. You can modify or cancel your subscription at any time prior to day 30 with zero penalty.',
        },
        {
            q: 'What is considered an "Institution" in InstitutoPropio?',
            a: 'In InstitutoPropio, an Institution is a fully isolated school or academy workspace with its own dedicated academic terms, student admissions, class sections, timetables, and fee structures. Starter includes 1 institution, Growth accommodates up to 5, Professional supports up to 10, and Enterprise offers unlimited institution provisioning.',
        },
        {
            q: 'Are there any limits on students or teachers?',
            a: 'No. Unlike legacy school management software that penalizes you per student or teacher head, InstitutoPropio offers 100% UNLIMITED students and teachers across every plan tier.',
        },
        {
            q: 'How much do I save with annual billing?',
            a: 'When you choose annual billing, you receive approximately 16.67% off, which is equivalent to two months completely free. For example, the Starter plan is $190/year (instead of $228), and the Growth plan is $490/year (instead of $588).',
        },
        {
            q: 'Can I upgrade or downgrade between plans later?',
            a: 'Yes. You can upgrade instantly from your Billing & Subscription dashboard as your institution opens additional branches or campus locations. When downgrading, our system verifies that your existing institution count fits within the target plan.',
        },
        {
            q: 'What happens to our school data if our trial expires?',
            a: 'Your educational data is sacred. When a trial expires, your institution transitions to a safe read-only policy. No students, grades, timetables, or financial records are ever deleted. You can restore administrative write access at any time by renewing your subscription.',
        },
        {
            q: 'How are payments and invoices processed?',
            a: 'All online orders and subscription transactions are processed by Paddle.com Market Ltd, acting as our Merchant of Record. Paddle provides PCI-compliant checkout, automated sales tax and VAT compliance, instant invoice receipts, and secure billing support at paddle.net.',
        },
    ];

    return (
        <PublicLayout title="Transparent International SaaS Pricing — InstitutoPropio">
            {/* HERO SECTION */}
            <section className="bg-gradient-hero pt-16 pb-12 sm:pt-24 sm:pb-16 border-b border-slate-100 text-center">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#078675]/25 bg-gradient-accent-pill px-3.5 py-1 text-xs font-bold text-[#173A5E] shadow-2xs">
                            <Sparkles className="size-3.5 text-[#078675]" />
                            <span>Transparent Global SaaS Pricing • USD</span>
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-[#173A5E] sm:text-6xl lg:text-7xl">
                            Empower Every School with{' '}
                            <span className="text-gradient-primary">
                                InstitutoPropio
                            </span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                            World-class multi-tenant school governance and e-learning. Straightforward pricing based exclusively on the number of institutions you govern.
                        </p>

                        {/* Unlimited Students & Teachers Banner */}
                        <div className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xs px-6 py-3 text-sm font-medium text-slate-700 shadow-xs">
                            <span className="flex items-center gap-2 text-emerald-700 font-bold">
                                <Users className="size-4 text-emerald-600" />
                                Unlimited Students & Teachers
                            </span>
                            <span className="hidden text-slate-300 sm:inline">•</span>
                            <span className="flex items-center gap-2 text-[#078675] font-bold">
                                <Shield className="size-4" />
                                30-Day Free Trial
                            </span>
                            <span className="hidden text-slate-300 sm:inline">•</span>
                            <span className="flex items-center gap-2 text-indigo-700 font-bold">
                                <CreditCard className="size-4 text-indigo-600" />
                                Zero Setup Fees
                            </span>
                        </div>

                        {/* MONTHLY / ANNUAL TOGGLE */}
                        <div className="mt-10 flex items-center justify-center">
                            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setBillingInterval('monthly')}
                                    className={`cursor-pointer rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                                        billingInterval === 'monthly'
                                            ? 'btn-gradient-primary text-white shadow-xs'
                                             : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Monthly Billing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingInterval('annual')}
                                    className={`flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                                        billingInterval === 'annual'
                                            ? 'btn-gradient-primary text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span>Annual Billing</span>
                                    <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                                        2 Months Free (~17% Off)
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Paddle Merchant of Record Trust Note */}
                        <div className="mx-auto mt-6 max-w-xl text-center">
                            <p className="text-xs text-slate-500">
                                <ShieldCheck className="mr-1 inline-block size-3.5 text-[#078675]" />
                                Secure checkout and payment processing handled by <strong className="font-semibold text-slate-700">Paddle.com</strong>, our Merchant of Record.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PLAN CARDS GRID */}
            <section className="bg-[#F5F8F7] py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {displayPlans.map((plan) => {
                            const isEnterprise = plan.is_custom || plan.slug === 'enterprise';
                            const monthlyPriceDollars = Math.round(plan.price_cents / 100);
                            const annualPriceDollars = Math.round(plan.price_annual_cents / 100);
                            const effectiveMonthlyFromAnnual = Math.round(annualPriceDollars / 12);

                            const displayPrice = isEnterprise
                                ? 'Custom'
                                : billingInterval === 'annual'
                                ? `$${annualPriceDollars}`
                                : `$${monthlyPriceDollars}`;

                            const pricePeriod = isEnterprise
                                ? ''
                                : billingInterval === 'annual'
                                ? '/year'
                                : '/month';

                            const targetHref = isEnterprise
                                ? '/contact?subject=Enterprise+Inquiry'
                                : `/register?journey=school&plan=${plan.slug}&interval=${billingInterval}`;

                            const ctaLabel = isEnterprise
                                ? 'Contact Sales'
                                : `Start 30-Day Free Trial`;

                            const tierLabelMap: Record<string, string> = {
                                starter: 'Bronze',
                                bronze: 'Bronze',
                                growth: 'Silver',
                                silver: 'Silver',
                                professional: 'Gold',
                                gold: 'Gold',
                                enterprise: 'Premium',
                                premium: 'Premium',
                            };
                            const tierName = tierLabelMap[plan.slug.toLowerCase()];
                            const displayName =
                                tierName && !plan.name.includes(tierName)
                                    ? `${plan.name} (${tierName})`
                                    : plan.name;

                            return (
                                <div
                                    key={plan.slug}
                                    className={`group relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                        plan.is_popular
                                            ? 'border-2 border-[#078675] ring-4 ring-[#078675]/10 bg-white shadow-xl shadow-glow-primary'
                                            : 'border-slate-200 bg-white shadow-xs hover:border-slate-300'
                                    }`}
                                >
                                    {plan.is_popular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center gap-1.5 rounded-full btn-gradient-warm px-4 py-1 text-xs font-extrabold text-white shadow-md">
                                                <Sparkles className="size-3.5" />
                                                Most Popular Choice
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-[#173A5E]">
                                                {displayName}
                                            </h3>
                                            <span className="rounded-full border border-[#078675]/20 bg-[#078675]/10 px-2.5 py-0.5 text-xs font-bold text-[#078675]">
                                                {plan.organization_limit}
                                            </span>
                                        </div>

                                        <p className="mt-3 text-xs leading-relaxed text-slate-500 min-h-[36px]">
                                            {plan.description}
                                        </p>

                                        {/* Pricing Block */}
                                        <div className="mt-6 border-y border-slate-100 py-5">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-4xl font-extrabold tracking-tight text-[#173A5E] sm:text-5xl">
                                                    {displayPrice}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-500">
                                                    {pricePeriod}
                                                </span>
                                            </div>

                                            {!isEnterprise && billingInterval === 'annual' && (
                                                <p className="mt-1.5 text-xs font-bold text-emerald-700">
                                                    Equivalent to ${effectiveMonthlyFromAnnual}/mo • 2 months free!
                                                </p>
                                            )}

                                            {!isEnterprise && billingInterval === 'monthly' && (
                                                <p className="mt-1.5 text-xs text-slate-500">
                                                    Billed monthly in USD. Cancel anytime.
                                                </p>
                                            )}

                                            {isEnterprise && (
                                                <p className="mt-1.5 text-xs text-slate-500">
                                                    Bespoke pricing tailored to your multi-campus network.
                                                </p>
                                            )}
                                        </div>

                                        {/* Unlimited Feature Highlights */}
                                        <div className="mt-6 space-y-2.5">
                                            <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-700">
                                                <Users className="size-4 shrink-0 text-emerald-600" />
                                                <span>Unlimited Students & Teachers</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-xs font-bold text-[#078675]">
                                                <Building2 className="size-4 shrink-0 text-[#078675]" />
                                                <span>{plan.organization_limit}</span>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <ul className="mt-6 space-y-3 text-xs text-slate-600">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#078675]">
                                                        <Check className="size-3 stroke-[3]" />
                                                    </div>
                                                    <span className="leading-relaxed">
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-8 pt-4">
                                        <Link href={targetHref} className="block w-full">
                                            <Button
                                                className={`w-full py-6 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                                    plan.is_popular
                                                        ? 'btn-gradient-cta text-white shadow-md active:scale-[0.98]'
                                                        : isEnterprise
                                                        ? 'btn-gradient-primary text-white shadow-md active:scale-[0.98]'
                                                        : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-[#078675]'
                                                }`}
                                            >
                                                <span>{ctaLabel}</span>
                                                <ArrowRight className="ml-2 size-4" />
                                            </Button>
                                        </Link>

                                        {!isEnterprise && (
                                            <p className="mt-2 text-center text-[11px] text-slate-400">
                                                30 days free • Zero setup charges
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 30-DAY TRIAL BANNER */}
            <section className="bg-[#078675]/10 border-b border-[#078675]/15 py-14">
                <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 text-center">
                    <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-blue-100 text-[#078675] mb-4 border border-[#078675]/20 shadow-xs">
                        <ShieldCheck className="size-7" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#173A5E]">
                        Experience InstitutoPropio Free for 30 Days
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
                        To protect our network integrity and ensure seamless uninterrupted service, an active payment method is verified upon registration. You will not be charged a single penny during your 30-day trial period, and you can cancel anytime.
                    </p>
                </div>
            </section>

            {/* FULL FEATURE COMPARISON MATRIX */}
            <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center mb-14">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Feature Breakdown
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#173A5E]">
                            Detailed Capability Comparison
                        </h2>
                        <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
                            Examine every operational capability across all four tiers of InstitutoPropio.
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
                        <table className="w-full min-w-[800px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-[#F8FAFC]">
                                    <th className="py-4 px-6 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                                        Features & Specifications
                                    </th>
                                    <th className="py-4 px-6 text-xs font-extrabold text-slate-900 uppercase tracking-wider text-center">
                                        Starter
                                    </th>
                                    <th className="py-4 px-6 text-xs font-extrabold text-[#078675] uppercase tracking-wider text-center">
                                        Growth
                                    </th>
                                    <th className="py-4 px-6 text-xs font-extrabold text-slate-900 uppercase tracking-wider text-center">
                                        Professional
                                    </th>
                                    <th className="py-4 px-6 text-xs font-extrabold text-purple-700 uppercase tracking-wider text-center">
                                        Enterprise
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonCategories.map((category, catIdx) => (
                                    <React.Fragment key={catIdx}>
                                        <tr className="bg-slate-50 border-t border-b border-slate-200">
                                            <td
                                                colSpan={5}
                                                className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-[#078675]"
                                            >
                                                {category.title}
                                            </td>
                                        </tr>
                                        {category.items.map((item, itemIdx) => (
                                            <tr
                                                key={itemIdx}
                                                className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                                            >
                                                <td className="py-4 px-6 text-xs font-semibold text-slate-800">
                                                    {item.name}
                                                </td>
                                                {['starter', 'growth', 'professional', 'enterprise'].map((col) => {
                                                    const val = (item as any)[col];
                                                    return (
                                                        <td
                                                            key={col}
                                                            className="py-4 px-6 text-center text-xs font-medium text-slate-600"
                                                        >
                                                            {typeof val === 'boolean' ? (
                                                                val ? (
                                                                    <div className="inline-flex size-6 items-center justify-center rounded-full bg-blue-100 text-[#078675]">
                                                                        <Check className="size-4 stroke-[3]" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                                        <Minus className="size-4" />
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <span className="font-bold text-slate-900">
                                                                    {val}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section className="bg-[#F5F8F7] py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#078675]/20 bg-[#078675]/10 px-3.5 py-1 text-xs font-bold text-[#078675]">
                            <HelpCircle className="size-3.5" />
                            <span>Frequently Asked Questions</span>
                        </div>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#173A5E]">
                            Everything You Need to Know
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => {
                            const isOpen = activeFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                                        className="flex w-full cursor-pointer items-center justify-between p-6 text-left transition hover:bg-slate-50"
                                    >
                                        <span className="text-sm sm:text-base font-bold text-[#173A5E] pr-4">
                                            {faq.q}
                                        </span>
                                        <ChevronDown
                                            className={`size-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-[#078675]' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-slate-100 p-6 pt-4 text-xs sm:text-sm leading-relaxed text-slate-600">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* BOTTOM CTA SECTION */}
            <section className="relative overflow-hidden bg-gradient-primary py-16 sm:py-24 text-center text-white shadow-glow-navy">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-20 -left-20 size-80 rounded-full bg-white/10 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-[#E49A2E]/20 blur-3xl"
                />

                <div className="relative mx-auto w-full max-w-4xl px-6 sm:px-8">
                    <span className="inline-block rounded-full border border-white/25 bg-white/15 px-4 py-1 text-xs font-semibold tracking-wide backdrop-blur-md">
                        Start Your Free Trial
                    </span>
                    <h2 className="mt-4 text-3xl sm:text-5xl font-black text-white tracking-tight">
                        Ready to Transform Your Educational System?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-emerald-100 leading-relaxed">
                        Start your 30-day free trial today or consult our enterprise team for customized campus network rollouts.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link href="/register?journey=school&plan=growth">
                            <Button className="h-12 btn-gradient-warm px-8 text-sm font-bold text-white shadow-lg active:scale-[0.98] cursor-pointer">
                                <span>Get Started with 30-Day Free Trial</span>
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                        </Link>
                        <Link href="/contact?subject=Sales+Inquiry">
                            <Button variant="outline" className="h-12 border-white/40 bg-white/10 px-8 text-sm font-bold text-white hover:bg-white/20 cursor-pointer">
                                <PhoneCall className="mr-2 size-4 text-emerald-300" />
                                <span>Talk to Sales</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
