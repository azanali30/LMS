import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    Users,
    GraduationCap,
    BookOpen,
    Layers,
    CalendarCheck,
    TrendingUp,
    Plus,
    Clock,
    ChevronRight,
    School,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    Settings,
    Shield,
    DollarSign,
    Activity,
} from 'lucide-react';

interface Metrics {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSections: number;
    totalCourses: number;
    attendanceRate: number;
}

interface Member {
    id: number;
    role: string;
    title?: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface CourseItem {
    id: number;
    title: string;
    slug: string;
    level: string;
    category?: {
        name: string;
    };
}

interface AcademicYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

interface AdminDashboardProps {
    metrics: Metrics;
    recentMembers?: Member[];
    recentCourses?: CourseItem[];
    currentAcademicYear?: AcademicYear | null;
}

export default function AdminDashboard({
    metrics,
    recentMembers = [],
    recentCourses = [],
    currentAcademicYear,
}: AdminDashboardProps) {
    const statCards = [
        {
            label: 'Enrolled Students',
            value: metrics.totalStudents.toLocaleString(),
            icon: Users,
            color: 'text-[#C084FC]',
            iconBg: 'bg-[#A020F0]/15 border-[#A020F0]/30 text-[#C084FC]',
            glow: 'hover:shadow-[0_0_20px_rgba(160,32,240,0.15)]',
            change: 'Active student cohort',
        },
        {
            label: 'Faculty & Teachers',
            value: metrics.totalTeachers.toLocaleString(),
            icon: GraduationCap,
            color: 'text-[#22C1D6]',
            iconBg: 'bg-[#22C1D6]/15 border-[#22C1D6]/30 text-[#22C1D6]',
            glow: 'hover:shadow-[0_0_20px_rgba(34,193,214,0.15)]',
            change: 'Teaching personnel',
        },
        {
            label: 'Classes & Sections',
            value: `${metrics.totalClasses} / ${metrics.totalSections}`,
            icon: Layers,
            color: 'text-[#6366F1]',
            iconBg: 'bg-[#6366F1]/15 border-[#6366F1]/30 text-[#6366F1]',
            glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
            change: 'Active classrooms',
        },
        {
            label: 'Daily Attendance',
            value: `${metrics.attendanceRate}%`,
            icon: CalendarCheck,
            color: 'text-[#22C55E]',
            iconBg: 'bg-[#22C55E]/15 border-[#22C55E]/30 text-[#22C55E]',
            glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]',
            change: 'Today present rate',
        },
        {
            label: 'Active Curriculum',
            value: metrics.totalCourses.toLocaleString(),
            icon: BookOpen,
            color: 'text-[#F5A623]',
            iconBg: 'bg-[#F5A623]/15 border-[#F5A623]/30 text-[#F5A623]',
            glow: 'hover:shadow-[0_0_20px_rgba(245,166,35,0.15)]',
            change: 'Courses & programs',
        },
    ];

