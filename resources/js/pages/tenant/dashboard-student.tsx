import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    BookOpen,
    Award,
    CalendarCheck,
    PlayCircle,
    ChevronRight,
    Clock,
    GraduationCap,
    FileText,
    MapPin,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Download,
    Sparkles,
} from 'lucide-react';

interface ClassEnrollment {
    id: number;
    roll_number?: string;
    class_section: {
        id: number;
        name: string;
        school_class: {
            id: number;
            name: string;
        };
    };
    academic_year: {
        id: number;
        name: string;
    };
}

interface CourseEnrollmentItem {
    id: number;
    progress_percent: number;
    status: string;
    course: {
        id: number;
        title: string;
        slug: string;
        level: string;
        category?: {
            name: string;
        };
        instructor?: {
            name: string;
        };
    };
}

interface GradeItem {
    id: number;
    score: number;
    feedback?: string;
    created_at: string;
    assessment: {
        id: number;
        title: string;
        type: string;
        max_score: number;
        subject?: {
            name: string;
        };
    };
}

interface StudentSubjectItem {
    id: number;
    name: string;
    code?: string;
    type?: string;
    curriculum_status?: string;
    units_count?: number;
    topics_count?: number;
    subject_teachers?: Array<{
        teacher: {
            name: string;
            email: string;
        };
    }>;
}

interface TimetableItem {
    id: number;
    start_time: string;
    end_time: string;
    period_name?: string;
    room?: string;
    subject: {
        name: string;
        code?: string;
    };
    teacher?: {
        name: string;
    };
}

interface FeeSummary {
    total_outstanding?: number;
    totalOutstanding?: number;
    next_due_date?: string | null;
    nextDueDate?: string | null;
    currency?: string;
    unpaid_count?: number;
    unpaidCount?: number;
    recent_invoices?: Array<{
        id: number;
        invoice_number: string;
        billing_month: string;
        total_amount: number;
        paid_amount: number;
        status: string;
        due_date: string;
    }>;
    recentInvoices?: Array<{
        id: number;
        invoice_number: string;
        billing_month: string;
        total_amount: number;
        paid_amount: number;
        status: string;
        due_date: string;
    }>;
}

interface StudentDashboardProps {
    classEnrollment?: ClassEnrollment | null;
    mySubjects?: StudentSubjectItem[];
    todayTimetable?: TimetableItem[];
    courseEnrollments?: CourseEnrollmentItem[];
    myGrades?: GradeItem[];
    attendanceRate?: number;
    feeSummary?: FeeSummary | null;
}

