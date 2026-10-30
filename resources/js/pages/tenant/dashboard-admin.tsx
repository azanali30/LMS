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
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20',
            change: 'Active cohort',
        },
        {
            label: 'Faculty & Teachers',
            value: metrics.totalTeachers.toLocaleString(),
            icon: GraduationCap,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10 border-sky-500/20',
            change: 'Teaching staff',
        },
        {
            label: 'Classes & Sections',
            value: `${metrics.totalClasses} / ${metrics.totalSections}`,
            icon: Layers,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
            change: 'Active classrooms',
        },
        {
            label: 'Daily Attendance',
            value: `${metrics.attendanceRate}%`,
            icon: CalendarCheck,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            change: 'Today present rate',
        },
        {
            label: 'LMS Courses',
            value: metrics.totalCourses.toLocaleString(),
            icon: BookOpen,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            change: 'Curriculum catalog',
        },
    ];

    return (
        <TenantLayout title="Institution Overview">
            <Head title="Admin Dashboard" />

            {/* Academic Session Banner */}
            {currentAcademicYear && (
                <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-indigo-50 p-4 sm:flex-row sm:items-center dark:border-purple-500/30 dark:bg-gradient-to-r dark:from-purple-950/40 dark:via-slate-900 dark:to-indigo-950/40">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300">
                            <School className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold tracking-wider uppercase text-purple-700 dark:text-purple-300">
                                    Current Academic Session
                                </span>
                                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                            </div>
                            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                                {currentAcademicYear.name}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end text-xs text-slate-500 sm:self-auto dark:text-slate-400">
                        <Clock className="size-4 text-purple-600 dark:text-purple-400" />
                        <span>
                            Term span: {currentAcademicYear.start_date} to{' '}
                            {currentAcademicYear.end_date}
                        </span>
                    </div>
                </div>
            )}

            {/* Quick Actions Bar */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Executive Dashboard
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Real-time academic performance, attendance, and faculty
                        statistics
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/school/classes"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Plus className="size-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Manage Classes</span>
                    </Link>
                    <Link
                        href="/school/students"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Plus className="size-3.5 text-sky-600 dark:text-sky-400" />
                        <span>Enroll Student</span>
                    </Link>
                    <Link
                        href="/school/attendance"
                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500"
                    >
                        <CalendarCheck className="size-3.5" />
                        <span>Mark Attendance</span>
                    </Link>
                </div>
            </div>

            {/* New School Empty State Onboarding Guide */}
            {metrics.totalStudents === 0 && metrics.totalClasses === 0 && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/80 p-6 shadow-xs dark:border-purple-500/20 dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#0B1220] dark:to-[#1e1b4b]/40">
                    <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Welcome to Your New School Workspace!
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Your multi-tenant workspace is active with isolated records. Follow these quick steps to get started:
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-100/70 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
                            <CheckCircle2 className="size-3.5 text-purple-600 dark:text-purple-400" />
                            <span>Setup Complete</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Link
                            href="/school/classes"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-purple-500/40"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                    <Layers className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                                    1. Classrooms & Sections
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Add grade levels, classrooms, and homeroom sections for your students.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                <span>Add Classes</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link
                            href="/organizations/members"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-sky-500/40"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                                    <Users className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                                    2. Invite Faculty & Staff
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Send email invitations to teachers and department administrators.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                                <span>Invite Teachers</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link
                            href="/school/students"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-emerald-500/40"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    <GraduationCap className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                                    3. Admit First Students
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Register student profiles, assign roll numbers, and enroll in classes.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <span>Admit Students</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link
                            href="/organizations/settings"
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-indigo-500/40"
                        >
                            <div>
                                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    <Settings className="size-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                                    4. School Settings & Logo
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Upload official school emblem, adjust timezone, currency, and brand color.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                <span>Customize Settings</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-lg dark:hover:border-slate-700"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {stat.label}
                                </span>
                                <div
                                    className={`size-8 rounded-xl ${stat.bg} flex items-center justify-center border`}
                                >
                                    <Icon className={`size-4 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="mb-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {stat.value}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <TrendingUp className="size-3 text-emerald-500 dark:text-emerald-400" />
                                <span>{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Two-Column Detail Section */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Recent Faculty & Staff Members */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Users className="size-5 text-purple-600 dark:text-purple-400" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Recent Staff & Community
                            </h3>
                        </div>
                        <Link
                            href="/organizations/members"
                            className="flex items-center gap-1 text-xs font-medium text-purple-600 transition hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                            <span>All Members</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentMembers.length === 0 ? (
                            <p className="py-6 text-center text-xs text-slate-500">
                                No members found.
                            </p>
                        ) : (
                            recentMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-xs font-bold text-white">
                                            {member.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                                {member.user.name}
                                            </div>
                                            <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                                {member.user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                        {member.role}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Course Catalog & E-Learning Highlights */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <BookOpen className="size-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Online Course Offerings
                            </h3>
                        </div>
                        <Link
                            href="/learning/courses"
                            className="flex items-center gap-1 text-xs font-medium text-purple-600 transition hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                            <span>Browse Courses</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentCourses.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="mb-3 text-xs text-slate-500">
                                    No courses created yet in this organization.
                                </p>
                                <Link
                                    href="/learning/courses"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300 dark:hover:bg-purple-600/30"
                                >
                                    <Plus className="size-3" />
                                    <span>Create First Course</span>
                                </Link>
                            </div>
                        ) : (
                            recentCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/learning/courses/${course.slug}`}
                                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-purple-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-purple-500/30"
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="truncate text-xs font-semibold text-slate-900 transition group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-300">
                                            {course.title}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            {course.category?.name || 'General'}{' '}
                                            &bull;{' '}
                                            <span className="capitalize">
                                                {course.level}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 shrink-0 text-slate-400 transition group-hover:text-purple-600 dark:text-slate-500 dark:group-hover:text-purple-400" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
