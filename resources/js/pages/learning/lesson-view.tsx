import { Head, router, Link } from '@inertiajs/react';
import {
    PlayCircle,
    CheckCircle2,
    ArrowLeft,
    Layers,
    Check,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';

interface LessonDetail {
    id: number;
    title: string;
    slug: string;
    type: string;
    video_url?: string;
    content?: string;
    duration_minutes: number;
    is_free_preview: boolean;
}

interface ModuleItem {
    id: number;
    title: string;
    lessons: LessonDetail[];
}

interface CourseItem {
    id: number;
    title: string;
    slug: string;
    modules: ModuleItem[];
}

interface LessonViewProps {
    course: CourseItem;
    lesson: LessonDetail;
    isCompleted: boolean;
    completedLessonIds?: number[];
}

export default function LessonViewPage({
    course,
    lesson,
    isCompleted,
    completedLessonIds = [],
}: LessonViewProps) {
    const [completing, setCompleting] = useState(false);

    const markComplete = () => {
        setCompleting(true);
        router.post(
            `/learning/courses/${course.id}/lessons/${lesson.id}/complete`,
            {},
            {
                onFinish: () => setCompleting(false),
            },
        );
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#070b14] font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
            <Head title={`${lesson.title} — ${course.title}`} />

            {/* Top Learning Bar */}
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-[#0B1220]/90 px-6 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/learning/courses/${course.slug}`}
                        className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">
                            Back to Syllabus
                        </span>
                    </Link>
                    <span className="hidden text-slate-700 sm:inline">
                        &bull;
                    </span>
                    <span className="max-w-sm truncate text-xs font-semibold text-white sm:max-w-md">
                        {course.title}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {isCompleted ? (
                        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            <span>Lesson Completed</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            disabled={completing}
                            onClick={markComplete}
                            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-60"
                        >
                            {completing ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Check className="size-3.5" />
                            )}
                            <span>Mark as Complete</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Split Screen Classroom Experience */}
            <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
                {/* Main Player & Content */}
                <main className="flex flex-1 flex-col items-center overflow-y-auto p-6 lg:p-10">
                    <div className="w-full max-w-4xl">
                        {/* Video Container */}
                        <div className="relative mb-8 flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 to-indigo-900/20" />
                            <div className="relative z-10 px-4 text-center">
                                <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-purple-500/40 bg-purple-600/30 text-purple-300 shadow-xl">
                                    <PlayCircle className="size-8" />
                                </div>
                                <h3 className="text-base font-bold text-white sm:text-lg">
                                    {lesson.title}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Duration: {lesson.duration_minutes} minutes
                                    &bull; Interactive Streaming Player
                                </p>
                            </div>
                        </div>

                        {/* Lesson Transcript / Reading Content */}
                        <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-xl sm:p-8">
                            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h1 className="text-xl font-bold text-white sm:text-2xl">
                                        {lesson.title}
                                    </h1>
                                    <span className="text-xs text-slate-400 capitalize">
                                        {lesson.type} module
                                    </span>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none space-y-4 text-sm leading-relaxed text-slate-300">
                                <p>
                                    Welcome to this lecture on{' '}
                                    <strong className="text-white">
                                        {lesson.title}
                                    </strong>
                                    . In this module, we explore core
                                    foundations, practical methodology, and
                                    real-world architectures.
                                </p>
                                <p>
                                    Review the accompanying code walkthrough,
                                    complete the exercises in your local
                                    development environment, and mark this
                                    lesson as completed to track your
                                    certification progress.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Curriculum Drawer */}
                <aside className="flex w-full flex-col border-t border-slate-800 bg-[#0B1220] lg:w-96 lg:border-t-0 lg:border-l">
                    <div className="flex items-center gap-2 border-b border-slate-800 p-4">
                        <Layers className="size-4 text-purple-400" />
                        <h2 className="text-xs font-bold tracking-wider text-white uppercase">
                            Curriculum Index
                        </h2>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                        {course.modules.map((mod, modIdx) => (
                            <div
                                key={mod.id}
                                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
                            >
                                <div className="border-b border-slate-800/80 bg-slate-900/80 px-3.5 py-2.5 text-xs font-bold text-slate-300">
                                    {modIdx + 1}. {mod.title}
                                </div>
                                <div className="divide-y divide-slate-800/50">
                                    {mod.lessons.map((les) => {
                                        const isCurrent = les.id === lesson.id;
                                        const isDone =
                                            completedLessonIds.includes(les.id);
                                        return (
                                            <Link
                                                key={les.id}
                                                href={`/learning/courses/${course.slug}/lessons/${les.slug}`}
                                                className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition ${
                                                    isCurrent
                                                        ? 'border-l-2 border-purple-500 bg-purple-600/20 font-semibold text-purple-300'
                                                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    {isDone ? (
                                                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                                                    ) : (
                                                        <PlayCircle className="size-3.5 shrink-0 text-slate-500" />
                                                    )}
                                                    <span className="truncate">
                                                        {les.title}
                                                    </span>
                                                </div>
                                                <span className="shrink-0 text-[10px] text-slate-500">
                                                    {les.duration_minutes}m
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
