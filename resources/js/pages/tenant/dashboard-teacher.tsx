import { Head, Link, usePage } from '@inertiajs/react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    GraduationCap,
    Clock,
    Award,
    CalendarCheck,
    ChevronRight,
    Users,
    AlertCircle,
    CheckCircle2,
    Calendar,
    BookOpen,
    ArrowRight,
    Check,
    Zap,
    FileText,
    BarChart3,
    Mail,
    FlaskConical,
    Laptop,
} from 'lucide-react';
import type { Auth } from '@/types';

interface AssignedClass {
    id: number;
    name: string;
    room?: string;
    capacity?: number;
    enrolled_count?: number;
    school_class: {
        id: number;
        name: string;
        code?: string;
    };
}

interface ScheduleItem {
    id: number;
    start_time: string;
    end_time: string;
    subject: string;
    class_name: string;
    section_name: string;
    class_section_id: number;
    room?: string;
    period_name: string;
    status: 'completed' | 'current' | 'upcoming' | 'scheduled';
    attendance_marked: boolean;
    can_mark_attendance: boolean;
}

interface AttendanceTask {
    class_section_id: number;
    timetable_entry_id?: number;
    class_name: string;
    section_name: string;
    subject_name: string;
    period_name: string;
    start_time: string;
    end_time: string;
    room?: string;
    is_first_period: boolean;
    is_submitted: boolean;
    submitted_at?: string;
    marked_by?: number;
    can_edit: boolean;
    total_students: number;
    present_count: number;
    absent_count: number;
}

interface PendingGradingTask {
    id: number;
    title: string;
    type: string;
    due_date?: string;
    class_name: string;
    section_name: string;
    subject_name: string;
    total_students: number;
    graded_count: number;
    ungraded_count: number;
    is_pending: boolean;
}

interface RecentGrade {
    id: number;
    score: number;
    feedback?: string;
    created_at: string;
    student: {
        id: number;
        name: string;
    };
    assessment: {
        id: number;
        title: string;
        max_score: number;
        subject?: {
            name: string;
        };
        class_section?: {
            name: string;
            school_class?: {
                name: string;
            };
        };
    };
}

interface TeacherCourse {
    id: number;
    title: string;
    slug: string;
    level: string;
    enrollments_count: number;
}

interface AcademicYear {
    id: number;
    name: string;
    is_current: boolean;
}

interface WeeklyAttendanceItem {
    day: string;
    date: string;
    rate: number;
    total: number;
}

interface TeacherActivityItem {
    id: string;
    title: string;
    time: string;
    type: 'attendance' | 'grade' | 'message';
}

interface TeacherDashboardProps {
    metrics?: {
        assignedClassesCount: number;
        todayPeriodsCount: number;
        totalStudentsCount?: number;
        attendanceTodayRate?: number | null;
        pendingAttendanceCount: number;
        pendingGradingCount: number;
        pendingTasksCount?: number;
    };
    assignedClasses?: AssignedClass[];
    todaySchedule?: ScheduleItem[];
    nextClass?: ScheduleItem | null;
    attendanceTasks?: AttendanceTask[];
    pendingAttendanceTasks?: AttendanceTask[];
    pendingGradingTasks?: PendingGradingTask[];
    weeklyAttendance?: WeeklyAttendanceItem[];
    recentActivities?: TeacherActivityItem[];
    teacherCourses?: TeacherCourse[];
    recentGradesGiven?: RecentGrade[];
    currentAcademicYear?: AcademicYear | null;
}

