import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    GraduationCap,
    Plus,
    Layers,
    Users,
    Loader2,
    DoorOpen,
    Eye,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    AlertTriangle,
    BookOpen,
} from 'lucide-react';

interface ClassSection {
    id: number;
    name: string;
    room?: string;
    capacity: number;
    student_enrollments?: Array<unknown>;
}

interface SchoolClassItem {
    id: number;
    name: string;
    code?: string;
    description?: string;
    sections: ClassSection[];
}

interface ClassesProps {
    classes: {
        data: SchoolClassItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    canManage?: boolean;
}

export default function ClassesPage({ classes, canManage = false }: ClassesProps) {
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [viewingClass, setViewingClass] = useState<SchoolClassItem | null>(null);
    const [editingClass, setEditingClass] = useState<SchoolClassItem | null>(null);
    const [deletingClass, setDeletingClass] = useState<SchoolClassItem | null>(null);

    const [sectionModalClassId, setSectionModalClassId] = useState<number | null>(null);
    const [editingSection, setEditingSection] = useState<{ section: ClassSection; classId: number } | null>(null);
    const [deletingSection, setDeletingSection] = useState<ClassSection | null>(null);

    const classForm = useForm({
        name: '',
        code: '',
        description: '',
        default_section: 'Section A',
    });

    const editClassForm = useForm({
        name: '',
        code: '',
        description: '',
    });

    const deleteClassForm = useForm({});

    const sectionForm = useForm({
        name: '',
        room: '',
        capacity: 35,
    });

    const editSectionForm = useForm({
        school_class_id: '',
        name: '',
        room: '',
        capacity: 35,
    });

    const deleteSectionForm = useForm({});

    const submitClass = (e: React.FormEvent) => {
        e.preventDefault();
        classForm.post('/school/classes', {
            onSuccess: () => {
                setShowCreateClass(false);
                classForm.reset();
            },
        });
    };

    const startEditingClass = (cls: SchoolClassItem) => {
        setEditingClass(cls);
        editClassForm.setData({
            name: cls.name,
            code: cls.code || '',
            description: cls.description || '',
        });
    };

    const submitUpdateClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClass) return;
        editClassForm.put(`/school/classes/${editingClass.id}`, {
            onSuccess: () => {
                setEditingClass(null);
            },
        });
    };

    const submitDeleteClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingClass) return;
        deleteClassForm.delete(`/school/classes/${deletingClass.id}`, {
            onSuccess: () => {
                setDeletingClass(null);
            },
        });
    };

    const submitSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionModalClassId) return;
        sectionForm.post(`/school/classes/${sectionModalClassId}/sections`, {
            onSuccess: () => {
                setSectionModalClassId(null);
                sectionForm.reset();
            },
        });
    };

    const startEditingSection = (sec: ClassSection, classId: number) => {
        setEditingSection({ section: sec, classId });
        editSectionForm.setData({
            school_class_id: String(classId),
            name: sec.name,
            room: sec.room || '',
            capacity: sec.capacity || 35,
        });
    };

    const submitUpdateSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSection) return;
        editSectionForm.put(`/school/sections/${editingSection.section.id}`, {
            onSuccess: () => {
                setEditingSection(null);
            },
        });
    };

    const submitDeleteSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingSection) return;
        deleteSectionForm.delete(`/school/sections/${deletingSection.id}`, {
            onSuccess: () => {
                setDeletingSection(null);
            },
        });
    };

    return (
        <TenantLayout title="Classes & Classrooms">
            <Head title="Classrooms" />

            {/* Header & Quick Action Buttons */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <GraduationCap className="size-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Academic Classes & Sections
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Configure institutional grades, cohorts, and physical/virtual sections
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/school/sections"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
                    >
                        <Layers className="size-3.5 text-purple-600 dark:text-purple-400" />
                        <span>View All Sections</span>
                    </Link>

                    {canManage && (
                        <button
                            onClick={() => setShowCreateClass(true)}
                            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500"
                        >
                            <Plus className="size-3.5" />
                            <span>Create New Class</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Classes & Sections Directory */}
            <div className="space-y-6">
                {classes.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]/50">
                        <Layers className="mx-auto mb-2 size-8 text-slate-400 dark:text-slate-500" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            No classes configured yet.
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Create your first academic class or grade level to start organizing students.
                        </p>
                        {canManage && (
                            <button
                                onClick={() => setShowCreateClass(true)}
                                className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-purple-500"
                            >
                                Create First Class
                            </button>
                        )}
                    </div>
                ) : (
                    classes.data.map((cls) => {
                        const totalCapacity = cls.sections.reduce((acc, s) => acc + (s.capacity || 0), 0);
                        const totalEnrolled = cls.sections.reduce(
                            (acc, s) => acc + (s.student_enrollments?.length || 0),
                            0
                        );

                        return (
                            <div
                                key={cls.id}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl"
                            >
                                {/* Class Header & Action buttons */}
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                {cls.name}
                                            </h3>
                                            {cls.code && (
                                                <span className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 font-mono text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                                    {cls.code}
                                                </span>
                                            )}
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                {cls.sections.length} {cls.sections.length === 1 ? 'Section' : 'Sections'}
                                            </span>
                                        </div>
                                        {cls.description && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {cls.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Class Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setViewingClass(cls)}
                                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                            title="View Details"
                                        >
                                            <Eye className="size-3.5 text-purple-600 dark:text-purple-400" />
                                            <span>Details</span>
                                        </button>

                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={() => startEditingClass(cls)}
                                                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                    title="Edit Class"
                                                >
                                                    <Pencil className="size-3.5 text-sky-600 dark:text-sky-400" />
                                                    <span>Edit</span>
                                                </button>

                                                <button
                                                    onClick={() => setDeletingClass(cls)}
                                                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                    title="Delete Class"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    <span>Delete</span>
                                                </button>

                                                <button
                                                    onClick={() => setSectionModalClassId(cls.id)}
                                                    className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500"
                                                >
                                                    <Plus className="size-3.5" />
                                                    <span>Add Section</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Sections Grid */}
                                {cls.sections.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                                        No sections assigned to this class yet.
                                        {canManage && (
                                            <>
                                                {' '}
                                                <button
                                                    onClick={() => setSectionModalClassId(cls.id)}
                                                    className="font-semibold text-purple-600 hover:underline dark:text-purple-400"
                                                >
                                                    Create one now
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                        {cls.sections.map((sec) => (
                                            <div
                                                key={sec.id}
                                                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-purple-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-purple-500/30"
                                            >
                                                <div>
                                                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                                                        <span>{sec.name}</span>
                                                        {canManage && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => startEditingSection(sec, cls.id)}
                                                                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                    title="Edit Section"
                                                                >
                                                                    <Pencil className="size-3 text-sky-600 dark:text-sky-400" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingSection(sec)}
                                                                    className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                                                    title="Delete Section"
                                                                >
                                                                    <Trash2 className="size-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="size-3 text-slate-400 dark:text-slate-500" />
                                                            <span>
                                                                Enrolled: {sec.student_enrollments?.length || 0} / {sec.capacity}
                                                            </span>
                                                        </div>
                                                        {sec.room && (
                                                            <div className="flex items-center gap-1.5">
                                                                <DoorOpen className="size-3 text-slate-400 dark:text-slate-500" />
                                                                <span>Room: {sec.room}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px] dark:border-slate-800/60">
                                                    <a
                                                        href={`/school/attendance?section_id=${sec.id}`}
                                                        className="font-medium text-purple-600 hover:underline dark:text-purple-400"
                                                    >
                                                        Attendance &rarr;
                                                    </a>
                                                    <a
                                                        href={`/school/students?section_id=${sec.id}`}
                                                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                                    >
                                                        Students
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* VIEW CLASS DETAILS MODAL */}
            {viewingClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400">
                                    <GraduationCap className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Class Details: {viewingClass.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setViewingClass(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Class Code
                                    </span>
                                    <div className="mt-1 font-mono font-bold text-purple-600 dark:text-purple-400">
                                        {viewingClass.code || 'None'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Total Sections
                                    </span>
                                    <div className="mt-1 font-bold text-slate-900 dark:text-white">
                                        {viewingClass.sections.length} active cohorts
                                    </div>
                                </div>
                            </div>

                            {viewingClass.description && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Description
                                    </span>
                                    <p className="mt-1">{viewingClass.description}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Sections in this Class ({viewingClass.sections.length})
                                </h4>
                                {viewingClass.sections.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                        No sections created under this class yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {viewingClass.sections.map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                                                    {s.room && (
                                                        <span className="ml-2 text-slate-500 dark:text-slate-400">
                                                            ({s.room})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {s.student_enrollments?.length || 0} / {s.capacity} Students
                                                    </span>
                                                    <Link
                                                        href={`/school/students?section_id=${s.id}`}
                                                        className="font-semibold text-purple-600 hover:underline dark:text-purple-400"
                                                    >
                                                        Roster &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                onClick={() => setViewingClass(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT CLASS MODAL */}
            {editingClass && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    <Pencil className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Edit Academic Class
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingClass(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitUpdateClass} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Class Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editClassForm.data.name}
                                    onChange={(e) =>
                                        editClassForm.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {editClassForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {editClassForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Class Code
                                </label>
                                <input
                                    type="text"
                                    value={editClassForm.data.code}
                                    onChange={(e) =>
                                        editClassForm.setData('code', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={editClassForm.data.description}
                                    onChange={(e) =>
                                        editClassForm.setData('description', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingClass(null)}
                                    className="rounded-xl px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editClassForm.processing}
                                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {editClassForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Update Class</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CLASS CONFIRMATION MODAL */}
            {deletingClass && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-[#0B1220]">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Delete Academic Class
                                </h3>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete class{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        "{deletingClass.name}"
                                    </span>
                                    ? All {deletingClass.sections.length} assigned sections and student cohort mappings will be removed.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitDeleteClass} className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingClass(null)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={deleteClassForm.processing}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 disabled:opacity-60"
                            >
                                {deleteClassForm.processing ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="size-3.5" />
                                        <span>Delete Class</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE CLASS MODAL */}
            {showCreateClass && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Define New School Class
                            </h3>
                            <button
                                onClick={() => setShowCreateClass(false)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={submitClass} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Class Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Grade 10 or Sophomore Cohort"
                                    value={classForm.data.name}
                                    onChange={(e) =>
                                        classForm.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Class Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="G10"
                                        value={classForm.data.code}
                                        onChange={(e) =>
                                            classForm.setData('code', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Default Section
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Section A"
                                        value={classForm.data.default_section}
                                        onChange={(e) =>
                                            classForm.setData('default_section', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Secondary school curriculum cohort"
                                    value={classForm.data.description}
                                    onChange={(e) =>
                                        classForm.setData('description', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateClass(false)}
                                    className="rounded-xl px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={classForm.processing}
                                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    {classForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        'Save Class'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD SECTION MODAL */}
            {sectionModalClassId && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Add Section to Class
                            </h3>
                            <button
                                onClick={() => setSectionModalClassId(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={submitSection} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Section Identifier *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Section B, Alpha, Room 102"
                                    value={sectionForm.data.name}
                                    onChange={(e) =>
                                        sectionForm.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Room #
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Room 204"
                                        value={sectionForm.data.room}
                                        onChange={(e) =>
                                            sectionForm.setData('room', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Student Capacity
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={sectionForm.data.capacity}
                                        onChange={(e) =>
                                            sectionForm.setData(
                                                'capacity',
                                                parseInt(e.target.value) || 35
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSectionModalClassId(null)}
                                    className="rounded-xl px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sectionForm.processing}
                                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    {sectionForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        'Add Section'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT SECTION MODAL */}
            {editingSection && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Edit Section: {editingSection.section.name}
                            </h3>
                            <button
                                onClick={() => setEditingSection(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={submitUpdateSection} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Section Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editSectionForm.data.name}
                                    onChange={(e) =>
                                        editSectionForm.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Room #
                                    </label>
                                    <input
                                        type="text"
                                        value={editSectionForm.data.room}
                                        onChange={(e) =>
                                            editSectionForm.setData('room', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Capacity
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={editSectionForm.data.capacity}
                                        onChange={(e) =>
                                            editSectionForm.setData(
                                                'capacity',
                                                parseInt(e.target.value) || 35
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingSection(null)}
                                    className="rounded-xl px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSectionForm.processing}
                                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    {editSectionForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        'Update Section'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE SECTION CONFIRMATION MODAL */}
            {deletingSection && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-[#0B1220]">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Delete Section
                                </h3>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete section{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        "{deletingSection.name}"
                                    </span>
                                    ? Any associated attendance records will be affected.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitDeleteSection} className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingSection(null)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={deleteSectionForm.processing}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 disabled:opacity-60"
                            >
                                {deleteSectionForm.processing ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="size-3.5" />
                                        <span>Delete Section</span>
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
