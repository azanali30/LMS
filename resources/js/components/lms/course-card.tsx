import { Link } from '@inertiajs/react';
import { ArrowUpRight, Award, Sparkles, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { register } from '@/routes';
import type { Course } from './course-types';

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    return (
        <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1769E0]/40 hover:shadow-xl hover:shadow-[#1769E0]/10">
            {/* Top Banner / Graphic representation */}
            <div
                className={`relative flex h-48 w-full flex-col justify-between overflow-hidden bg-gradient-to-br ${course.gradient} p-5 text-white`}
            >
                {/* Subtle grid pattern overlay */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15"
                />

                {/* Badges Row */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
                        {course.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                        {course.popular && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF7A30] px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                                <Sparkles className="size-3" />
                                Popular
                            </span>
                        )}
                        <span className="rounded-full bg-slate-950/40 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-md">
                            {course.level}
                        </span>
                    </div>
                </div>

                {/* Center graphic icon */}
                <div className="relative z-10 my-auto flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                        <Award className="size-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-white/80">
                            Verified Certification Track
                        </span>
                        <span className="text-sm font-semibold tracking-tight text-white">
                            {course.duration} · {course.lessonsCount} Modules
                        </span>
                    </div>
                </div>

                {/* Bottom stats inside banner */}
                <div className="relative z-10 flex items-center justify-between text-xs text-white/85">
                    <div className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-300 text-amber-300" />
                        <span className="font-bold text-white">
                            {course.rating}
                        </span>
                        <span className="text-white/70">
                            ({course.reviewsCount.toLocaleString()})
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        <span>Enrolled Track</span>
                    </div>
                </div>
            </div>

            {/* Card Content Body */}
            <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                <div className="space-y-3">
                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5">
                        {course.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Course Title */}
                    <h3 className="line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-[#1769E0]">
                        {course.title}
                    </h3>

                    {/* Course Description */}
                    <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                        {course.description}
                    </p>
                </div>

                {/* Instructor & Actions Footer */}
                <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            className="size-9 rounded-full object-cover ring-1 ring-slate-200"
                            loading="lazy"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-900">
                                {course.instructor.name}
                            </span>
                            <span className="max-w-[170px] truncate text-[11px] text-slate-500">
                                {course.instructor.role}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-slate-500">
                                Access
                            </span>
                            <span className="text-xs font-bold text-[#1769E0]">
                                {course.price}
                            </span>
                        </div>

                        <Button
                            asChild
                            size="sm"
                            className="bg-[#FF7A30] text-xs font-semibold text-white shadow-xs hover:bg-[#E5661E]"
                        >
                            <Link href={register()}>
                                Enroll Now
                                <ArrowUpRight className="ml-1 size-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
