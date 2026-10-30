import { Head, Link } from '@inertiajs/react';
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
    Sparkles,
    BookOpen,
    ArrowRight,
} from 'lucide-react';

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

interface TeacherDashboardProps {
    metrics?: {
        assignedClassesCount: number;
        todayPeriodsCount: number;
        pendingAttendanceCount: number;
        pendingGradingCount: number;
    };
    assignedClasses?: AssignedClass[];
    todaySchedule?: ScheduleItem[];
    nextClass?: ScheduleItem | null;
    attendanceTasks?: AttendanceTask[];
    pendingAttendanceTasks?: AttendanceTask[];
    pendingGradingTasks?: PendingGradingTask[];
    teacherCourses?: TeacherCourse[];
    recentGradesGiven?: RecentGrade[];
}

export default function TeacherDashboard({
    metrics = {
        assignedClassesCount: 0,
        todayPeriodsCount: 0,
        pendingAttendanceCount: 0,
        pendingGradingCount: 0,
    },
    assignedClasses = [],
    todaySchedule = [],
    nextClass = null,
    attendanceTasks = [],
    pendingAttendanceTasks = [],
    pendingGradingTasks = [],
    teacherCourses = [],
    recentGradesGiven = [],
}: TeacherDashboardProps) {
    const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    return (
        <TenantLayout title="Faculty Portal">
            <Head title="Teacher Dashboard" />

            {/* Quick Actions Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Faculty Workspace
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                            <Sparkles className="size-3" />
                            {todayFormatted}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Manage your teaching schedule, track daily attendance, and enter student assessments
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        href="/school/attendance"
                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500"
                    >
                        <CalendarCheck className="size-3.5" />
                        <span>My Attendance</span>
                    </Link>
                    <Link
                        href="/school/timetable"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Clock className="size-3.5 text-purple-500" />
                        <span>My Timetable</span>
                    </Link>
                    <Link
                        href="/school/grades"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Award className="size-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Gradebook</span>
                    </Link>
                </div>
            </div>

            {/* Metric Cards Banner */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Today's Periods</span>
                        <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                            <Clock className="size-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        {metrics.todayPeriodsCount}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Scheduled for today</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Tasks</span>
                        <div className={`rounded-xl p-2 ${metrics.pendingAttendanceCount > 0 ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                            {metrics.pendingAttendanceCount > 0 ? (
                                <AlertCircle className="size-4" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        {metrics.pendingAttendanceCount}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                        {metrics.pendingAttendanceCount > 0 ? 'Pending submission today' : 'All today submitted'}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Grading Tasks</span>
                        <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                            <Award className="size-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        {metrics.pendingGradingCount}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Assessments awaiting scores</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned Cohorts</span>
                        <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                            <GraduationCap className="size-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        {metrics.assignedClassesCount}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Class sections instructed</p>
                </div>
            </div>

            {/* Upcoming / Next Class Banner */}
            {nextClass && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-900/30 via-slate-900 to-indigo-950/40 p-5 shadow-md dark:border-purple-800/40">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                                        {nextClass.status === 'current' ? 'Live Session Now' : 'Upcoming Period'}
                                    </span>
                                    <span className="text-xs font-semibold text-purple-200">
                                        {nextClass.start_time} – {nextClass.end_time}
                                    </span>
                                </div>
                                <h3 className="mt-1 text-base font-bold text-white">
                                    {nextClass.subject} — {nextClass.class_name} ({nextClass.section_name})
                                </h3>
                                <p className="text-xs text-slate-300">
                                    {nextClass.period_name} • Room: {nextClass.room || 'General Classroom'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {nextClass.can_mark_attendance && (
                                <Link
                                    href={`/school/attendance?section_id=${nextClass.class_section_id}&timetable_entry_id=${nextClass.id}`}
                                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md ${
                                        nextClass.attendance_marked
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                                            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/30'
                                    }`}
                                >
                                    <CalendarCheck className="size-3.5" />
                                    <span>{nextClass.attendance_marked ? 'Attendance Marked ✓' : 'Mark Attendance'}</span>
                                </Link>
                            )}
                            <Link
                                href="/school/timetable"
                                className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                            >
                                <span>Schedule</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Layout */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left 2-Column Section */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Today's Teaching Schedule List */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Clock className="size-5 text-purple-600 dark:text-purple-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Today's Assigned Schedule
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Personal timetable periods scheduled for today
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/school/timetable"
                                className="flex items-center gap-1 text-xs font-medium text-purple-600 transition hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                <span>Weekly Grid</span>
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </div>

                        {todaySchedule.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
                                <div className="rounded-full bg-purple-500/10 p-3 text-purple-500 dark:bg-purple-500/20">
                                    <Calendar className="size-6" />
                                </div>
                                <h4 className="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    No Teaching Periods Scheduled for Today
                                </h4>
                                <p className="mt-1 max-w-sm text-[11px] text-slate-500 dark:text-slate-400">
                                    You have no timetable periods assigned for {todayFormatted}. Check your full weekly timetable for upcoming classes.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todaySchedule.map((item) => {
                                    const isCurrent = item.status === 'current';
                                    const isCompleted = item.status === 'completed';

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                                                isCurrent
                                                    ? 'border-purple-400 bg-purple-50/60 dark:border-purple-500/50 dark:bg-purple-950/20'
                                                    : 'border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-900/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex min-w-[70px] flex-col items-center justify-center rounded-lg bg-white px-2 py-1.5 shadow-xs dark:bg-slate-800">
                                                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                        {item.start_time}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-slate-400">
                                                        {item.end_time}
                                                    </span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 dark:text-white">
                                                            {item.subject}
                                                        </span>
                                                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                            {item.period_name}
                                                        </span>
                                                        {isCurrent && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Active Now
                                                            </span>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                Finished
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                        <span>
                                                            {item.class_name} • Section {item.section_name}
                                                        </span>
                                                        {item.room && <span>Room: {item.room}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.can_mark_attendance ? (
                                                    item.attendance_marked ? (
                                                        <Link
                                                            href={`/school/attendance?section_id=${item.class_section_id}&timetable_entry_id=${item.id}`}
                                                            className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                        >
                                                            <CheckCircle2 className="size-3.5" />
                                                            <span>Attendance Saved</span>
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            href={`/school/attendance?section_id=${item.class_section_id}&timetable_entry_id=${item.id}`}
                                                            className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500"
                                                        >
                                                            <CalendarCheck className="size-3.5" />
                                                            <span>Take Attendance</span>
                                                        </Link>
                                                    )
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">
                                                        {item.attendance_marked ? 'Marked by Lead' : 'Not First Period'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Attendance Tasks Requiring Action */}
                    {pendingAttendanceTasks.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/10">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Attendance Tasks Requiring Action Today ({pendingAttendanceTasks.length})
                                    </h3>
                                </div>
                                <Link
                                    href="/school/attendance"
                                    className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
                                >
                                    Open Register &rarr;
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {pendingAttendanceTasks.map((task) => (
                                    <div
                                        key={`${task.class_section_id}-${task.timetable_entry_id || 'daily'}`}
                                        className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-white p-3.5 shadow-xs dark:border-amber-800/40 dark:bg-[#0B1220]"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                                                {task.class_name} • {task.section_name}
                                            </div>
                                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                {task.period_name} ({task.start_time} - {task.end_time})
                                            </div>
                                            <div className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                                                {task.total_students} students enrolled
                                            </div>
                                        </div>

                                        <Link
                                            href={`/school/attendance?section_id=${task.class_section_id}${task.timetable_entry_id ? `&timetable_entry_id=${task.timetable_entry_id}` : ''}`}
                                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-500"
                                        >
                                            Submit Now
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Grading Tasks */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Award className="size-5 text-amber-500 dark:text-amber-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Pending Grading Tasks
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Assessments with ungraded student submissions
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/school/grades"
                                className="flex items-center gap-1 text-xs font-medium text-purple-600 transition hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                <span>All Assessments</span>
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </div>

                        {pendingGradingTasks.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500">
                                All assessments are fully graded! Great work.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingGradingTasks.map((task) => {
                                    const progressPct = task.total_students > 0
                                        ? Math.round((task.graded_count / task.total_students) * 100)
                                        : 0;

                                    return (
                                        <div
                                            key={task.id}
                                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-purple-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-purple-500/40"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                                                        {task.title}
                                                    </span>
                                                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span className="capitalize">{task.type}</span>
                                                        <span>•</span>
                                                        <span>{task.subject_name} ({task.class_name} - {task.section_name})</span>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/school/grades?assessment_id=${task.id}`}
                                                    className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500"
                                                >
                                                    Enter Scores ({task.ungraded_count} left)
                                                </Link>
                                            </div>

                                            <div className="mt-3">
                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                    <span>{task.graded_count} of {task.total_students} students graded</span>
                                                    <span>{progressPct}%</span>
                                                </div>
                                                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                                    <div
                                                        className="h-1.5 rounded-full bg-purple-600 dark:bg-purple-500"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right 1-Column Section */}
                <div className="space-y-6">
                    {/* Assigned Classes and Sections */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="size-5 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Your Assigned Cohorts
                                </h3>
                            </div>
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                {assignedClasses.length} cohorts
                            </span>
                        </div>

                        {assignedClasses.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-500">
                                No classes currently assigned. Contact school leadership.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {assignedClasses.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-purple-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-purple-500/30"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                {cls.school_class.name}
                                            </span>
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                Section {cls.name}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Users className="size-3 text-slate-400" />
                                                <span>{cls.enrolled_count ?? 0} students enrolled</span>
                                            </div>
                                            {cls.room && <span>Room: {cls.room}</span>}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] dark:border-slate-800/60">
                                            <Link
                                                href={`/school/students?section_id=${cls.id}`}
                                                className="text-purple-600 hover:underline dark:text-purple-400"
                                            >
                                                View Students &rarr;
                                            </Link>
                                            <Link
                                                href={`/school/attendance?section_id=${cls.id}`}
                                                className="font-medium text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-300"
                                            >
                                                Attendance
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Grades Recorded by Teacher */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="size-5 text-amber-500 dark:text-amber-400" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Recent Grades Recorded
                                </h3>
                            </div>
                            <Link
                                href="/school/grades"
                                className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
                            >
                                Register
                            </Link>
                        </div>

                        {recentGradesGiven.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500">
                                No recent grades recorded yet.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {recentGradesGiven.map((g) => (
                                    <div
                                        key={g.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs dark:border-slate-800/80 dark:bg-slate-900/50"
                                    >
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {g.student.name}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {g.assessment.title}
                                            </div>
                                        </div>
                                        <div className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                                            {g.score} / {g.assessment.max_score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Online Courses Taught (if any) */}
                    {teacherCourses.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="size-4 text-indigo-500" />
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                                        Authored E-Learning Courses
                                    </h3>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {teacherCourses.map((c) => (
                                    <Link
                                        key={c.id}
                                        href={`/learning/courses/${c.slug}`}
                                        className="block rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/40"
                                    >
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {c.title}
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                            <span className="capitalize">{c.level}</span>
                                            <span>{c.enrollments_count} enrolled</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TenantLayout>
    );
}
