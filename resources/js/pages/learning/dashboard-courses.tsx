import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    PlayCircle,
    Users,
    Layers,
    Loader2,
    X,
    Sparkles,
    CheckCircle2,
    Globe,
    Lock,
    ExternalLink,
    Clock,
    Eye,
    Pencil,
    Trash2,
    AlertTriangle,
    ChevronDown,
} from 'lucide-react';

interface CourseCategory {
    id: number;
    name: string;
    slug: string;
}

interface Instructor {
    id: number;
    name: string;
}

interface LessonItem {
    id: number;
    title: string;
    slug: string;
    type?: string;
    duration_minutes?: number;
    is_free_preview?: boolean;
    content?: string;
    video_url?: string;
}

interface ModuleItem {
    id: number;
    title: string;
    description?: string;
    order: number;
    lessons?: LessonItem[];
}

interface CourseItem {
    id: number;
    title: string;
    slug: string;
    level: string;
    duration?: string;
    summary: string;
    description?: string;
    is_public: boolean;
    is_published: boolean;
    modules_count: number;
    enrollments_count: number;
    category?: CourseCategory;
    instructor?: Instructor;
    modules?: ModuleItem[];
}

interface DashboardCoursesProps {
    courses: {
        data: CourseItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    categories?: CourseCategory[];
    canManage?: boolean;
    stats: {
        totalCourses: number;
        publishedCourses: number;
        totalModules: number;
        totalEnrollments: number;
    };
    filters?: {
        category?: string;
        search?: string;
    };
}

export default function DashboardCoursesPage({
    courses,
    categories = [],
    canManage = true,
    stats,
    filters = {},
}: DashboardCoursesProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewingCourse, setViewingCourse] = useState<CourseItem | null>(null);
    const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
    const [deletingCourse, setDeletingCourse] = useState<CourseItem | null>(null);
    const [syllabusCourse, setSyllabusCourse] = useState<CourseItem | null>(null);
    const [openSyllabusModuleId, setOpenSyllabusModuleId] = useState<number | null>(null);
    const [showAddModule, setShowAddModule] = useState(false);
    const [addingLessonModuleId, setAddingLessonModuleId] = useState<number | null>(null);

    // Keep syllabusCourse synchronized with latest courses data
    const currentSyllabusCourse = syllabusCourse
        ? courses.data.find((c) => c.id === syllabusCourse.id) || syllabusCourse
        : null;

    const moduleForm = useForm({
        title: '',
        description: '',
    });

    const lessonForm = useForm({
        title: '',
        duration_minutes: 15,
        is_free_preview: false,
        video_url: '',
    });

    const submitCreateModule = (courseId: number, e: React.FormEvent) => {
        e.preventDefault();
        moduleForm.post(`/learning/courses/${courseId}/modules`, {
            preserveScroll: true,
            onSuccess: () => {
                moduleForm.reset();
                setShowAddModule(false);
            },
        });
    };

    const submitCreateLesson = (moduleId: number, e: React.FormEvent) => {
        e.preventDefault();
        lessonForm.post(`/learning/modules/${moduleId}/lessons`, {
            preserveScroll: true,
            onSuccess: () => {
                lessonForm.reset();
                setAddingLessonModuleId(null);
            },
        });
    };

    const deleteModule = (moduleId: number) => {
        if (!confirm('Are you sure you want to remove this module and its lessons?')) return;
        router.delete(`/learning/modules/${moduleId}`, {
            preserveScroll: true,
        });
    };

