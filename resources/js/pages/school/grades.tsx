import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    Award,
    Plus,
    Save,
    Loader2,
    Calendar,
    FileSpreadsheet,
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Clock,
    Sparkles,
    BarChart3,
    FileText,
} from 'lucide-react';

interface ClassSection {
    id: number;
    name: string;
    school_class?: {
        id: number;
        name: string;
    };
    schoolClass?: {
        id: number;
        name: string;
    };
}

interface Subject {
    id: number;
    name: string;
    code?: string;
}

interface AcademicTerm {
    id: number;
    name: string;
    is_current?: boolean;
    start_date?: string;
    end_date?: string;
}

interface AssessmentItem {
    id: number;
    title: string;
    type: string;
    max_score: number;
    due_date?: string;
    class_section: ClassSection;
    subject: Subject;
    academic_term: AcademicTerm;
}

interface StudentEnrollment {
    id: number;
    roll_number?: string;
    student: {
        id: number;
        name: string;
        email: string;
    };
}

interface GradeRecord {
    id: number;
    score: number;
    feedback?: string;
}

interface StudentGradeItem {
    id: number;
    score: number;
    feedback?: string;
    assessment: {
        id: number;
        title: string;
        type: string;
        max_score: number;
        due_date?: string;
        subject: {
            name: string;
            code?: string;
        };
        academic_term?: {
            name: string;
        };
        class_section?: {
            name: string;
            school_class?: {
                name: string;
            };
            schoolClass?: {
                name: string;
            };
        };
    };
    created_at: string;
}

interface GradesProps {
    isStudent?: boolean;
    canManage?: boolean;
    studentEnrollment?: {
        class_section: {
            name: string;
            school_class?: {
                name: string;
            };
            schoolClass?: {
                name: string;
            };
        };
    } | null;
    studentGrades?: {
        data: StudentGradeItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    assessments?: {
        data: AssessmentItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    sections?: ClassSection[];
    subjects?: Subject[];
    terms?: AcademicTerm[];
    currentTermId?: number | null;
    selectedAssessment?: AssessmentItem | null;
    students?: StudentEnrollment[];
    grades?: Record<string, GradeRecord>;
}

export default function GradesPage({
    isStudent = false,
    canManage = true,
    studentEnrollment,
    studentGrades,
    assessments = { data: [], links: [] },
    sections = [],
    subjects = [],
    terms = [],
    currentTermId,
    selectedAssessment,
    students = [],
    grades = {},
}: GradesProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Identify current running academic term
    const activeTerm =
        terms.find((t) => t.id === currentTermId) ||
        terms.find((t) => t.is_current) ||
        terms[0];

    // Grading scores & feedback state
    const [scores, setScores] = useState<
        Record<number, { score: string; feedback: string }>
    >({});

    useEffect(() => {
        if (isStudent) return;
        const initial: Record<number, { score: string; feedback: string }> = {};
        students.forEach((s) => {
            const grade = grades[s.student.id];
            initial[s.student.id] = {
                score: grade ? grade.score.toString() : '',
                feedback: grade ? grade.feedback || '' : '',
            };
        });
        setScores(initial);
    }, [students, grades, isStudent]);

    const assessmentForm = useForm({
        title: '',
        type: 'exam',
        class_section_id: sections[0]?.id || 0,
        subject_id: subjects[0]?.id || 0,
        academic_term_id: activeTerm?.id || 0,
        max_score: 100,
        due_date: '',
    });

    // Keep activeTerm auto-filled if terms load or if not yet set
    useEffect(() => {
        if (activeTerm && (!assessmentForm.data.academic_term_id || assessmentForm.data.academic_term_id === 0)) {
            assessmentForm.setData('academic_term_id', activeTerm.id);
        }
    }, [activeTerm, assessmentForm.data.academic_term_id]);

    const handleOpenCreateModal = () => {
        if (activeTerm) {
            assessmentForm.setData((prev) => ({
                ...prev,
                academic_term_id: activeTerm.id,
                class_section_id: prev.class_section_id || sections[0]?.id || 0,
                subject_id: prev.subject_id || subjects[0]?.id || 0,
            }));
        }
        setShowCreateModal(true);
    };

    const submitCreateAssessment = (e: React.FormEvent) => {
        e.preventDefault();
        assessmentForm.post('/school/grades/assessments', {
            onSuccess: () => {
                setShowCreateModal(false);
                assessmentForm.reset();
                if (activeTerm) {
                    assessmentForm.setData('academic_term_id', activeTerm.id);
                }
            },
        });
    };

    const submitGrades = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssessment) return;

        const payload = {
            grades: students.map((s) => ({
                student_id: s.student.id,
                score: parseFloat(scores[s.student.id]?.score) || 0,
                feedback: scores[s.student.id]?.feedback || null,
            })),
        };

        router.post(`/school/grades/${selectedAssessment.id}`, payload);
    };

