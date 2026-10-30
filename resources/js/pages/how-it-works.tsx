import { Link } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import {
    School,
    GraduationCap,
    BookOpen,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowItWorksPage() {
    const [activeTab, setActiveTab] = useState<'school' | 'teacher' | 'learner'>('school');

    const journeys = {
        school: {
            title: 'For School Owners & Administrators',
            subtitle: "Provision your entire institution's digital campus in four simple stages.",
            badge: 'Institutional Governance',
            icon: School,
            steps: [
                {
                    num: '01',
                    title: 'One-Click Workspace Provisioning',
                    desc: 'Sign up with your academy name to automatically create your isolated organization tenant, subdomain, and dedicated database scope.',
                },
                {
                    num: '02',
                    title: 'Structure Academic Sessions & Classes',
                    desc: 'Define current academic years, terms, grade cohorts, and classroom sections with custom capacity thresholds.',
                },
                {
                    num: '03',
                    title: 'Curriculum & Faculty Onboarding',
                    desc: 'Build your subject catalog and issue secure cryptographic invitation tokens directly to your teachers and department heads.',
                },
                {
                    num: '04',
                    title: 'Student Enrollment & Live Oversight',
                    desc: 'Enroll student cohorts, assign roll numbers, and monitor real-time attendance registers, timetables, and fee billing from the Executive Dashboard.',
                },
            ],
            ctaText: 'Get Started — Create School',
            ctaLink: '/register?journey=school',
        },
        teacher: {
            title: 'For Educators & Teachers',
            subtitle: 'Streamline classroom management, roll call, and interactive lesson authoring.',
            badge: 'Faculty Operations',
            icon: GraduationCap,
            steps: [
                {
                    num: '01',
                    title: 'Accept Institutional Invitation',
                    desc: 'Join your school via a secure 40-character invitation token dispatched by your administrator, instantly activating teacher privileges.',
                },
                {
                    num: '02',
                    title: 'Review Assigned Classes & Sections',
                    desc: 'Access your dedicated Faculty Portal showing your daily timetable, enrolled student rosters, and curriculum subjects.',
                },
                {
                    num: '03',
                    title: 'Daily Attendance in Seconds',
                    desc: 'Execute rapid classroom roll calls with batch Present, Absent, Late, or Excused toggles and optional administrative notes.',
                },
                {
                    num: '04',
                    title: 'Conduct Assessments & Author Lessons',
                    desc: 'Schedule exams and quizzes, input qualitative student grades, and record video lectures for online module learning.',
                },
            ],
            ctaText: 'Get Started — Join School',
            ctaLink: '/register?journey=join',
        },
        learner: {
            title: 'For Individual Online Learners',
            subtitle: 'Enroll in specialization tracks and earn accredited, verifiable certificates.',
            badge: 'Lifelong Learning',
            icon: BookOpen,
            steps: [
                {
                    num: '01',
                    title: 'Create Your Learner Profile',
                    desc: 'Sign up in seconds to access our curated public catalog of technology, design, artificial intelligence, and leadership tracks.',
                },
                {
                    num: '02',
                    title: 'Engage with Multimedia Modules',
                    desc: 'Watch high-definition video lessons, review architectural reading guides, and complete checkpoint milestone exercises.',
                },
                {
                    num: '03',
                    title: 'Track Progress & Milestones',
                    desc: 'Monitor your completion percentage across modules with real-time progress indicators and interactive checklists.',
                },
                {
                    num: '04',
                    title: 'Receive Verifiable Digital Certificate',
                    desc: 'Instantly download your cryptographically signed completion diploma upon 100% course track completion.',
                },
            ],
            ctaText: 'Get Started — Start Learning',
            ctaLink: '/register?journey=learner',
        },
    };

    const currentJourney = journeys[activeTab];
    const JourneyIcon = currentJourney.icon;

    return (
        <PublicLayout title="How It Works — Institutional SaaS & Online Learning">
            <div className="bg-white py-16 sm:py-24 border-b border-slate-100">
                {/* Hero Header */}
                <section className="relative mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 text-center">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#1769E0]">
                            <Sparkles className="size-3.5" />
                            <span>Platform Architecture & Workflows</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-5xl">
                            How Our Platform Works for Every Role
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
                            Whether you are establishing a multi-campus academy, teaching daily classes, or learning independently, our system provides an intuitive, high-performance workflow.
                        </p>

                        {/* Role Selector Tabs */}
                        <div className="mt-10 inline-flex flex-wrap justify-center rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-xs">
                            {[
                                { id: 'school', label: 'School Owners & Admins', icon: School },
                                { id: 'teacher', label: 'Educators & Teachers', icon: GraduationCap },
                                { id: 'learner', label: 'Individual Learners', icon: BookOpen },
                            ].map((t) => {
                                const TabIcon = t.icon;
                                const isSelected = activeTab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setActiveTab(t.id as any)}
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:px-6 sm:text-sm cursor-pointer ${
                                            isSelected
                                                ? 'bg-[#1769E0] text-white shadow-sm shadow-blue-500/25'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <TabIcon className="size-4" />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Active Journey Presentation */}
                <section className="mx-auto mt-12 w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FC] p-6 shadow-sm sm:p-12">
                        <div className="mb-4 flex items-center gap-3.5">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769E0]">
                                <JourneyIcon className="size-5.5" />
                            </div>
                            <div>
                                <span className="block text-[11px] font-bold tracking-wider text-[#1769E0] uppercase">
                                    {currentJourney.badge}
                                </span>
                                <h2 className="text-xl font-extrabold tracking-tight text-[#0B1528] sm:text-2xl">
                                    {currentJourney.title}
                                </h2>
                            </div>
                        </div>

                        <p className="mb-10 max-w-xl text-xs text-slate-600 sm:text-sm">
                            {currentJourney.subtitle}
                        </p>

                        {/* Step By Step Grid (4 Columns) */}
                        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {currentJourney.steps.map((st, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-[#1769E0]/40 hover:shadow-xs"
                                >
                                    <div>
                                        <span className="mb-2 block font-mono text-2xl font-black text-[#1769E0]">
                                            {st.num}
                                        </span>
                                        <h3 className="mb-2 text-base font-bold text-slate-900">
                                            {st.title}
                                        </h3>
                                        <p className="text-xs leading-relaxed text-slate-600">
                                            {st.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Journey Call to Action */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                            <span className="text-xs text-slate-500 font-medium">
                                Institutional setup takes less than two minutes
                            </span>
                            <Button
                                asChild
                                className="bg-[#FF7A30] font-bold text-white shadow-md hover:bg-[#E5661E]"
                            >
                                <Link href={currentJourney.ctaLink}>
                                    <span>{currentJourney.ctaText}</span>
                                    <ArrowRight className="ml-1.5 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
