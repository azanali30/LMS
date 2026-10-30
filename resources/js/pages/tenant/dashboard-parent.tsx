import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/layouts/tenant-layout';
import { Users, Award, CalendarCheck, HeartHandshake, CreditCard } from 'lucide-react';

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

            <div className="mb-8">
                <div className="mb-1 flex items-center gap-2">
                    <HeartHandshake className="size-5 text-purple-400" />
                    <h2 className="text-xl font-bold tracking-tight text-white">
                        Family Academic Dashboard
                    </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track your children's attendance, academic performance, and
                    teacher notes across their classes
                </p>
            </div>

            {/* Linked Children Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {childrenEnrollments.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                        <Users className="mx-auto mb-2 size-8 text-slate-400 dark:text-slate-500" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            No children are currently linked to your parent
                            account.
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            Contact your school administration office with your
                            student's roll number to link accounts.
                        </p>
                    </div>
                ) : (
                    childrenEnrollments.map((enr) => {
                        const childFee = childrenFees[enr.student.id];
                        return (
                            <div
                                key={enr.id}
                                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl"
                            >
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-sm font-bold text-white">
                                            {enr.student.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            Enrolled
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {enr.student.name}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        {enr.student.email}
                                    </p>

                                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-900/60">
                                        <div className="text-slate-500 dark:text-slate-400">
                                            Current Classroom:
                                        </div>
                                        <div className="mt-0.5 font-semibold text-purple-700 dark:text-purple-300">
                                            {enr.class_section.school_class.name}{' '}
                                            &bull; {enr.class_section.name}
                                        </div>
                                    </div>

                                    {childFee && (
                                        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-900/60">
                                            <div>
                                                <div className="text-[10px] font-semibold uppercase text-slate-400">
                                                    Fee Balance
                                                </div>
                                                <div
                                                    className={`font-bold ${
                                                        childFee.total_outstanding > 0
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : 'text-emerald-600 dark:text-emerald-400'
                                                    }`}
                                                >
                                                    {childFee.total_outstanding > 0
                                                        ? `${childFee.currency} ${childFee.total_outstanding.toLocaleString()} Due`
                                                        : 'Cleared'}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/school/my-fees?student_id=${enr.student.id}`}
                                                className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-300"
                                            >
                                                <CreditCard className="size-3" />
                                                <span>Challan</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800/80">
                                    <Link
                                        href={`/school/attendance?section_id=${enr.class_section.id}`}
                                        className="flex items-center gap-1 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    >
                                        <CalendarCheck className="size-3.5 text-purple-600 dark:text-purple-400" />
                                        <span>Attendance</span>
                                    </Link>
                                    <Link
                                        href={`/school/my-fees?student_id=${enr.student.id}`}
                                        className="flex items-center gap-1 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    >
                                        <CreditCard className="size-3.5 text-purple-600 dark:text-purple-400" />
                                        <span>Fees</span>
                                    </Link>
                                    <Link
                                        href="/school/grades"
                                        className="flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Award className="size-5 text-amber-500 dark:text-amber-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Recent Examination Results
                        </h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <th className="pb-3 font-semibold">
                                    Student Name
                                </th>
                                <th className="pb-3 font-semibold">Subject</th>
                                <th className="pb-3 font-semibold">
                                    Assessment
                                </th>
                                <th className="pb-3 font-semibold">Score</th>
                                <th className="pb-3 font-semibold">
                                    Teacher Feedback
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {childrenGrades.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-6 text-center text-slate-500"
                                    >
                                        No assessment records available for your
                                        linked children yet.
                                    </td>
                                </tr>
                            ) : (
                                childrenGrades.map((g) => (
                                    <tr
                                        key={g.id}
                                        className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
                                    >
                                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                                            {g.student.name}
                                        </td>
                                        <td className="py-3 text-slate-600 dark:text-slate-300">
                                            {g.assessment.subject?.name ||
                                                'General'}
                                        </td>
                                        <td className="py-3 text-slate-600 dark:text-slate-300">
                                            {g.assessment.title}
                                        </td>
                                        <td className="py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                                            {g.score} / {g.assessment.max_score}
                                        </td>
                                        <td className="py-3 text-slate-500 dark:text-slate-400">
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
