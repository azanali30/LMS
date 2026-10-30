import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    BookOpen,
    PlayCircle,
    Award,
    School,
    KeyRound,
    ChevronRight,
    Sparkles,
} from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

interface Instructor {
    id: number;
    name: string;
}

interface CourseItem {
    id: number;
    title: string;
    slug: string;
    level: string;
    summary: string;
    duration?: string;
    category?: Category;
    instructor?: Instructor;
}

interface Enrollment {
    id: number;
    progress_percent: number;
    status: string;
    course: CourseItem;
}

interface Certificate {
    id: number;
    certificate_number: string;
    issued_at: string;
    course: {
        id: number;
        title: string;
    };
}

interface LearnerDashboardProps {
    enrolledCourses?: Enrollment[];
    featuredCourses?: CourseItem[];
    certificates?: Certificate[];
}

export default function IndividualLearnerDashboard({
    enrolledCourses = [],
    featuredCourses = [],
    certificates = [],
}: LearnerDashboardProps) {
    return (
        <TenantLayout title="Individual Learning Hub">
            <Head title="Learner Dashboard" />

            {/* Welcome Banner */}
            <div className="relative mb-8 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 p-6 shadow-2xl sm:p-8 md:flex-row md:items-center">
                <div className="max-w-xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                        <Sparkles className="size-3.5" />
                        <span>Self-Paced Career Track</span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        Welcome to Your Personal Learning Workspace
                    </h1>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                        Track your enrolled courses, stream HD lecture videos,
                        earn verified certificates, or connect to an academic
                        institution anytime.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2.5 sm:flex-row md:w-auto">
                    <Link
                        href="/learning/courses"
                        className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500"
                    >
                        <BookOpen className="size-4" />
                        <span>Explore Catalog</span>
                    </Link>
                    <Link
                        href="/organizations/create"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                        <School className="size-4 text-purple-400" />
                        <span>Create / Join School</span>
                    </Link>
                </div>
            </div>

            {/* Active Enrolled Courses */}
            <div className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="size-5 text-purple-400" />
                        <h2 className="text-base font-bold text-white">
                            Your Courses in Progress
                        </h2>
                    </div>
                    <Link
                        href="/learning/courses"
                        className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300"
                    >
                        <span>Browse Catalog</span>
                        <ChevronRight className="size-3.5" />
                    </Link>
                </div>

                {enrolledCourses.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                        <BookOpen className="mx-auto mb-2 size-8 text-slate-400 dark:text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            No active enrollments yet
                        </h3>
                        <p className="mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">
                            Browse our verified course offerings and start
                            advancing your skills today.
                        </p>
                        <Link
                            href="/learning/courses"
                            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500"
                        >
                            <span>Find Courses</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {enrolledCourses.map((enr) => (
                            <div
                                key={enr.id}
                                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-purple-300 dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-lg dark:hover:border-purple-500/40"
                            >
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                        <span className="font-medium text-purple-600 dark:text-purple-400">
                                            {enr.course.category?.name ||
                                                'Curriculum'}
                                        </span>
                                        <span className="capitalize">
                                            {enr.course.level}
                                        </span>
                                    </div>
                                    <h3 className="line-clamp-2 text-sm font-bold text-slate-900 transition group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-300">
                                        {enr.course.title}
                                    </h3>
                                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                        {enr.course.summary}
                                    </p>
                                </div>

                                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            Progress
                                        </span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400">
                                            {enr.progress_percent}%
                                        </span>
                                    </div>
                                    <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-1.5 rounded-full bg-purple-500"
                                            style={{
                                                width: `${enr.progress_percent}%`,
                                            }}
                                        />
                                    </div>
                                    <Link
                                        href={`/learning/courses/${enr.course.slug}`}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition group-hover:border-transparent group-hover:bg-purple-600 group-hover:text-white dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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

            {/* Certificates Achieved */}
            {certificates.length > 0 && (
                <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="mb-4 flex items-center gap-2">
                        <Award className="size-5 text-amber-500 dark:text-amber-400" />
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            Your Earned Certificates ({certificates.length})
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {certificates.map((cert) => (
                            <div
                                key={cert.id}
                                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                            >
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                        {cert.course.title}
                                    </div>
                                    <div className="mt-0.5 font-mono text-[10px] text-purple-600 dark:text-purple-400">
                                        {cert.certificate_number}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {cert.issued_at?.slice(0, 10)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Catalog Discovery */}
            <div className="mb-10">
                <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Recommended Courses for You
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {featuredCourses.map((c) => (
                        <div
                            key={c.id}
                            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-lg dark:hover:border-indigo-500/30"
                        >
                            <div>
                                <span className="mb-1 block text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                    {c.category?.name || 'General'} &bull;{' '}
                                    <span className="capitalize">
                                        {c.level}
                                    </span>
                                </span>
                                <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                                    {c.title}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                    {c.summary}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {c.duration || 'Self-Paced'}
                                </span>
                                <Link
                                    href={`/learning/courses/${c.slug}`}
                                    className="text-xs font-semibold text-purple-400 hover:text-purple-300"
                                >
                                    View Syllabus &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* School Invitation Redemption Card */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-600/10 text-purple-400">
                        <KeyRound className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">
                            Have a School Invitation Token?
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Connect your learner account directly to your
                            school, academy, or university cohort.
                        </p>
                    </div>
                </div>

                <Link
                    href="/organizations/create"
                    className="self-end rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 sm:self-auto"
                >
                    Redeem Token
                </Link>
            </div>
        </TenantLayout>
    );
}