    const getGradeLetter = (pct: number) => {
        if (pct >= 90) return { letter: 'A+', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' };
        if (pct >= 80) return { letter: 'A', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' };
        if (pct >= 70) return { letter: 'B', color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20' };
        if (pct >= 60) return { letter: 'C', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' };
        if (pct >= 50) return { letter: 'D', color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' };
        return { letter: 'F', color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' };
    };

    // STUDENT VIEW
    if (isStudent) {
        const gradeList = studentGrades?.data || [];
        const totalGraded = gradeList.length;
        
        let avgScore = 0;
        let highestScore = 0;
        if (totalGraded > 0) {
            let sumPct = 0;
            gradeList.forEach((g) => {
                const max = g.assessment?.max_score || 100;
                const pct = Math.round((g.score / max) * 100);
                sumPct += pct;
                if (pct > highestScore) highestScore = pct;
            });
            avgScore = Math.round(sumPct / totalGraded);
        }

        const className = studentEnrollment?.class_section?.school_class?.name || studentEnrollment?.class_section?.schoolClass?.name || 'Class Cohort';
        const sectionName = studentEnrollment?.class_section?.name || 'Enrolled Section';

        return (
            <TenantLayout title="Assessments & Grades">
                <Head title="My Academic Grades" />

                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Award className="size-5 text-amber-500 dark:text-amber-400" />
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                My Academic Gradebook & Results
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            View official examination scores, coursework marks, and qualitative teacher feedback
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-600/10 dark:text-purple-300">
                        <GraduationCap className="size-4" />
                        <span>{className} — {sectionName}</span>
                    </div>
                </div>

                {/* Performance Highlights */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Graded Exams
                            </span>
                            <FileText className="size-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                            {totalGraded}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            Completed assessments
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Overall Average
                            </span>
                            <BarChart3 className="size-4 text-sky-500" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-sky-600 dark:text-sky-400">
                            {avgScore}%
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            Across all curriculum
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Top Score
                            </span>
                            <Sparkles className="size-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {highestScore}%
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            Personal highest record
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Academic Status
                            </span>
                            <CheckCircle2 className="size-4 text-purple-500" />
                        </div>
                        <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
                            {avgScore >= 50 ? 'Good Standing' : 'Needs Review'}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            Active session evaluation
                        </div>
                    </div>
                </div>

                {/* Grades Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="size-4 text-purple-600 dark:text-purple-400" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Student Marks & Evaluation Statement
                            </h3>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Showing {gradeList.length} graded results
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <th className="pb-3 font-semibold">Assessment Title</th>
                                    <th className="pb-3 font-semibold">Subject</th>
                                    <th className="pb-3 font-semibold">Type</th>
                                    <th className="pb-3 font-semibold">Date</th>
                                    <th className="pb-3 font-semibold">Marks Obtained</th>
                                    <th className="pb-3 font-semibold">Grade</th>
                                    <th className="pb-3 font-semibold">Instructor Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {gradeList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                                            No graded assessments published yet for your account.
                                        </td>
                                    </tr>
                                ) : (
                                    gradeList.map((item) => {
                                        const max = item.assessment?.max_score || 100;
                                        const pct = Math.round((item.score / max) * 100);
                                        const gradeBadge = getGradeLetter(pct);

                                        return (
                                            <tr key={item.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                                <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                                                    {item.assessment?.title || 'Assessment'}
                                                </td>
                                                <td className="py-3.5 text-slate-600 dark:text-slate-300">
                                                    <span className="inline-flex items-center gap-1">
                                                        <BookOpen className="size-3 text-purple-500" />
                                                        {item.assessment?.subject?.name || 'General'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5">
                                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                                        {item.assessment?.type || 'Exam'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 font-mono text-slate-500 dark:text-slate-400">
                                                    {item.assessment?.due_date || '—'}
                                                </td>
                                                <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                                                    {item.score} <span className="font-normal text-slate-400">/ {max}</span>
                                                </td>
                                                <td className="py-3.5">
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${gradeBadge.color}`}>
                                                        {gradeBadge.letter} ({pct}%)
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-slate-600 dark:text-slate-400">
                                                    {item.feedback ? (
                                                        <span className="italic">"{item.feedback}"</span>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500">No feedback</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {studentGrades?.links && studentGrades.links.length > 3 && (
                        <div className="mt-6 flex justify-center gap-1 border-t border-slate-100 pt-4 dark:border-slate-800">
                            {studentGrades.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        link.active
                                            ? 'bg-purple-600 text-white'
                                            : !link.url
                                            ? 'cursor-not-allowed opacity-40 text-slate-400'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </TenantLayout>
        );
    }

    // TEACHER / ADMIN / OWNER VIEW
    return (
        <TenantLayout title="Assessments & Grading">
            <Head title="Grading Register" />

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <Award className="size-5 text-amber-500 dark:text-amber-400" />
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Academic Gradebook & Examination Results
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Create midterm exams, quizzes, or lab practicals and
                        input student marks with feedback
                    </p>
                </div>

                {canManage && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500"
                    >
                        <Plus className="size-3.5" />
                        <span>Create Assessment</span>
                    </button>
                )}
            </div>

            {/* Create Assessment Modal */}
            {canManage && showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl zoom-in-95 dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                New Academic Assessment
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>

                        <form
                            onSubmit={submitCreateAssessment}
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Midterm Examination 2026"
                                    value={assessmentForm.data.title}
                                    onChange={(e) =>
                                        assessmentForm.setData(
                                            'title',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Type *
                                    </label>
                                    <select
                                        value={assessmentForm.data.type}
                                        onChange={(e) =>
                                            assessmentForm.setData(
                                                'type',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="exam">
                                            Official Examination
                                        </option>
                                        <option value="quiz">
                                            Weekly Quiz
                                        </option>
                                        <option value="assignment">
                                            Home Assignment
                                        </option>
                                        <option value="project">
                                            Term Project
                                        </option>
                                        <option value="practical">
                                            Lab Practical
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Max Score *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="1000"
                                        value={assessmentForm.data.max_score}
                                        onChange={(e) =>
                                            assessmentForm.setData(
                                                'max_score',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Classroom Section *
                                    </label>
                                    <select
                                        value={
                                            assessmentForm.data.class_section_id
                                        }
                                        onChange={(e) =>
                                            assessmentForm.setData(
                                                'class_section_id',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {sections.map((sec) => (
                                            <option key={sec.id} value={sec.id}>
                                                {sec.school_class?.name || sec.schoolClass?.name || 'Class'} — {sec.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Subject / Course *
                                    </label>
                                    <select
                                        value={assessmentForm.data.subject_id}
                                        onChange={(e) =>
                                            assessmentForm.setData(
                                                'subject_id',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {subjects.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                            Academic Term *
                                        </label>
                                        {activeTerm && (
                                            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                                                Active Term
                                            </span>
                                        )}
                                    </div>
                                    <select
                                        value={
                                            assessmentForm.data.academic_term_id ||
                                            activeTerm?.id ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            assessmentForm.setData(
                                                'academic_term_id',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {terms.length === 0 ? (
                                            <option value="">No academic terms configured</option>
                                        ) : (
                                            terms.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} {t.is_current ? '— (Current Active Term)' : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                        Due / Exam Date
                                    </label>
                                    <input
                                        type="date"
                                        value={assessmentForm.data.due_date}
                                        onChange={(e) =>
                                            assessmentForm.setData(
                                                'due_date',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assessmentForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    {assessmentForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        'Create Assessment'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assessment Selection Cards */}
            <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-white">
                        Select Assessment to Grade
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {assessments.data.map((ass) => {
                        const isSelected = selectedAssessment?.id === ass.id;
                        return (
                            <div
                                key={ass.id}
                                onClick={() =>
                                    router.get(
                                        '/school/grades',
                                        { assessment_id: ass.id },
                                        { preserveState: true },
                                    )
                                }
                                className={`cursor-pointer rounded-2xl border p-4 transition ${
                                    isSelected
                                        ? 'border-purple-500 bg-purple-50/50 shadow-md ring-1 ring-purple-500/20 dark:bg-purple-950/20'
                                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#0B1220] dark:hover:border-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                        {ass.type}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        Max: {ass.max_score} pts
                                    </span>
                                </div>

                                <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                                    {ass.title}
                                </h4>

                                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    {ass.subject.name} &bull;{' '}
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {ass.class_section.school_class?.name || (ass.class_section as any).schoolClass?.name || 'Class'} (
                                        {ass.class_section.name})
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="size-3 text-slate-400" />
                                        <span>{ass.due_date || 'No deadline'}</span>
                                    </div>
                                    <span>{ass.academic_term?.name || 'Current Term'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Student Mark Entry Matrix */}
            {selectedAssessment && (
                <form
                    onSubmit={submitGrades}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl"
                >
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                            <span className="text-xs font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400">
                                Grading Sheet
                            </span>
                            <h3 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                                {selectedAssessment.title} —{' '}
                                {selectedAssessment.subject.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Target:{' '}
                                {
                                    selectedAssessment.class_section
                                        .school_class?.name || (selectedAssessment.class_section as any).schoolClass?.name || 'Class'
                                }{' '}
                                ({selectedAssessment.class_section.name}) &bull;
                                Max Score: {selectedAssessment.max_score}
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500"
                        >
                            <Save className="size-4" />
                            <span>Save All Grades</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <th className="pb-3 font-semibold">
                                        Roll #
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Student
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Score (Max:{' '}
                                        {selectedAssessment.max_score})
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Qualitative Feedback
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {students.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-8 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No enrolled students found in this
                                            section.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
                                        >
                                            <td className="py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                                                {s.roll_number || '—'}
                                            </td>
                                            <td className="py-3 font-medium text-slate-900 dark:text-white">
                                                <div>{s.student.name}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                    {s.student.email}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={
                                                        selectedAssessment.max_score
                                                    }
                                                    step="0.5"
                                                    placeholder="0.0"
                                                    value={
                                                        scores[s.student.id]
                                                            ?.score ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        setScores((prev) => ({
                                                            ...prev,
                                                            [s.student.id]: {
                                                                ...prev[
                                                                    s.student.id
                                                                ],
                                                                score: e.target
                                                                    .value,
                                                            },
                                                        }))
                                                    }
                                                    className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                />
                                            </td>
                                            <td className="py-3">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Excellent conceptual grasp"
                                                    value={
                                                        scores[s.student.id]
                                                            ?.feedback ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        setScores((prev) => ({
                                                            ...prev,
                                                            [s.student.id]: {
                                                                ...prev[
                                                                    s.student.id
                                                                ],
                                                                feedback:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        }))
                                                    }
                                                    className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </form>
            )}
        </TenantLayout>
    );
}
