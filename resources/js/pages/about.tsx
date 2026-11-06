import { Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import {
    Sparkles,
    Compass,
    Target,
    ArrowRight,
    Lock,
    Globe,
    CheckCircle2,
    Cpu,
    ShieldCheck,
    Layers,
    Server,
    BookOpen,
    Users,
    Calendar,
    Award,
    Receipt,
    GraduationCap,
    Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
    const values = [
        {
            title: 'Absolute Institutional Privacy',
            desc: 'We consider educational data sacrosanct. Every institution operates with verifiable, tenant-isolated data scopes with zero third-party tracking or data harvesting.',
            icon: Lock,
        },
        {
            title: 'Empowerment Over Bureaucracy',
            desc: 'Educational tools should liberate teachers, not drown them in spreadsheets. We engineer intuitive workflows for daily attendance, grading, and syllabus delivery.',
            icon: Compass,
        },
        {
            title: 'Integrated School OS & E-Learning',
            desc: 'Schools shouldn’t need five disconnected tools. InstitutoPropio unites physical classroom administration with online video courses and digital certificates in one unified system.',
            icon: Globe,
        },
    ];

    const actualFeatures = [
        {
            title: 'Multi-Tenant Campus Isolation',
            desc: 'Strict server-side database scoping ensures every school, academy, or branch operates within an independent, isolated workspace.',
            icon: ShieldCheck,
        },
        {
            title: 'Student Admissions & Rosters',
            desc: 'Complete student lifecycle management, including enrollment records, parent links, class assignments, and verification documents.',
            icon: Users,
        },
        {
            title: 'Daily Attendance & Substitute Tracking',
            desc: 'Rapid period-by-period roll call with instant absent/late marking and seamless substitute teacher delegations.',
            icon: Clock,
        },
        {
            title: 'Weekly Timetable & Room Scheduling',
            desc: 'Visual schedule builder configuring classrooms, teacher assignments, and period intervals with published timetables.',
            icon: Calendar,
        },
        {
            title: 'Curriculum & Syllabus Builder',
            desc: 'Structured curriculum hierarchies tracking subjects, units, and learning topics with real-time class progress indicators.',
            icon: BookOpen,
        },
        {
            title: 'Digital Gradebook & Assessments',
            desc: 'Comprehensive gradebook recording examination marks, weighted grading structures, and student performance summaries.',
            icon: Award,
        },
        {
            title: 'Tuition Fee Management & Invoices',
            desc: 'Custom fee structures by class tier, automated invoice generation, payment receipt issuance, and PDF downloads.',
            icon: Receipt,
        },
        {
            title: 'Multimedia Course Catalog & Certificates',
            desc: 'Publish interactive e-learning tracks with modular video lessons, progress tracking, and verifiable completion certificates.',
            icon: GraduationCap,
        },
    ];

    const techPillars = [
        {
            title: 'Laravel 13 Architecture',
            desc: 'Robust backend with cryptographic multi-tenant query scoping, asynchronous queue workers, and transaction protection.',
            icon: Server,
        },
        {
            title: 'React 19 & Inertia.js',
            desc: 'Instant client-side transitions with zero API boilerplate, delivering the responsiveness of an SPA with the security of server validation.',
            icon: Cpu,
        },
        {
            title: 'Strict TypeScript Types',
            desc: 'End-to-end type safety across database models, route definitions, and frontend components for zero-runtime surprises.',
            icon: ShieldCheck,
        },
        {
            title: 'Windows Tauri Desktop Client',
            desc: 'Native desktop application with PKCE authentication for high-speed, distraction-free administration in administrative offices.',
            icon: Layers,
        },
    ];

    return (
        <PublicLayout title="About Us — Mission, Architecture & Platform Capabilities">
            <div className="border-b border-slate-100 bg-white py-16 sm:py-24">
                {/* Hero Header */}
                <section className="relative mx-auto w-full max-w-[1720px] px-6 text-center sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#078675]/20 bg-[#078675]/10 px-3.5 py-1 text-xs font-semibold text-[#078675]">
                            <Sparkles className="size-3.5" />
                            <span>Institutional Education Infrastructure</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#173A5E] sm:text-5xl leading-tight">
                            Built for Schools, Academies & Training Institutes
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
                            InstitutoPropio was engineered to solve a fundamental challenge in educational technology: modern institutions require disciplined, reliable campus administration alongside modern, flexible digital learning.
                        </p>
                    </div>
                </section>

                {/* Mission & Vision Section */}
                <section className="mx-auto mt-16 w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-[#F5F8F7] p-8 shadow-xs">
                            <div>
                                <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#078675]/10 text-[#078675]">
                                    <Target className="size-6" />
                                </div>
                                <h2 className="mb-3 text-xl font-bold text-slate-900">
                                    Our Mission
                                </h2>
                                <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                                    To provide schools, academies, tutoring centers, and educational networks with an integrated, multi-tenant software foundation that simplifies administrative friction, guarantees student record privacy, and empowers faculty to focus on impactful teaching.
                                </p>
                            </div>
                            <div className="mt-8 flex items-center gap-2 border-t border-slate-200/80 pt-4 text-xs font-semibold text-[#078675]">
                                <CheckCircle2 className="size-4 text-[#26965B]" />
                                <span>Dedicated to Pedagogical & Engineering Excellence</span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-[#F5F8F7] p-8 shadow-xs">
                            <div>
                                <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#078675]/10 text-[#078675]">
                                    <Compass className="size-6" />
                                </div>
                                <h2 className="mb-3 text-xl font-bold text-slate-900">
                                    Our Vision
                                </h2>
                                <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                                    A world where educational leaders—from a single independent academy to a regional multi-campus network—can provision tenant-isolated digital classrooms, automated roll calls, transparent fee invoicing, and rich multimedia course delivery with zero DevOps overhead.
                                </p>
                            </div>
                            <div className="mt-8 flex items-center gap-2 border-t border-slate-200/80 pt-4 text-xs font-semibold text-[#078675]">
                                <CheckCircle2 className="size-4 text-[#26965B]" />
                                <span>Multi-Tenant Scalability & Strict Data Isolation</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Real Platform Capabilities Section */}
                <section className="mx-auto mt-20 w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mb-12 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Core Capabilities
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                            What InstitutoPropio Delivers Out of the Box
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 sm:text-sm">
                            Every module is deeply integrated into our unified campus operating system.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {actualFeatures.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div
                                    key={f.title}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-[#078675]/40 hover:shadow-sm"
                                >
                                    <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#078675]/10 text-[#078675]">
                                        <Icon className="size-5" />
                                    </div>
                                    <h3 className="mb-2 text-sm font-bold text-slate-900">
                                        {f.title}
                                    </h3>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        {f.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Values Section */}
                <section className="mx-auto mt-20 w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mb-12 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Guiding Values
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                            Principles That Guide Our Development
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {values.map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <div
                                    key={i}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-[#078675]/40"
                                >
                                    <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#078675]/10 text-[#078675]">
                                        <Icon className="size-5" />
                                    </div>
                                    <h3 className="mb-2 text-base font-bold text-slate-900">
                                        {v.title}
                                    </h3>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        {v.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Technical Pillars Section */}
                <section className="mx-auto mt-20 w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="rounded-3xl border border-slate-200 bg-[#F5F8F7] p-8 sm:p-12">
                        <div className="text-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                                Production-Grade Technology
                            </span>
                            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                Engineered for Enterprise Reliability
                            </h2>
                            <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 sm:text-sm">
                                Built with modern frameworks proven for data integrity and high availability.
                            </p>
                        </div>

                        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {techPillars.map((tp) => {
                                const Icon = tp.icon;
                                return (
                                    <div
                                        key={tp.title}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-[#078675]/10 text-[#078675]">
                                            <Icon className="size-4.5" />
                                        </div>
                                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                                            {tp.title}
                                        </h4>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                            {tp.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom CTA Card */}
                    <div className="mt-16 rounded-3xl bg-[#173A5E] p-8 text-center text-white shadow-xl sm:p-12">
                        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                            Empower Your Educational Institution Today
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-xs text-slate-200 sm:text-sm">
                            Experience unified campus management with our 30-day trial. Setup takes less than two minutes.
                        </p>
                        <div className="mt-6 flex justify-center gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="bg-[#E49A2E] font-bold text-white shadow-md hover:bg-[#d08a24]"
                            >
                                <Link href="/register?journey=school">
                                    <span>Get Started Free</span>
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="border-white/30 bg-white/10 font-bold text-white hover:bg-white/20"
                            >
                                <Link href="/pricing">
                                    <span>View Pricing</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
