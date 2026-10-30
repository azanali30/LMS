import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    Layers,
    Plus,
    Search,
    Filter,
    DoorOpen,
    Users,
    GraduationCap,
    CheckCircle2,
    CalendarCheck,
    Loader2,
    X,
    Building2,
    Sparkles,
    Eye,
    Pencil,
    Trash2,
    AlertTriangle,
    Info,
    Hash,
} from 'lucide-react';

interface SchoolClass {
    id: number;
    name: string;
    code?: string;
}

interface StudentEnrollment {
    id: number;
    student?: {
        id: number;
        name: string;
        email?: string;
    };
    roll_number?: string;
}

interface ClassSectionItem {
    id: number;
    name: string;
    room?: string;
    capacity: number;
    school_class_id: number;
    school_class: SchoolClass;
    student_enrollments?: StudentEnrollment[];
}

interface SectionsPageProps {
    sections: {
        data: ClassSectionItem[];
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    classes: SchoolClass[];
    stats: {
        totalSections: number;
        totalClasses: number;
        totalCapacity: number;
        totalStudents: number;
    };
    filters: {
        class_id?: string;
        search?: string;
    };
    canManage?: boolean;
}

export default function SectionsPage({
    sections,
    classes = [],
    stats,
    filters = {},
    canManage = false,
}: SectionsPageProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewingSection, setViewingSection] = useState<ClassSectionItem | null>(null);
    const [editingSection, setEditingSection] = useState<ClassSectionItem | null>(null);
    const [deletingSection, setDeletingSection] = useState<ClassSectionItem | null>(null);

    const [search, setSearch] = useState(filters.search || '');
    const [selectedClassId, setSelectedClassId] = useState(filters.class_id || '');
    const [createNewClass, setCreateNewClass] = useState(classes.length === 0);

    const sectionForm = useForm({
        school_class_id: classes[0]?.id ? String(classes[0].id) : 'new',
        new_class_name: '',
        name: '',
        room: '',
        capacity: 35,
    });

    const editForm = useForm({
        school_class_id: '',
        name: '',
        room: '',
        capacity: 35,
    });

    const deleteForm = useForm({});

    const handleFilter = (clsId: string, query: string) => {
        router.get(
            '/school/sections',
            {
                class_id: clsId || undefined,
                search: query || undefined,
            },
            { preserveState: true }
        );
    };