    const deleteLesson = (lessonId: number) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        router.delete(`/learning/lessons/${lessonId}`, {
            preserveScroll: true,
        });
    };

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || '',
    );

    const courseForm = useForm({
        title: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        level: 'beginner',
        duration: '6 Weeks',
        summary: '',
        description: '',
        is_published: true,
        is_public: false,
    });

    const editForm = useForm({
        title: '',
        category_id: '',
        level: 'beginner',
        duration: '6 Weeks',
        summary: '',
        description: '',
        is_published: true,
        is_public: false,
    });

    const deleteForm = useForm({});

    const handleFilter = (catSlug: string, query: string) => {
        router.get(
            '/learning/courses',
            {
                category: catSlug || undefined,
                search: query || undefined,
            },
            { preserveState: true },
        );
    };

    const submitCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        courseForm.post('/learning/courses', {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                courseForm.reset();
            },
        });
    };

    const startEditingCourse = (course: CourseItem) => {
        setEditingCourse(course);
        editForm.setData({
            title: course.title,
            category_id: course.category?.id ? String(course.category.id) : '',
            level: course.level,
            duration: course.duration || '6 Weeks',
            summary: course.summary,
            description: course.description || '',
            is_published: course.is_published,
            is_public: course.is_public,
        });
    };

    const submitUpdateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse) return;
        editForm.put(`/learning/courses/${editingCourse.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCourse(null);
            },
        });
    };

    const submitDeleteCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingCourse) return;
        deleteForm.delete(`/learning/courses/${deletingCourse.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingCourse(null);
            },
        });
    };

    return (
        <TenantLayout title="Course Catalog">
            <Head title="Course Catalog" />

            {/* Header & Actions */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400">
                            <BookOpen className="size-4" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Institutional Course Catalog
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Create digital courses, author interactive curriculum modules, and track enrolled student progress
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/courses"
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
                    >
                        <Globe className="size-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Public Marketplace</span>
                        <ExternalLink className="size-3 text-slate-400 dark:text-slate-500" />
                    </Link>

                    {canManage && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500"
                        >
                            <Plus className="size-3.5" />
                            <span>Create Course</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Courses
                        </span>
                        <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalCourses}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Active curricula
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Published
                        </span>
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.publishedCourses}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Available for learning
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Curriculum Modules
                        </span>
                        <Layers className="size-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalModules}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Structured chapters
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Active Enrollments
                        </span>
                        <Users className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalEnrollments}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Enrolled learners
                    </div>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                <div className="flex min-w-[280px] flex-1 items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search organization courses by title or topic..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter(selectedCategory, e.target.value);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="size-3.5 text-slate-400" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            handleFilter(e.target.value, search);
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Courses Grid */}
            {courses.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-[#0B1220]/50">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-600/10 dark:text-purple-400">
                        <BookOpen className="size-6" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                        No Courses Created Yet
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        Start building your institution's e-learning course catalog by publishing your first course module.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500"
                    >
                        <Plus className="size-4" />
                        <span>Create Your First Course</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.data.map((course) => (
                        <div
                            key={course.id}
                            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl dark:hover:border-purple-500/40"
                        >
                            <div>
                                <div className="mb-3 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                                        {course.category?.name || 'General Curriculum'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                            {course.level}
                                        </span>
                                        {course.is_published ? (
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="line-clamp-2 text-base font-bold text-slate-900 transition group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-300">
                                    {course.title}
                                </h3>

                                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    {course.summary}
                                </p>

                                <div className="mt-3 flex items-center gap-2">
                                    {course.is_public ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
                                            <Globe className="size-3" />
                                            <span>Listed on Public Portal</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                            <Lock className="size-3" />
                                            <span>Internal Institution Only</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                                <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="size-3.5 text-slate-400 dark:text-slate-500" />
                                        <span>
                                            {course.modules_count} Modules
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="size-3.5 text-slate-400 dark:text-slate-500" />
                                        <span>
                                            {course.enrollments_count} Enrolled
                                        </span>
                                    </div>
                                </div>

                                {/* Actions Row: View, Edit, Delete, Syllabus */}
                                <div className="mb-3 flex items-center justify-between gap-1">
                                    <button
                                        onClick={() => setViewingCourse(course)}
                                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                        title="View Details"
                                    >
                                        <Eye className="size-3 text-purple-600 dark:text-purple-400" />
                                        <span>Details</span>
                                    </button>

                                    {canManage && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => startEditingCourse(course)}
                                                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                title="Edit Course"
                                            >
                                                <Pencil className="size-3 text-sky-600 dark:text-sky-400" />
                                                <span>Edit</span>
                                            </button>

                                            <button
                                                onClick={() => setDeletingCourse(course)}
                                                className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                                                title="Delete Course"
                                            >
                                                <Trash2 className="size-3" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSyllabusCourse(course)}
                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-500/30 dark:hover:bg-purple-600/10 dark:hover:text-white"
                                    >
                                        <PlayCircle className="size-3.5 text-purple-600 dark:text-purple-400" />
                                        <span>Syllabus</span>
                                    </button>

                                    <Link
                                        href={`/learning/courses/${course.slug}`}
                                        className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500"
                                    >
                                        <span>{canManage ? 'Manage' : 'View Course'}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {courses.links && courses.links.length > 3 && (
                <div className="mt-8 flex justify-center gap-1">
                    {courses.links.map((link, idx) => (
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

            {/* VIEW COURSE DETAILS MODAL */}
            {viewingCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400">
                                    <BookOpen className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Course Details
                                </h3>
                            </div>
                            <button
                                onClick={() => setViewingCourse(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                    {viewingCourse.category?.name || 'General Curriculum'}
                                </span>
                                <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                    {viewingCourse.title}
                                </h2>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 text-xs">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Level
                                    </span>
                                    <div className="mt-1 font-bold text-slate-900 capitalize dark:text-white">
                                        {viewingCourse.level}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Duration
                                    </span>
                                    <div className="mt-1 font-bold text-slate-900 dark:text-white">
                                        {viewingCourse.duration || 'Flexible'}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Enrolled
                                    </span>
                                    <div className="mt-1 font-bold text-slate-900 dark:text-white">
                                        {viewingCourse.enrollments_count} Students
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Course Summary
                                </span>
                                <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                                    {viewingCourse.summary}
                                </p>
                            </div>

                            {viewingCourse.description && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Extended Description
                                    </span>
                                    <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                                        {viewingCourse.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-xs">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${
                                    viewingCourse.is_published
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}>
                                    {viewingCourse.is_published ? 'Published' : 'Draft Mode'}
                                </span>

                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${
                                    viewingCourse.is_public
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                    {viewingCourse.is_public ? 'Public Marketplace' : 'Internal Organization'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                onClick={() => setViewingCourse(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const c = viewingCourse;
                                    setViewingCourse(null);
                                    setSyllabusCourse(c);
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                            >
                                <PlayCircle className="size-3.5" />
                                <span>View Syllabus</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IN-LMS COURSE SYLLABUS MODAL */}
            {currentSyllabusCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                                    <BookOpen className="size-5" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                            {currentSyllabusCourse.category?.name || 'Curriculum Syllabus'}
                                        </span>
                                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                            {currentSyllabusCourse.level}
                                        </span>
                                        {currentSyllabusCourse.duration && (
                                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                                <Clock className="size-3" />
                                                <span>{currentSyllabusCourse.duration}</span>
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                        {currentSyllabusCourse.title}
                                    </h3>
                                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                        {currentSyllabusCourse.summary}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/learning/courses/${currentSyllabusCourse.slug}`}
                                    className="hidden items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-950/30 dark:text-purple-300 sm:flex"
                                    title="Open full page course view inside LMS"
                                >
                                    <ExternalLink className="size-3.5" />
                                    <span>Full Page</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setSyllabusCourse(null);
                                        setShowAddModule(false);
                                        setAddingLessonModuleId(null);
                                    }}
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body / Scrollable Syllabus */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Total Modules
                                    </span>
                                    <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                                        {currentSyllabusCourse.modules?.length ?? currentSyllabusCourse.modules_count ?? 0}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Total Lessons
                                    </span>
                                    <div className="mt-1 text-xl font-extrabold text-purple-600 dark:text-purple-400">
                                        {currentSyllabusCourse.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) ?? 0}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Lead Instructor
                                    </span>
                                    <div className="mt-1 truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {currentSyllabusCourse.instructor?.name || 'Faculty Assigned'}
                                    </div>
                                </div>
                            </div>

                            {/* Modules & Lessons Section */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <Layers className="size-4 text-purple-600 dark:text-purple-400" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        Course Modules & Syllabus Outline
                                    </h4>
                                </div>

                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModule((prev) => !prev)}
                                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>{showAddModule ? 'Cancel' : 'Add Module'}</span>
                                    </button>
                                )}
                            </div>

                            {/* Add Module Inline Form */}
                            {showAddModule && (
                                <form
                                    onSubmit={(e) => submitCreateModule(currentSyllabusCourse.id, e)}
                                    className="animate-in rounded-2xl border border-purple-200 bg-purple-50/50 p-4 zoom-in-95 dark:border-purple-500/20 dark:bg-purple-950/20"
                                >
                                    <h5 className="mb-2 text-xs font-bold text-slate-900 dark:text-white">
                                        New Syllabus Module
                                    </h5>
                                    <div className="space-y-3">
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Module 1: Foundations & Core Concepts"
                                                value={moduleForm.data.title}
                                                onChange={(e) => moduleForm.setData('title', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-[#0B1220] dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <textarea
                                                rows={2}
                                                placeholder="Brief outline / goals for this module (optional)..."
                                                value={moduleForm.data.description}
                                                onChange={(e) => moduleForm.setData('description', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-[#0B1220] dark:text-white"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddModule(false)}
                                                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={moduleForm.processing}
                                                className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-500"
                                            >
                                                {moduleForm.processing ? 'Saving...' : 'Save Module'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* Modules list */}
                            {(!currentSyllabusCourse.modules || currentSyllabusCourse.modules.length === 0) ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                                    <BookOpen className="mx-auto size-8 text-slate-300 dark:text-slate-600" />
                                    <h5 className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                        No Syllabus Modules Yet
                                    </h5>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {canManage
                                            ? 'Start structuring this course syllabus by adding your first learning module above.'
                                            : 'The instructor is assembling the official syllabus modules for this course.'}
                                    </p>
                                    {canManage && !showAddModule && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModule(true)}
                                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500"
                                        >
                                            <Plus className="size-3.5" />
                                            <span>Create First Module</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentSyllabusCourse.modules.map((mod, modIdx) => {
                                        const isExpanded = openSyllabusModuleId === mod.id || (openSyllabusModuleId === null && modIdx === 0);
                                        return (
                                            <div
                                                key={mod.id}
                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-900/40"
                                            >
                                                <div className="flex items-center justify-between p-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/80">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenSyllabusModuleId(isExpanded ? -1 : mod.id)}
                                                        className="flex flex-1 items-center gap-3 text-left"
                                                    >
                                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xs font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                                                            {modIdx + 1}
                                                        </span>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {mod.title}
                                                            </h5>
                                                            {mod.description && (
                                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                    {mod.description}
                                                                </p>
                                                            )}
                                                            <span className="text-[11px] font-medium text-slate-400">
                                                                {mod.lessons?.length || 0} lessons included
                                                            </span>
                                                        </div>
                                                    </button>

                                                    <div className="flex items-center gap-2">
                                                        {canManage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddingLessonModuleId(addingLessonModuleId === mod.id ? null : mod.id)}
                                                                className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-950/30 dark:text-purple-300"
                                                            >
                                                                <Plus className="size-3" />
                                                                <span>Add Lesson</span>
                                                            </button>
                                                        )}
                                                        {canManage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteModule(mod.id)}
                                                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                title="Delete module"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenSyllabusModuleId(isExpanded ? -1 : mod.id)}
                                                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                                        >
                                                            <ChevronDown className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Add Lesson Inline Form */}
                                                {addingLessonModuleId === mod.id && (
                                                    <form
                                                        onSubmit={(e) => submitCreateLesson(mod.id, e)}
                                                        className="border-t border-purple-100 bg-purple-50/40 p-4 dark:border-purple-500/10 dark:bg-purple-950/20"
                                                    >
                                                        <div className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                            Add Lesson to Module {modIdx + 1}
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                                            <div className="sm:col-span-2">
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    placeholder="Lesson title e.g. Understanding Closures"
                                                                    value={lessonForm.data.title}
                                                                    onChange={(e) => lessonForm.setData('title', e.target.value)}
                                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-[#0B1220] dark:text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    placeholder="Duration (mins)"
                                                                    value={lessonForm.data.duration_minutes}
                                                                    onChange={(e) => lessonForm.setData('duration_minutes', parseInt(e.target.value) || 15)}
                                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-[#0B1220] dark:text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2.5 flex items-center justify-between">
                                                            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={lessonForm.data.is_free_preview}
                                                                    onChange={(e) => lessonForm.setData('is_free_preview', e.target.checked)}
                                                                    className="rounded text-purple-600"
                                                                />
                                                                <span>Allow Free Preview</span>
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAddingLessonModuleId(null)}
                                                                    className="px-2.5 py-1 text-xs text-slate-500"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="submit"
                                                                    disabled={lessonForm.processing}
                                                                    className="rounded-xl bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-500"
                                                                >
                                                                    Save Lesson
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                )}

                                                {/* Lessons List in Module */}
                                                {isExpanded && (
                                                    <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/30 dark:divide-slate-800/60 dark:border-slate-800 dark:bg-slate-900/20">
                                                        {(!mod.lessons || mod.lessons.length === 0) ? (
                                                            <div className="px-5 py-3 text-xs text-slate-400">
                                                                No lessons added to this module yet.
                                                            </div>
                                                        ) : (
                                                            mod.lessons.map((les, lIdx) => (
                                                                <div
                                                                    key={les.id}
                                                                    className="flex items-center justify-between px-5 py-3 transition hover:bg-purple-50/40 dark:hover:bg-purple-950/20"
                                                                >
                                                                    <div className="flex min-w-0 items-center gap-3">
                                                                        <PlayCircle className="size-4 shrink-0 text-purple-600 dark:text-purple-400" />
                                                                        <div className="min-w-0">
                                                                            <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                                                {les.title}
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-400">
                                                                                Lesson {lIdx + 1} &bull; {les.duration_minutes || 15} mins
                                                                                {les.is_free_preview && (
                                                                                    <span className="ml-1.5 rounded-sm bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                                        Preview
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <Link
                                                                            href={`/learning/courses/${currentSyllabusCourse.slug}/lessons/${les.slug}`}
                                                                            className="flex items-center gap-1 rounded-lg bg-purple-600/10 px-2.5 py-1 text-xs font-semibold text-purple-600 transition hover:bg-purple-600 hover:text-white dark:bg-purple-500/20 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white"
                                                                        >
                                                                            <span>Start</span>
                                                                            <span>&rarr;</span>
                                                                        </Link>
                                                                        {canManage && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteLesson(les.id)}
                                                                                className="p-1 text-slate-400 hover:text-rose-500"
                                                                                title="Delete lesson"
                                                                            >
                                                                                <Trash2 className="size-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800">
                            <Link
                                href={`/learning/courses/${currentSyllabusCourse.slug}`}
                                className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
                            >
                                <span>View full course workspace</span>
                                <span>&rarr;</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => {
                                    setSyllabusCourse(null);
                                    setShowAddModule(false);
                                    setAddingLessonModuleId(null);
                                }}
                                className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT COURSE MODAL */}
            {editingCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    <Pencil className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Edit Course: {editingCourse.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingCourse(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitUpdateCourse} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Course Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.title}
                                    onChange={(e) =>
                                        editForm.setData('title', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {editForm.errors.title && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {editForm.errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Category
                                    </label>
                                    <select
                                        value={editForm.data.category_id}
                                        onChange={(e) =>
                                            editForm.setData('category_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Difficulty Level *
                                    </label>
                                    <select
                                        value={editForm.data.level}
                                        onChange={(e) =>
                                            editForm.setData('level', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Duration
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.duration}
                                    onChange={(e) =>
                                        editForm.setData('duration', e.target.value)
                                    }
                                    placeholder="e.g. 6 Weeks or 20 Hours"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Brief Summary *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    value={editForm.data.summary}
                                    onChange={(e) =>
                                        editForm.setData('summary', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Visibility Toggles */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.is_published}
                                        onChange={(e) =>
                                            editForm.setData('is_published', e.target.checked)
                                        }
                                        className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Publish Course</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.is_public}
                                        onChange={(e) =>
                                            editForm.setData('is_public', e.target.checked)
                                        }
                                        className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Public Marketplace</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingCourse(null)}
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
                                            <span>Update Course</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE COURSE CONFIRMATION MODAL */}
            {deletingCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-[#0B1220]">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Delete Course
                                </h3>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        "{deletingCourse.title}"
                                    </span>
                                    ? All curriculum modules, syllabus chapters, and student enrollment records will be permanently removed.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitDeleteCourse} className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingCourse(null)}
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
                                        <span>Delete Course</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE COURSE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <BookOpen className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Create New Course
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitCreateCourse} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Course Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Advanced Physics & Mechanics"
                                    value={courseForm.data.title}
                                    onChange={(e) =>
                                        courseForm.setData('title', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                />
                                {courseForm.errors.title && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {courseForm.errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Category
                                    </label>
                                    <select
                                        value={courseForm.data.category_id}
                                        onChange={(e) =>
                                            courseForm.setData(
                                                'category_id',
                                                e.target.value ? e.target.value : ''
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Difficulty Level *
                                    </label>
                                    <select
                                        value={courseForm.data.level}
                                        onChange={(e) =>
                                            courseForm.setData('level', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Duration Estimate
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 6 Weeks, 40 Hours"
                                    value={courseForm.data.duration}
                                    onChange={(e) =>
                                        courseForm.setData('duration', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Brief Summary *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    placeholder="Short overview describing the outcomes and core skills covered..."
                                    value={courseForm.data.summary}
                                    onChange={(e) =>
                                        courseForm.setData('summary', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                />
                                {courseForm.errors.summary && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {courseForm.errors.summary}
                                    </p>
                                )}
                            </div>

                            {/* Visibility Toggles */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={courseForm.data.is_published}
                                        onChange={(e) =>
                                            courseForm.setData('is_published', e.target.checked)
                                        }
                                        className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Publish Immediately</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={courseForm.data.is_public}
                                        onChange={(e) =>
                                            courseForm.setData('is_public', e.target.checked)
                                        }
                                        className="size-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Public Marketplace</span>
                                </label>
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
                                    disabled={courseForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {courseForm.processing ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Save Course</span>
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
