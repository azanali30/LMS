import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    BookOpen,
    Plus,
    UserCheck,
    Loader2,
    Eye,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    AlertTriangle,
    GraduationCap,
    Clock,
    Search,
    Filter,
    Layers,
    FileText,
    Calendar,
    UserX,
} from 'lucide-react';

interface TeacherAssignment {
    id: number;
    teacher: {
        id: number;
        name: string;
        email: string;
    };
    class_section: {
        id: number;
        name: string;
        school_class: {
            name: string;
        };
    };
}

interface ClassItem {
    id: number;
    name: string;
    code?: string;
}

interface SectionItem {
    id: number;
    name: string;
    school_class_id?: number;
    school_class?: {
        id: number;
        name: string;
    };
}

interface SubjectItem {
    id: number;
    name: string;
    code?: string;
    description?: string;
    type?: string;
    school_class_id?: number;
    school_class?: ClassItem;
    classes?: ClassItem[];
    academic_year?: {
        id: number;
        name: string;
    };
    curriculum_status?: string;
    units_count?: number;
    topics_count?: number;
    curriculum_progress?: number;
    curriculum_total_topics?: number;
    curriculum_completed_topics?: number;
    subject_teachers?: TeacherAssignment[];
    timetable_entries?: Array<{
        id: number;
        day_of_week: string;
        start_time: string;
        end_time: string;
        room?: string;
    }>;
}

interface OrgTeacher {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface SubjectsProps {
    isStudent?: boolean;
    isTeacher?: boolean;
    canManage?: boolean;
    enrollment?: {
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
        academic_year?: {
            id: number;
            name: string;
        };
    } | null;
    studentSubjects?: SubjectItem[];
    subjects: {
        data: SubjectItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    classes?: ClassItem[];
    sections?: SectionItem[];
    teachers?: OrgTeacher[];
    academicYear?: {
        id: number;
        name: string;
    } | null;
    academicYears?: Array<{ id: number; name: string }>;
    filters?: {
        search?: string;
        class_id?: string;
        teacher_id?: string;
        academic_year_id?: string;
    };
}

export default function SubjectsPage({
    isStudent = false,
    isTeacher = false,
    canManage = false,
    enrollment,
    studentSubjects = [],
    subjects,
    classes = [],
    sections = [],
    teachers = [],
    academicYear,
    academicYears = [],
    filters = {},
}: SubjectsProps) {
    const [showCreateSubject, setShowCreateSubject] = useState(false);
    const [viewingSubject, setViewingSubject] = useState<SubjectItem | null>(null);
    const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
    const [deletingSubject, setDeletingSubject] = useState<SubjectItem | null>(null);
    const [assignModalSubject, setAssignModalSubject] = useState<SubjectItem | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedClassFilter, setSelectedClassFilter] = useState(filters.class_id || '');
    const [selectedTeacherFilter, setSelectedTeacherFilter] = useState(filters.teacher_id || '');

    const handleApplyFilters = () => {
        router.get(
            '/school/subjects',
            {
                search: searchTerm || undefined,
                class_id: selectedClassFilter || undefined,
                teacher_id: selectedTeacherFilter || undefined,
            },
            { preserveState: true }
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedClassFilter('');
        setSelectedTeacherFilter('');
        router.get('/school/subjects', {}, { preserveState: true });
    };

    // Subject creation form
    const subjectForm = useForm({
        name: '',
        code: '',
        description: '',
        type: 'core',
        school_class_id: classes[0]?.id ? String(classes[0].id) : '',
        academic_year_id: academicYear?.id ? String(academicYear.id) : '',
        class_ids: [] as number[],
        teacher_id: '',
        class_section_id: '',
    });

    // Subject edit form
    const editSubjectForm = useForm({
        name: '',
        code: '',
        description: '',
        type: 'core',
        school_class_id: '',
        academic_year_id: '',
        class_ids: [] as number[],
    });

    const deleteSubjectForm = useForm({});
    const unassignForm = useForm({});

    // Assign Teacher form
    const assignForm = useForm({
        subject_id: 0,
        class_section_id: sections[0]?.id || 0,
        teacher_id: teachers[0]?.user.id || 0,
        academic_year_id: academicYear?.id || 0,
    });

    const submitSubject = (e: React.FormEvent) => {
        e.preventDefault();
        subjectForm.post('/school/subjects', {
            onSuccess: () => {
                setShowCreateSubject(false);
                subjectForm.reset();
            },
        });
    };

    const startEditingSubject = (subj: SubjectItem) => {
        setEditingSubject(subj);
        editSubjectForm.setData({
            name: subj.name,
            code: subj.code || '',
            description: subj.description || '',
            type: subj.type || 'core',
            school_class_id: subj.school_class_id ? String(subj.school_class_id) : '',
            academic_year_id: subj.academic_year?.id ? String(subj.academic_year.id) : '',
            class_ids: subj.classes ? subj.classes.map((c) => c.id) : [],
        });
    };

    const submitUpdateSubject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubject) return;
        editSubjectForm.put(`/school/subjects/${editingSubject.id}`, {
            onSuccess: () => {
                setEditingSubject(null);
            },
        });
    };

