import { router, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import TenantLayout from '@/layouts/tenant-layout';
import {
    PlayCircle,
    Lock,
    Clock,
    Layers,
    ChevronDown,
    ArrowLeft,
    Sparkles,
    Plus,
    Trash2,
    BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface LessonItem {
    id: number;
    title: string;
    slug: string;
    type: string;
    duration_minutes: number;
    is_free_preview: boolean;
}

interface ModuleItem {
    id: number;
    title: string;
    order: number;
    description?: string;
    lessons: LessonItem[];
}

interface CourseDetail {
    id: number;
    title: string;
    slug: string;
    level: string;
    duration?: string;
    summary: string;
    description?: string;
    is_public: boolean;
    category?: {
        name: string;
    };
    instructor?: {
        name: string;
    };
    modules: ModuleItem[];
}

interface Enrollment {
    id: number;
    progress_percent: number;
    status: string;
}

interface CourseShowProps {
    course: CourseDetail;
    isEnrolled?: boolean;
    enrollment?: Enrollment | null;
    canManage?: boolean;
    isDashboard?: boolean;
}

export default function CourseShowPage({
    course,
    isEnrolled = false,
    enrollment,
    canManage = false,
    isDashboard = false,
}: CourseShowProps) {
    const { auth } = usePage().props as any;
    const isInsideLms = isDashboard || Boolean(auth?.user);
    const LayoutComponent = isInsideLms ? TenantLayout : PublicLayout;

    const [openModules, setOpenModules] = useState<Record<number, boolean>>({
        [course.modules[0]?.id || 0]: true,
    });

    const [showAddModule, setShowAddModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newModuleDesc, setNewModuleDesc] = useState('');

    const [addingLessonModuleId, setAddingLessonModuleId] = useState<number | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDuration, setNewLessonDuration] = useState(15);
    const [newLessonPreview, setNewLessonPreview] = useState(false);

    const toggleModule = (modId: number) => {
        setOpenModules((prev) => ({
            ...prev,
            [modId]: !prev[modId],
        }));
    };

    const handleEnroll = () => {
        router.post(`/learning/courses/${course.id}/enroll`);
    };

    const handleCreateModule = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/learning/courses/${course.id}/modules`,
            { title: newModuleTitle, description: newModuleDesc },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewModuleTitle('');
                    setNewModuleDesc('');
                    setShowAddModule(false);
                },
            }
        );
    };

    const handleCreateLesson = (moduleId: number, e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/learning/modules/${moduleId}/lessons`,
            {
                title: newLessonTitle,
                duration_minutes: newLessonDuration,
                is_free_preview: newLessonPreview,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewLessonTitle('');
                    setNewLessonDuration(15);
                    setNewLessonPreview(false);
                    setAddingLessonModuleId(null);
                },
            }
        );
    };

    const handleDeleteModule = (moduleId: number) => {
        if (!confirm('Are you sure you want to remove this module and its lessons?')) return;
        router.delete(`/learning/modules/${moduleId}`, { preserveScroll: true });
    };

    const handleDeleteLesson = (lessonId: number) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        router.delete(`/learning/lessons/${lessonId}`, { preserveScroll: true });
    };

    const firstLesson = course.modules[0]?.lessons[0];

    return (
        <LayoutComponent title={`${course.title} — Course Syllabus`}>
            <div className="mx-auto w-full max-w-[1720px] px-6 py-10 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                <div className="mb-6">
                    <Link
                        href={isInsideLms ? '/learning/courses' : '/courses'}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-[#078675]"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>{isInsideLms ? 'Back to Courses' : 'Back to Course Catalog'}</span>
                    </Link>
                </div>

                {/* Course Header Hero */}
                <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-[#F5F8F7] p-6 shadow-sm sm:p-10">
                    <div className="relative max-w-3xl">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold tracking-wider text-[#078675] uppercase">
                                {course.category?.name || 'Curriculum Track'}
                            </span>
                            <span className="text-slate-400">&bull;</span>
                            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700 capitalize">
                                {course.level}
                            </span>
                            {course.duration && (
                                <>
                                    <span className="text-slate-400">&bull;</span>
                                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                        <Clock className="size-3 text-[#078675]" />
                                        <span>{course.duration}</span>
                                    </span>
                                </>
                            )}
                        </div>

                        <h1 className="text-2xl font-black tracking-tight text-[#173A5E] sm:text-4xl">
                            {course.title}
                        </h1>

                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            {course.summary}
                        </p>

                        <div className="mt-4 flex items-center gap-5 text-xs text-slate-500">
                            <span>
                                Instructor:{' '}
                                <strong className="text-slate-800">
                                    {course.instructor?.name || 'Faculty Member'}
                                </strong>
                            </span>
                            <span>
                                Modules:{' '}
                                <strong className="text-slate-800">
                                    {course.modules.length}
                                </strong>
                            </span>
                        </div>

                        {/* Action Area */}
                        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
                            {isEnrolled ? (
                                <div className="flex flex-wrap items-center gap-4">
                                    {firstLesson && (
                                        <Link
                                            href={`/learning/courses/${course.slug}/lessons/${firstLesson.slug}`}
                                            className="flex items-center gap-2 rounded-xl bg-[#173A5E] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#056b5e]"
                                        >
                                            <PlayCircle className="size-4" />
                                            <span>Continue Learning</span>
                                        </Link>
                                    )}
                                    <div className="text-xs text-slate-600">
                                        Enrolled &bull;{' '}
                                        <strong className="text-[#078675]">
                                            {enrollment?.progress_percent || 0}% Complete
                                        </strong>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleEnroll}
                                    size="lg"
                                    className="bg-[#E49A2E] font-bold text-white shadow-md hover:bg-[#d08a24]"
                                >
                                    <Sparkles className="size-4 mr-2" />
                                    <span>Enroll in Course</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Curriculum Modules & Lessons Accordion */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Layers className="size-5 text-[#078675]" />
                            <h2 className="text-lg font-bold tracking-tight text-[#173A5E]">
                                Course Curriculum & Syllabus
                            </h2>
                        </div>

                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setShowAddModule((prev) => !prev)}
                                className="flex items-center gap-1.5 rounded-xl bg-[#173A5E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#056b5e]"
                            >
                                <Plus className="size-3.5" />
                                <span>{showAddModule ? 'Cancel' : 'Add Module'}</span>
                            </button>
                        )}
                    </div>

                    {/* Inline Add Module Form for Instructors */}
                    {canManage && showAddModule && (
                        <form
                            onSubmit={handleCreateModule}
                            className="mb-6 rounded-2xl border border-[#078675]/20 bg-[#078675]/10 p-4"
                        >
                            <h4 className="mb-3 text-xs font-bold text-slate-900">
                                Add New Syllabus Module
                            </h4>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    required
                                    placeholder="Module title (e.g. Module 1: Foundations of System Architecture)"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#078675]"
                                />
                                <textarea
                                    rows={2}
                                    placeholder="Module overview / objectives (optional)..."
                                    value={newModuleDesc}
                                    onChange={(e) => setNewModuleDesc(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#078675]"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModule(false)}
                                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-[#173A5E] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#056b5e]"
                                    >
                                        Save Module
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4">
                        {course.modules.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
                                <p className="text-xs text-slate-500">
                                    No modules published for this course yet.
                                </p>
                                {canManage && !showAddModule && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModule(true)}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#173A5E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#056b5e]"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Create First Module</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            course.modules.map((mod, modIdx) => {
                                const isOpen = openModules[mod.id] ?? false;
                                return (
                                    <div
                                        key={mod.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-[#F5F8F7]"
                                    >
                                        <div className="flex items-center justify-between px-5 py-4 transition hover:bg-slate-100/70">
                                            <button
                                                type="button"
                                                onClick={() => toggleModule(mod.id)}
                                                className="flex flex-1 items-center gap-3 text-left"
                                            >
                                                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-[#078675]">
                                                    {modIdx + 1}
                                                </span>
                                                <div>
                                                    <h3 className="text-sm font-bold text-[#173A5E]">
                                                        {mod.title}
                                                    </h3>
                                                    {mod.description && (
                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            {mod.description}
                                                        </p>
                                                    )}
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        {mod.lessons.length} lessons
                                                    </span>
                                                </div>
                                            </button>

                                            <div className="flex items-center gap-2">
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddingLessonModuleId(addingLessonModuleId === mod.id ? null : mod.id)}
                                                        className="flex items-center gap-1 rounded-lg border border-[#078675]/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#078675] hover:bg-[#078675]/10"
                                                    >
                                                        <Plus className="size-3" />
                                                        <span>Add Lesson</span>
                                                    </button>
                                                )}
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteModule(mod.id)}
                                                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                                                        title="Delete module"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModule(mod.id)}
                                                    className="p-1 text-slate-400 hover:text-slate-600"
                                                >
                                                    <ChevronDown
                                                        className={`size-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#078675]' : ''}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline Add Lesson Form for Instructors */}
                                        {canManage && addingLessonModuleId === mod.id && (
                                            <form
                                                onSubmit={(e) => handleCreateLesson(mod.id, e)}
                                                className="border-t border-slate-200 bg-white p-4"
                                            >
                                                <div className="mb-2 text-xs font-bold text-slate-800">
                                                    Add Lesson to Module {modIdx + 1}
                                                </div>
                                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                                    <div className="sm:col-span-2">
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Lesson title e.g. Scope, Hoisting & Closures"
                                                            value={newLessonTitle}
                                                            onChange={(e) => setNewLessonTitle(e.target.value)}
                                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#078675]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="Minutes"
                                                            value={newLessonDuration}
                                                            onChange={(e) => setNewLessonDuration(parseInt(e.target.value) || 15)}
                                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#078675]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2.5 flex items-center justify-between">
                                                    <label className="flex items-center gap-2 text-xs text-slate-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={newLessonPreview}
                                                            onChange={(e) => setNewLessonPreview(e.target.checked)}
                                                            className="rounded text-[#078675]"
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
                                                            className="rounded-xl bg-[#173A5E] px-3 py-1 text-xs font-bold text-white hover:bg-[#056b5e]"
                                                        >
                                                            Save Lesson
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}

                                        {isOpen && (
                                            <div className="divide-y divide-slate-100 border-t border-slate-200 bg-white">
                                                {mod.lessons.length === 0 ? (
                                                    <div className="px-6 py-3 text-xs text-slate-400">
                                                        No lessons added to this module yet.
                                                    </div>
                                                ) : (
                                                    mod.lessons.map((les) => (
                                                        <div
                                                            key={les.id}
                                                            className="flex items-center justify-between px-6 py-3.5 transition hover:bg-slate-50"
                                                        >
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <PlayCircle className="size-4 shrink-0 text-[#078675]" />
                                                                <div className="min-w-0">
                                                                    <div className="truncate text-xs font-bold text-slate-900">
                                                                        {les.title}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 capitalize">
                                                                        {les.type || 'Lesson'} &bull; {les.duration_minutes} min
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {isEnrolled || les.is_free_preview ? (
                                                                    <Link
                                                                        href={`/learning/courses/${course.slug}/lessons/${les.slug}`}
                                                                        className="flex items-center gap-1 text-xs font-bold text-[#078675] hover:underline"
                                                                    >
                                                                        <span>
                                                                            {les.is_free_preview && !isEnrolled
                                                                                ? 'Free Preview'
                                                                                : 'Start'}
                                                                        </span>
                                                                        <span>&rarr;</span>
                                                                    </Link>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                                        <Lock className="size-3 text-slate-400" />
                                                                        <span>Enrolled only</span>
                                                                    </div>
                                                                )}

                                                                {canManage && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteLesson(les.id)}
                                                                        className="p-1 text-slate-400 hover:text-rose-500"
                                                                        title="Delete lesson"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
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
                            })
                        )}
                    </div>
                </div>
            </div>
        </LayoutComponent>
    );
}