export default function TeacherDashboard({
    metrics = {
        assignedClassesCount: 0,
        todayPeriodsCount: 0,
        totalStudentsCount: 0,
        attendanceTodayRate: null,
        pendingAttendanceCount: 0,
        pendingGradingCount: 0,
        pendingTasksCount: 0,
    },
    assignedClasses = [],
    todaySchedule = [],
    nextClass: _nextClass = null,
    attendanceTasks: _attendanceTasks = [],
    pendingAttendanceTasks: _pendingAttendanceTasks = [],
    pendingGradingTasks = [],
    weeklyAttendance = [],
    recentActivities = [],
    teacherCourses: _teacherCourses = [],
    recentGradesGiven: _recentGradesGiven = [],
    currentAcademicYear,
}: TeacherDashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const sessionLabel = currentAcademicYear?.name || '2026-2027';

    // Calculate real dynamic counts from database props
    const totalStudentsCalculated = assignedClasses.reduce(
        (sum, c) => sum + (c.enrolled_count || 0),
        0
    );
    const displayTotalStudents = metrics.totalStudentsCount ?? totalStudentsCalculated;
    const displayPeriodsCount = metrics.todayPeriodsCount ?? todaySchedule.length;
    const displayPendingTasks = metrics.pendingTasksCount ?? (metrics.pendingAttendanceCount + metrics.pendingGradingCount);
    const attendanceTodayRate = metrics.attendanceTodayRate ?? null;

    // Timeline schedule: use real database periods
    const scheduleItems = todaySchedule.map((item, idx) => ({
        id: item.id,
        time: `${item.start_time} - ${item.end_time}`,
        title: `${item.subject} • ${item.class_name} (${item.section_name})`,
        status: item.status === 'current' ? 'Ongoing' : item.status === 'completed' ? 'Completed' : 'Upcoming',
        isOngoing: item.status === 'current' || (todaySchedule.length === 1 && idx === 0),
    }));

    // Classes cards: use real assigned classes with cycling theme
    const classThemes = [
        { icon: BookOpen, color: 'text-[#C084FC]', bg: 'bg-[#1C1335]', border: 'border-[#7C3AED]/40', btnBg: 'bg-purple-600/30 text-purple-200 border-purple-500/30 hover:bg-purple-600 hover:text-white', iconBox: 'bg-purple-900/40 text-purple-300' },
        { icon: FlaskConical, color: 'text-[#38BDF8]', bg: 'bg-[#0E2738]', border: 'border-[#0284C7]/40', btnBg: 'bg-sky-600/30 text-sky-200 border-sky-500/30 hover:bg-sky-600 hover:text-white', iconBox: 'bg-sky-900/40 text-sky-300' },
        { icon: Laptop, color: 'text-[#34D399]', bg: 'bg-[#0D2821]', border: 'border-[#10B981]/40', btnBg: 'bg-emerald-600/30 text-emerald-200 border-emerald-500/30 hover:bg-emerald-600 hover:text-white', iconBox: 'bg-emerald-900/40 text-emerald-300' },
    ];

    const displayClasses = assignedClasses.slice(0, 3).map((c, i) => {
        const theme = classThemes[i % classThemes.length];
        return {
            title: c.school_class.name,
            classSub: `Section ${c.name}`,
            students: c.enrolled_count || 0,
            href: `/school/classes`,
            ...theme,
        };
    });

    // Attendance Overview Weekly Chart calculation from real backend attendance data
    const weekDays = (weeklyAttendance && weeklyAttendance.length === 7) ? weeklyAttendance : [
        { day: 'Mon', rate: 0, total: 0 },
        { day: 'Tue', rate: 0, total: 0 },
        { day: 'Wed', rate: 0, total: 0 },
        { day: 'Thu', rate: 0, total: 0 },
        { day: 'Fri', rate: 0, total: 0 },
        { day: 'Sat', rate: 0, total: 0 },
        { day: 'Sun', rate: 0, total: 0 },
    ];
    const xCoords = [10, 50, 90, 130, 170, 210, 250];
    const chartNodes = weekDays.map((d, i) => {
        const cy = Math.round(105 - ((d.rate || 0) / 100) * 90);
        return { cx: xCoords[i], cy, rate: d.rate, day: d.day };
    });
    const linePath = chartNodes.map((pt, i) => (i === 0 ? `M ${pt.cx} ${pt.cy}` : `L ${pt.cx} ${pt.cy}`)).join(' ');
    const areaPath = `${linePath} L 250 110 L 10 110 Z`;

    return (
        <TenantLayout title="">
            <Head title="Teacher Portal" />

            {/* Top Hero Welcome Banner */}
            <div className="relative mb-6 overflow-hidden rounded-3xl border border-[#3B2D6C]/70 bg-gradient-to-r from-[#1E124A] via-[#101F48] to-[#24104E] p-6 shadow-2xl">
                {/* Background ambient lighting */}
                <div className="pointer-events-none absolute -right-10 -top-10 size-72 rounded-full bg-purple-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-10 -bottom-10 size-72 rounded-full bg-cyan-600/15 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Teacher profile & greeting */}
                    <div className="flex items-center gap-4">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-[#C084FC]/60 shadow-[0_0_20px_rgba(192,132,252,0.35)]">
                            <div className="flex size-full items-center justify-center bg-gradient-to-tr from-[#A020F0] via-[#8B5CF6] to-[#6366F1] text-xl font-black text-white">
                                {auth.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">
                                Welcome back, {auth.user?.name || 'Megan Johnson'}!
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-300">
                                Teaching today, inspiring tomorrow.
                            </p>
                        </div>
                    </div>

                    {/* Date and Academic Session pills */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md">
                            <Calendar className="size-5 text-slate-300" />
                            <div>
                                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                    Today
                                </div>
                                <div className="text-xs font-bold text-white">
                                    {todayFormatted}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md">
                            <span className="size-2.5 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_10px_#22C55E]" />
                            <div>
                                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                    Academic Session
                                </div>
                                <div className="text-xs font-bold text-white">
                                    {sessionLabel}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 1: The 4 Big Colorful Metric Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Today's Periods (Purple) */}
                <Link
                    href="/school/timetable"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#7C3AED]/40 bg-[#18122B] p-5 shadow-lg transition duration-200 hover:border-[#A855F7] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#9333EA] to-[#A855F7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                            <GraduationCap className="size-6" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-300">Today's Periods</span>
                            <div className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:translate-x-0.5">
                                <ArrowRight className="size-3" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-white">
                            {displayPeriodsCount}
                        </div>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-[#A855F7]/30">
                            <div className="h-1.5 rounded-full bg-[#A855F7]" style={{ width: displayPeriodsCount > 0 ? '100%' : '0%' }} />
                        </div>
                    </div>
                </Link>

                {/* 2. My Students (Cyan) */}
                <Link
                    href="/school/students"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#06B6D4]/40 bg-[#0B2233] p-5 shadow-lg transition duration-200 hover:border-[#22D3EE] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#0891B2] to-[#06B6D4] text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                            <Users className="size-6" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-300">My Students</span>
                            <div className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:translate-x-0.5">
                                <ArrowRight className="size-3" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-white">
                            {displayTotalStudents}
                        </div>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-[#06B6D4]/30">
                            <div className="h-1.5 rounded-full bg-[#06B6D4]" style={{ width: displayTotalStudents > 0 ? '100%' : '0%' }} />
                        </div>
                    </div>
                </Link>

                {/* 3. Attendance Today (Green) */}
                <Link
                    href="/school/attendance"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#10B981]/40 bg-[#0A261D] p-5 shadow-lg transition duration-200 hover:border-[#34D399] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] to-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <Check className="size-6 stroke-[3]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-300">Attendance Today</span>
                            <div className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:translate-x-0.5">
                                <ArrowRight className="size-3" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-white">
                            {attendanceTodayRate !== null ? `${attendanceTodayRate}%` : '--'}
                        </div>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-[#10B981]/30">
                            <div
                                className="h-1.5 rounded-full bg-[#10B981]"
                                style={{ width: `${attendanceTodayRate !== null ? Math.min(100, Math.max(0, attendanceTodayRate)) : 0}%` }}
                            />
                        </div>
                    </div>
                </Link>

                {/* 4. Pending Tasks (Amber) */}
                <Link
                    href="/school/grades"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#F59E0B]/40 bg-[#291D11] p-5 shadow-lg transition duration-200 hover:border-[#FBBF24] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                            <Award className="size-6" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-300">Pending Tasks</span>
                            <div className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:translate-x-0.5">
                                <ArrowRight className="size-3" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black text-white">
                            {displayPendingTasks}
                        </div>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-[#F59E0B]/30">
                            <div className="h-1.5 rounded-full bg-[#F59E0B]" style={{ width: displayPendingTasks > 0 ? '60%' : '0%' }} />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Row 2: Middle Section (Today's Schedule & My Classes) */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left: Today's Teaching Schedule (5 cols) */}
                <div className="flex flex-col justify-between rounded-3xl border border-[#26364D] bg-[#111B2C] p-6 lg:col-span-5">
                    <div>
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#A020F0]/15 text-[#C084FC]">
                                    <Clock className="size-4" />
                                </div>
                                <h2 className="text-base font-bold text-white">
                                    Today's Teaching Schedule
                                </h2>
                            </div>
                            <Link
                                href="/school/timetable"
                                className="text-xs font-semibold text-[#C084FC] hover:underline"
                            >
                                View Full Schedule &rarr;
                            </Link>
                        </div>

                        {/* Connected vertical timeline */}
                        {scheduleItems.length === 0 ? (
                            <div className="py-10 text-center text-slate-400">
                                <Clock className="mx-auto size-8 text-slate-500 opacity-60 mb-2" />
                                <p className="text-xs font-semibold text-slate-300">No teaching periods scheduled today</p>
                                <p className="mt-1 text-[11px] text-slate-500">Your timetable is clear for today.</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#26364D]">
                                {scheduleItems.map((item, idx) => (
                                    <div key={item.id || idx} className="relative flex items-center justify-between gap-4">
                                        {/* Timeline dot */}
                                        <span
                                            className={`absolute -left-6 top-1.5 size-3.5 rounded-full border-2 border-[#111B2C] ${
                                                item.isOngoing
                                                    ? 'bg-[#C084FC] shadow-[0_0_10px_#C084FC]'
                                                    : 'bg-slate-500'
                                            }`}
                                        />

                                        <div>
                                            <div className="text-xs font-bold text-white">
                                                {item.time}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {item.title}
                                            </div>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-0.5 text-[11px] font-semibold border ${
                                                item.isOngoing
                                                    ? 'border-[#A020F0]/40 bg-[#A020F0]/20 text-[#C084FC]'
                                                    : 'border-[#0284C7]/40 bg-[#0284C7]/20 text-[#38BDF8]'
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: My Classes (7 cols) */}
                <div className="flex flex-col justify-between rounded-3xl border border-[#26364D] bg-[#111B2C] p-6 lg:col-span-7">
                    <div>
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#22C1D6]/15 text-[#22C1D6]">
                                    <Users className="size-4" />
                                </div>
                                <h2 className="text-base font-bold text-white">
                                    My Classes
                                </h2>
                            </div>
                            <Link
                                href="/school/classes"
                                className="text-xs font-semibold text-[#C084FC] hover:underline"
                            >
                                View All &rarr;
                            </Link>
                        </div>

                        {/* Class Cards */}
                        {displayClasses.length === 0 ? (
                            <div className="py-10 text-center text-slate-400">
                                <BookOpen className="mx-auto size-8 text-slate-500 opacity-60 mb-2" />
                                <p className="text-xs font-semibold text-slate-300">No classes assigned yet</p>
                                <p className="mt-1 text-[11px] text-slate-500">Assigned sections and cohorts will display here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {displayClasses.map((cls, idx) => {
                                    const IconComponent = cls.icon;
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col justify-between rounded-2xl border ${cls.border} ${cls.bg} p-4 transition hover:brightness-110`}
                                        >
                                            <div>
                                                <div className={`mb-3 flex size-8 items-center justify-center rounded-lg ${cls.iconBox}`}>
                                                    <IconComponent className="size-4" />
                                                </div>
                                                <h3 className="text-sm font-bold text-white">
                                                    {cls.title}
                                                </h3>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {cls.classSub}
                                                </p>
                                                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                                                    <Users className="size-3 text-slate-400" />
                                                    <span>{cls.students} Students</span>
                                                </div>
                                            </div>

                                            <Link
                                                href={cls.href}
                                                className={`mt-4 block rounded-xl border py-1.5 text-center text-xs font-bold transition ${cls.btnBg}`}
                                            >
                                                View Class &rarr;
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3: Bottom 3 Columns (Attendance Overview, Pending Assessments, Recent Activity) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Column 1: Attendance Overview */}
                <div className="flex flex-col justify-between rounded-3xl border border-[#26364D] bg-[#111B2C] p-6">
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#A020F0]/15 text-[#C084FC]">
                                    <BarChart3 className="size-4" />
                                </div>
                                <h3 className="text-sm font-bold text-white">
                                    Attendance Overview
                                </h3>
                            </div>
                            <span className="rounded-lg border border-[#26364D] bg-[#162338] px-2.5 py-1 text-xs text-slate-300">
                                This Week &or;
                            </span>
                        </div>

                        {/* Area chart SVG */}
                        <div className="relative mt-2 h-44 w-full">
                            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-slate-400">
                                <span>100</span>
                                <span>75</span>
                                <span>50</span>
                                <span>25</span>
                                <span>0</span>
                            </div>

                            <div className="ml-8 h-full">
                                <svg className="size-full overflow-visible" viewBox="0 0 280 120">
                                    <defs>
                                        <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#A020F0" stopOpacity="0.45" />
                                            <stop offset="100%" stopColor="#A020F0" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid Lines */}
                                    <line x1="0" y1="10" x2="280" y2="10" stroke="#26364D" strokeDasharray="3 3" />
                                    <line x1="0" y1="35" x2="280" y2="35" stroke="#26364D" strokeDasharray="3 3" />
                                    <line x1="0" y1="60" x2="280" y2="60" stroke="#26364D" strokeDasharray="3 3" />
                                    <line x1="0" y1="85" x2="280" y2="85" stroke="#26364D" strokeDasharray="3 3" />
                                    <line x1="0" y1="110" x2="280" y2="110" stroke="#26364D" strokeDasharray="3 3" />

                                    {/* Area Fill */}
                                    <path
                                        d={areaPath}
                                        fill="url(#purpleGlow)"
                                    />
                                    {/* Stroke Line */}
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke="#C084FC"
                                        strokeWidth="2.5"
                                    />

                                    {/* Nodes */}
                                    {chartNodes.map((pt, i) => (
                                        <circle
                                            key={i}
                                            cx={pt.cx}
                                            cy={pt.cy}
                                            r="4"
                                            fill="#C084FC"
                                            stroke="#111B2C"
                                            strokeWidth="2"
                                            className="shadow-[0_0_8px_#C084FC]"
                                        />
                                    ))}
                                </svg>

                                <div className="mt-2 flex justify-between pr-2 text-[10px] text-slate-400">
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                    <span>Sun</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Pending Assessments */}
                <div className="flex flex-col justify-between rounded-3xl border border-[#26364D] bg-[#111B2C] p-6">
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#F5A623]/15 text-[#F5A623]">
                                    <FileText className="size-4" />
                                </div>
                                <h3 className="text-sm font-bold text-white">
                                    Pending Assessments
                                </h3>
                            </div>
                            <Link
                                href="/school/grades"
                                className="text-xs font-semibold text-[#C084FC] hover:underline"
                            >
                                View All &rarr;
                            </Link>
                        </div>

                        {pendingGradingTasks.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <CheckCircle2 className="mx-auto size-8 text-emerald-400/60 mb-2" />
                                <p className="text-xs font-semibold text-slate-300">All assessments evaluated</p>
                                <p className="mt-1 text-[11px] text-slate-500">No pending grading tasks.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingGradingTasks.slice(0, 3).map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="flex items-center justify-between rounded-2xl border border-[#26364D]/60 bg-[#0D1423]/70 p-3.5 transition hover:border-[#26364D]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${idx === 0 ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                <FileText className="size-4.5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">
                                                    {item.title}
                                                </h4>
                                                <span className={`text-[11px] font-medium ${idx === 0 ? 'text-[#F5A623]' : 'text-slate-400'}`}>
                                                    {item.due_date ? `Due ${item.due_date}` : `${item.ungraded_count} to grade`}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="rounded-full border border-[#A020F0]/40 bg-[#A020F0]/20 px-3 py-1 text-[10px] font-semibold text-[#C084FC]">
                                            {item.ungraded_count > 0 ? `${item.ungraded_count} Pending` : 'Due Soon'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: Recent Activity */}
                <div className="flex flex-col justify-between rounded-3xl border border-[#26364D] bg-[#111B2C] p-6">
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#0284C7]/15 text-[#38BDF8]">
                                    <Zap className="size-4" />
                                </div>
                                <h3 className="text-sm font-bold text-white">
                                    Recent Activity
                                </h3>
                            </div>
                            <Link
                                href="/school/grades"
                                className="text-xs font-semibold text-[#C084FC] hover:underline"
                            >
                                View All &rarr;
                            </Link>
                        </div>

                        {recentActivities.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                <Zap className="mx-auto size-8 text-slate-500/50 mb-2" />
                                <p className="text-xs font-semibold text-slate-300">No recent activity</p>
                                <p className="mt-1 text-[11px] text-slate-500">Actions will appear as attendance and grades are logged.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivities.map((act) => {
                                    const IconComp = act.type === 'attendance' ? Check : act.type === 'grade' ? BarChart3 : Mail;
                                    const iconBg = act.type === 'attendance' ? 'bg-[#10B981] text-white' : act.type === 'grade' ? 'bg-[#A020F0] text-white' : 'bg-[#0284C7] text-white';
                                    return (
                                        <div
                                            key={act.id}
                                            className="flex items-center justify-between rounded-2xl border border-[#26364D]/60 bg-[#0D1423]/70 p-3 transition hover:border-[#26364D]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                                                    <IconComp className="size-3.5" />
                                                </div>
                                                <span className="text-xs font-medium text-white">
                                                    {act.title}
                                                </span>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-slate-400">
                                                {act.time}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
