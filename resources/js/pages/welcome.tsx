import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BarChart3,
    Bell,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    CreditCard,
    DollarSign,
    GraduationCap,
    HeartHandshake,
    Info,
    Laptop,
    Layers,
    Lock,
    Play,
    School,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import CourseCard from '@/components/lms/course-card';
import type { CourseCategory } from '@/components/lms/course-types';
import PublicLayout from '@/layouts/public-layout';
import {
    PLATFORM_STATS,
    SAMPLE_COURSES,
} from '@/components/lms/sample-courses';
import { Button } from '@/components/ui/button';
import { dashboard, register } from '@/routes';
import type { User } from '@/types';

export default function Welcome() {
    const { auth, name } = usePage().props as {
        auth?: { user?: User | null };
        name?: string;
    };
    const user = auth?.user ?? null;
    const platformName = name || 'InstitutoPropio';

    // Solution tab switcher
    const [activeSolution, setActiveSolution] = useState<
        'independent' | 'multi' | 'academies' | 'faculty'
    >('independent');

    // Course filters state
    const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    const categories: CourseCategory[] = [
        'All',
        'Development',
        'AI & Data',
        'Design',
        'DevOps & Cloud',
        'Security',
    ];

    const filteredCourses = SAMPLE_COURSES.filter((course) => {
        const matchesCategory =
            selectedCategory === 'All' || course.category === selectedCategory;
        const matchesSearch =
            searchQuery.trim() === '' ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        return matchesCategory && matchesSearch;
    });

    const solutionsData = {
        independent: {
            title: 'Independent K-12 Schools',
            badge: 'Single Campus Governance',
            headline: 'Replace Disconnected Tools with One Operating System',
            description:
                'Single-campus schools struggle when attendance is on paper, grades in spreadsheets, and fee records in desktop accounting software. InstitutoPropio centralizes admissions, academic terms, and tuition invoicing into one unified platform.',
            points: [
                'Full student directory, classroom sections & subject management',
                '30-second daily attendance roll call with instant percentage logs',
                'Custom fee structures with automated batch invoices & printable vouchers',
                'Examination scheduling, gradebook marks entry & student report cards',
            ],
            cta: 'Register Your School Free',
            href: '/register?journey=school',
        },
        multi: {
            title: 'Multi-School Groups & Chains',
            badge: 'Multi-Tenant Scale',
            headline: 'Govern 5, 10, or Unlimited Schools with Strict Tenant Isolation',
            description:
                'For educational trusts and multi-branch school networks. Manage independent schools under one master executive account with cryptographic query-level data boundaries.',
            points: [
                'One-click organization switching without logging out',
                'Independent academic sessions, term calendars & grading scales per campus',
                'Cross-campus executive reporting on fee collections and student enrollment',
                'Role delegation for campus principals, department heads, and accountants',
            ],
            cta: 'Explore Multi-Campus Pricing',
            href: '/pricing',
        },
        academies: {
            title: 'Academies & Training Centers',
            badge: 'Vocational & Cohorts',
            headline: 'Combine Cohort Management with On-Demand Video Learning',
            description:
                'Deliver self-paced online courses and structured bootcamps. Author lessons, upload video curriculums, track student milestones, and issue tamper-proof digital certificates.',
            points: [
                'Interactive curriculum module builder with video lectures and readings',
                'Progress tracking dashboards showing completion percentages in real time',
                'Cryptographically verifiable digital certificates upon 100% completion',
                'Public course catalog with searchable specialization tracks',
            ],
            cta: 'Explore Course Catalog',
            href: '/courses',
        },
        faculty: {
            title: 'Teachers & Students',
            badge: 'Classroom Experience',
            headline: 'Empower Faculty with Zero-Friction Academic Workflows',
            description:
                'Teachers save hours every week on daily administration. Students access their schedules, exam feedback, and learning materials without confusion.',
            points: [
                'Personalized weekly timetable view showing assigned periods and rooms',
                'Batch roll calls marking entire classrooms present, late, or excused',
                'Curriculum syllabi progress tracking by unit and individual topic',
                'Self-service student fee portal with downloadable payment vouchers',
            ],
            cta: 'Learn About Faculty Workflows',
            href: '/how-it-works',
        },
    };

    const faqs = [
        {
            question: 'How does InstitutoPropio combine School Management with an Online LMS?',
            answer: 'Unlike legacy campus tools that only manage administrative registers or disconnected video portals, InstitutoPropio unites institutional governance (student admissions, attendance roll call, timetable schedules, exam gradebooks, and fee billing) with a full multimedia e-learning catalog where instructors publish structured courses, video lessons, and digital certificates under one unified single sign-on system.',
        },
        {
            question: 'How does multi-tenant data isolation protect school records?',
            answer: 'Every registered institution operates within a cryptographically isolated tenant boundary enforced at the database query level via our TenantScope architecture. School A can never query, inspect, or modify records belonging to School B.',
        },
        {
            question: 'What are the organization limits in the proposed pricing tiers?',
            answer: 'Our plan tiers are based primarily on organization count: Starter covers 1 organization, Growth accommodates up to 5 organizations, Professional supports up to 10 organizations, and Enterprise provides unlimited organizations for large educational networks. There are no arbitrary student or teacher limits within an organization.',
        },
        {
            question: 'Does the application provide separate portals for Teachers, Students, and Parents?',
            answer: 'Yes. The platform provides dedicated portal workflows for School Administrators, Teachers, Students, and Parents. Users authenticate securely through single sign-on and are automatically routed to their role-tailored dashboard with strict permission controls.',
        },
        {
            question: 'Can schools configure custom fee structures and issue invoices?',
            answer: 'Yes. Administrators can define fee structures per grade and classroom, generate batch invoices across student cohorts, record payments, and download printable PDF fee vouchers and official payment receipts.',
        },
        {
            question: 'Is there a desktop application available for Windows?',
            answer: 'Yes! We are actively developing a lightweight native Windows desktop client built with Tauri and Webview2. The desktop client offers native toast alerts, fast startup, dedicated workspace focus, and direct document printing. Visit our Windows Desktop page for technical specifications and release progress.',
        },
    ];

    return (
        <PublicLayout title={`${platformName} — One Platform for Smarter School Management & Online Learning`}>
            {/* A. HERO SECTION (RingCentral-Inspired Light B2B SaaS) */}
            <section className="relative overflow-hidden bg-gradient-hero pt-12 pb-16 md:pt-18 md:pb-24 lg:pt-22 lg:pb-28 border-b border-slate-100">
                {/* Subtle soft gradient background glow */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[950px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#078675]/15 via-[#26965B]/10 to-[#E49A2E]/15 blur-[120px]"
                />

                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
                        {/* Hero Text Content */}
                        <div className="space-y-6 text-center lg:col-span-6 lg:text-left">
                            {/* Eyebrow badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#078675]/25 bg-gradient-accent-pill px-3.5 py-1 text-xs font-bold text-[#173A5E] shadow-2xs">
                                <Sparkles className="size-3.5 text-[#078675]" />
                                <span>The Modern Operating System for Schools & E-Learning</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-3xl font-black tracking-tight text-[#173A5E] sm:text-5xl lg:text-6xl leading-[1.12]">
                                One Platform for{' '}
                                <span className="text-gradient-primary">
                                    Smarter School Management
                                </span>{' '}
                                and{' '}
                                <span className="text-gradient-secondary">
                                    Online Learning
                                </span>
                            </h1>

                            {/* Supporting Description */}
                            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
                                Unify multi-tenant campus governance—admissions, daily roll call, timetable schedules, exam gradebooks, and fee billing—with a full multimedia e-learning catalog in one enterprise-grade SaaS platform.
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row lg:justify-start">
                                {user ? (
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 w-full cursor-pointer btn-gradient-warm px-7 font-bold text-white shadow-md active:scale-[0.98] sm:w-auto"
                                    >
                                        <Link href={dashboard()}>
                                            Go to Dashboard ({user.name})
                                            <ArrowRight className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            asChild
                                            size="lg"
                                            className="h-12 w-full cursor-pointer btn-gradient-cta px-8 font-bold text-white shadow-md active:scale-[0.98] sm:w-auto"
                                        >
                                            <Link href={register()}>
                                                Get Started Free
                                                <ArrowRight className="ml-2 size-4" />
                                            </Link>
                                        </Button>

                                        <Button
                                            asChild
                                            variant="outline"
                                            size="lg"
                                            className="h-12 w-full cursor-pointer border-slate-300 bg-white px-7 font-bold text-slate-800 hover:bg-slate-50 hover:text-[#078675] sm:w-auto"
                                        >
                                            <Link href="#use-cases">
                                                Explore the Platform
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Micro trust indicators */}
                            <div className="flex flex-wrap items-center justify-center gap-5 pt-3 text-xs font-semibold text-slate-500 lg:justify-start">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                    <span>Tenant-isolated databases</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                    <span>Admin, Teacher & Student Portals</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                    <span>Instant setup — No credit card</span>
                                </div>
                            </div>
                        </div>

                        {/* Large High-Quality Dashboard Desktop & Mobile Composition */}
                        <div className="lg:col-span-6">
                            <div className="relative mx-auto max-w-lg lg:max-w-none">
                                {/* Ambient Gradient Halo behind Mockup */}
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-tr from-[#078675]/25 via-[#26965B]/15 to-[#E49A2E]/25 blur-2xl opacity-75"
                                />

                                {/* Desktop Frame Mockup */}
                                <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xs sm:p-5">
                                    {/* Mock Product Top Bar */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-xs">
                                                <School className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-extrabold text-[#173A5E] leading-tight">
                                                    Oakridge International Academy
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-500">
                                                    Academic Year 2026–2027 · Main Campus
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-500/20">
                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Live Academic Day
                                            </span>
                                            <div className="size-7 rounded-full bg-blue-100 flex items-center justify-center text-[#078675] text-xs font-bold">
                                                OA
                                            </div>
                                        </div>
                                    </div>

                                    {/* Real Operational Metrics Row */}
                                    <div className="mt-4 grid grid-cols-3 gap-2.5">
                                        <div className="rounded-xl border border-slate-100 bg-[#F5F8F7] p-3">
                                            <span className="text-[10px] font-bold text-slate-500">
                                                Today's Roll Call
                                            </span>
                                            <div className="mt-1 flex items-baseline gap-1.5">
                                                <span className="text-lg font-black text-[#173A5E]">
                                                    96.4%
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-600">
                                                    +1.2%
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">894 / 927 Present</span>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-[#F5F8F7] p-3">
                                            <span className="text-[10px] font-bold text-slate-500">
                                                Active Periods
                                            </span>
                                            <div className="mt-1 flex items-baseline gap-1.5">
                                                <span className="text-lg font-black text-[#173A5E]">
                                                    42
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-500">
                                                    Scheduled
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">All Rooms Assigned</span>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-[#F5F8F7] p-3">
                                            <span className="text-[10px] font-bold text-slate-500">
                                                Tuition Invoices
                                            </span>
                                            <div className="mt-1 flex items-baseline gap-1.5">
                                                <span className="text-lg font-black text-[#173A5E]">
                                                    92%
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-600">
                                                    Collected
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">$128k Cleared</span>
                                        </div>
                                    </div>

                                    {/* Live Class Attendance & Timetable Mock */}
                                    <div className="mt-3.5 space-y-2.5">
                                        <div className="rounded-xl border border-[#078675]/20 bg-[#078675]/10 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-4 text-[#078675]" />
                                                    <span className="text-xs font-bold text-[#173A5E]">
                                                        Period 3: Advanced Physics (Grade 10-A)
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-[#078675]">
                                                    Room 204 · 10:30 AM
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                <span className="text-slate-600 text-[11px]">
                                                    Instructor: <strong>Dr. Vance</strong>
                                                </span>
                                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                    Roll Call Finalized (28/30)
                                                </span>
                                            </div>
                                        </div>

                                        {/* E-Learning Course Progress Widget */}
                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="size-4 text-[#078675]" />
                                                    <span className="text-xs font-bold text-[#173A5E]">
                                                        Online Course: Full-Stack Engineering Track
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    Module 4 of 10
                                                </span>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                    <span>Relational Schemas & Inertia Routing</span>
                                                    <span className="font-bold text-[#078675]">68%</span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-slate-100">
                                                    <div className="h-1.5 w-[68%] rounded-full bg-[#173A5E]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Verified Certificate Footer */}
                                    <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                            <Award className="size-4 text-emerald-600" />
                                            <span className="text-slate-600 font-medium">
                                                Verifiable Credential: <code className="text-[#078675] font-mono font-bold">SKF-90214-CERT</code>
                                            </span>
                                        </div>
                                        <span className="font-bold text-slate-400 text-[10px]">
                                            Tenant Isolation: Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Platform Stats Strip */}
                    <div className="relative mt-14 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-soft p-6 shadow-sm sm:p-8">
                        {/* Top Accent Gradient Hairline */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#173A5E] via-[#078675] via-[#26965B] to-[#E49A2E]" />

                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:divide-x md:divide-slate-200">
                            {PLATFORM_STATS.map((stat, idx) => (
                                <div
                                    key={stat.label}
                                    className={`flex flex-col items-center text-center ${
                                        idx > 0 ? 'md:pl-6' : ''
                                    }`}
                                >
                                    <span className="text-2xl font-black tracking-tight text-gradient-primary sm:text-3xl">
                                        {stat.value}
                                    </span>
                                    <span className="mt-0.5 text-xs font-bold text-slate-800">
                                        {stat.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        {stat.subtext}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* B. LARGE IMAGE-LED USE-CASE SECTION (RingCentral Inspired Storytelling) */}
            <section id="use-cases" className="scroll-mt-20 bg-white py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Real-World Educational Workflows
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl">
                            See What's Possible with InstitutoPropio
                        </h2>
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                            Discover how campus leadership, faculty, students, and parents experience the unified operating system across every stage of the academic journey.
                        </p>
                    </div>

                    {/* 4 Large Editorial Image Cards */}
                    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {/* 1. School Administration */}
                        <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-[#F5F8F7] transition-all duration-300 hover:-translate-y-1 hover:border-[#078675]/40 hover:shadow-xl">
                            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                                <img
                                    src="/images/school-admin.jpg"
                                    alt="School administrator managing campus operations on a modern computer"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#078675] shadow-sm backdrop-blur-sm">
                                    Executive Leadership
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-[#173A5E] group-hover:text-[#078675] transition-colors">
                                        School Administration
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                        Oversee multi-tenant academic years, classroom grade cohorts, subject allocations, and batch tuition billing from an executive command center.
                                    </p>
                                </div>
                                <div className="mt-5 pt-3 border-t border-slate-200/80">
                                    <Link
                                        href="/how-it-works"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#078675] hover:text-[#056b5e]"
                                    >
                                        <span>Learn about Admin tools</span>
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 2. Teaching & Classroom Management */}
                        <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-[#F5F8F7] transition-all duration-300 hover:-translate-y-1 hover:border-[#078675]/40 hover:shadow-xl">
                            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                                <img
                                    src="/images/teacher-classroom.jpg"
                                    alt="Teacher guiding students with interactive classroom digital tools"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-amber-700 shadow-sm backdrop-blur-sm">
                                    Faculty Operations
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-[#173A5E] group-hover:text-[#078675] transition-colors">
                                        Teaching & Classroom Management
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                        Execute rapid 30-second daily attendance roll calls, view weekly room timetables, manage gradebooks, and progress syllabus topics.
                                    </p>
                                </div>
                                <div className="mt-5 pt-3 border-t border-slate-200/80">
                                    <Link
                                        href="/benefits"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#078675] hover:text-[#056b5e]"
                                    >
                                        <span>Explore Faculty workflows</span>
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 3. Online Learning */}
                        <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-[#F5F8F7] transition-all duration-300 hover:-translate-y-1 hover:border-[#078675]/40 hover:shadow-xl">
                            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                                <img
                                    src="/images/student-learning.jpg"
                                    alt="Student engaging with self-paced online video courses on a laptop"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur-sm">
                                    Digital LMS Catalog
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-[#173A5E] group-hover:text-[#078675] transition-colors">
                                        Online Learning & Certificates
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                        Deliver engaging video courses with module playlists, lesson readings, real-time progress tracking, and verifiable completion certificates.
                                    </p>
                                </div>
                                <div className="mt-5 pt-3 border-t border-slate-200/80">
                                    <Link
                                        href="/courses"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#078675] hover:text-[#056b5e]"
                                    >
                                        <span>View Online Courses</span>
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 4. Student & Parent Experience */}
                        <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-[#F5F8F7] transition-all duration-300 hover:-translate-y-1 hover:border-[#078675]/40 hover:shadow-xl">
                            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                                <img
                                    src="/images/parent-student.jpg"
                                    alt="Parent and student reviewing academic progress and fee invoices together"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-purple-700 shadow-sm backdrop-blur-sm">
                                    Family Transparency
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-[#173A5E] group-hover:text-[#078675] transition-colors">
                                        Student & Parent Experience
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                        Give families real-time transparency into daily attendance, published report cards, teacher feedback remarks, and downloadable fee vouchers.
                                    </p>
                                </div>
                                <div className="mt-5 pt-3 border-t border-slate-200/80">
                                    <Link
                                        href="/benefits"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#078675] hover:text-[#056b5e]"
                                    >
                                        <span>Explore Parent Portal</span>
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* C. PRODUCT FEATURE STORYTELLING (Alternating Left/Right Image-and-Text Sections) */}
            <section className="bg-[#F5F8F7] py-16 sm:py-24 border-b border-slate-200">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 space-y-20 sm:space-y-28">
                    {/* Story 1: School Management (Left Mockup, Right Text) */}
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
                        <div className="lg:col-span-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#078675]/10 text-[#078675]">
                                            <Building2 className="size-4" />
                                        </div>
                                        <span className="text-xs font-bold text-[#173A5E]">
                                            Campus Hierarchy & Enrollment
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-bold text-[#078675]">
                                        Tenant Isolated
                                    </span>
                                </div>
                                <div className="mt-5 space-y-3">
                                    <div className="rounded-xl border border-slate-100 bg-[#F5F8F7] p-3.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-[#173A5E]">
                                            <span>Grade 10 · Cohort Alpha</span>
                                            <span className="text-[#078675]">3 Sections Active</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Sections: 10-A (32 students), 10-B (30 students), 10-C (28 students)
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-[#F5F8F7] p-3.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-[#173A5E]">
                                            <span>Curriculum Subject Matrix</span>
                                            <span className="text-emerald-600 font-semibold">12 Core Subjects</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            All subjects mapped to qualified department teachers with active allocations
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                                    <span>Cryptographic Teacher Tokens</span>
                                    <span className="font-bold text-emerald-600">Zero Spreadsheet Roster Sync</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 lg:col-span-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                                Foundation of Campus Governance
                            </span>
                            <h3 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                School Management: Admissions, Classes, Sections & Staff
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                Establishing a structured institution requires clean relational data. InstitutoPropio allows administrators to configure academic years, define grade levels, divide classrooms into manageable sections, and assign qualified teachers to subjects with zero configuration drift.
                            </p>
                            <div className="space-y-2 pt-2 text-xs text-slate-700">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Comprehensive student directories with parent linkage and enrollment documents</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Automatic class capacity management to prevent classroom overcrowding</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Direct cryptographic staff invitations for rapid teacher portal onboarding</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Story 2: Academic Operations (Left Text, Right Mockup) */}
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
                        <div className="space-y-4 lg:col-span-6 lg:order-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                Faculty Daily Flow
                            </span>
                            <h3 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                Academic Operations: 30-Second Roll Calls, Timetables & Grades
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                Teachers should spend their time educating students, not fighting administrative red tape. Our faculty portal turns morning roll call into a 30-second routine, provides clear timetable schedules with room assignments, and validates gradebook entries against strict maximum scores.
                            </p>
                            <div className="space-y-2 pt-2 text-xs text-slate-700">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Batch mark Present, Late, or Excused with substitute teacher tracking</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Weekly timetable matrices showing room assignments and period blocks</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Dynamic assessment scoring for midterms, quizzes, and homework projects</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 lg:order-2">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                                            <Zap className="size-4" />
                                        </div>
                                        <span className="text-xs font-bold text-[#173A5E]">
                                            Rapid Daily Attendance Engine
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                        98.2% Accuracy
                                    </span>
                                </div>
                                <div className="mt-4 space-y-2.5">
                                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#F5F8F7] p-3 text-xs">
                                        <span className="font-bold text-[#173A5E]">Section 10-A (Physics)</span>
                                        <span className="font-semibold text-emerald-600">30 / 30 Recorded</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#F5F8F7] p-3 text-xs">
                                        <span className="font-bold text-[#173A5E]">Section 10-B (Mathematics)</span>
                                        <span className="font-semibold text-emerald-600">28 / 28 Recorded</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#F5F8F7] p-3 text-xs">
                                        <span className="font-bold text-[#173A5E]">Section 11-A (Chemistry)</span>
                                        <span className="font-semibold text-amber-700">Substitute Assigned</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Story 3: Financial Management (Left Mockup, Right Text) */}
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
                        <div className="lg:col-span-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                            <CreditCard className="size-4" />
                                        </div>
                                        <span className="text-xs font-bold text-[#173A5E]">
                                            Tuition Invoicing & Ledger
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                        Real-Time Audits
                                    </span>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-xl border border-slate-100 bg-[#F5F8F7] p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-[#173A5E]">Fall Term Tuition Fees</span>
                                            <span className="text-xs font-black text-emerald-700">$128,450 Settled</span>
                                        </div>
                                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                                            <div className="h-2 w-[92%] rounded-full bg-emerald-500" />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                                            <span>Batch Invoices: 320 Issued</span>
                                            <span>92% Paid on Schedule</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                                        <span>Downloadable PDF Fee Vouchers</span>
                                        <span className="font-bold text-[#078675]">1-Click Generation</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 lg:col-span-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Financial Control & Compliance
                            </span>
                            <h3 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                Financial Management: Fee Records, Batch Invoices & Receipts
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                Eliminate tuition confusion and late payment disputes. School owners configure transparent fee structures by grade and section, trigger automated batch invoice runs, record partial and full installments, and download printable fee vouchers and official payment receipts.
                            </p>
                            <div className="space-y-2 pt-2 text-xs text-slate-700">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Custom fee categories: Tuition, Lab Fees, Library, and Transportation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Self-service parent & student fee portal with instant balance calculations</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Printable PDF fee vouchers and payment receipts with bank deposit details</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Story 4: Online Learning (Left Text, Right Mockup) */}
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
                        <div className="space-y-4 lg:col-span-6 lg:order-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                Multimedia Digital LMS
                            </span>
                            <h3 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                Online Learning: Courses, Lessons, Progress & Certificates
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                Go beyond standard classroom walls. Instructors author structured modules, attach video lectures and reading materials, and monitor lesson completions in real time. Students earn verifiable digital graduation certificates that prove curriculum mastery.
                            </p>
                            <div className="space-y-2 pt-2 text-xs text-slate-700">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Interactive module and lesson builder supporting rich video and Markdown</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Real-time completion checklists and milestone percentage trackers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Cryptographically unique graduation certificates verifiable worldwide</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 lg:order-2">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                            <BookOpen className="size-4" />
                                        </div>
                                        <span className="text-xs font-bold text-[#173A5E]">
                                            Curriculum Syllabus & Progress
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-[#078675]/10 px-2 py-0.5 text-[10px] font-bold text-[#078675]">
                                        100% Verifiable
                                    </span>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-xl border border-slate-100 bg-[#F5F8F7] p-3.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-[#173A5E]">
                                            <span>Full-Stack Modern Engineering Track</span>
                                            <span className="text-[#078675]">Module 4 of 10</span>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                                            <div className="h-1.5 w-[68%] rounded-full bg-[#173A5E]" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                                            <Award className="size-4 text-emerald-600" />
                                            <span>Digital Graduation Certificate Issued</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-emerald-700">
                                            Credential ID: <code className="font-mono font-bold">SKF-90214-CERT</code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Story 5: Multi-Organization Management (Left Mockup, Right Text) */}
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
                        <div className="lg:col-span-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <span className="text-xs font-bold text-[#173A5E]">
                                            Multi-Tenant Organization Switcher
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                        Tenant Isolation
                                    </span>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between rounded-xl border border-[#078675]/20 bg-[#078675]/10 p-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-[#173A5E]" />
                                            <span className="font-bold text-[#173A5E]">Oakridge Main Campus (Primary)</span>
                                        </div>
                                        <span className="font-bold text-[#078675]">Active Context</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#F5F8F7] p-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-slate-300" />
                                            <span className="font-medium text-slate-700">Oakridge Junior Academy (Branch)</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">1-Click Switch</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#F5F8F7] p-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-slate-300" />
                                            <span className="font-medium text-slate-700">Oakridge Online Training Institute</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">1-Click Switch</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 lg:col-span-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                                Enterprise Multi-Campus Governance
                            </span>
                            <h3 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                Multi-Organization Management: Isolated Tenants, Unified Oversight
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                Grow from a single school to a multi-campus educational group without software limitations. Each organization operates with independent academic terms, staffing, and fee ledgers, while executive owners switch instantly between institutions from one unified dashboard.
                            </p>
                            <div className="space-y-2 pt-2 text-xs text-slate-700">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Query-level tenant isolation preventing accidental cross-school data access</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Instant organization switching in one click from the navigation header</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>Tiered organization plans: Bronze (1 org), Silver (up to 5), Gold (up to 10), Premium (unlimited)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* D. SOLUTIONS SECTION (By Stakeholder & Institution Type) */}
            <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Targeted Solutions
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl">
                            Engineered for Every Educational Model
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Explore tailored interfaces and role-scoped permissions configured specifically for your institutional requirements.
                        </p>
                    </div>

                    {/* Interactive Role Switcher Tabs */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                        {[
                            { key: 'independent', label: 'Independent Schools', icon: School },
                            { key: 'multi', label: 'Multi-School Groups', icon: Building2 },
                            { key: 'academies', label: 'Academies & Training', icon: Award },
                            { key: 'faculty', label: 'Teachers & Students', icon: UserCheck },
                        ].map((t) => {
                            const Icon = t.icon;
                            const isSelected = activeSolution === t.key;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setActiveSolution(t.key as any)}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                                        isSelected
                                            ? 'btn-gradient-primary text-white shadow-md active:scale-[0.98]'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="size-4" />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Solution Content Card */}
                    {solutionsData[activeSolution] && (
                        <div className="mt-8 rounded-3xl border border-slate-200 bg-[#F5F8F7] p-6 sm:p-10 shadow-sm">
                            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                                <div className="space-y-4 lg:col-span-7">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold text-[#078675]">
                                        {solutionsData[activeSolution].badge}
                                    </span>
                                    <h3 className="text-xl font-extrabold tracking-tight text-[#173A5E] sm:text-2xl">
                                        {solutionsData[activeSolution].headline}
                                    </h3>
                                    <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                        {solutionsData[activeSolution].description}
                                    </p>

                                    <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">
                                        {solutionsData[activeSolution].points.map((pt, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#078675]" />
                                                <span>{pt}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            asChild
                                            className="btn-gradient-primary font-bold text-white shadow-md cursor-pointer hover:opacity-95"
                                        >
                                            <Link href={solutionsData[activeSolution].href}>
                                                {solutionsData[activeSolution].cta}
                                                <ArrowRight className="ml-1.5 size-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5 shadow-xs">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <span className="text-xs font-bold text-[#173A5E]">
                                                Scoped Access Control
                                            </span>
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                Active Authorization
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            All database operations strictly enforce the authenticated user's organization membership. Multi-tenancy prevents cross-campus data leakage.
                                        </p>

                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                                                <span className="font-semibold text-slate-700">Tenant Scoping</span>
                                                <span className="font-bold text-emerald-600">Strictly Scoped</span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                                                <span className="font-semibold text-slate-700">Role-Based Routing</span>
                                                <span className="font-bold text-[#078675]">Single Sign-On</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* F. HOW IT WORKS (Visual 4-Stage Onboarding Journey) */}
            <section className="bg-[#F5F8F7] py-16 sm:py-24 border-b border-slate-200">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Implementation Roadmap
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl">
                            How It Works: Up and Running in Four Steps
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Launch your school's digital campus with an intuitive onboarding process designed for fast adoption.
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                step: '01',
                                title: 'Create Account',
                                desc: 'Sign up in 30 seconds with email and password or Google authentication to initialize your administrator credentials.',
                                badge: 'Instant Setup',
                            },
                            {
                                step: '02',
                                title: 'Set Up Organization',
                                desc: 'Provision your dedicated school tenant, specify academic sessions and terms, and configure your campus identity.',
                                badge: 'Tenant Scope',
                            },
                            {
                                step: '03',
                                title: 'Add Staff, Classes & Students',
                                desc: 'Issue cryptographic tokens to invite teachers, define grade sections, and enroll student cohorts with roll numbers.',
                                badge: 'Zero Spreadsheets',
                            },
                            {
                                step: '04',
                                title: 'Manage Academics & Learning',
                                desc: 'Conduct daily roll calls, manage weekly timetables, publish exam gradebooks, issue fee invoices, and launch online courses.',
                                badge: 'Live Operations',
                            },
                        ].map((s) => (
                            <div
                                key={s.step}
                                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:border-[#078675]/40 hover:shadow-lg transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-black text-[#078675]">
                                            {s.step}
                                        </span>
                                        <span className="rounded-full bg-[#078675]/10 px-2 py-0.5 text-[10px] font-bold text-[#078675]">
                                            {s.badge}
                                        </span>
                                    </div>
                                    <h3 className="mt-4 text-base font-bold text-[#173A5E]">
                                        {s.title}
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                        {s.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            href="/how-it-works"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#078675] hover:text-[#056b5e]"
                        >
                            <span>Read detailed walkthrough for teachers and individual learners</span>
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* G. PRICING PREVIEW SECTION ON HOMEPAGE */}
            <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Proposed Plan Tiers
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl">
                            Scalable Plans Built Around Your Organization Count
                        </h2>
                        <p className="mt-3 text-xs text-slate-600 sm:text-sm">
                            Plans are anchored primarily by how many independent school organizations you need to govern, with unlimited students and teachers per campus.
                        </p>
                    </div>

                    {/* 4 Plan Preview Cards */}
                    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                name: 'Bronze',
                                org: '1 Organization',
                                target: 'Single Independent School',
                                desc: 'Everything needed to run admissions, daily attendance, timetables, and fee billing on a single campus.',
                                cta: 'Get Started with Bronze',
                                href: '/register?journey=school',
                                primary: false,
                            },
                            {
                                name: 'Silver',
                                org: 'Up to 5 Organizations',
                                target: 'Twin Campuses & Growing Schools',
                                desc: 'Unified executive oversight across multiple campuses with 1-click organization switching.',
                                cta: 'Get Started with Silver',
                                href: '/register?journey=school',
                                primary: true,
                            },
                            {
                                name: 'Gold',
                                org: 'Up to 10 Organizations',
                                target: 'Regional Private School Networks',
                                desc: 'Advanced consolidated financial reporting, shared curriculum templates, and priority onboarding.',
                                cta: 'Inquire for Gold',
                                href: '/pricing',
                                primary: false,
                            },
                            {
                                name: 'Premium',
                                org: 'Unlimited Organizations',
                                target: 'Large Trusts & School Districts',
                                desc: 'Unlimited tenant capacity, custom subdomains, dedicated SLA guarantees, and enterprise account management.',
                                cta: 'Contact Institutional Sales',
                                href: '/contact',
                                primary: false,
                            },
                        ].map((p) => (
                            <div
                                key={p.name}
                                className={`flex flex-col justify-between rounded-3xl border bg-[#F5F8F7] p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                                    p.primary
                                        ? 'border-[#078675] ring-2 ring-[#078675]/20 bg-white'
                                        : 'border-slate-200'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-[#173A5E]">{p.name}</h3>
                                        <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-bold text-[#078675]">
                                            {p.org}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">{p.target}</p>
                                    <div className="mt-4 border-t border-slate-200/80 pt-3">
                                        <span className="text-xl font-extrabold text-[#173A5E]">Custom Quote</span>
                                        <p className="text-[10px] text-slate-400">Proposed tier — contact for rate</p>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-slate-600">{p.desc}</p>
                                </div>
                                <div className="mt-6 pt-2">
                                    <Button
                                        asChild
                                        className={`w-full font-bold cursor-pointer text-xs ${
                                            p.primary
                                                ? 'bg-[#E49A2E] text-white hover:bg-[#d08a24]'
                                                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-[#078675]'
                                        }`}
                                    >
                                        <Link href={p.href}>
                                            <span>{p.cta}</span>
                                            <ArrowRight className="ml-1.5 size-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Button
                            asChild
                            variant="outline"
                            className="border-slate-300 bg-white px-6 font-bold text-slate-800 hover:bg-slate-50 hover:text-[#078675]"
                        >
                            <Link href="/pricing">
                                View Full Pricing Page & Feature Comparison Table &rarr;
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* FEATURED ONLINE COURSES CATALOG PREVIEW */}
            <section
                id="courses"
                className="scroll-mt-20 bg-[#F5F8F7] py-16 sm:py-24 border-b border-slate-200"
            >
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    {/* Header row */}
                    <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:items-end sm:text-left">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                                Production Curriculum
                            </span>
                            <h2 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl">
                                Explore Live Specialization Tracks
                            </h2>
                            <p className="max-w-xl text-xs text-slate-600 sm:text-sm">
                                Structured video modules, hands-on architectural notes, and verifiable graduation certificates.
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search courses or tags..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#078675] focus:ring-2 focus:ring-[#078675]/20 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="mt-8 flex flex-wrap items-center gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setSelectedCategory(category)}
                                className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                    selectedCategory === category
                                        ? 'btn-gradient-primary text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Courses Grid */}
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                        {filteredCourses.slice(0, 8).map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    {/* View all courses link */}
                    <div className="mt-12 text-center">
                        <Button
                            asChild
                            variant="outline"
                            className="border-slate-300 bg-white px-6 font-bold text-slate-800 hover:bg-slate-100 hover:text-[#078675]"
                        >
                            <Link href="/courses">
                                View Full Course Catalog ({SAMPLE_COURSES.length} Specializations)
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* H. WINDOWS DESKTOP APP SPOTLIGHT BANNER */}
            <section className="bg-white py-16 sm:py-20 border-b border-slate-100">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-soft p-8 sm:p-12 shadow-sm">
                        {/* Top Hairline Accent */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#173A5E] via-[#078675] to-[#E49A2E]" />

                        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                            <div className="space-y-4 lg:col-span-8">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#078675]/20 bg-gradient-accent-pill px-3 py-1 text-xs font-bold text-[#173A5E]">
                                    <Laptop className="size-3.5 text-[#078675]" />
                                    <span>Tauri Windows Client · Coming Soon</span>
                                </span>
                                <h3 className="text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                    Take Your Campus Operating System to the Windows Desktop
                                </h3>
                                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                    Enjoy zero-tab distractions, native Windows toast alerts for daily roll call and fee schedules, fast startup, and direct document printing for transcripts and fee vouchers.
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        <span>Lightweight WebView2</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        <span>Windows 10/11 Compatible</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        <span>Official Build In Progress</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
                                <Button
                                    asChild
                                    size="lg"
                                    className="btn-gradient-cta font-bold text-white shadow-md active:scale-[0.98] cursor-pointer"
                                >
                                    <Link href="/download">
                                        Learn About Desktop App
                                        <ArrowRight className="ml-1.5 size-4" />
                                    </Link>
                                </Button>
                                <span className="text-[11px] text-slate-500">
                                    Connects to your school's LMS server instance
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section className="bg-[#F5F8F7] py-16 sm:py-24 border-b border-slate-200">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-4xl">
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Clear Answers
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-4xl">
                            Frequently Asked Questions
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 sm:text-sm">
                            Transparent architectural and functional information about your LMS platform.
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
                                        <span>{faq.question}</span>
                                        <ChevronDown
                                            className={`size-4 text-slate-400 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-[#078675]' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-slate-100 px-5 pt-3 pb-5 text-xs leading-relaxed text-slate-600">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                </div>
            </section>

            {/* FINAL CONVERSION CTA BANNER */}
            <section className="relative overflow-hidden bg-gradient-primary py-16 sm:py-24 text-white shadow-glow-navy">
                {/* Ambient Soft Glow Elements */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/10 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-[#E49A2E]/20 blur-3xl"
                />

                <div className="relative mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center">
                    <span className="inline-block rounded-full border border-white/25 bg-white/15 px-4 py-1 text-xs font-semibold tracking-wide backdrop-blur-md">
                        Zero Complex Setup
                    </span>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                        Ready to Unify Your School Management and E-Learning?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-emerald-100 sm:text-base">
                        Provision your institutional workspace in under two minutes. Experience tenant isolation, effortless roll calls, and online courses.
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 w-full cursor-pointer btn-gradient-warm px-8 font-bold text-white shadow-lg shadow-black/20 active:scale-[0.98] sm:w-auto"
                        >
                            <Link href={register()}>
                                Get Started Free
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 w-full cursor-pointer border-white/40 bg-white/10 px-6 font-semibold text-white hover:bg-white/20 sm:w-auto"
                        >
                            <Link href="/contact">
                                Talk to an Education Specialist
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
