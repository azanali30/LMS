import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    Users,
    Award,
    CalendarCheck,
    HeartHandshake,
    CreditCard,
    ChevronRight,
    GraduationCap,
    Clock,
    Sparkles,
} from 'lucide-react';

interface Student {
    id: number;
    name: string;
    email: string;
}

interface LinkedStudent {
    id: number;
    relationship: string;
    student: Student;
}

interface ChildEnrollment {
    id: number;
    roll_number?: string;
    student: Student;
    class_section: {
        id: number;
        name: string;
        school_class: {
            name: string;
        };
    };
}

interface ChildGrade {
    id: number;
    score: number;
    feedback?: string;
    student: Student;
    assessment: {
        title: string;
        max_score: number;
        subject?: {
            name: string;
        };
    };
}

interface ChildFeeSummary {
    total_outstanding: number;
    unpaid_count: number;
    next_due_date: string | null;
    currency: string;
}

interface ParentDashboardProps {
    linkedStudents?: LinkedStudent[];
    childrenEnrollments?: ChildEnrollment[];
    childrenGrades?: ChildGrade[];
    childrenFees?: Record<number, ChildFeeSummary>;
}

export default function ParentDashboard({
    linkedStudents: _linkedStudents = [],
    childrenEnrollments = [],
    childrenGrades = [],
    childrenFees = {},
}: ParentDashboardProps) {
    return (
        <TenantLayout title="Parent & Guardian Portal">
            <Head title="Parent Portal" />

            {/* Family Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                            Family Academic Portal
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:border-[#A020F0]/30 dark:bg-[#A020F0]/15 dark:text-[#C084FC]">
                            <HeartHandshake className="size-3 text-[#C084FC]" />
                            <span>Linked Family</span>
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                        Track your children's attendance, examination progress, and institutional fee status
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-[#26364D] dark:bg-[#111B2C] dark:text-[#F8FAFC]">
                        {childrenEnrollments.length} Child{childrenEnrollments.length === 1 ? '' : 'ren'} Linked
                    </span>
                </div>
            </div>

            {/* Linked Children Cards */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {childrenEnrollments.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-[#26364D] dark:bg-[#111B2C]">
                        <Users className="mx-auto mb-2 size-8 text-slate-400 dark:text-[#64748B]" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-[#F8FAFC]">
                            No children are currently linked to your parent account.
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-[#94A3B8]">
                            Contact your school administration office with your student's admission or roll number to link your guardian profile.
                        </p>
                    </div>
                ) : (
                    childrenEnrollments.map((enr) => {
                        const childFee = childrenFees[enr.student.id];
                        const hasDue = childFee && childFee.total_outstanding > 0;

                        return (
                            <div
                                key={enr.id}
                                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition duration-200 hover:border-slate-300 dark:border-[#26364D] dark:bg-[#111B2C] dark:hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(160,32,240,0.12)]"
                            >
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#A020F0] to-[#6366F1] text-sm font-black text-white shadow-xs">
                                            {enr.student.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <span className="rounded-full border border-[#22C55E]/30 bg-[#22C55E]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#22C55E]">
                                            Enrolled &bull; Active
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                                        {enr.student.name}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                                        {enr.student.email}
                                    </p>

                                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-[#26364D]/60 dark:bg-[#0D1423]/60">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                                            Current Classroom:
                                        </div>
                                        <div className="mt-0.5 font-bold text-purple-700 dark:text-[#C084FC]">
                                            {enr.class_section.school_class.name}{' '}
                                            &bull; Section {enr.class_section.name}
                                        </div>
                                    </div>

                                    {childFee && (
                                        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-[#26364D]/60 dark:bg-[#0D1423]/60">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                                                    Fee Balance
                                                </div>
                                                <div
                                                    className={`font-black ${
                                                        hasDue
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : 'text-[#22C55E]'
                                                    }`}
                                                >
                                                    {hasDue
                                                        ? `${childFee.currency} ${childFee.total_outstanding.toLocaleString()} Due`
                                                        : 'Cleared & Settled'}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/school/my-fees?student_id=${enr.student.id}`}
                                                className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 dark:border-[#A020F0]/30 dark:bg-[#A020F0]/15 dark:text-[#C084FC]"
                                            >
                                                <CreditCard className="size-3" />
                                                <span>Challan</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-[#26364D]">
                                    <Link
                                        href={`/school/attendance?section_id=${enr.class_section.id}`}
                                        className="flex items-center gap-1 font-semibold text-slate-500 transition hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
                                    >
                                        <CalendarCheck className="size-3.5 text-[#22C55E]" />
                                        <span>Attendance</span>
                                    </Link>
                                    <Link
                                        href={`/school/my-fees?student_id=${enr.student.id}`}
                                        className="flex items-center gap-1 font-semibold text-slate-500 transition hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
                                    >
                                        <CreditCard className="size-3.5 text-[#22C1D6]" />
                                        <span>Fees</span>
                                    </Link>
                                    <Link
                                        href="/school/grades"
                                        className="flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 dark:text-[#C084FC]"
                                    >
                                        <Award className="size-3.5" />
                                        <span>Grades</span>
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Child Assessment Results */}
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
                                <th className="pb-3 font-semibold">Student Name</th>
                                <th className="pb-3 font-semibold">Subject</th>
                                <th className="pb-3 font-semibold">Assessment</th>
                                <th className="pb-3 font-semibold">Score</th>
                                <th className="pb-3 font-semibold">Teacher Feedback</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#26364D]/60">
                            {childrenGrades.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-6 text-center text-slate-500 dark:text-[#64748B]"
                                    >
                                        No assessment records available for your linked children yet.
                                    </td>
                                </tr>
                            ) : (
                                childrenGrades.map((g) => (
                                    <tr
                                        key={g.id}
                                        className="transition hover:bg-slate-50 dark:hover:bg-[#0D1423]/60"
                                    >
                                        <td className="py-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                                            {g.student.name}
                                        </td>
                                        <td className="py-3 text-slate-600 dark:text-[#94A3B8]">
                                            {g.assessment.subject?.name || 'General'}
                                        </td>
                                        <td className="py-3 text-slate-600 dark:text-[#94A3B8]">
                                            {g.assessment.title}
                                        </td>
                                        <td className="py-3 font-mono font-black text-purple-600 dark:text-[#C084FC]">
                                            {g.score} / {g.assessment.max_score}
                                        </td>
                                        <td className="py-3 text-slate-500 dark:text-[#94A3B8]">
                                            {g.feedback || 'In good standing.'}
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
