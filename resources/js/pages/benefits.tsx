import { Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import {
    ShieldCheck,
    GraduationCap,
    BookOpen,
    BarChart3,
    HeartHandshake,
    Award,
    Layers,
    ArrowRight,
    Lock,
    Zap,
    CheckCircle2,
    Server,
    CreditCard,
    Sparkles,
    Check,
    Calendar,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BenefitsPage() {
    const benefits = [
        {
            title: 'Strict Multi-Tenant Isolation',
            desc: 'Every institution operates within a cryptographically isolated tenant boundary with automatic query-level scoping. Private records never bleed across school domains.',
            icon: ShieldCheck,
            badge: 'Enterprise Security',
            color: 'text-[#1769E0] bg-blue-50',
        },
        {
            title: 'End-to-End Academic Operations',
            desc: 'Manage multiple academic years, terms, classes, and sections seamlessly. Organize subject allocations and teacher assignments with zero spreadsheets.',
            icon: GraduationCap,
            badge: 'Campus Governance',
            color: 'text-indigo-600 bg-indigo-50',
        },
        {
            title: 'Full Multimedia E-Learning LMS',
            desc: 'Author video lectures, curriculum modules, and interactive readings. Track lesson completion in real-time with automatic certificate issuance.',
            icon: BookOpen,
            badge: 'Digital Learning',
            color: 'text-purple-600 bg-purple-50',
        },
        {
            title: 'Rapid Daily Attendance Roll Call',
            desc: 'Equip teachers with lightning-fast roll calls. Batch mark entire classrooms present, late, or excused in 30 seconds with instant percentage calculations.',
            icon: Zap,
            badge: 'Daily Efficiency',
            color: 'text-amber-600 bg-amber-50',
        },
        {
            title: 'Dynamic Gradebook & Assessments',
            desc: 'Schedule midterm exams, quizzes, and homework projects. Input scores within strict validation limits and deliver qualitative feedback to students.',
            icon: BarChart3,
            badge: 'Evaluation Engine',
            color: 'text-emerald-600 bg-emerald-50',
        },
        {
            title: 'Direct Parent & Guardian Portal',
            desc: "Empower parents with verified access to their children's attendance records, examination report cards, and faculty remarks without administrative overhead.",
            icon: HeartHandshake,
            badge: 'Family Transparency',
            color: 'text-pink-600 bg-pink-50',
        },
        {
            title: 'Verifiable Course Certificates',
            desc: 'Automatically issue cryptographically unique certificates upon 100% course completion, verifiable across universities and employers.',
            icon: Award,
            badge: 'Accreditation',
            color: 'text-teal-600 bg-teal-50',
        },
        {
            title: 'Institutional Fee Management',
            desc: 'Configure grade-level fee structures, batch generate student invoices, record payments, and download printable fee vouchers and receipts.',
            icon: CreditCard,
            badge: 'Financial Control',
            color: 'text-blue-600 bg-blue-50',
        },
    ];

    return (
        <PublicLayout title="Platform Benefits — Enterprise Academic & E-Learning SaaS">
            {/* HERO HEADER */}
            <section className="bg-white pt-16 pb-12 sm:pt-24 sm:pb-16 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#1769E0]">
                            <Layers className="size-3.5" />
                            <span>Architectural Superiority & Value</span>
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-5xl lg:text-6xl">
                            Why Educational Institutions Choose Our{' '}
                            <span className="text-[#1769E0]">Unified SaaS</span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                            Traditional educational software is fragmented across isolated legacy databases, paper attendance registers, and clunky separate video platforms.
                            SkillForge LMS unites campus governance and online learning into one cohesive, high-performance operating system.
                        </p>
                    </div>
                </div>
            </section>

            {/* BENEFITS 8-CARD GRID */}
            <section className="bg-[#F7F9FC] py-16 sm:py-24">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                            Platform Pillars
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-3xl">
                            Core Capabilities Engineered for Excellence
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {benefits.map((b, i) => {
                            const Icon = b.icon;
                            return (
                                <div
                                    key={i}
                                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#1769E0]/40 hover:shadow-lg"
                                >
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className={`flex size-11 items-center justify-center rounded-xl transition-colors ${b.color}`}>
                                                <Icon className="size-5" />
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                                                {b.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1769E0] transition-colors">
                                            {b.title}
                                        </h3>
                                        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                                            {b.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* OPERATIONAL SUPERIORITY COMPARISON STRIP */}
                    <div className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
                        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
                            <div className="space-y-4 lg:col-span-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
                                    Unified Architecture
                                </span>
                                <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-3xl">
                                    Single Stack Efficiency vs. Fragmented Software
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed sm:text-sm">
                                    Schools frequently waste hundreds of hours each semester reconciling student rosters between administrative spreadsheets and disconnected learning portals.
                                    Our platform eliminates manual synchronization by powering both campus operations and video course catalogs from one relational source of truth.
                                </p>
                                <div className="space-y-2.5 pt-2 text-xs text-slate-700">
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                        <span>Single user authentication across campus governance and online courses</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                        <span>Automated student fee balance calculation with downloadable invoices</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                        <span>Strict query-level tenant isolation preventing cross-school data exposure</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                        <span>Dedicated portal views for Admins, Teachers, Students, and Parents</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-[#F7F9FC] p-6 lg:col-span-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <span className="text-xs font-bold text-slate-900">
                                            Enterprise Software Architecture
                                        </span>
                                        <span className="text-[11px] font-bold text-[#1769E0]">
                                            100% Native Implementation
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <span className="text-xs font-bold text-slate-900">
                                                Laravel 13 Core
                                            </span>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                                Robust query scoping, queue workers, and transaction protection.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <span className="text-xs font-bold text-slate-900">
                                                React 19 & Inertia
                                            </span>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                                Instant single-page interactivity without REST boilerplate.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <span className="text-xs font-bold text-slate-900">
                                                Strict Multi-Tenancy
                                            </span>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                                Tenant isolation guaranteed at the relational model layer.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <span className="text-xs font-bold text-slate-900">
                                                Windows Desktop Client
                                            </span>
                                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                                Tauri container for distraction-free campus workstation focus.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM CTA CARD */}
                    <div className="mt-16 rounded-3xl bg-[#1769E0] p-8 text-center text-white shadow-xl sm:p-12">
                        <div className="mx-auto max-w-2xl">
                            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                                Ready to Upgrade Your Institution?
                            </h2>
                            <p className="mt-2 text-xs text-blue-100 sm:text-sm">
                                Launch your school's dedicated tenant workspace in under 2 minutes or view our transparent pricing tiers.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-[#FF7A30] font-bold text-white shadow-md hover:bg-[#E5661E]"
                                >
                                    <Link href="/register?journey=school">
                                        Create Your School Free
                                        <ArrowRight className="ml-1.5 size-4" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    className="border-white/40 bg-white/10 font-semibold text-white hover:bg-white/20"
                                >
                                    <Link href="/pricing">
                                        View Pricing Plans
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

BenefitsPage.layout = (page: React.ReactNode) => page;
