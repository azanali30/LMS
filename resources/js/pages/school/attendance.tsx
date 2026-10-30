import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    CalendarCheck,
    Check,
    X,
    Clock,
    AlertCircle,
    Save,
    Loader2,
    Calendar,
    GraduationCap,
    CheckCircle2,
    Lock,
    Users,
    Sparkles,
    UserPlus,
    BarChart3,
    ShieldAlert,
} from 'lucide-react';

interface ClassSection {
    id: number;
    name: string;
    room?: string;
    school_class?: {
        id: number;
        name: string;
    };
    schoolClass?: {
        id: number;
        name: string;
    };
}

interface StudentItem {
    id: number;
    roll_number?: string;
    student: {
        id: number;
        name: string;
        email: string;
    };
}

interface AttendanceRecord {
    id: number;
    student_id: number;
    timetable_entry_id?: number | null;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
    marked_by?: number;
    updated_at?: string;
}

interface AttendanceTask {
    class_section_id: number;
    timetable_entry_id?: number | null;
    class_name: string;
    section_name: string;
    subject_name: string;
    period_name: string;
    start_time: string;
    end_time: string;
    room?: string;
    is_first_period: boolean;
    is_submitted: boolean;
    submitted_at?: string;
    marked_by?: number;
    can_edit: boolean;
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count?: number;
    excused_count?: number;
}

interface StudentAttendanceRecord {
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
}

interface OrgTeacher {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface AttendanceProps {
    isStudent?: boolean;
    isTeacher?: boolean;
    isAdmin?: boolean;
    attendanceMode?: 'daily_first_period' | 'period_wise';
    allowEditing?: boolean;
    enrollment?: {
        class_section: {
            name: string;
            school_class?: {
                name: string;
            };
            schoolClass?: {
                name: string;
            };
        };
    } | null;
    studentAttendances?: {
        data: StudentAttendanceRecord[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    attendanceStats?: {
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
    };
    attendanceTasks?: AttendanceTask[];
    sections?: ClassSection[];
    selectedSectionId?: number | null;
    selectedTimetableEntryId?: number | null;
    selectedDate?: string;
    students?: StudentItem[];
    existingRecords?: Record<string, AttendanceRecord>;
    canSubmit?: boolean;
    selectedTask?: AttendanceTask | null;
    teachers?: OrgTeacher[];
}

export default function AttendancePage({
    isStudent = false,
    isTeacher = false,
    isAdmin = false,
    attendanceMode = 'daily_first_period',
    allowEditing = true,
    enrollment,
    studentAttendances,
    attendanceStats,
    attendanceTasks = [],
    sections = [],
    selectedSectionId = null,
    selectedTimetableEntryId = null,
    selectedDate = new Date().toISOString().split('T')[0],
    students = [],
    existingRecords = {},
    canSubmit = false,
    selectedTask = null,
    teachers = [],
}: AttendanceProps) {
    const [date, setDate] = useState(selectedDate);
    const [sectionId, setSectionId] = useState<number | null>(selectedSectionId);
    const [timetableEntryId, setTimetableEntryId] = useState<number | null>(selectedTimetableEntryId);
    const [showSubstituteModal, setShowSubstituteModal] = useState(false);

    // Initial state setup for batch attendance
    const [records, setRecords] = useState<
        Record<number, { status: 'present' | 'absent' | 'late' | 'excused'; remarks: string }>
    >({});

    useEffect(() => {
        if (isStudent) return;
        const initial: Record<number, { status: 'present' | 'absent' | 'late' | 'excused'; remarks: string }> = {};
        students.forEach((item) => {
            const existing = existingRecords[item.student.id];
            initial[item.student.id] = {
                status: existing?.status || 'present',
                remarks: existing?.remarks || '',
            };
        });
        setRecords(initial);
    }, [students, existingRecords, isStudent]);

    const { processing } = useForm();

    // Substitute form for Owner/Admin
    const substituteForm = useForm({
        class_section_id: sections[0]?.id || '',
        substitute_teacher_id: teachers[0]?.user.id || '',
        date: selectedDate,
        timetable_entry_id: '',
        notes: '',
    });

    const handleNavigate = (newDate: string, newSecId: number | null, newEntryId: number | null = null) => {
        const params: Record<string, any> = {
            date: newDate,
        };
        if (newSecId) {
            params.section_id = newSecId;
        }
        if (newEntryId) {
            params.timetable_entry_id = newEntryId;
        }
        router.get('/school/attendance', params, { preserveState: true });
    };

    const setStudentStatus = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
        if (!canSubmit) return;
        setRecords((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status,
            },
        }));
    };