    const getRolePill = (role: string) => {
        switch (role.toLowerCase()) {
            case 'owner':
            case 'admin':
                return 'border-[#A020F0]/30 bg-[#A020F0]/10 text-[#C084FC]';
            case 'teacher':
                return 'border-[#22C1D6]/30 bg-[#22C1D6]/10 text-[#22C1D6]';
            case 'student':
                return 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]';
            case 'parent':
                return 'border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623]';
            default:
                return 'border-[#26364D] bg-[#162338] text-[#94A3B8]';
        }
    };

    return (
        <TenantLayout title="Institution Overview">
            <Head title="Admin Dashboard" />

            {/* Academic Session Banner */}
            {currentAcademicYear && (
                <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-indigo-50 p-4 sm:flex-row sm:items-center dark:border-[#26364D] dark:bg-gradient-to-r dark:from-[#111B2C] dark:via-[#131F33] dark:to-[#171A34]">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-100 text-purple-700 dark:border-[#A020F0]/30 dark:bg-[#A020F0]/15 dark:text-[#C084FC]">
                            <School className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold tracking-wider uppercase text-purple-700 dark:text-[#C084FC]">
                                    Current Academic Session
                                </span>
                                <span className="flex size-2 rounded-full bg-[#22C55E] animate-pulse" />
                            </div>
                            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                                {currentAcademicYear.name}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end text-xs text-slate-500 sm:self-auto dark:text-[#94A3B8]">
                        <Clock className="size-4 text-purple-600 dark:text-[#C084FC]" />
                        <span>
                            Session Timeline: {currentAcademicYear.start_date} &ndash; {currentAcademicYear.end_date}
                        </span>
                    </div>
                </div>
            )}

            {/* Header & Quick Action Buttons */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                        Executive Administration
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                        Real-time campus metrics, faculty management, and student enrollment
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        href="/school/classes"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-[#26364D] dark:bg-[#111B2C] dark:text-[#F8FAFC] dark:hover:border-purple-500/40 dark:hover:bg-[#162338]"
                    >
                        <Plus className="size-3.5 text-[#C084FC]" />
                        <span>Manage Classes</span>
                    </Link>
                    <Link
                        href="/school/students"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-[#26364D] dark:bg-[#111B2C] dark:text-[#F8FAFC] dark:hover:border-sky-500/40 dark:hover:bg-[#162338]"
                    >
                        <Plus className="size-3.5 text-[#22C1D6]" />
                        <span>Enroll Student</span>
                    </Link>
                    <Link
                        href="/school/attendance"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-[#26364D] dark:bg-[#111B2C] dark:text-[#F8FAFC] dark:hover:border-emerald-500/40 dark:hover:bg-[#162338]"
                    >
                        <CalendarCheck className="size-3.5 text-[#22C55E]" />
                        <span>Attendance</span>
                    </Link>
                    <Link
                        href="/school/fees"
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#7C3AED] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:brightness-110"
                    >
                        <DollarSign className="size-3.5" />
                        <span>Fee Ledger</span>
                    </Link>
                </div>
            </div>

            {/* New School Empty State Onboarding Guide */}
            {metrics.totalStudents === 0 && metrics.totalClasses === 0 && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/80 p-6 shadow-xs dark:border-[#26364D] dark:bg-gradient-to-br dark:from-[#111B2C] dark:via-[#0F1827] dark:to-[#171B38]">
                    <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#A020F0] to-[#6366F1] text-white shadow-md shadow-purple-600/30">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                                    Welcome to Your New School Workspace!
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                                    Your multi-tenant workspace is active with isolated records. Follow these quick steps to get started:
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-100/70 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-[#22C55E]/30 dark:bg-[#22C55E]/10 dark:text-[#22C55E]">
                            <CheckCircle2 className="size-3.5" />
                            <span>Workspace Ready</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Link
                            href="/school/classes"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-purple-300 hover:shadow-md dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-[#A020F0]/50"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-[#A020F0]/15 dark:text-[#C084FC]">
                                    <Layers className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-purple-600 dark:text-[#F8FAFC] dark:group-hover:text-[#C084FC]">
                                    1. Classrooms & Sections
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                    Add grade levels, classrooms, and homeroom sections for your students.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-[#C084FC]">
                                <span>Add Classes</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link
                            href="/organizations/members"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-sky-300 hover:shadow-md dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-[#22C1D6]/50"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-[#22C1D6]/15 dark:text-[#22C1D6]">
                                    <Users className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 dark:text-[#F8FAFC] dark:group-hover:text-[#22C1D6]">
                                    2. Invite Faculty & Staff
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                    Send email invitations to teachers and department administrators.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-[#22C1D6]">
                                <span>Invite Teachers</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link
                            href="/school/students"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-md dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-[#22C55E]/50"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
                                    <GraduationCap className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-[#F8FAFC] dark:group-hover:text-[#22C55E]">
                                    3. Admit First Students
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                    Register student profiles, assign roll numbers, and enroll in classes.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-[#22C55E]">
                                <span>Admit Students</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link
                            href="/organizations/settings"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-[#6366F1]/50"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-[#6366F1]/15 dark:text-[#6366F1]">
                                    <Settings className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-[#F8FAFC] dark:group-hover:text-[#6366F1]">
                                    4. School Settings & Logo
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                    Upload official school emblem, adjust timezone, currency, and brand color.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-[#6366F1]">
                                <span>Customize Settings</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:border-slate-300 dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-[#384E6E] ${stat.glow}`}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
                                    {stat.label}
                                </span>
                                <div
                                    className={`flex size-9 items-center justify-center rounded-xl border ${stat.iconBg}`}
                                >
                                    <Icon className="size-4.5" />
                                </div>
                            </div>
                            <div className="mb-1 text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                                {stat.value}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                                <TrendingUp className="size-3 text-[#22C55E]" />
                                <span>{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Two-Column Detail Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Faculty & Staff Members */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#26364D] dark:bg-[#111B2C]">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#26364D]">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#A020F0]/15 text-[#C084FC]">
                                <Users className="size-4" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                                Faculty & Staff Roster
                            </h3>
                        </div>
                        <Link
                            href="/organizations/members"
                            className="flex items-center gap-1 text-xs font-semibold text-purple-600 transition hover:text-purple-500 dark:text-[#C084FC] dark:hover:underline"
                        >
                            <span>Manage Roster</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="space-y-2.5">
                        {recentMembers.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-500 dark:text-[#64748B]">
                                No members registered yet.
                            </div>
                        ) : (
                            recentMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-slate-200 dark:border-[#26364D]/60 dark:bg-[#0D1423]/60 dark:hover:border-[#26364D]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#A020F0] to-[#6366F1] text-xs font-black text-white shadow-xs">
                                            {member.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                                                {member.user.name}
                                            </div>
                                            <div className="truncate text-[11px] text-slate-500 dark:text-[#94A3B8]">
                                                {member.user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getRolePill(member.role)}`}
                                    >
                                        {member.role}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Course Offerings & Curriculum */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#26364D] dark:bg-[#111B2C]">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#26364D]">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#22C1D6]/15 text-[#22C1D6]">
                                <BookOpen className="size-4" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                                Curriculum & Course Catalog
                            </h3>
                        </div>
                        <Link
                            href="/learning/courses"
                            className="flex items-center gap-1 text-xs font-semibold text-purple-600 transition hover:text-purple-500 dark:text-[#C084FC] dark:hover:underline"
                        >
                            <span>Full Catalog</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="space-y-2.5">
                        {recentCourses.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="mb-3 text-xs text-slate-500 dark:text-[#64748B]">
                                    No courses published yet for this institution.
                                </p>
                                <Link
                                    href="/learning/courses"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-[#A020F0]/30 dark:bg-[#A020F0]/15 dark:text-[#C084FC] dark:hover:bg-[#A020F0]/25"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Create First Course</span>
                                </Link>
                            </div>
                        ) : (
                            recentCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/learning/courses/${course.slug}`}
                                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-purple-300 dark:border-[#26364D]/60 dark:bg-[#0D1423]/60 dark:hover:border-purple-500/40"
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="truncate text-xs font-bold text-slate-900 transition group-hover:text-purple-600 dark:text-[#F8FAFC] dark:group-hover:text-[#C084FC]">
                                            {course.title}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                                            {course.category?.name || 'General'}{' '}
                                            &bull;{' '}
                                            <span className="capitalize text-slate-600 dark:text-[#64748B]">
                                                {course.level} Level
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 shrink-0 text-slate-400 transition group-hover:text-purple-600 dark:text-[#64748B] dark:group-hover:text-[#C084FC]" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
