import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    Calendar as CalendarIcon,
    Clock,
    Plus,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    AlertTriangle,
    GraduationCap,
    Users,
    BookOpen,
    MapPin,
    Filter,
    Loader2,
    Layers,
    Share2,
} from 'lucide-react';

interface TimetablePeriod {
    id: number;
    day_of_week: string; // monday, tuesday, wednesday, thursday, friday, saturday, sunday
    period_name?: string;
    start_time: string;
    end_time: string;
    room?: string;
    notes?: string;
    is_published: boolean;
    subject: {
        id: number;
        name: string;
        code?: string;
    };
    teacher?: {
        id: number;
        name: string;
        email: string;
    };
    school_class?: {
        id: number;
        name: string;
    };
    class_section?: {
        id: number;
        name: string;
    };
}

interface ClassItem {
    id: number;
    name: string;
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
}

interface OrgTeacher {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface TimetableProps {
    isStudent: boolean;
    isTeacher: boolean;
    canManage: boolean;
    teachingHours?: number;
    assignedCohortsCount?: number;
    enrollment?: {
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
    entries: TimetablePeriod[];
    selectedSectionId?: number | null;
    selectedTeacherId?: number | null;
    selectedClassId?: number | null;
    viewMode?: string;
    currentAcademicYear?: {
        id: number;
        name: string;
    } | null;
    academicYears?: Array<{ id: number; name: string }>;
    classes?: ClassItem[];
    sections?: SectionItem[];
    subjects?: SubjectItem[];
    teachers?: OrgTeacher[];
}

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
];

export default function TimetablePage({
    isStudent,
    isTeacher,
    canManage,
    teachingHours = 0,
    assignedCohortsCount = 0,
    enrollment,
    entries = [],
    selectedSectionId,
    selectedTeacherId,
    selectedClassId,
    viewMode = 'section',
    currentAcademicYear,
    academicYears = [],
    classes = [],
    sections = [],
    subjects = [],
    teachers = [],
}: TimetableProps) {
    // Current day detection (monday..sunday)
    const currentDayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const currentDayKey =
        ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDayIndex] || 'monday';

    const [activeMobileDay, setActiveMobileDay] = useState<string>(
        ['sunday'].includes(currentDayKey) ? 'monday' : currentDayKey
    );

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<TimetablePeriod | null>(null);

    // Period Creation Form
    const periodForm = useForm({
        academic_year_id: currentAcademicYear?.id || (academicYears[0]?.id ?? 0),
        school_class_id: classes[0]?.id || 0,
        class_section_id: selectedSectionId || (sections[0]?.id ?? 0),
        subject_id: subjects[0]?.id || 0,
        teacher_id: teachers[0]?.user.id || '',
        day_of_week: 'monday',
        period_name: 'Period 1',
        start_time: '08:30',
        end_time: '09:15',
        room: '',
        notes: '',
        is_published: true,
    });

    // Period Edit Form
    const editPeriodForm = useForm({
        academic_year_id: 0,
        school_class_id: 0,
        class_section_id: 0,
        subject_id: 0,
        teacher_id: '',
        day_of_week: 'monday',
        period_name: '',
        start_time: '08:30',
        end_time: '09:15',
        room: '',
        notes: '',
        is_published: true,
    });

    const deletePeriodForm = useForm({});
    const publishForm = useForm({
        class_section_id: selectedSectionId || 0,
        is_published: true,
    });

    // Filter changes
    const handleSectionChange = (sectionId: number | string) => {
        if (!sectionId) {
            router.get(
                '/school/timetable',
                { view_mode: isTeacher ? 'my_schedule' : 'section' },
                { preserveState: true }
            );
        } else {
            router.get(
                '/school/timetable',
                { class_section_id: sectionId, view_mode: isTeacher ? 'my_schedule' : 'section' },
                { preserveState: true }
            );
        }
    };

    const handleTeacherFilterChange = (teacherId: string) => {
        router.get(
            '/school/timetable',
            { teacher_id: teacherId || undefined, view_mode: 'teacher' },
            { preserveState: true }
        );
    };

    const handleViewModeToggle = (mode: string) => {
        router.get('/school/timetable', { view_mode: mode }, { preserveState: true });
    };

    const submitCreatePeriod = (e: React.FormEvent) => {
        e.preventDefault();
        periodForm.post('/school/timetable', {
            onSuccess: () => {
                setShowCreateModal(false);
                periodForm.reset();
            },
        });
    };

    const startEditingPeriod = (period: TimetablePeriod) => {
        setEditingPeriod(period);
        editPeriodForm.setData({
            academic_year_id: currentAcademicYear?.id || 0,
            school_class_id: period.school_class?.id || 0,
            class_section_id: period.class_section?.id || 0,
            subject_id: period.subject.id,
            teacher_id: period.teacher ? String(period.teacher.id) : '',
            day_of_week: period.day_of_week,
            period_name: period.period_name || '',
            start_time: period.start_time.substring(0, 5),
            end_time: period.end_time.substring(0, 5),
            room: period.room || '',
            notes: period.notes || '',
            is_published: period.is_published,
        });
    };

