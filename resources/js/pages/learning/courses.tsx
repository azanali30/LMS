import { router, Link } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import {
    BookOpen,
    Search,
    Filter,
    PlayCircle,
    Users,
    Layers,
    Sparkles,
    ArrowRight,
    GraduationCap,
    Clock,
    Award,
    CheckCircle2,
    Star,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourseCategory {
    id: number;
    name: string;
    slug: string;
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
    duration?: string;
    summary: string;
    thumbnail_path?: string | null;
    is_public: boolean;
    is_published: boolean;
    modules_count: number;
    enrollments_count: number;
    category?: CourseCategory;
    instructor?: Instructor;
}

interface CoursesProps {
    courses: {
        data: CourseItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total?: number;
    };
    categories?: CourseCategory[];
    filters?: {
        category?: string;
        search?: string;
    };
}

// Curated educational photography thumbnails for course cards
const COURSE_THUMBNAILS = [
    '/images/student-learning.jpg',
    '/images/teacher-classroom.jpg',
    '/images/school-admin.jpg',
    '/images/hero-lms-platform.jpg',
    '/images/parent-student.jpg',
];

export default function CoursesCatalogPage({
    courses,
    categories = [],
    filters = {},
}: CoursesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || '',
    );

    const handleFilter = (catSlug: string, query: string) => {
        router.get(
            '/courses',
            {
                category: catSlug || undefined,
                search: query || undefined,
            },
            { preserveState: true },
        );
    };

    const getCourseThumbnail = (course: CourseItem, index: number) => {
        if (course.thumbnail_path && course.thumbnail_path.trim() !== '') {
            return course.thumbnail_path;
        }
        return COURSE_THUMBNAILS[index % COURSE_THUMBNAILS.length];
    };

    const getLevelBadge = (level: string) => {
        const normalized = (level || 'All Levels').toLowerCase();
        if (normalized.includes('beg')) {
            return {
                label: 'Beginner',
                className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            };
        }
        if (normalized.includes('adv')) {
            return {
                label: 'Advanced',
                className: 'bg-blue-50 text-[#1769E0] border-blue-200',
            };
        }
        return {
            label: 'Intermediate',
            className: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    };

    return (
        <PublicLayout title="Explore Courses & Specializations — SkillForge LMS">
            {/* FULL-WIDTH HERO SECTION (Left-Aligned, RingCentral Style) */}
            <section className="relative w-full border-b border-slate-200/80 bg-white pt-14 pb-12 sm:pt-18 sm:pb-16">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-[#1769E0]">
                                <Sparkles className="size-3.5" />
                                <span>Curated Specializations & Cohort Tracks</span>
                            </div>

                            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B1528] sm:text-5xl lg:text-6xl">
                                Explore Courses & Learning Tracks
                            </h1>

                            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                                Master modern skills through structured video lessons, comprehensive syllabus units, interactive assignments, and verifiable digital graduation certificates.
                            </p>
                        </div>

                        {/* Quick Trust Badges on the right */}
                        <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F7F9FC] px-4 py-2.5 text-xs font-medium text-slate-700 shadow-xs">
                                <Award className="size-4 text-[#1769E0]" />
                                <span>Verifiable Digital Certificates</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F7F9FC] px-4 py-2.5 text-xs font-medium text-slate-700 shadow-xs">
                                <GraduationCap className="size-4 text-[#1769E0]" />
                                <span>Multi-Tenant School Access</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FULL-WIDTH CATALOG BODY & FILTER SYSTEM */}
            <section className="w-full bg-[#F7F9FC] py-10 sm:py-14 min-h-[700px]">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    
                    {/* FULL-WIDTH SEARCH & CATEGORY BAR */}
                    <div className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                        {/* Search input and clear action */}
                        <div className="relative w-full">
                            <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search courses by topic, syllabus keywords, or subject..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilter(selectedCategory, e.target.value);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#1769E0] focus:bg-white focus:ring-2 focus:ring-[#1769E0]/20"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        handleFilter(selectedCategory, '');
                                    }}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        {/* Category Filter Pills (Spanning full width horizontally) */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                            <div className="mr-2 flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <Filter className="size-3.5" />
                                <span>Filter by Track:</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory('');
                                    handleFilter('', search);
                                }}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                    selectedCategory === ''
                                        ? 'bg-[#1769E0] text-white shadow-xs'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                All Tracks
                            </button>

                            {categories.map((c) => {
                                const isActive = selectedCategory === c.slug;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            const newCat = isActive ? '' : c.slug;
                                            setSelectedCategory(newCat);
                                            handleFilter(newCat, search);
                                        }}
                                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                            isActive
                                                ? 'bg-[#1769E0] text-white shadow-xs'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {c.name}
                                    </button>
                                );
                            })}

                            {(selectedCategory || search) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedCategory('');
                                        handleFilter('', '');
                                    }}
                                    className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                                >
                                    <span>Reset All</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* COURSES CATALOG RESPONSIVE GRID (3-4 on Desktop, 2 on Tablet, 1 on Mobile) */}
                    {courses.data.length === 0 ? (
                        <div className="w-full rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">
                            <BookOpen className="mx-auto mb-3 size-12 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-900">
                                No courses match your criteria
                            </h3>
                            <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
                                Try clearing your search query or selecting a different category above.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setSelectedCategory('');
                                    handleFilter('', '');
                                }}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1769E0]"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                            {courses.data.map((course, idx) => {
                                const levelBadge = getLevelBadge(course.level);
                                const thumbnail = getCourseThumbnail(course, idx);

                                return (
                                    <div
                                        key={course.id}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#1769E0]/40 hover:shadow-xl"
                                    >
                                        {/* VISUAL IMAGE BANNER */}
                                        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                                            <img
                                                src={thumbnail}
                                                alt={course.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            {/* Gradient overlay for text contrast */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />

                                            {/* Category Badge on top-left */}
                                            <div className="absolute left-3 top-3">
                                                <span className="inline-flex items-center rounded-full border border-white/60 bg-white/95 px-3 py-1 text-[11px] font-bold text-[#1769E0] shadow-xs backdrop-blur-xs">
                                                    {course.category?.name || 'Academic Track'}
                                                </span>
                                            </div>

                                            {/* Level Badge on top-right */}
                                            <div className="absolute right-3 top-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize shadow-xs backdrop-blur-xs ${levelBadge.className}`}
                                                >
                                                    {levelBadge.label}
                                                </span>
                                            </div>

                                            {/* Module & Duration Indicator on bottom of image */}
                                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-medium text-white">
                                                <span className="flex items-center gap-1 drop-shadow-sm">
                                                    <Layers className="size-3.5 text-blue-300" />
                                                    {course.modules_count} Modules
                                                </span>
                                                <span className="flex items-center gap-1 drop-shadow-sm">
                                                    <Users className="size-3.5 text-blue-300" />
                                                    {course.enrollments_count} Enrolled
                                                </span>
                                            </div>
                                        </div>

                                        {/* CARD CONTENT BODY */}
                                        <div className="flex flex-1 flex-col justify-between p-5">
                                            <div>
                                                {/* Instructor if available */}
                                                {course.instructor && (
                                                    <div className="mb-2 text-[11px] font-semibold text-slate-500">
                                                        Instructor: {course.instructor.name}
                                                    </div>
                                                )}

                                                {/* Title */}
                                                <h3 className="line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-[#1769E0]">
                                                    {course.title}
                                                </h3>

                                                {/* Summary Description */}
                                                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                                                    {course.summary}
                                                </p>
                                            </div>

                                            {/* ACTION & ENROLLMENT FOOTER */}
                                            <div className="mt-5 border-t border-slate-100 pt-4">
                                                <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
                                                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Certificate Included
                                                    </span>
                                                    <span className="text-slate-400">
                                                        Self-Paced
                                                    </span>
                                                </div>

                                                <Link
                                                    href={`/courses/${course.slug}`}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1256B8]"
                                                >
                                                    <PlayCircle className="size-4" />
                                                    <span>View Syllabus & Enroll</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PAGINATION */}
                    {courses.links && courses.links.length > 3 && (
                        <div className="mt-12 flex justify-center gap-1.5">
                            {courses.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                        link.active
                                            ? 'bg-[#1769E0] text-white shadow-xs'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}

CoursesCatalogPage.layout = (page: React.ReactNode) => page;
