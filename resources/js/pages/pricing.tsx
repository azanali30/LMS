import { Link } from '@inertiajs/react';
import { useState } from 'react';
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
            name: 'Starter',
            slug: 'starter',
            description:
                'Essential digital campus operating system for a single independent school, academy, or specialized training institute.',
            price_cents: 1900,
            price_annual_cents: 19000,
            price_monthly_formatted: '$19',
            price_annual_formatted: '$190',
            currency: 'USD',
            max_organizations: 1,
            organization_limit: '1 Institution',
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
            name: 'Growth',
            slug: 'growth',
            description:
                'Multi-campus expansion system for educational groups operating up to 5 branch institutions with centralized oversight.',
            price_cents: 4900,
            price_annual_cents: 49000,
            price_monthly_formatted: '$49',
            price_annual_formatted: '$490',
            currency: 'USD',
            max_organizations: 5,
            organization_limit: 'Up to 5 Institutions',
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
            name: 'Professional',
            slug: 'professional',
            description:
                'Regional campus network architecture managing up to 10 institutions with consolidated portfolio reporting and shared curricula.',
            price_cents: 9900,
            price_annual_cents: 99000,
            price_monthly_formatted: '$99',
            price_annual_formatted: '$990',
            currency: 'USD',
            max_organizations: 10,
            organization_limit: 'Up to 10 Institutions',
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
            name: 'Enterprise',
            slug: 'enterprise',
            description:
                'For national educational trusts, school franchises, and university networks requiring unlimited institutions and bespoke SLAs.',
            price_cents: 0,
            price_annual_cents: 0,
            price_monthly_formatted: 'Custom',
            price_annual_formatted: 'Custom',
            currency: 'USD',
            max_organizations: null,
            organization_limit: 'Unlimited Institutions',
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
                    name: 'Consolidated Executive Multi-School Dashboard',
                    starter: false,
                    growth: false,
                    professional: true,
                    enterprise: true,
                },
            ],
        },
        {
            title: 'Campus & School Governance',
            items: [
                {
                    name: 'Classrooms, Sections & Academic Terms',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Student Admission & Bio Documents',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Daily Roll Call & Substitute Tracking',
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
                    name: 'Curriculum Syllabi, Units & Topic Progress',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Cross-Campus Faculty Teaching Assignments',
                    starter: false,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
            ],
        },
        {
            title: 'Tuition Fees & Financial Operations',
            items: [
                {
                    name: 'Custom Fee Structures & Schedules',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Automated Invoice Generation',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Printable / Downloadable PDF Invoices & Receipts',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Multi-Campus Consolidated Financial Reconciliation',
                    starter: false,
                    growth: false,
                    professional: true,
                    enterprise: true,
                },
            ],
        },
        {
            title: 'Digital LMS & Course Authoring',
            items: [
                {
                    name: 'Online Course Hub & Lesson Player',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Video Lessons & Module Progress Tracking',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
                {
                    name: 'Digital Course Completion Certificates',
                    starter: true,
                    growth: true,
                    professional: true,
                    enterprise: true,
                },
            ],
        },
        {
            title: 'Support, SLAs & Infrastructure',
            items: [
                {
                    name: 'Free Trial Duration',
                    starter: `${trialDays} Days`,
                    growth: `${trialDays} Days`,
                    professional: `${trialDays} Days`,
                    enterprise: `${trialDays} Days`,
                },
                {
                    name: 'Support Channel',
                    starter: 'Standard Email & Portal',
                    growth: 'Priority Ticketing & Email',
                    professional: 'Dedicated Specialist',
                    enterprise: '24/7 Telephone & Private Slack',
                },
                {
                    name: 'Custom Domain & SSO Integrations',
                    starter: false,
                    growth: false,
                    professional: false,
                    enterprise: true,
                },
                {
                    name: 'Uptime SLA Guarantee',
                    starter: '99.5%',
                    growth: '99.8%',
                    professional: '99.9%',
                    enterprise: '99.95% Custom SLA',
                },
            ],
        },
    ];

    const faqs = [
        {
            q: 'How does the 30-day free trial work?',
            a: `Every new institution owner can start with an unrestricted 30-day free trial on our Starter, Growth, or Professional plans. A verified payment method is registered upfront to ensure uninterrupted continuity, but your card will never be charged during the trial period. You can modify or cancel your subscription at any time prior to day 30 with zero penalty.`,
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
    ];

    return (
        <PublicLayout title="Transparent International SaaS Pricing — InstitutoPropio">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-[#070b14] pt-20 pb-16 text-white sm:pt-28 sm:pb-20">
                {/* Subtle radial glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

                <div className="relative mx-auto w-full max-w-[1720px] px-6 text-center sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur-md">
                            <Sparkles className="size-4 text-blue-400" />
                            <span>Transparent Global SaaS Pricing • USD</span>
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Empower Every School with{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                                InstitutoPropio
                            </span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-xl">
                            World-class multi-tenant school governance and e-learning. Straightforward pricing based exclusively on the number of institutions you govern.
                        </p>

                        {/* Unlimited Students & Teachers Banner */}
                        <div className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-3 text-sm font-medium text-slate-200 shadow-xl backdrop-blur-md">
                            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                                <Users className="size-4" />
                                Unlimited Students & Teachers
                            </span>
                            <span className="hidden text-slate-600 sm:inline">•</span>
                            <span className="flex items-center gap-2 text-blue-400 font-semibold">
                                <Shield className="size-4" />
                                30-Day Free Trial
                            </span>
                            <span className="hidden text-slate-600 sm:inline">•</span>
                            <span className="flex items-center gap-2 text-indigo-400 font-semibold">
                                <CreditCard className="size-4" />
                                Zero Setup Fees
                            </span>
                        </div>

                        {/* MONTHLY / ANNUAL TOGGLE */}
                        <div className="mt-10 flex items-center justify-center">
                            <div className="relative flex items-center rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-lg">
                                <button
                                    type="button"
                                    onClick={() => setBillingInterval('monthly')}
                                    className={`relative z-10 cursor-pointer rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                                        billingInterval === 'monthly'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Monthly Billing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingInterval('annual')}
                                    className={`relative z-10 flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                                        billingInterval === 'annual'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span>Annual Billing</span>
                                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
                                        2 Months Free (~17% Off)
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PLAN CARDS GRID */}
            <section className="relative z-10 -mt-8 bg-slate-950 pb-20 sm:pb-28">
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

                            return (
                                <div
                                    key={plan.slug}
                                    className={`group relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                                        plan.is_popular
                                            ? 'border-blue-500 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/30'
                                            : 'border-slate-800 bg-slate-900/60 shadow-lg backdrop-blur-md hover:border-slate-700'
                                    }`}
                                >
                                    {plan.is_popular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1 text-xs font-extrabold text-white shadow-md shadow-blue-500/30">
                                                <Sparkles className="size-3.5" />
                                                Most Popular Choice
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-white">
                                                {plan.name}
                                            </h3>
                                            <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300">
                                                {plan.organization_limit}
                                            </span>
                                        </div>

                                        <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                            {plan.description}
                                        </p>

                                        {/* Pricing Block */}
                                        <div className="mt-6 border-y border-slate-800/80 py-5">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                                                    {displayPrice}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-400">
                                                    {pricePeriod}
                                                </span>
                                            </div>

                                            {!isEnterprise && billingInterval === 'annual' && (
                                                <p className="mt-1.5 text-xs font-medium text-emerald-400">
                                                    Equivalent to ${effectiveMonthlyFromAnnual}/mo • 2 months free!
                                                </p>
                                            )}

                                            {!isEnterprise && billingInterval === 'monthly' && (
                                                <p className="mt-1.5 text-xs text-slate-500">
                                                    Billed monthly in USD. Cancel anytime.
                                                </p>
                                            )}

                                            {isEnterprise && (
                                                <p className="mt-1.5 text-xs text-slate-400">
                                                    Bespoke pricing tailored to your multi-campus network.
                                                </p>
                                            )}
                                        </div>

                                        {/* Unlimited Feature Highlights */}
                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-400">
                                                <Users className="size-4 shrink-0 text-emerald-400" />
                                                <span>Unlimited Students & Teachers</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-xs font-bold text-blue-400">
                                                <Building2 className="size-4 shrink-0 text-blue-400" />
                                                <span>{plan.organization_limit}</span>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <ul className="mt-6 space-y-3 text-sm text-slate-300">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                                        <Check className="size-3 stroke-[3]" />
                                                    </div>
                                                    <span className="text-xs leading-relaxed text-slate-300">
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
                                                className={`w-full py-6 text-sm font-bold shadow-lg transition-all duration-200 cursor-pointer ${
                                                    plan.is_popular
                                                        ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'
                                                        : isEnterprise
                                                        ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                                                        : 'bg-white text-slate-900 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span>{ctaLabel}</span>
                                                <ArrowRight className="ml-2 size-4" />
                                            </Button>
                                        </Link>

                                        {!isEnterprise && (
                                            <p className="mt-2 text-center text-[11px] text-slate-500">
                                                30 days free • Payment method required
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
            <section className="bg-slate-900 border-y border-slate-800 py-12">
                <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 text-center">
                    <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
                        <ShieldCheck className="size-7" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Experience InstitutoPropio Free for 30 Days
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-300">
                        To protect our network integrity and ensure seamless uninterrupted service, an active payment method is verified upon registration. You will not be charged a single penny during your 30-day trial period, and you can cancel anytime.
                    </p>
                </div>
            </section>

            {/* FULL FEATURE COMPARISON MATRIX */}
            <section className="bg-slate-950 py-20 sm:py-28 text-white">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                            Detailed Feature Comparison
                        </h2>
                        <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                            Examine every operational capability across all four tiers of InstitutoPropio.
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl">
                        <table className="w-full min-w-[800px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900">
                                    <th className="py-5 px-6 text-sm font-extrabold text-white uppercase tracking-wider">
                                        Features & Specifications
                                    </th>
                                    <th className="py-5 px-6 text-sm font-extrabold text-white uppercase tracking-wider text-center">
                                        Starter
                                    </th>
                                    <th className="py-5 px-6 text-sm font-extrabold text-blue-400 uppercase tracking-wider text-center">
                                        Growth
                                    </th>
                                    <th className="py-5 px-6 text-sm font-extrabold text-white uppercase tracking-wider text-center">
                                        Professional
                                    </th>
                                    <th className="py-5 px-6 text-sm font-extrabold text-purple-400 uppercase tracking-wider text-center">
                                        Enterprise
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonCategories.map((category, catIdx) => (
                                    <React.Fragment key={catIdx}>
                                        <tr className="bg-slate-800/60 border-t border-b border-slate-800">
                                            <td
                                                colSpan={5}
                                                className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-400"
                                            >
                                                {category.title}
                                            </td>
                                        </tr>
                                        {category.items.map((item, itemIdx) => (
                                            <tr
                                                key={itemIdx}
                                                className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors"
                                            >
                                                <td className="py-4 px-6 text-sm font-medium text-slate-200">
                                                    {item.name}
                                                </td>
                                                {['starter', 'growth', 'professional', 'enterprise'].map((col) => {
                                                    const val = (item as any)[col];
                                                    return (
                                                        <td
                                                            key={col}
                                                            className="py-4 px-6 text-center text-sm font-medium text-slate-300"
                                                        >
                                                            {typeof val === 'boolean' ? (
                                                                val ? (
                                                                    <div className="inline-flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                                                        <Check className="size-4" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex size-6 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                                                                        <Minus className="size-4" />
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <span className="font-semibold text-white">
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
            <section className="bg-slate-900 py-20 border-t border-slate-800">
                <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
                            <HelpCircle className="size-3.5" />
                            <span>Frequently Asked Questions</span>
                        </div>
                        <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white">
                            Everything You Need to Know
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => {
                            const isOpen = activeFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                                        className="flex w-full cursor-pointer items-center justify-between p-6 text-left transition hover:bg-slate-900"
                                    >
                                        <span className="text-base font-bold text-white pr-4">
                                            {faq.q}
                                        </span>
                                        <ChevronDown
                                            className={`size-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-blue-400' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-slate-800/80 p-6 pt-4 text-sm leading-relaxed text-slate-300">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="bg-gradient-to-b from-slate-900 to-[#070b14] py-20 border-t border-slate-800 text-center">
                <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        Ready to Transform Your Educational System?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                        Start your 30-day free trial today or consult our enterprise team for customized campus network rollouts.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link href="/register?journey=school&plan=growth">
                            <Button className="bg-blue-600 px-8 py-6 text-base font-bold text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30 cursor-pointer">
                                <span>Get Started with 30-Day Free Trial</span>
                                <ArrowRight className="ml-2 size-5" />
                            </Button>
                        </Link>
                        <Link href="/contact?subject=Sales+Inquiry">
                            <Button variant="outline" className="border-slate-700 bg-slate-800/60 px-8 py-6 text-base font-bold text-white hover:bg-slate-800 cursor-pointer">
                                <PhoneCall className="mr-2 size-5" />
                                <span>Talk to an Expert</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

// React import needed for React.Fragment in JSX
import React from 'react';