    const submitCreateSection = (e: React.FormEvent) => {
        e.preventDefault();
        sectionForm.post('/school/sections', {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                sectionForm.reset();
            },
        });
    };

    const startEditing = (sec: ClassSectionItem) => {
        setEditingSection(sec);
        editForm.setData({
            school_class_id: String(sec.school_class_id),
            name: sec.name,
            room: sec.room || '',
            capacity: sec.capacity || 35,
        });
    };

    const submitUpdateSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSection) return;
        editForm.put(`/school/sections/${editingSection.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingSection(null);
            },
        });
    };

    const submitDeleteSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingSection) return;
        deleteForm.delete(`/school/sections/${deletingSection.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSection(null);
            },
        });
    };

    return (
        <TenantLayout title="Sections & Cohorts">
            <Head title="Sections & Classrooms" />

            {/* Top Navigation & Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400">
                            <Layers className="size-4" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Sections & Classroom Cohorts
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Create, manage, inspect, and organize physical classrooms, student cohorts, and target capacities
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/school/classes"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
                    >
                        <GraduationCap className="size-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Classes Directory</span>
                    </Link>

                    {canManage && (
                        <button
                            onClick={() => {
                                if (classes.length === 0) {
                                    setCreateNewClass(true);
                                    sectionForm.setData('school_class_id', 'new');
                                }
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500"
                        >
                            <Plus className="size-3.5" />
                            <span>Add New Section</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stat Highlights */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Sections
                        </span>
                        <Layers className="size-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalSections}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Active classroom cohorts
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Parent Classes
                        </span>
                        <GraduationCap className="size-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalClasses}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Grade levels & curricula
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Enrolled Students
                        </span>
                        <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalStudents}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Allocated to sections
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Capacity
                        </span>
                        <DoorOpen className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalCapacity}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Maximum desk seats
                    </div>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                <div className="flex min-w-[280px] flex-1 items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by section name, room number, or parent class..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter(selectedClassId, e.target.value);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="size-3.5 text-slate-400" />
                    <select
                        value={selectedClassId}
                        onChange={(e) => {
                            setSelectedClassId(e.target.value);
                            handleFilter(e.target.value, search);
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">All Parent Classes</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.code ? `(${c.code})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sections Listing Grid */}
            {sections.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]/50">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-600/10 dark:text-purple-400">
                        <Layers className="size-6" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                        No Class Sections Found
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        You have not created any sections yet. Sections are required before enrolling students and tracking attendance.
                    </p>
                    {canManage && (
                        <button
                            onClick={() => {
                                if (classes.length === 0) {
                                    setCreateNewClass(true);
                                    sectionForm.setData('school_class_id', 'new');
                                }
                                setShowCreateModal(true);
                            }}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500"
                        >
                            <Plus className="size-4" />
                            <span>Create Your First Section</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sections.data.map((sec) => {
                        const enrolledCount = sec.student_enrollments?.length || 0;
                        const fillPercent = sec.capacity > 0
                            ? Math.min(100, Math.round((enrolledCount / sec.capacity) * 100))
                            : 0;

                        return (
                            <div
                                key={sec.id}
                                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl dark:hover:border-slate-700"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                                <GraduationCap className="size-3" />
                                                {sec.school_class?.name || 'Class'}
                                            </span>
                                            <h4 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                                {sec.name}
                                            </h4>
                                        </div>

                                        {sec.room && (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                                <DoorOpen className="size-3 text-slate-400 dark:text-slate-500" />
                                                {sec.room}
                                            </span>
                                        )}
                                    </div>

                                    {/* Capacity Progress Bar */}
                                    <div className="mt-5">
                                        <div className="mb-1.5 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Roster Capacity</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {enrolledCount} / {sec.capacity}
                                                <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                    ({fillPercent}%)
                                                </span>
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    fillPercent >= 90
                                                        ? 'bg-rose-500'
                                                        : fillPercent >= 70
                                                        ? 'bg-amber-500'
                                                        : 'bg-purple-600'
                                                }`}
                                                style={{ width: `${fillPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons: View, Edit, Delete & Quick Links */}
                                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                                    <div className="mb-2.5 flex items-center justify-between gap-1">
                                        <button
                                            onClick={() => setViewingSection(sec)}
                                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                            title="View Details"
                                        >
                                            <Eye className="size-3 text-purple-600 dark:text-purple-400" />
                                            <span>Details</span>
                                        </button>

                                        {canManage && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => startEditing(sec)}
                                                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                                    title="Edit Section"
                                                >
                                                    <Pencil className="size-3 text-sky-600 dark:text-sky-400" />
                                                    <span>Edit</span>
                                                </button>

                                                <button
                                                    onClick={() => setDeletingSection(sec)}
                                                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                    title="Delete Section"
                                                >
                                                    <Trash2 className="size-3" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/school/students?section_id=${sec.id}`}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-500/30 dark:hover:bg-purple-600/10 dark:hover:text-white"
                                        >
                                            <Users className="size-3.5 text-purple-600 dark:text-purple-400" />
                                            <span>Roster</span>
                                        </Link>

                                        <Link
                                            href={`/school/attendance?section_id=${sec.id}`}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-500/30 dark:hover:bg-purple-600/10 dark:hover:text-white"
                                        >
                                            <CalendarCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span>Attendance</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Links */}
            {sections.links && sections.links.length > 3 && (
                <div className="mt-8 flex justify-center gap-1">
                    {sections.links.map((link, idx) => (
                        <button
                            key={idx}
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                link.active
                                    ? 'bg-purple-600 text-white'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-400 dark:hover:text-white'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            {viewingSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400">
                                    <Layers className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Section Details: {viewingSection.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Cohort specifications and enrolled student list
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingSection(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Parent Class
                                    </span>
                                    <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                        <GraduationCap className="size-4 text-purple-600 dark:text-purple-400" />
                                        <span>{viewingSection.school_class?.name || 'Unassigned'}</span>
                                        {viewingSection.school_class?.code && (
                                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-mono text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                {viewingSection.school_class.code}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Room / Classroom
                                    </span>
                                    <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                        <DoorOpen className="size-4 text-amber-600 dark:text-amber-400" />
                                        <span>{viewingSection.room || 'General Campus'}</span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Capacity & Enrolled
                                    </span>
                                    <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                        <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>
                                            {viewingSection.student_enrollments?.length || 0} / {viewingSection.capacity} Seats
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Utilization
                                    </span>
                                    <div className="mt-1 font-bold text-slate-900 dark:text-white">
                                        {viewingSection.capacity > 0
                                            ? Math.round(((viewingSection.student_enrollments?.length || 0) / viewingSection.capacity) * 100)
                                            : 0}
                                        % occupied
                                    </div>
                                </div>
                            </div>

                            {/* Enrolled Students preview */}
                            <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Enrolled Students ({viewingSection.student_enrollments?.length || 0})
                                </h4>
                                {(!viewingSection.student_enrollments || viewingSection.student_enrollments.length === 0) ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                        No students have been enrolled into this section yet.
                                    </div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:divide-slate-800">
                                        {viewingSection.student_enrollments.map((enr) => (
                                            <div key={enr.id} className="flex items-center justify-between p-2.5 text-xs">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {enr.student?.name || 'Student'}
                                                </div>
                                                {enr.roll_number && (
                                                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {enr.roll_number}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                onClick={() => setViewingSection(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Close
                            </button>
                            <Link
                                href={`/school/students?section_id=${viewingSection.id}`}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                            >
                                <Users className="size-3.5" />
                                <span>Manage Roster</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT SECTION MODAL */}
            {canManage && editingSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    <Pencil className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Edit Class Section
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingSection(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitUpdateSection} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Parent Class *
                                </label>
                                <select
                                    value={editForm.data.school_class_id}
                                    onChange={(e) =>
                                        editForm.setData('school_class_id', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.code ? `(${c.code})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {editForm.errors.school_class_id && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {editForm.errors.school_class_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Section Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {editForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Room / Location
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.room}
                                        onChange={(e) =>
                                            editForm.setData('room', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Max Capacity
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={editForm.data.capacity}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'capacity',
                                                parseInt(e.target.value) || 35
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingSection(null)}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {editForm.processing ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Update Section</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE SECTION CONFIRMATION MODAL */}
            {canManage && deletingSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-[#0B1220]">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Delete Class Section
                                </h3>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete section{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        "{deletingSection.name}"
                                    </span>
                                    ? Any associated attendance entries and records tied to this section will be affected.
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
                                disabled={deleteForm.processing}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 disabled:opacity-60"
                            >
                                {deleteForm.processing ? (
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

            {/* CREATE SECTION MODAL */}
            {canManage && showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <Layers className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Create Class Section
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitCreateSection} className="space-y-4">
                            {/* Class Selection or Creation */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Parent Class *
                                    </label>
                                    {classes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nextState = !createNewClass;
                                                setCreateNewClass(nextState);
                                                sectionForm.setData(
                                                    'school_class_id',
                                                    nextState ? 'new' : String(classes[0]?.id || '')
                                                );
                                            }}
                                            className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                        >
                                            {createNewClass
                                                ? '← Choose Existing Class'
                                                : '+ Create New Class'}
                                        </button>
                                    )}
                                </div>

                                {createNewClass ? (
                                    <div>
                                        <div className="relative">
                                            <Building2 className="pointer-events-none absolute left-3.5 top-3 size-4 text-purple-600 dark:text-purple-400" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Grade 10 / Matric / Year 1"
                                                value={sectionForm.data.new_class_name}
                                                onChange={(e) =>
                                                    sectionForm.setData('new_class_name', e.target.value)
                                                }
                                                className="w-full rounded-xl border border-purple-300 bg-purple-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-500 dark:border-purple-500/40 dark:bg-purple-950/20 dark:text-white dark:placeholder-slate-500"
                                            />
                                        </div>
                                        <p className="mt-1 text-[11px] text-purple-600 dark:text-purple-300">
                                            A new parent class will be created automatically.
                                        </p>
                                    </div>
                                ) : (
                                    <select
                                        value={sectionForm.data.school_class_id}
                                        onChange={(e) =>
                                            sectionForm.setData('school_class_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.code ? `(${c.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {sectionForm.errors.school_class_id && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {sectionForm.errors.school_class_id}
                                    </p>
                                )}
                            </div>

                            {/* Section Name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Section Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Section A, Blue Cohort, Morning"
                                    value={sectionForm.data.name}
                                    onChange={(e) =>
                                        sectionForm.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                />
                                {sectionForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {sectionForm.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Room & Capacity */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Room / Location
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Room 204"
                                        value={sectionForm.data.room}
                                        onChange={(e) =>
                                            sectionForm.setData('room', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Max Capacity
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

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sectionForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {sectionForm.processing ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Save Section</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
