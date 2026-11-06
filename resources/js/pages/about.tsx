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
            title: 'Democratized Global Learning',
            desc: 'High-quality education must reach beyond geographical boundaries. Any student worldwide can join our online catalog and earn verified graduation certificates.',
            icon: Globe,
        },
    ];

    const techPillars = [
        {
            title: 'Laravel 13 Core',
            desc: 'Enterprise-grade backend with cryptographic multi-tenant query scoping, asynchronous queue workers, and transaction protection.',
            icon: Server,
        },
        {
            title: 'React 19 & Inertia.js',
            desc: 'Instant client-side page transitions with zero API boilerplate, delivering the speed of an SPA with the security of a server-rendered monolith.',
            icon: Cpu,
        },
        {
            title: 'Strict TypeScript Types',
            desc: 'End-to-end type safety from database models and Wayfinder route definitions to frontend React component props.',
            icon: ShieldCheck,
        },
        {
            title: 'Windows Tauri Desktop Client',
            desc: 'Hardware-accelerated native desktop container using lightweight Webview2 for distraction-free classroom administration.',
            icon: Layers,
        },
    ];

    return (
        <PublicLayout title="About Us — Mission, Vision & Educational Technology">
            <div className="bg-white py-16 sm:py-24 border-b border-slate-100">
                {/* Hero Header */}
                <section className="relative mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#078675]/20 bg-[#078675]/10 px-3.5 py-1 text-xs font-semibold text-[#078675]">
                            <Sparkles className="size-3.5" />
                            <span>Our Founding Principles</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#173A5E] sm:text-5xl leading-tight">
                            Pioneering the Next Generation of Educational Infrastructure
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
                            Our platform was architected from the ground up to solve a fundamental challenge: modern education requires disciplined institutional school governance and flexible, self-paced digital learning in one unified solution.
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
                                    To provide schools, academies, universities, and individual learners with an all-in-one, enterprise-grade multi-tenant platform that eliminates administrative friction, protects student privacy, and accelerates real-world skill mastery.
                                </p>
                            </div>
                            <div className="mt-8 flex items-center gap-2 border-t border-slate-200/80 pt-4 text-xs font-semibold text-[#078675]">
                                <CheckCircle2 className="size-4 text-emerald-500" />
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
                                    A world where any educational institution—from a specialized academy to a sprawling multi-campus network—can provision high-availability digital classrooms, automated roll calls, and video streaming in under two minutes with zero DevOps overhead.
                                </p>
                            </div>
                            <div className="mt-8 flex items-center gap-2 border-t border-slate-200/80 pt-4 text-xs font-semibold text-[#078675]">
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                <span>Global Accessibility & Strict Data Sovereignty</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Commitments Section */}
                <section className="mx-auto mt-20 w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="mb-12 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#078675]">
                            Core Commitments
                        </span>
                        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                            What Drives Our Product Engineering
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
                                Modern Technology Stack
                            </span>
                            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#173A5E] sm:text-3xl">
                                Engineered on Production-Grade Technologies
                            </h2>
                            <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 sm:text-sm">
                                Built without legacy bloat, powered by contemporary frameworks proven for enterprise reliability.
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
                                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
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
                            Join the Modern Educational Movement
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-xs text-blue-100 sm:text-sm">
                            Whether you represent an institutional school board or are looking to develop cutting-edge career skills, our platform provides your digital foundation.
                        </p>
                        <div className="mt-6 flex justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="bg-[#E49A2E] font-bold text-white shadow-md hover:bg-[#d08a24]"
                            >
                                <Link href="/register">
                                    <span>Get Started Free</span>
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