export default function StudentDashboard({
    classEnrollment,
    mySubjects = [],
    todayTimetable = [],
    courseEnrollments = [],
    myGrades = [],
    attendanceRate = 100,
    feeSummary,
}: StudentDashboardProps) {
    const totalOutstanding = Number(feeSummary?.total_outstanding ?? feeSummary?.totalOutstanding ?? 0);
    const nextDueDate = feeSummary?.next_due_date || feeSummary?.nextDueDate || null;
    const unpaidCount = Number(feeSummary?.unpaid_count ?? feeSummary?.unpaidCount ?? 0);
    const recentInvoices = (feeSummary?.recent_invoices ?? feeSummary?.recentInvoices ?? []) as Array<{
        id: number;
        invoice_number: string;
        billing_month: string;
        total_amount: number;
        paid_amount: number;
        status: string;
        due_date: string;
    }>;
    const currency = feeSummary?.currency || 'USD';

    return (
        <TenantLayout title="Student Learning Hub">
            <Head title="Student Dashboard" />

            {/* Academic Class & Attendance Overview */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Enrolled Classroom */}
                <div className="flex flex-col justify-between rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-indigo-50 p-6 shadow-xs md:col-span-2 dark:border-[#26364D] dark:bg-gradient-to-r dark:from-[#111B2C] dark:via-[#131F33] dark:to-[#171A34]">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-700 dark:text-[#C084FC]">
                                Official Classroom Enrollment
                            </span>
                            <span className="flex size-2 rounded-full bg-[#22C55E] animate-pulse" />
                        </div>
                        {classEnrollment ? (
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                                    {classEnrollment.class_section?.school_class?.name || 'Class'} &bull; {classEnrollment.class_section?.name || 'Section'}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                    Academic Session: {classEnrollment.academic_year?.name || 'Current Session'}
                                    {classEnrollment.roll_number && (
                                        <span className="ml-3 rounded-md border border-[#A020F0]/30 bg-[#A020F0]/15 px-2 py-0.5 font-mono text-xs font-semibold text-[#C084FC]">
                                            Roll #{classEnrollment.roll_number}
                                        </span>
                                    )}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                                    No Classroom Assigned
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                    Contact your academic registrar to be assigned to your class section.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs dark:border-[#26364D]">
                        <span className="text-slate-500 dark:text-[#94A3B8]">
                            Academic Status: <strong className="text-[#22C55E]">Enrolled & Active</strong>
                        </span>
                        <Link
                            href="/school/grades"
                            className="flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 dark:text-[#C084FC] dark:hover:underline"
                        >
                            <span>View Gradebook</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>
                </div>

                {/* Attendance Metric */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-[#26364D] dark:bg-[#111B2C]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-[#94A3B8]">
                            Attendance Score
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]">
                            <CalendarCheck className="size-4.5" />
                        </div>
                    </div>

                    <div className="my-4">
                        <div className="mb-2 text-3xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                            {attendanceRate}%
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#162338]">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-[#22C55E] to-[#22C1D6] transition-all duration-500"
                                style={{
                                    width: `${Math.min(attendanceRate, 100)}%`,
                                }}
                            />
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        {attendanceRate >= 85
                            ? 'Excellent attendance record!'
                            : 'Minimum required threshold is 75%.'}
                    </p>
                </div>
            </div>

            {/* Student Fees & Balance Widget */}
            {feeSummary && (
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#26364D] dark:bg-[#111B2C]">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3 dark:border-[#26364D]">
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex size-10 items-center justify-center rounded-xl border ${
                                    totalOutstanding > 0
                                        ? 'border-[#F5A623]/30 bg-[#F5A623]/15 text-[#F5A623]'
                                        : 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]'
                                }`}
                            >
                                <CreditCard className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                                    My Fees & Challan Status
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                                    {totalOutstanding > 0
                                        ? `${unpaidCount} pending invoice(s) requiring settlement`
                                        : 'All term fees and charges are fully settled!'}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/school/my-fees"
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#7C3AED] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:brightness-110"
                        >
                            <span>Open Fees Portal</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-[#26364D]/60 dark:bg-[#0D1423]/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                                Total Outstanding Balance
                            </span>
                            <div
                                className={`mt-1 text-2xl font-black ${
                                    totalOutstanding > 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-[#22C55E]'
                                }`}
                            >
                                {currency} {totalOutstanding.toLocaleString()}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-[#26364D]/60 dark:bg-[#0D1423]/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                                Next Due Date
                            </span>
                            <div className="mt-1 text-lg font-bold text-slate-800 dark:text-[#F8FAFC]">
                                {nextDueDate || 'No upcoming due date'}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-[#26364D]/60 dark:bg-[#0D1423]/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                                Recent Challan
                            </span>
                            {recentInvoices.length > 0 ? (
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-[#C084FC]">
                                        {recentInvoices[0].invoice_number}
                                    </span>
                                    <a
                                        href={`/school/fees/invoices/${recentInvoices[0].id}/download`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-purple-600 dark:text-[#94A3B8] dark:hover:text-[#C084FC]"
                                    >
                                        <Download className="size-3" />
                                        <span>Download</span>
                                    </a>
                                </div>
                            ) : (
                                <p className="mt-1 text-xs text-slate-400 dark:text-[#64748B]">No invoices generated yet</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Schedule Banner */}
            {todayTimetable.length > 0 && (
                <div className="mb-6 rounded-2xl border border-purple-200 bg-white p-5 shadow-xs dark:border-[#26364D] dark:bg-[#111B2C]">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-[#26364D]">
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-purple-600 dark:text-[#C084FC]" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                                Today's Class Schedule
                            </h3>
                        </div>
                        <Link
                            href="/school/timetable"
                            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-[#C084FC] dark:hover:underline"
                        >
                            <span>Full Timetable</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {todayTimetable.map((period) => (
                            <div
                                key={period.id}
                                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-[#26364D]/60 dark:bg-[#0D1423]/60"
                            >
                                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-purple-600 dark:text-[#C084FC]">
                                    <span>
                                        {period.start_time?.substring(0, 5) || ''} &ndash; {period.end_time?.substring(0, 5) || ''}
                                    </span>
                                    {period.room && (
                                        <span className="flex items-center gap-0.5 rounded border border-[#26364D] bg-[#162338] px-1.5 py-0.2 text-[10px] text-slate-700 dark:text-[#94A3B8]">
                                            <MapPin className="size-2.5" />
                                            {period.room}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 font-bold text-slate-900 dark:text-[#F8FAFC]">
                                    {period.subject?.name || 'Class Subject'}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-[#94A3B8]">
                                    {period.teacher?.name || 'Assigned Instructor'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* My Academic Subjects Section */}
            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="size-5 text-purple-600 dark:text-[#C084FC]" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                            My Enrolled Subjects
                        </h3>
                    </div>
                    <Link
                        href="/school/subjects"
                        className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-[#C084FC] dark:hover:underline"
                    >
                        <span>View All Subjects</span>
                        <ChevronRight className="size-3.5" />
                    </Link>
                </div>

                {mySubjects.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-[#26364D] dark:bg-[#111B2C]">
                        <p className="text-xs text-slate-500 dark:text-[#64748B]">
                            No academic subjects assigned to your class section yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {mySubjects.map((subj) => {
                            const teacher = subj.subject_teachers?.[0]?.teacher;
                            return (
                                <div
                                    key={subj.id}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-purple-300 dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-purple-500/40"
                                >
                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-[11px]">
                                            <span className="font-mono font-bold text-purple-600 dark:text-[#C084FC]">
                                                {subj.code || 'ACADEMIC'}
                                            </span>
                                            <span className="rounded-full border border-[#26364D] bg-[#162338] px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-[#94A3B8]">
                                                {subj.type || 'core'}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                                            {subj.name}
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                            Instructor: {teacher?.name || 'TBA'}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-[#26364D]">
                                        <span className="text-[11px] text-slate-400 dark:text-[#64748B]">
                                            {subj.topics_count || 0} topics in syllabus
                                        </span>
                                        <Link
                                            href={`/school/subjects/${subj.id}/curriculum`}
                                            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-[#C084FC]"
                                        >
                                            <FileText className="size-3" />
                                            <span>Syllabus</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Online Courses Enrolled */}
            <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PlayCircle className="size-5 text-[#22C1D6]" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                            Active Online Courses
                        </h3>
                    </div>
                    <Link
                        href="/learning/courses"
                        className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-[#C084FC] dark:hover:underline"
                    >
                        <span>Explore Catalog</span>
                        <ChevronRight className="size-3.5" />
                    </Link>
                </div>

                {courseEnrollments.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-[#26364D] dark:bg-[#111B2C]">
                        <p className="mb-4 text-sm text-slate-500 dark:text-[#94A3B8]">
                            You are not enrolled in any online courses yet.
                        </p>
                        <Link
                            href="/learning/courses"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#7C3AED] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:brightness-110"
                        >
                            <BookOpen className="size-4" />
                            <span>Browse Available Courses</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {courseEnrollments.map((enr) => (
                            <div
                                key={enr.id}
                                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-purple-300 dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-purple-500/40"
                            >
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8]">
                                        <span className="font-semibold text-purple-600 dark:text-[#C084FC]">
                                            {enr.course.category?.name || 'General'}
                                        </span>
                                        <span className="capitalize">{enr.course.level}</span>
                                    </div>
                                    <h4 className="line-clamp-2 text-sm font-bold text-slate-900 transition group-hover:text-purple-600 dark:text-[#F8FAFC] dark:group-hover:text-[#C084FC]">
                                        {enr.course.title}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                                        By {enr.course.instructor?.name || 'Faculty Member'}
                                    </p>
                                </div>

                                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-[#26364D]">
                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 dark:text-[#94A3B8]">
                                            Progress
                                        </span>
                                        <span className="font-bold text-purple-600 dark:text-[#C084FC]">
                                            {enr.progress_percent}%
                                        </span>
                                    </div>
                                    <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#162338]">
                                        <div
                                            className="h-1.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#22C1D6]"
                                            style={{
                                                width: `${enr.progress_percent}%`,
                                            }}
                                        />
                                    </div>

                                    <Link
                                        href={`/learning/courses/${enr.course.slug}`}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition group-hover:border-transparent group-hover:bg-[#A020F0] group-hover:text-white dark:border-[#26364D] dark:bg-[#0D1423] dark:text-[#F8FAFC]"
                                    >
                                        <PlayCircle className="size-3.5" />
                                        <span>
                                            {enr.progress_percent > 0
                                                ? 'Continue Lesson'
                                                : 'Start Course'}
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Academic Grades */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#26364D] dark:bg-[#111B2C]">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#26364D]">
                    <div className="flex items-center gap-2">
                        <Award className="size-5 text-[#F5A623]" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                            Recent Examination & Assessment Results
                        </h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-[#26364D] dark:text-[#94A3B8]">
                                <th className="pb-3 font-semibold">Subject</th>
                                <th className="pb-3 font-semibold">Assessment Title</th>
                                <th className="pb-3 font-semibold">Type</th>
                                <th className="pb-3 font-semibold">Score</th>
                                <th className="pb-3 font-semibold">Instructor Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#26364D]/60">
                            {myGrades.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-[#64748B]">
                                        No assessment grades recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                myGrades.map((grade) => (
                                    <tr
                                        key={grade.id}
                                        className="transition hover:bg-slate-50 dark:hover:bg-[#0D1423]/60"
                                    >
                                        <td className="py-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                                            {grade.assessment?.subject?.name || 'General'}
                                        </td>
                                        <td className="py-3 text-slate-600 dark:text-[#94A3B8]">
                                            {grade.assessment?.title || 'Assessment'}
                                        </td>
                                        <td className="py-3 capitalize text-slate-500 dark:text-[#64748B]">
                                            {grade.assessment?.type || 'Exam'}
                                        </td>
                                        <td className="py-3 font-mono font-black text-purple-600 dark:text-[#C084FC]">
                                            {grade.score} / {grade.assessment?.max_score ?? 100}
                                        </td>
                                        <td className="py-3 text-slate-500 dark:text-[#94A3B8]">
                                            {grade.feedback || 'Good work!'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TenantLayout>
    );
}