    const setStudentRemarks = (studentId: number, remarks: string) => {
        if (!canSubmit) return;
        setRecords((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                remarks,
            },
        }));
    };

    const markAll = (status: 'present' | 'absent') => {
        if (!canSubmit) return;
        setRecords((prev) => {
            const next = { ...prev };
            students.forEach((s) => {
                next[s.student.id] = {
                    ...next[s.student.id],
                    status,
                };
            });
            return next;
        });
    };

    const submitAttendance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionId || !canSubmit) return;

        const payload = {
            class_section_id: sectionId,
            date: date,
            timetable_entry_id: timetableEntryId || undefined,
            attendances: students.map((s) => ({
                student_id: s.student.id,
                status: records[s.student.id]?.status || 'present',
                remarks: records[s.student.id]?.remarks || null,
            })),
        };

        router.post('/school/attendance', payload);
    };

    const submitSubstitute = (e: React.FormEvent) => {
        e.preventDefault();
        substituteForm.post('/school/attendance/substitutes', {
            onSuccess: () => {
                setShowSubstituteModal(false);
                substituteForm.reset();
            },
        });
    };

    // Calculate percentage for student attendance
    const totalDays = attendanceStats?.total || 0;
    const presentDays = attendanceStats?.present || 0;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Computed counts for the active register sheet
    const currentCounts = {
        present: Object.values(records).filter((r) => r.status === 'present').length,
        absent: Object.values(records).filter((r) => r.status === 'absent').length,
        late: Object.values(records).filter((r) => r.status === 'late').length,
        excused: Object.values(records).filter((r) => r.status === 'excused').length,
    };

    // 1. STUDENT VIEW
    if (isStudent) {
        const sectionName = enrollment?.class_section?.name || 'Assigned Section';
        const className = enrollment?.class_section?.school_class?.name || enrollment?.class_section?.schoolClass?.name || 'Class Cohort';

        return (
            <TenantLayout title="My Attendance">
                <Head title="My Attendance" />

                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <CalendarCheck className="size-5 text-purple-600 dark:text-purple-400" />
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                My Attendance Record
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Track your personal daily presence, absence logs, and instructor remarks
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-600/10 dark:text-purple-300">
                        <GraduationCap className="size-4" />
                        <span>{className} — {sectionName}</span>
                    </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Attendance Rate
                            </span>
                            <BarChart3 className="size-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                            {attendancePercentage}%
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            {totalDays} total recorded sessions
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Present Days
                            </span>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {attendanceStats?.present || 0}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            Attended on time
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Absent Days
                            </span>
                            <X className="size-4 text-rose-500" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400">
                            {attendanceStats?.absent || 0}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            Unexcused absences
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Late / Excused
                            </span>
                            <Clock className="size-4 text-amber-500" />
                        </div>
                        <div className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
                            {(attendanceStats?.late || 0) + (attendanceStats?.excused || 0)}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                            Approved adjustments
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Session History
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <th className="pb-3 font-semibold">Date</th>
                                    <th className="pb-3 font-semibold">Day</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                    <th className="pb-3 font-semibold">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {!studentAttendances?.data || studentAttendances.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                                            No attendance entries recorded yet for your account.
                                        </td>
                                    </tr>
                                ) : (
                                    studentAttendances.data.map((rec) => {
                                        const dateObj = new Date(rec.date);
                                        const dayName = isNaN(dateObj.getTime())
                                            ? '—'
                                            : dateObj.toLocaleDateString(undefined, { weekday: 'long' });

                                        return (
                                            <tr key={rec.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                                <td className="py-3.5 font-mono font-medium text-slate-900 dark:text-white">
                                                    {rec.date}
                                                </td>
                                                <td className="py-3.5 text-slate-600 dark:text-slate-400">
                                                    {dayName}
                                                </td>
                                                <td className="py-3.5">
                                                    {rec.status === 'present' && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                            <Check className="size-3" />
                                                            Present
                                                        </span>
                                                    )}
                                                    {rec.status === 'absent' && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                                                            <X className="size-3" />
                                                            Absent
                                                        </span>
                                                    )}
                                                    {rec.status === 'late' && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                                                            <Clock className="size-3" />
                                                            Late
                                                        </span>
                                                    )}
                                                    {rec.status === 'excused' && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400">
                                                            <AlertCircle className="size-3" />
                                                            Excused
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 text-slate-500 dark:text-slate-400">
                                                    {rec.remarks || '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </TenantLayout>
        );
    }

    // 2. TEACHER & ADMIN ATTENDANCE VIEW
    const activeSection = sections.find((s) => s.id === sectionId);
    const isSubmitted = Object.keys(existingRecords).length > 0;

    return (
        <TenantLayout title={isTeacher ? 'My Attendance' : 'Attendance Register'}>
            <Head title="Attendance" />

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarCheck className="size-6 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isTeacher ? 'My Daily Attendance Register' : 'Institution Attendance Register'}
                        </h2>
                        <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                            {attendanceMode === 'period_wise' ? 'Period-Wise Mode' : 'Daily First-Period Mode'}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {attendanceMode === 'daily_first_period'
                            ? 'Default School Policy: Attendance for each section is taken by the educator assigned to the section’s first period.'
                            : 'Period-Wise Policy: Individual attendance is recorded per timetable period by the assigned educator.'}
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setShowSubstituteModal(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <UserPlus className="size-3.5 text-purple-500" />
                        <span>Authorize Substitute Teacher</span>
                    </button>
                )}
            </div>

            {/* Today's Authorized Tasks Carousel / Cards */}
            {attendanceTasks.length > 0 && (
                <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Authorized Attendance Sessions for {date} ({attendanceTasks.length})
                        </span>
                        <span className="text-[11px] text-slate-400">
                            Click session to open register
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {attendanceTasks.map((task) => {
                            const isSelected =
                                task.class_section_id === sectionId &&
                                (!timetableEntryId || task.timetable_entry_id === timetableEntryId);

                            return (
                                <button
                                    key={`${task.class_section_id}-${task.timetable_entry_id || 'daily'}`}
                                    type="button"
                                    onClick={() => {
                                        setSectionId(task.class_section_id);
                                        setTimetableEntryId(task.timetable_entry_id || null);
                                        handleNavigate(date, task.class_section_id, task.timetable_entry_id || null);
                                    }}
                                    className={`relative flex flex-col rounded-2xl border p-4 text-left transition ${
                                        isSelected
                                            ? 'border-purple-500 bg-purple-50/50 shadow-md ring-2 ring-purple-500/30 dark:border-purple-500 dark:bg-purple-950/20'
                                            : 'border-slate-200 bg-white hover:border-purple-300 dark:border-slate-800 dark:bg-[#0B1220]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            {task.class_name} • {task.section_name}
                                        </span>
                                        {task.is_submitted ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                <CheckCircle2 className="size-3" />
                                                Submitted
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                                <AlertCircle className="size-3" />
                                                Needs Roll Call
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                        {task.subject_name}
                                    </div>

                                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                        <span>{task.period_name}</span>
                                        <span className="font-mono">{task.start_time} - {task.end_time}</span>
                                    </div>

                                    {task.room && (
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            Room: {task.room}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter and Selection Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Picker */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Attendance Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                setDate(newDate);
                                handleNavigate(newDate, sectionId, timetableEntryId);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Section Selector */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {isTeacher ? 'Authorized Section Cohort' : 'Class Section'}
                        </label>
                        <select
                            value={sectionId || ''}
                            onChange={(e) => {
                                const newId = parseInt(e.target.value);
                                setSectionId(newId);
                                handleNavigate(date, newId, timetableEntryId);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                            {sections.length === 0 ? (
                                <option value="">No authorized cohorts available</option>
                            ) : (
                                sections.map((sec) => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.school_class?.name || (sec as any).schoolClass?.name || 'Class'} — {sec.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                {/* Batch Mark Controls */}
                {canSubmit && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => markAll('present')}
                            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                            Mark All Present
                        </button>
                        <button
                            type="button"
                            onClick={() => markAll('absent')}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-400"
                        >
                            Mark All Absent
                        </button>
                    </div>
                )}
            </div>

            {/* Attendance Roster Area */}
            {!sectionId ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="rounded-full bg-purple-500/10 p-3 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                        <CalendarCheck className="size-8" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                        {isTeacher ? 'No Authorized Attendance Task Selected' : 'Select a Section Cohort'}
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        {isTeacher
                            ? 'In daily first-period attendance mode, you may only take attendance for sections where you instruct the first period of the day or have been designated as substitute.'
                            : 'Choose an active classroom section and date above to load student enrollment.'}
                    </p>
                </div>
            ) : (
                <form onSubmit={submitAttendance} className="space-y-6">
                    {/* Active Status Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {activeSection?.school_class?.name || (activeSection as any)?.schoolClass?.name || 'Class'} — Section {activeSection?.name}
                                </h3>
                                {isSubmitted ? (
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        Submitted for {date}
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                        Pending Submission
                                    </span>
                                )}
                            </div>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {isSubmitted && !canSubmit
                                    ? 'Attendance is locked. Modifications are restricted by school administration policy.'
                                    : isSubmitted && canSubmit
                                    ? 'Editing authorized: Submitting will update the recorded attendance for this date.'
                                    : 'Review student status and click Submit Attendance to record.'}
                            </p>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-xl bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Total: {students.length}
                            </span>
                            <span className="rounded-xl bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                Present: {currentCounts.present}
                            </span>
                            <span className="rounded-xl bg-rose-50 px-3 py-1 font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                Absent: {currentCounts.absent}
                            </span>
                            <span className="rounded-xl bg-amber-50 px-3 py-1 font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                Late: {currentCounts.late}
                            </span>
                            <span className="rounded-xl bg-sky-50 px-3 py-1 font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
                                Excused: {currentCounts.excused}
                            </span>
                        </div>
                    </div>

                    {/* Student List Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                        {students.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-500">
                                No active students currently enrolled in this section.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                            <th className="pb-3 font-semibold">Roll #</th>
                                            <th className="pb-3 font-semibold">Student Name</th>
                                            <th className="pb-3 font-semibold">Attendance Status</th>
                                            <th className="pb-3 font-semibold">Remarks (Optional)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {students.map((item) => {
                                            const studentRecord = records[item.student.id] || {
                                                status: 'present',
                                                remarks: '',
                                            };

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
                                                >
                                                    <td className="py-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                                                        {item.roll_number || '—'}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {item.student.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            {item.student.email}
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                                                            <button
                                                                type="button"
                                                                disabled={!canSubmit}
                                                                onClick={() => setStudentStatus(item.student.id, 'present')}
                                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                                                    studentRecord.status === 'present'
                                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                                                } ${!canSubmit ? 'cursor-not-allowed opacity-60' : ''}`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!canSubmit}
                                                                onClick={() => setStudentStatus(item.student.id, 'absent')}
                                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                                                    studentRecord.status === 'absent'
                                                                        ? 'bg-rose-600 text-white shadow-xs'
                                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                                                } ${!canSubmit ? 'cursor-not-allowed opacity-60' : ''}`}
                                                            >
                                                                Absent
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!canSubmit}
                                                                onClick={() => setStudentStatus(item.student.id, 'late')}
                                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                                                    studentRecord.status === 'late'
                                                                        ? 'bg-amber-600 text-white shadow-xs'
                                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                                                } ${!canSubmit ? 'cursor-not-allowed opacity-60' : ''}`}
                                                            >
                                                                Late
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!canSubmit}
                                                                onClick={() => setStudentStatus(item.student.id, 'excused')}
                                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                                                    studentRecord.status === 'excused'
                                                                        ? 'bg-sky-600 text-white shadow-xs'
                                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                                                } ${!canSubmit ? 'cursor-not-allowed opacity-60' : ''}`}
                                                            >
                                                                Excused
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <input
                                                            type="text"
                                                            disabled={!canSubmit}
                                                            placeholder="Note reason if absent/late..."
                                                            value={studentRecord.remarks}
                                                            onChange={(e) =>
                                                                setStudentRemarks(item.student.id, e.target.value)
                                                            }
                                                            className={`w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${
                                                                !canSubmit ? 'cursor-not-allowed opacity-60' : ''
                                                            }`}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Submit Button */}
                        {students.length > 0 && (
                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {canSubmit
                                        ? `Recording attendance for ${students.length} students on ${date}`
                                        : 'Attendance submission locked for this session'}
                                </div>

                                {canSubmit ? (
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Save className="size-4" />
                                        )}
                                        <span>{isSubmitted ? 'Update Attendance Record' : 'Submit Daily Attendance'}</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400 dark:bg-slate-800">
                                        <Lock className="size-3.5" />
                                        <span>Attendance Locked</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            )}

            {/* AUTHORIZE SUBSTITUTE MODAL (Admin Only) */}
            {showSubstituteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Authorize Substitute Teacher
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Grant substitute permission to mark daily attendance for a section
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSubstituteModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitSubstitute} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                    Classroom Section *
                                </label>
                                <select
                                    value={substituteForm.data.class_section_id}
                                    onChange={(e) => substituteForm.setData('class_section_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    required
                                >
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.school_class?.name || (s as any).schoolClass?.name || 'Class'} — {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                    Substitute Educator *
                                </label>
                                <select
                                    value={substituteForm.data.substitute_teacher_id}
                                    onChange={(e) => substituteForm.setData('substitute_teacher_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    required
                                >
                                    {teachers.map((t) => (
                                        <option key={t.user.id} value={t.user.id}>
                                            {t.user.name} ({t.user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={substituteForm.data.date}
                                    onChange={(e) => substituteForm.setData('date', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                                    Authorization Reason / Notes
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Primary teacher on medical leave"
                                    value={substituteForm.data.notes}
                                    onChange={(e) => substituteForm.setData('notes', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowSubstituteModal(false)}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={substituteForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-500 disabled:opacity-50"
                                >
                                    {substituteForm.processing && <Loader2 className="size-3.5 animate-spin" />}
                                    <span>Authorize Substitute</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