    const submitUpdatePeriod = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPeriod) return;
        editPeriodForm.put(`/school/timetable/${editingPeriod.id}`, {
            onSuccess: () => setEditingPeriod(null),
        });
    };

    const submitDeletePeriod = (periodId: number) => {
        if (!confirm('Are you sure you want to remove this timetable period?')) return;
        deletePeriodForm.delete(`/school/timetable/${periodId}`);
    };

    const togglePublishSection = (publish: boolean) => {
        if (!selectedSectionId) return;
        publishForm.setData({
            class_section_id: selectedSectionId,
            is_published: publish,
        });
        publishForm.post('/school/timetable/publish');
    };

    // Group entries by day
    const entriesByDay: Record<string, TimetablePeriod[]> = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
    };

    entries.forEach((entry) => {
        const day = entry.day_of_week.toLowerCase();
        if (entriesByDay[day]) {
            entriesByDay[day].push(entry);
        }
    });

    // Sort each day chronologically
    Object.keys(entriesByDay).forEach((day) => {
        entriesByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    const activeSection = sections.find((s) => s.id === selectedSectionId);

    return (
        <TenantLayout title={isStudent || isTeacher ? 'My Timetable' : 'Timetable & Schedule'}>
            <Head title="Class Timetable & Weekly Schedules" />

            {/* Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <Clock className="size-6 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isStudent
                                ? 'My Weekly Class Schedule'
                                : isTeacher
                                ? 'Faculty Teaching Timetable'
                                : 'School Timetable & Period Schedules'}
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isStudent
                            ? 'Official weekly schedule, class timings, assigned educators, and room allocations.'
                            : isTeacher
                            ? 'Weekly assigned instruction sessions across classroom cohorts and designated lab rooms.'
                            : 'Configure academic periods, prevent faculty double-bookings, and publish class weekly schedules.'}
                    </p>
                </div>

                {/* Right Header Status / Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    {isStudent && enrollment && (
                        <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-800 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-300">
                            <GraduationCap className="size-4 text-purple-600 dark:text-purple-400" />
                            <span>
                                {enrollment.class_section.school_class.name} — {enrollment.class_section.name}
                            </span>
                        </div>
                    )}

                    {isTeacher && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/30 dark:text-purple-300">
                                <Clock className="size-3.5" />
                                <span>{teachingHours} Teaching hrs/week</span>
                            </span>
                            <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300">
                                <GraduationCap className="size-3.5 text-purple-500" />
                                <span>{assignedCohortsCount || sections.length} Assigned Cohorts</span>
                            </span>
                        </div>
                    )}

                    {canManage && (
                        <>
                            {selectedSectionId && (
                                <button
                                    onClick={() =>
                                        togglePublishSection(
                                            !entries.some((e) => e.is_published)
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    {entries.some((e) => e.is_published)
                                        ? 'Unpublish Section Schedule'
                                        : 'Publish Section Schedule'}
                                </button>
                            )}

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500"
                            >
                                <Plus className="size-3.5" />
                                <span>Schedule Period</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filter / Selector Bar for Admins and Teachers */}
            {!isStudent && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Section Selector */}
                        <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {isTeacher ? 'Filter by Assigned Cohort' : 'Select Section Cohort'}
                            </label>
                            <select
                                value={selectedSectionId || ''}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            >
                                {isTeacher && (
                                    <option value="">All My Assigned Classes & Cohorts (Full Week)</option>
                                )}
                                {sections.length === 0 ? (
                                    <option value="">No cohorts available</option>
                                ) : (
                                    sections.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            {sec.school_class?.name || (sec as any).schoolClass?.name || 'Class'} — {sec.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* View by Teacher filter (Admin only) */}
                        {canManage && (
                            <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Filter by Educator
                                </label>
                                <select
                                    value={selectedTeacherId || ''}
                                    onChange={(e) => handleTeacherFilterChange(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="">All Section Periods</option>
                                    {teachers.map((t) => (
                                        <option key={t.user.id} value={t.user.id}>
                                            {t.user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {isTeacher && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span>Showing {entries.length} instruction periods for your assigned classes</span>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Day Selector Tabs */}
            <div className="mb-4 flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 md:hidden dark:border-slate-800 dark:bg-[#0B1220]">
                {DAYS_OF_WEEK.map((d) => (
                    <button
                        key={d.key}
                        onClick={() => setActiveMobileDay(d.key)}
                        className={`flex-1 min-w-[70px] rounded-lg py-2 text-center text-xs font-bold transition ${
                            activeMobileDay === d.key
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                    >
                        {d.label.substring(0, 3)}
                    </button>
                ))}
            </div>

            {/* Desktop Weekly Grid (Hidden on Mobile) */}
            <div className="hidden grid-cols-6 gap-3 md:grid">
                {DAYS_OF_WEEK.map((day) => {
                    const isToday = currentDayKey === day.key;
                    const dayPeriods = entriesByDay[day.key] || [];

                    return (
                        <div
                            key={day.key}
                            className={`flex flex-col rounded-2xl border p-3.5 shadow-xs transition ${
                                isToday
                                    ? 'border-purple-400 bg-purple-50/20 dark:border-purple-800/80 dark:bg-purple-950/15'
                                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B1220]'
                            }`}
                        >
                            {/* Day Header */}
                            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
                                <div>
                                    <span
                                        className={`text-xs font-bold uppercase tracking-wider ${
                                            isToday
                                                ? 'text-purple-600 dark:text-purple-400'
                                                : 'text-slate-900 dark:text-white'
                                        }`}
                                    >
                                        {day.label}
                                    </span>
                                    {isToday && (
                                        <span className="ml-1.5 rounded-full bg-purple-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                                            TODAY
                                        </span>
                                    )}
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">
                                    {dayPeriods.length} periods
                                </span>
                            </div>

                            {/* Periods Stack */}
                            <div className="space-y-2.5">
                                {dayPeriods.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400 dark:border-slate-800">
                                        No sessions scheduled
                                    </div>
                                ) : (
                                    dayPeriods.map((period) => (
                                        <div
                                            key={period.id}
                                            className="group relative rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs transition hover:border-purple-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-purple-800 dark:hover:bg-slate-900"
                                        >
                                            <div className="mb-1 flex items-center justify-between text-[11px]">
                                                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                                    {period.start_time.substring(0, 5)} - {period.end_time.substring(0, 5)}
                                                </span>
                                                {period.period_name && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {period.period_name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {period.subject.name}
                                            </div>

                                            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                                <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                                                    {isTeacher
                                                        ? `${period.school_class?.name || (period as any).schoolClass?.name || 'Class'} (${period.class_section?.name || (period as any).classSection?.name || 'Sec'})`
                                                        : (period.teacher?.name || 'TBA')}
                                                </span>
                                                {period.room && (
                                                    <span className="flex items-center gap-0.5 rounded-md bg-slate-200/60 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        <MapPin className="size-2.5" />
                                                        {period.room}
                                                    </span>
                                                )}
                                            </div>

                                            {(period as any).today_status && (
                                                <div className="mt-1.5">
                                                    {(period as any).today_status === 'current' && (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                            <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                                                            Active Now
                                                        </span>
                                                    )}
                                                    {(period as any).today_status === 'upcoming' && (
                                                        <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                                                            Upcoming Today
                                                        </span>
                                                    )}
                                                    {(period as any).today_status === 'completed' && (
                                                        <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Admin quick actions on hover */}
                                            {canManage && (
                                                <div className="mt-2 flex items-center justify-end gap-1 border-t border-slate-200/60 pt-1.5 opacity-90 transition group-hover:opacity-100 dark:border-slate-800">
                                                    <button
                                                        onClick={() => startEditingPeriod(period)}
                                                        className="rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                                        title="Edit Period"
                                                    >
                                                        <Pencil className="size-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => submitDeletePeriod(period.id)}
                                                        className="rounded-md p-1 text-rose-400 hover:text-rose-600"
                                                        title="Delete Period"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Stacked View for Active Selected Day */}
            <div className="md:hidden">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900 dark:text-white">
                                {DAYS_OF_WEEK.find((d) => d.key === activeMobileDay)?.label} Schedule
                            </span>
                            {currentDayKey === activeMobileDay && (
                                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white">
                                    TODAY
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400">
                            {(entriesByDay[activeMobileDay] || []).length} sessions
                        </span>
                    </div>

                    <div className="space-y-3">
                        {(entriesByDay[activeMobileDay] || []).length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                                No classes scheduled for this day.
                            </div>
                        ) : (
                            entriesByDay[activeMobileDay].map((period) => (
                                <div
                                    key={period.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                                            {period.start_time.substring(0, 5)} - {period.end_time.substring(0, 5)}
                                        </span>
                                        {period.room && (
                                            <span className="flex items-center gap-1 rounded-md bg-slate-200/60 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                <MapPin className="size-3" />
                                                {period.room}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                                        {period.subject.name}
                                    </h4>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {isTeacher
                                            ? `Cohort: ${period.school_class?.name || (period as any).schoolClass?.name || 'Class'} (${period.class_section?.name || (period as any).classSection?.name || 'Sec'})`
                                            : `Instructor: ${period.teacher?.name || 'TBA'}`}
                                    </div>
                                    {(period as any).today_status && (
                                        <div className="mt-1.5">
                                            {(period as any).today_status === 'current' && (
                                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                    <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                                                    Active Now
                                                </span>
                                            )}
                                            {(period as any).today_status === 'upcoming' && (
                                                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                                                    Upcoming Today
                                                </span>
                                            )}
                                            {(period as any).today_status === 'completed' && (
                                                <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* CREATE PERIOD MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Schedule Academic Period
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Configure day, time slot, instructor, and classroom room allocation
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {periodForm.hasErrors && (
                            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                                <div className="font-bold">Scheduling conflict detected:</div>
                                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                                    {Object.values(periodForm.errors).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={submitCreatePeriod} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Class Grade *
                                    </label>
                                    <select
                                        value={periodForm.data.school_class_id}
                                        onChange={(e) => {
                                            const classId = parseInt(e.target.value);
                                            periodForm.setData('school_class_id', classId);
                                            const matchingSection = sections.find(
                                                (s) => s.school_class_id === classId || (s as any).school_class?.id === classId
                                            );
                                            if (matchingSection) {
                                                periodForm.setData('class_section_id', matchingSection.id);
                                            }
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Class Section *
                                    </label>
                                    <select
                                        value={periodForm.data.class_section_id}
                                        onChange={(e) =>
                                            periodForm.setData('class_section_id', parseInt(e.target.value))
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {sections.map((sec) => (
                                            <option key={sec.id} value={sec.id}>
                                                {sec.school_class?.name || 'Class'} — {sec.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Subject *
                                    </label>
                                    <select
                                        value={periodForm.data.subject_id}
                                        onChange={(e) =>
                                            periodForm.setData('subject_id', parseInt(e.target.value))
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.code || '—'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Responsible Teacher
                                    </label>
                                    <select
                                        value={periodForm.data.teacher_id}
                                        onChange={(e) => periodForm.setData('teacher_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">No Teacher Assigned</option>
                                        {teachers.map((t) => (
                                            <option key={t.user.id} value={t.user.id}>
                                                {t.user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Day of Week *
                                    </label>
                                    <select
                                        value={periodForm.data.day_of_week}
                                        onChange={(e) => periodForm.setData('day_of_week', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {DAYS_OF_WEEK.map((d) => (
                                            <option key={d.key} value={d.key}>
                                                {d.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Start Time *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={periodForm.data.start_time}
                                        onChange={(e) => periodForm.setData('start_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        End Time *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={periodForm.data.end_time}
                                        onChange={(e) => periodForm.setData('end_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Room / Lab
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Lab 204, Room A"
                                        value={periodForm.data.room}
                                        onChange={(e) => periodForm.setData('room', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Period Label
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Period 1, Morning Block"
                                        value={periodForm.data.period_name}
                                        onChange={(e) => periodForm.setData('period_name', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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
                                    disabled={periodForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {periodForm.processing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        'Schedule Period'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PERIOD MODAL */}
            {editingPeriod && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Edit Timetable Period
                            </h3>
                            <button
                                onClick={() => setEditingPeriod(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {editPeriodForm.hasErrors && (
                            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                                <div className="font-bold">Conflict:</div>
                                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                                    {Object.values(editPeriodForm.errors).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={submitUpdatePeriod} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Subject *
                                    </label>
                                    <select
                                        value={editPeriodForm.data.subject_id}
                                        onChange={(e) =>
                                            editPeriodForm.setData('subject_id', parseInt(e.target.value))
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Educator
                                    </label>
                                    <select
                                        value={editPeriodForm.data.teacher_id}
                                        onChange={(e) =>
                                            editPeriodForm.setData('teacher_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">No Teacher</option>
                                        {teachers.map((t) => (
                                            <option key={t.user.id} value={t.user.id}>
                                                {t.user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Day
                                    </label>
                                    <select
                                        value={editPeriodForm.data.day_of_week}
                                        onChange={(e) =>
                                            editPeriodForm.setData('day_of_week', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {DAYS_OF_WEEK.map((d) => (
                                            <option key={d.key} value={d.key}>
                                                {d.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={editPeriodForm.data.start_time}
                                        onChange={(e) =>
                                            editPeriodForm.setData('start_time', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={editPeriodForm.data.end_time}
                                        onChange={(e) =>
                                            editPeriodForm.setData('end_time', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Room / Lab
                                    </label>
                                    <input
                                        type="text"
                                        value={editPeriodForm.data.room}
                                        onChange={(e) => editPeriodForm.setData('room', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Period Label
                                    </label>
                                    <input
                                        type="text"
                                        value={editPeriodForm.data.period_name}
                                        onChange={(e) =>
                                            editPeriodForm.setData('period_name', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingPeriod(null)}
                                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editPeriodForm.processing}
                                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                                >
                                    Update Period
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
