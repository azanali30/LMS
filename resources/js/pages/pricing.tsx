import { Link } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import {
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    ChevronDown,
    HelpCircle,
    Info,
    Layers,
    Mail,
    Minus,
    PhoneCall,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { register } from '@/routes';

interface PricingPlan {
    name: string;
    orgLimit: string;
    target: string;
    badge?: string;
    badgeColor?: string;
    description: string;
    ctaText: string;
    ctaHref: string;
    isPrimary?: boolean;
    features: string[];
}

export default function PricingPage() {
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    const plans: PricingPlan[] = [
        {
            name: 'Bronze',
            orgLimit: '1 Organization',
            target: 'Single Campus / Independent School',
            description:
                'Ideal for standalone private schools, single-branch academies, and specialized training institutes needing a complete digital operating system.',
            ctaText: 'Start 30-Day Free Trial',
            ctaHref: '/register?journey=school&plan=bronze',
            isPrimary: false,
            features: [
                '1 Isolated organization tenant',
                'Unlimited students, teachers & classrooms',
                'Daily roll call & substitute tracking',
                'Weekly timetable & room allocations',
                'Curriculum syllabi & topic tracking',
                'Student fee invoices & PDF receipts',
                'Gradebook & exam marks entry',
                'Community & email support',
            ],
        },
        {
            name: 'Silver',
            orgLimit: 'Up to 5 Organizations',
            target: 'Growing Multi-Campus Schools',
            badge: 'Most Popular',
            badgeColor: 'bg-blue-50 text-[#1769E0] border border-blue-200',
            description:
                'Tailored for expanding education groups managing primary, middle, and secondary schools or twin campuses with unified executive oversight.',
            ctaText: 'Start 30-Day Free Trial',
            ctaHref: '/register?journey=school&plan=silver',
            isPrimary: true,
            features: [
                'Up to 5 Isolated organization tenants',
                'Instant organization switching in 1 click',
                'Unified executive owner account',
                'Separate academic calendars & terms per school',
                'Independent fee structures & accounts',
                'Cross-campus faculty assignments',
                'All Bronze core capabilities included',
                'Standard priority email & ticketing support',
            ],
        },
        {
            name: 'Gold',
            orgLimit: 'Up to 10 Organizations',
            target: 'Regional School Networks',
            description:
                'Engineered for regional educational groups, multi-city academy chains, and comprehensive campus networks requiring consolidated metrics.',
            ctaText: 'Start 30-Day Free Trial',
            ctaHref: '/register?journey=school&plan=gold',
            isPrimary: false,
            features: [
                'Up to 10 Isolated organization tenants',
                'Consolidated executive reporting',
                'Dedicated database query scoping',
                'Centralized curriculum sharing templates',
                'Role-based multi-campus administrator delegation',
                'Parent portal link across family enrollments',
                'Full multimedia course LMS authoring',
                'Dedicated onboarding specialist',
            ],
        },
        {
            name: 'Premium',
            orgLimit: 'Unlimited Organizations',
            target: 'Large Educational Trusts & Districts',
            badge: 'Enterprise',
            badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
            description:
                'For national educational trusts, school franchises, and government educational divisions requiring unlimited tenant provisioning and custom SLAs.',
            ctaText: 'Start 30-Day Free Trial',
            ctaHref: '/register?journey=school&plan=premium',
            isPrimary: false,
            features: [
                'Unlimited organization tenants',
                'Dynamic organization provisioning on demand',
                'Strict tenant data boundary guarantees',
                'Custom domain / branding configuration',
                'Tailored faculty & administrator onboarding sessions',
                'Windows Tauri Desktop client site deployment',
                '99.9% Uptime SLA & 24/7 dedicated telephone support',
                'Executive quarterly review & roadmap influence',
            ],
        },
    ];

    const comparisonCategories = [
        {
            title: 'Multi-Tenant Governance',
            items: [
                {
                    name: 'Organization Limit',
                    bronze: '1 Organization',
                    silver: 'Up to 5 Organizations',
                    gold: 'Up to 10 Organizations',
                    premium: 'Unlimited',
                },
                {
                    name: 'Tenant Data Isolation (Query-Level Scoping)',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'One-Click Organization Switcher',
                    bronze: false,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Cryptographic Faculty Invitation Tokens',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Custom Domain / Subdomain Provisioning',
                    bronze: false,
                    silver: false,
                    gold: 'On Request',
                    premium: true,
                },
            ],
        },
        {
            title: 'School Operations & Administration',
            items: [
                {
                    name: 'Student Admissions & Records',
                    bronze: 'Unlimited',
                    silver: 'Unlimited',
                    gold: 'Unlimited',
                    premium: 'Unlimited',
                },
                {
                    name: 'Classrooms, Sections & Subjects',
                    bronze: 'Unlimited',
                    silver: 'Unlimited',
                    gold: 'Unlimited',
                    premium: 'Unlimited',
                },
                {
                    name: 'Rapid Attendance Roll Call with Substitutes',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Weekly Timetable Matrices & Room Allocations',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Curriculum Syllabi & Progress Checklists',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
            ],
        },
        {
            title: 'Financial Management & Billing',
            items: [
                {
                    name: 'Class-Level Fee Structures',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Batch Invoice Generation',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Printable Fee Vouchers & Receipts',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Multi-Campus Consolidated Billing Audits',
                    bronze: false,
                    silver: 'Per School',
                    gold: true,
                    premium: true,
                },
            ],
        },
        {
            title: 'E-Learning, Portals & Desktop',
            items: [
                {
                    name: 'Dedicated Portals (Admin, Teacher, Student, Parent)',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Course Catalog & Video Lessons',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Verifiable Digital Graduation Certificates',
                    bronze: true,
                    silver: true,
                    gold: true,
                    premium: true,
                },
                {
                    name: 'Windows Desktop Client (Tauri)',
                    bronze: 'Coming Soon',
                    silver: 'Coming Soon',
                    gold: 'Coming Soon',
                    premium: 'Priority Access',
                },
                {
                    name: 'Support Level',
                    bronze: 'Standard Email',
                    silver: 'Priority Ticketing',
                    gold: 'Dedicated Specialist',
                    premium: '24/7 Phone & SLA',
                },
            ],
        },
    ];

    const faqs = [
        {
            q: 'How are organizations distinguished across plans?',
            a: 'In SkillForge LMS, an Organization represents an autonomous school or campus entity with its own dedicated academic sessions, classrooms, attendance logs, teacher staff rosters, and financial accounts. The primary distinction between plans is the number of independent organizations you can create and manage under your master executive account.',
        },
        {
            q: 'Are there student or teacher seat limits imposed?',
            a: 'No arbitrary limits are imposed on students or teachers within your provisioned organizations. Whether you have 200 or 2,000 students in a school, your institution has full capacity to operate without per-seat penalty fees.',
        },
        {
            q: 'What are the current pricing rates and billing cycles?',
            a: 'Pricing tiers are currently proposed and tailored to institutional requirements. Contact our education solutions team for a personalized quotation based on your organization structure and support requirements. No unexpected charges will ever be applied without your explicit approval.',
        },
        {
            q: 'Can I easily upgrade when our school network expands?',
            a: 'Yes. Upgrading between Bronze, Silver, Gold, and Premium is instantaneous. When your institution opens new campuses or branches, you can immediately increase your organization allocation without re-installing software or migrating databases.',
        },
        {
            q: 'How does multi-organization data isolation work?',
            a: 'Each organization operates within strict database query boundaries enforced by our backend TenantScope system. Even when an executive owner oversees multiple campuses, teachers and students are strictly scoped to their assigned school domain.',
        },
        {
            q: 'Can each organization maintain distinct fee structures and academic calendars?',
            a: 'Yes, each organization has independent control over its academic terms, admission cycles, grading formulas, and fee schedules.',
        },
    ];

    return (
        <PublicLayout title="Transparent Institutional Pricing — SkillForge LMS">
            {/* PAGE HEADER */}
            <section className="bg-white pt-14 pb-12 sm:pt-20 sm:pb-16 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center">
                    <div className="mx-auto max-w-4xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#1769E0]">
                        <Sparkles className="size-3.5" />
                        <span>Proposed Institutional Plan Tiers</span>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-5xl lg:text-6xl">
                        Simple, Scalable Pricing for{' '}
                        <span className="text-[#1769E0]">Modern Schools</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                        Choose the right tier for your educational setup. Pricing is anchored primarily by the number of independent organizations you need to govern.
                    </p>

                    {/* Proposed Pricing Notice */}
                    <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 border border-amber-200">
                        <Info className="size-4 shrink-0 text-amber-600" />
                        <span>
                            <strong>Note on Proposed Tiers:</strong> Plan rates are configurable per institutional contract. Contact our team to confirm approved pricing.
                        </span>
                    </div>
                    </div>
                </div>
            </section>

            {/* 4 PLAN CARDS GRID */}
            <section className="bg-[#F7F9FC] py-16 sm:py-20">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`flex flex-col justify-between rounded-3xl border bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                                    plan.isPrimary
                                        ? 'border-[#1769E0] ring-2 ring-[#1769E0]/20 shadow-lg shadow-blue-500/10'
                                        : 'border-slate-200 shadow-xs'
                                }`}
                            >
                                <div>
                                    {/* Header & Badges */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-extrabold text-[#0B1528]">
                                            {plan.name}
                                        </h3>
                                        {plan.badge && (
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${plan.badgeColor}`}
                                            >
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>

                                    {/* Organization limit pill */}
                                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-[#0B1528]">
                                        <Building2 className="size-3.5 text-[#1769E0]" />
                                        <span>{plan.orgLimit}</span>
                                    </div>

                                    {/* Target audience */}
                                    <p className="mt-2 text-xs font-semibold text-slate-500">
                                        {plan.target}
                                    </p>

                                    {/* Price tag placeholder */}
                                    <div className="mt-6 border-t border-slate-100 pt-5">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black tracking-tight text-[#0B1528]">
                                                Custom Quote
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Tailored to institutional scale
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <p className="mt-4 text-xs leading-relaxed text-slate-600">
                                        {plan.description}
                                    </p>

                                    {/* Feature List */}
                                    <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            What's Included:
                                        </span>
                                        {plan.features.map((feat, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2.5 text-xs text-slate-700"
                                            >
                                                <Check className="mt-0.5 size-3.5 shrink-0 text-[#1769E0]" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Plan CTA Button */}
                                <div className="mt-8 pt-4">
                                    <Button
                                        asChild
                                        className={`w-full font-bold cursor-pointer transition-all ${
                                            plan.isPrimary
                                                ? 'bg-[#FF7A30] text-white shadow-md shadow-orange-500/20 hover:bg-[#E5661E]'
                                                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-[#1769E0]'
                                        }`}
                                    >
                                        <Link href={plan.ctaHref}>
                                            <span>{plan.ctaText}</span>
                                            <ArrowRight className="ml-1.5 size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DETAILED PLAN COMPARISON TABLE */}
            <section className="bg-white py-16 sm:py-24 border-t border-slate-200">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                            Deep Feature Breakdown
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-4xl">
                            Compare Features Across All Plans
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Inspect exactly how governance, operations, academics, and billing scale with your organization tier.
                        </p>
                    </div>

                    <div className="mt-12 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-[#F7F9FC]">
                                    <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-700 w-1/3">
                                        Platform Features
                                    </th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-slate-900">
                                        Bronze
                                        <span className="block text-[10px] font-normal text-slate-500">1 Org</span>
                                    </th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-[#1769E0] bg-blue-50/60">
                                        Silver
                                        <span className="block text-[10px] font-normal text-[#1769E0]">Up to 5 Orgs</span>
                                    </th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-slate-900">
                                        Gold
                                        <span className="block text-[10px] font-normal text-slate-500">Up to 10 Orgs</span>
                                    </th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-slate-900">
                                        Premium
                                        <span className="block text-[10px] font-normal text-slate-500">Unlimited</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {comparisonCategories.map((cat) => (
                                    <>
                                        <tr key={cat.title} className="bg-slate-50/70">
                                            <td
                                                colSpan={5}
                                                className="py-3 px-6 text-xs font-bold text-[#0B1528] uppercase tracking-wider"
                                            >
                                                {cat.title}
                                            </td>
                                        </tr>
                                        {cat.items.map((row) => (
                                            <tr
                                                key={row.name}
                                                className="hover:bg-slate-50/60 transition-colors"
                                            >
                                                <td className="py-3.5 px-6 font-medium text-slate-800">
                                                    {row.name}
                                                </td>

                                                {/* Bronze */}
                                                <td className="py-3.5 px-4 text-center">
                                                    {typeof row.bronze === 'boolean' ? (
                                                        row.bronze ? (
                                                            <Check className="mx-auto size-4 text-emerald-600" />
                                                        ) : (
                                                            <Minus className="mx-auto size-4 text-slate-300" />
                                                        )
                                                    ) : (
                                                        <span className="font-semibold text-slate-800">
                                                            {row.bronze}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Silver */}
                                                <td className="py-3.5 px-4 text-center bg-blue-50/20">
                                                    {typeof row.silver === 'boolean' ? (
                                                        row.silver ? (
                                                            <Check className="mx-auto size-4 text-[#1769E0]" />
                                                        ) : (
                                                            <Minus className="mx-auto size-4 text-slate-300" />
                                                        )
                                                    ) : (
                                                        <span className="font-bold text-[#1769E0]">
                                                            {row.silver}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Gold */}
                                                <td className="py-3.5 px-4 text-center">
                                                    {typeof row.gold === 'boolean' ? (
                                                        row.gold ? (
                                                            <Check className="mx-auto size-4 text-emerald-600" />
                                                        ) : (
                                                            <Minus className="mx-auto size-4 text-slate-300" />
                                                        )
                                                    ) : (
                                                        <span className="font-semibold text-slate-800">
                                                            {row.gold}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Premium */}
                                                <td className="py-3.5 px-4 text-center">
                                                    {typeof row.premium === 'boolean' ? (
                                                        row.premium ? (
                                                            <Check className="mx-auto size-4 text-emerald-600" />
                                                        ) : (
                                                            <Minus className="mx-auto size-4 text-slate-300" />
                                                        )
                                                    ) : (
                                                        <span className="font-bold text-purple-700">
                                                            {row.premium}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section className="bg-[#F7F9FC] py-16 sm:py-24 border-t border-slate-200">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-4xl">
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                            Clear Pricing Guidance
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-4xl">
                            Frequently Asked Questions
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 sm:text-sm">
                            Everything you need to know about organization tiers, campus scaling, and subscription rules.
                        </p>
                    </div>

                    <div className="mt-10 space-y-3">
                        {faqs.map((faq, idx) => {
                            const isOpen = activeFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-slate-200 bg-white transition-all shadow-2xs"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                                        className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 focus-visible:outline-none"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown
                                            className={`size-4 text-slate-400 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-[#1769E0]' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-slate-100 px-5 pt-3 pb-5 text-xs leading-relaxed text-slate-600">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA BANNER */}
            <section className="bg-[#1769E0] py-16 sm:py-20 text-white">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center">
                    <div className="mx-auto max-w-4xl">
                    <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
                        Tailored Institutional Deployments
                    </span>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Ready to Empower Your Campus or Multi-School Network?
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-blue-100 sm:text-sm">
                        Get started in minutes with our free school registration or contact our education specialists to configure multi-organization enterprise plans.
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 w-full cursor-pointer bg-[#FF7A30] px-8 font-bold text-white shadow-lg shadow-black/20 hover:bg-[#E5661E] sm:w-auto"
                        >
                            <Link href={register()}>
                                Create Your First School Free
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 w-full border-white/40 bg-white/10 px-6 font-semibold text-white hover:bg-white/20 sm:w-auto"
                        >
                            <Link href="/contact">
                                Schedule Custom Pricing Call
                            </Link>
                        </Button>
                    </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

PricingPage.layout = (page: React.ReactNode) => page;