    const submitDeleteSubject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingSubject) return;
        deleteSubjectForm.delete(`/school/subjects/${deletingSubject.id}`, {
            onSuccess: () => {
                setDeletingSubject(null);
            },
        });
    };

    const openAssignModal = (subject: SubjectItem) => {
        setAssignModalSubject(subject);
        const availableSections = sections.filter(
            (sec) => !subject.school_class_id || sec.school_class_id === subject.school_class_id || (sec as any).school_class?.id === subject.school_class_id
        );
        assignForm.setData({
            subject_id: subject.id,
            class_section_id: availableSections[0]?.id || sections[0]?.id || 0,
            teacher_id: teachers[0]?.user.id || 0,
            academic_year_id: academicYear?.id || 0,
        });
    };

    const submitAssign = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post('/school/subjects/assign-teacher', {
            onSuccess: () => {
                setAssignModalSubject(null);
            },
        });
    };

    const submitUnassign = (assignmentId: number) => {
        if (!confirm('Are you sure you want to remove this faculty assignment?')) return;
        unassignForm.delete(`/school/subjects/assignments/${assignmentId}`, {
            onSuccess: () => {
                if (assignModalSubject) {
                    setAssignModalSubject({
                        ...assignModalSubject,
                        subject_teachers: assignModalSubject.subject_teachers?.filter(
                            (a) => a.id !== assignmentId
                        ),
                    });
                }
            },
        });
    };

    // ==========================================
    // 1. STUDENT VIEW
    // ==========================================
    if (isStudent) {
        return (
            <TenantLayout title="My Subjects">
                <Head title="My Academic Subjects" />

                {/* Student Header */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <BookOpen className="size-6 text-purple-600 dark:text-purple-400" />
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                My Academic Subjects & Syllabus
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            View active curriculum syllabi, assigned instructors, and lesson schedules for your enrolled class.
                        </p>
                    </div>

                    {enrollment && (
                        <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-800 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-300">
                            <GraduationCap className="size-4 text-purple-600 dark:text-purple-400" />
                            <span>
                                {enrollment.class_section.school_class.name} — {enrollment.class_section.name}
                            </span>
                            {enrollment.roll_number && (
                                <span className="ml-1 rounded-md bg-purple-200/80 px-1.5 py-0.5 text-[10px] font-bold text-purple-900 dark:bg-purple-800/60 dark:text-purple-100">
                                    Roll #{enrollment.roll_number}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Empty State: No Enrollment */}
                {!enrollment ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                            <AlertTriangle className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            No Active Class Enrollment
                        </h3>
                        <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                            Your school administration has not assigned you to an active class section yet. Please reach out to your school administrator to complete your student enrollment.
                        </p>
                    </div>
                ) : studentSubjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
                            <BookOpen className="size-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            No Subjects Assigned to Your Class Yet
                        </h3>
                        <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                            No curriculum courses have been registered for {enrollment.class_section.school_class.name} in the current session.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {studentSubjects.map((subj) => {
                            const teacher = subj.subject_teachers?.[0]?.teacher;
                            const hasCurriculum = (subj.curriculum_total_topics || 0) > 0;
                            const progress = subj.curriculum_progress || 0;

                            return (
                                <div
                                    key={subj.id}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl dark:hover:border-purple-800/50"
                                >
                                    <div>
                                        {/* Card Header */}
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                {subj.code || 'ACADEMIC'}
                                            </span>
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                                {subj.type ? subj.type.toUpperCase() : 'CORE'}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {subj.name}
                                        </h3>
                                        {subj.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                {subj.description}
                                            </p>
                                        )}

                                        {/* Assigned Instructor */}
                                        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800/80 dark:bg-slate-900/50">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-xs font-bold text-white shadow-xs">
                                                {teacher?.name ? teacher.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                    Instructor
                                                </div>
                                                <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                    {teacher?.name || 'TBA by School'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Syllabus Progress */}
                                        <div className="mt-4">
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    Syllabus Progress
                                                </span>
                                                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                                    {progress}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="mt-1 text-[11px] text-slate-400">
                                                {subj.curriculum_completed_topics || 0} of {subj.curriculum_total_topics || 0} topics completed
                                            </div>
                                        </div>

                                        {/* Timetable schedule preview */}
                                        {subj.timetable_entries && subj.timetable_entries.length > 0 && (
                                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/60 dark:bg-slate-900/40">
                                                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Clock className="size-3 text-purple-500" />
                                                    <span>Class Periods</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {subj.timetable_entries.slice(0, 3).map((tt) => (
                                                        <span
                                                            key={tt.id}
                                                            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                                        >
                                                            {tt.day_of_week.substring(0, 3).toUpperCase()} {tt.start_time.substring(0, 5)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action footer */}
                                    <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        <Link
                                            href={`/school/subjects/${subj.id}/curriculum`}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/20 transition hover:bg-purple-500"
                                        >
                                            <BookOpen className="size-3.5" />
                                            <span>Open Syllabus & Lessons</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </TenantLayout>
        );
    }

    // ==========================================
    // 2. ADMIN & TEACHER DIRECTORY VIEW
    // ==========================================
    return (
        <TenantLayout title="Curriculum & Subjects">
            <Head title="Subjects & Curriculum" />

            {/* Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <BookOpen className="size-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Academic Curriculum & Subject Directory
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manage class-specific subjects, build comprehensive academic syllabi, and allocate faculty to classroom sections.
                    </p>
                </div>

                {canManage && (
                    <button
                        onClick={() => setShowCreateSubject(true)}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500"
                    >
                        <Plus className="size-3.5" />
                        <span>Create Subject</span>
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                {/* Search */}
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by title, code, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                </div>

                {/* Class Filter */}
                <div className="w-44">
                    <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">All Grade Levels</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Teacher Filter */}
                <div className="w-48">
                    <select
                        value={selectedTeacherFilter}
                        onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">All Educators</option>
                        {teachers.map((t) => (
                            <option key={t.user.id} value={t.user.id}>
                                {t.user.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleApplyFilters}
                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-purple-500"
                    >
                        <Filter className="size-3.5" />
                        <span>Filter</span>
                    </button>
                    {(searchTerm || selectedClassFilter || selectedTeacherFilter) && (
                        <button
                            onClick={handleClearFilters}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Subjects Table Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <th className="pb-3 font-semibold uppercase tracking-wider">
                                    Subject Title & Code
                                </th>
                                <th className="pb-3 font-semibold uppercase tracking-wider">
                                    Grade / Class
                                </th>
                                <th className="pb-3 font-semibold uppercase tracking-wider">
                                    Curriculum Syllabus
                                </th>
                                <th className="pb-3 font-semibold uppercase tracking-wider">
                                    Faculty Allocation
                                </th>
                                <th className="pb-3 text-right font-semibold uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {subjects.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-400">
                                        No subjects found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                subjects.data.map((subj) => (
                                    <tr
                                        key={subj.id}
                                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                                    >
                                        {/* Subject Title & Code */}
                                        <td className="py-4 font-bold text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <span>{subj.name}</span>
                                                <span className="font-mono text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                                    [{subj.code || '—'}]
                                                </span>
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    {subj.type || 'core'}
                                                </span>
                                                {subj.description && (
                                                    <span className="line-clamp-1">{subj.description}</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Grade / Class */}
                                        <td className="py-4">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">
                                                {subj.school_class?.name || (subj.classes && subj.classes[0]?.name) || 'All Classes'}
                                            </div>
                                            {subj.classes && subj.classes.length > 1 && (
                                                <div className="text-[10px] text-purple-600 dark:text-purple-400">
                                                    +{subj.classes.length - 1} more classes
                                                </div>
                                            )}
                                        </td>

                                        {/* Curriculum Status */}
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        subj.curriculum_status === 'Published'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                            : subj.curriculum_status === 'Draft'
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {subj.curriculum_status}
                                                </span>
                                                {(subj.units_count || 0) > 0 && (
                                                    <span className="text-[11px] text-slate-400">
                                                        {subj.units_count} units • {subj.topics_count} topics
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Assigned Teachers */}
                                        <td className="py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {!subj.subject_teachers || subj.subject_teachers.length === 0 ? (
                                                    <span className="text-slate-400 italic">
                                                        No instructor assigned
                                                    </span>
                                                ) : (
                                                    subj.subject_teachers.map((st) => (
                                                        <span
                                                            key={st.id}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                                        >
                                                            <span className="font-medium text-purple-600 dark:text-purple-300">
                                                                {st.class_section?.school_class?.name || 'Class'} ({st.class_section?.name}):
                                                            </span>
                                                            <span className="text-slate-900 dark:text-white">
                                                                {st.teacher.name}
                                                            </span>
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/school/subjects/${subj.id}/curriculum`}
                                                    className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-300 dark:hover:bg-purple-900/40"
                                                    title="Syllabus Builder"
                                                >
                                                    <FileText className="size-3" />
                                                    <span>Curriculum</span>
                                                </Link>

                                                <button
                                                    onClick={() => setViewingSubject(subj)}
                                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                                    title="View Details"
                                                >
                                                    <Eye className="size-3.5 text-purple-600 dark:text-purple-400" />
                                                </button>

                                                {canManage && (
                                                    <>
                                                        <button
                                                            onClick={() => startEditingSubject(subj)}
                                                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                                            title="Edit Subject"
                                                        >
                                                            <Pencil className="size-3.5 text-sky-600 dark:text-sky-400" />
                                                        </button>

                                                        <button
                                                            onClick={() => openAssignModal(subj)}
                                                            className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-300 dark:hover:bg-purple-900/40"
                                                            title="Assign Faculty"
                                                        >
                                                            <UserCheck className="mr-1 inline size-3" />
                                                            Assign
                                                        </button>

                                                        <button
                                                            onClick={() => setDeletingSubject(subj)}
                                                            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                            title="Delete Subject"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {subjects.links && subjects.links.length > 3 && (
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div className="text-xs text-slate-500">
                            Showing page of registered subjects
                        </div>
                        <div className="flex gap-1">
                            {subjects.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`rounded-lg px-3 py-1 text-xs font-medium ${
                                        link.active
                                            ? 'bg-purple-600 text-white'
                                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                                    } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE SUBJECT MODAL */}
            {showCreateSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Create Curriculum Subject
                            </h3>
                            <button
                                onClick={() => setShowCreateSubject(false)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitSubject} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Subject Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Advanced Physics, Algebra II"
                                        value={subjectForm.data.name}
                                        onChange={(e) => subjectForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                    {subjectForm.errors.name && (
                                        <p className="mt-1 text-xs text-rose-500">{subjectForm.errors.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="PHY-301"
                                        value={subjectForm.data.code}
                                        onChange={(e) => subjectForm.setData('code', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Grade Level / Class *
                                    </label>
                                    <select
                                        value={subjectForm.data.school_class_id}
                                        onChange={(e) => subjectForm.setData('school_class_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">Select Primary Grade Level</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Subject Type
                                    </label>
                                    <select
                                        value={subjectForm.data.type}
                                        onChange={(e) => subjectForm.setData('type', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="core">Core Academic</option>
                                        <option value="elective">Elective</option>
                                        <option value="practical">Practical / Lab</option>
                                        <option value="language">Language</option>
                                        <option value="vocational">Vocational</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Brief summary of learning objectives or course scope..."
                                    value={subjectForm.data.description}
                                    onChange={(e) => subjectForm.setData('description', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Optional immediate instructor assignment */}
                            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 dark:border-purple-950/40 dark:bg-purple-950/10">
                                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                    Optional: Assign Educator Immediately
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={subjectForm.data.teacher_id}
                                        onChange={(e) => subjectForm.setData('teacher_id', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        <option value="">Select Instructor (Optional)</option>
                                        {teachers.map((t) => (
                                            <option key={t.user.id} value={t.user.id}>
                                                {t.user.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={subjectForm.data.class_section_id}
                                        onChange={(e) => subjectForm.setData('class_section_id', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        <option value="">Select Section (Optional)</option>
                                        {sections.map((sec) => (
                                            <option key={sec.id} value={sec.id}>
                                                {sec.school_class?.name || 'Class'} — {sec.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateSubject(false)}
                                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={subjectForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {subjectForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        'Save Subject'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN TEACHER MODAL */}
            {assignModalSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Faculty Allocation: {assignModalSubject.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Assign or unassign certified educators to section cohorts for this subject
                                </p>
                            </div>
                            <button
                                onClick={() => setAssignModalSubject(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Current Assignments List */}
                        <div className="mb-4">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                Existing Section Allocations
                            </span>
                            {!assignModalSubject.subject_teachers || assignModalSubject.subject_teachers.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-slate-800">
                                    No educators assigned to this subject yet.
                                </div>
                            ) : (
                                <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                                    {assignModalSubject.subject_teachers.map((st) => (
                                        <div
                                            key={st.id}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {st.teacher.name}
                                                </div>
                                                <div className="text-[11px] text-purple-600 dark:text-purple-400">
                                                    {st.class_section?.school_class?.name} ({st.class_section?.name})
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => submitUnassign(st.id)}
                                                className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
                                                title="Unassign"
                                            >
                                                <UserX className="size-3" />
                                                <span>Remove</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assign New Educator Form */}
                        <form onSubmit={submitAssign} className="space-y-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <span className="block text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                Assign Educator to Section
                            </span>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        Classroom Section *
                                    </label>
                                    <select
                                        value={assignForm.data.class_section_id}
                                        onChange={(e) =>
                                            assignForm.setData('class_section_id', parseInt(e.target.value))
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {sections.length === 0 ? (
                                            <option value="0">No classroom sections found</option>
                                        ) : (
                                            sections.map((sec) => (
                                                <option key={sec.id} value={sec.id}>
                                                    {sec.school_class?.name || (sec as any).schoolClass?.name || 'Class'} — {sec.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        Assigned Teacher *
                                    </label>
                                    <select
                                        value={assignForm.data.teacher_id}
                                        onChange={(e) =>
                                            assignForm.setData('teacher_id', parseInt(e.target.value))
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {teachers.length === 0 ? (
                                            <option value="0">No educators found</option>
                                        ) : (
                                            teachers.map((t) => (
                                                <option key={t.user.id} value={t.user.id}>
                                                    {t.user.name} ({t.user.email})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignModalSubject(null)}
                                    className="rounded-xl px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {assignForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <>
                                            <UserCheck className="size-3.5" />
                                            <span>Confirm Assignment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT SUBJECT MODAL */}
            {editingSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Edit Subject: {editingSubject.name}
                            </h3>
                            <button
                                onClick={() => setEditingSubject(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitUpdateSubject} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Subject Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editSubjectForm.data.name}
                                    onChange={(e) => editSubjectForm.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Code
                                    </label>
                                    <input
                                        type="text"
                                        value={editSubjectForm.data.code}
                                        onChange={(e) => editSubjectForm.setData('code', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Type
                                    </label>
                                    <select
                                        value={editSubjectForm.data.type}
                                        onChange={(e) => editSubjectForm.setData('type', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="core">Core Academic</option>
                                        <option value="elective">Elective</option>
                                        <option value="practical">Practical / Lab</option>
                                        <option value="language">Language</option>
                                        <option value="vocational">Vocational</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Primary Grade Level
                                </label>
                                <select
                                    value={editSubjectForm.data.school_class_id}
                                    onChange={(e) => editSubjectForm.setData('school_class_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="">Select Grade Level</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={editSubjectForm.data.description}
                                    onChange={(e) => editSubjectForm.setData('description', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingSubject(null)}
                                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSubjectForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {editSubjectForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        'Update Subject'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deletingSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-[#0B1220]">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Delete Subject
                                </h3>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete subject "{deletingSubject.name}"? All teacher allocations, timetables, and curriculum syllabi for this subject will be permanently removed.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitDeleteSubject} className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingSubject(null)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={deleteSubjectForm.processing}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 disabled:opacity-60"
                            >
                                {deleteSubjectForm.processing ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="size-3.5" />
                                        <span>Delete Subject</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
