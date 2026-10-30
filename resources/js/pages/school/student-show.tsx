import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    GraduationCap,
    ArrowLeft,
    User,
    Users,
    MapPin,
    Calendar,
    DollarSign,
    FileText,
    CheckCircle2,
    Clock,
    Phone,
    Mail,
    Shield,
    HeartPulse,
    Building2,
    BookOpen,
    Download,
    Eye,
    Pencil,
    Activity,
    CreditCard,
    AlertCircle,
    UserCheck,
    Briefcase,
} from 'lucide-react';
import { FeeInvoice, FeePayment } from '@/types';

interface StudentProfile {
    id: number;
    admission_number: string;
    admission_date: string;
    dob?: string;
    gender?: string;
    phone?: string;
    nationality?: string;
    identity_number?: string;
    previous_school?: string;
    previous_class?: string;
    blood_group?: string;
    medical_notes?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
    photo_path?: string;
    remarks?: string;
}

interface StudentGuardian {
    id: number;
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    occupation?: string;
    address?: string;
    is_primary: boolean;
    is_emergency_contact: boolean;
}

interface StudentDocument {
    id: number;
    title: string;
    document_type: string;
    file_name: string;
    file_size: number;
    mime_type?: string;
    created_at: string;
}

interface StudentEnrollment {
    id: number;
    roll_number?: string;
    status: string;
    created_at: string;
    class_section?: {
        id: number;
        name: string;
        room?: string;
        capacity?: number;
        school_class?: {
            id: number;
            name: string;
        };
    };
    academic_year?: {
        id: number;
        name: string;
    };
}

interface FeeStructure {
    id: number;
    fee_category: string;
    monthly_tuition_fee: string | number;
    transport_fee?: string | number;
    admission_fee: string | number;
    annual_fee: string | number;
    other_recurring_charges: string | number;
    discount_type: string;
    discount_value: string | number;
    discount_reason?: string;
    net_monthly_fee: string | number;
    currency: string;
    payment_frequency: string;
    due_day: number;
    effective_date?: string;
    fee_notes?: string;
}

interface AttendanceRecord {
    id: number;
    date: string;
    status: string;
    remarks?: string;
}

interface SectionSubject {
    id: number;
    subject?: {
        id: number;
        name: string;
        code?: string;
    };
    teacher?: {
        id: number;
        name: string;
        email: string;
    };
}

interface TimetableEntryItem {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room?: string;
    subject?: {
        id: number;
        name: string;
    };
    teacher?: {
        id: number;
        name: string;
    };
}

interface StudentShowProps {
    student: {
        id: number;
        name: string;
        email: string;
        created_at: string;
        student_profile?: StudentProfile;
        student_guardians?: StudentGuardian[];
        student_documents?: StudentDocument[];
        student_enrollments?: StudentEnrollment[];
    };
    activeEnrollment?: StudentEnrollment | null;
    feeStructure?: FeeStructure | null;
    feeInvoices?: FeeInvoice[];
    feePayments?: FeePayment[];
    attendanceSummary: {
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        rate: number;
    };
    recentAttendance: AttendanceRecord[];
    sectionSubjects: SectionSubject[];
    timetableEntries: TimetableEntryItem[];
    currency: string;
    canManage: boolean;
    canViewFinancials: boolean;
}

export default function StudentShowPage({
    student,
    activeEnrollment,
    feeStructure,
    feeInvoices = [],
    feePayments = [],
    attendanceSummary,
    recentAttendance = [],
    sectionSubjects = [],
    timetableEntries = [],
    currency = 'USD',
    canManage = false,
    canViewFinancials = false,
}: StudentShowProps) {
    const [activeTab, setActiveTab] = useState<
        | 'overview'
        | 'personal'
        | 'guardians'
        | 'academics'
        | 'attendance'
        | 'subjects'
        | 'fees'
        | 'documents'
    >('overview');

    const profile = student.student_profile;
    const guardians = student.student_guardians || [];
    const enrollments = student.student_enrollments || [];
    const documents = student.student_documents || [];
    const primaryGuardian = guardians.find((g) => g.is_primary) || guardians[0];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: GraduationCap },
        { id: 'personal', label: 'Personal Information', icon: User },
        { id: 'guardians', label: `Parents & Guardians (${guardians.length})`, icon: Users },
        { id: 'academics', label: 'Academic Placement', icon: Building2 },
        { id: 'attendance', label: `Attendance (${attendanceSummary.rate}%)`, icon: Activity },
        { id: 'subjects', label: `Subjects (${sectionSubjects.length})`, icon: BookOpen },
        ...(canViewFinancials
            ? [{ id: 'fees', label: 'Fees & Payments', icon: CreditCard }]
            : []),
        { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    ];

    return (
        <TenantLayout title={`Student: ${student.name}`}>
            <Head title={`${student.name} — Student Profile`} />

            {/* Top Navigation */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/school/students"
                        className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
                        title="Back to Students Registry"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Student Institutional Profile
                            </h2>
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                Official Record
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Comprehensive record for admissions, academics, guardians, attendance, and finances
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canManage && (
                        <Link
                            href="/school/students/create"
                            className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300"
                        >
                            <span>+ New Admission</span>
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:bg-slate-800/80"
                    >
                        Print Record
                    </button>
                </div>
            </div>

            {/* Profile Hero Card */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        {profile?.photo_path ? (
                            <img
                                src={`/storage/${profile.photo_path}`}
                                alt={student.name}
                                className="size-20 shrink-0 rounded-2xl border border-purple-200 object-cover shadow-md dark:border-purple-500/30"
                            />
                        ) : (
                            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-2xl font-bold text-white shadow-md">
                                {student.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {student.name}
                                </h3>
                                <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 font-mono text-[11px] font-bold text-purple-700 dark:border-purple-500/30 dark:bg-purple-900/30 dark:text-purple-300">
                                    {profile?.admission_number || 'ADM-PENDING'}
                                </span>
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider dark:text-emerald-400">
                                    {activeEnrollment?.status || 'Active'}
                                </span>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="size-3.5 text-purple-600 dark:text-purple-400" />
                                    <span>
                                        {activeEnrollment?.class_section?.school_class?.name || 'Class'} —{' '}
                                        <strong className="text-slate-800 dark:text-slate-200">
                                            {activeEnrollment?.class_section?.name || 'Section'}
                                        </strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Mail className="size-3.5 text-slate-400" />
                                    <span>{student.email}</span>
                                </div>
                                {profile?.phone && (
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="size-3.5 text-slate-400" />
                                        <span>{profile.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900/60">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Roll Number
                            </span>
                            <div className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                                {activeEnrollment?.roll_number || '—'}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900/60">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Attendance
                            </span>
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {attendanceSummary.rate}%
                            </div>
                        </div>

                        {canViewFinancials && feeStructure && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900/60">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Net Monthly Fee
                                </span>
                                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                    {currency} {Number(feeStructure.net_monthly_fee).toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs Bar */}
                <div className="mt-6 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                    isActive
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Icon className="size-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB CONTENT PANELS */}
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Key Academic & Identity Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220] lg:col-span-2">
                            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Quick Placement & Bio Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-xs">
                                <div>
                                    <span className="text-slate-400">Enrolled Class:</span>
                                    <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                        {activeEnrollment?.class_section?.school_class?.name || 'Class'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Class Section:</span>
                                    <p className="mt-0.5 font-bold text-purple-600 dark:text-purple-400">
                                        {activeEnrollment?.class_section?.name || 'Section'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Academic Session:</span>
                                    <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                        {activeEnrollment?.academic_year?.name || 'Current Session'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Admission Date:</span>
                                    <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                        {profile?.admission_date || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Date of Birth:</span>
                                    <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                        {profile?.dob || 'Not Provided'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Gender:</span>
                                    <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                        {profile?.gender || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Blood Group:</span>
                                    <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                        {profile?.blood_group || '—'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Identity / B-Form:</span>
                                    <p className="mt-0.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                                        {profile?.identity_number || '—'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Nationality:</span>
                                    <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                        {profile?.nationality || 'Pakistani'}
                                    </p>
                                </div>
                            </div>

                            {profile?.remarks && (
                                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Admission Remarks
                                    </span>
                                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                                        {profile.remarks}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Primary Guardian Snapshot */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Primary Guardian
                            </h4>
                            {primaryGuardian ? (
                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                            <Users className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {primaryGuardian.name}
                                            </p>
                                            <span className="text-[11px] capitalize text-purple-600 dark:text-purple-400">
                                                {primaryGuardian.relationship}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Phone className="size-3.5 text-slate-400" />
                                            <span>{primaryGuardian.phone}</span>
                                        </div>
                                        {primaryGuardian.email && (
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Mail className="size-3.5 text-slate-400" />
                                                <span>{primaryGuardian.email}</span>
                                            </div>
                                        )}
                                        {primaryGuardian.occupation && (
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <Briefcase className="size-3.5 text-slate-400" />
                                                <span>{primaryGuardian.occupation}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">No primary guardian recorded.</p>
                            )}
                        </div>
                    </div>

                    {/* Attendance and Academic Subjects row */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Attendance Summary Box */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Attendance Overview
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('attendance')}
                                    className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
                                >
                                    View Log →
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900/60">
                                    <span className="text-[10px] text-slate-400">Total</span>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                                        {attendanceSummary.total}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-950/20">
                                    <span className="text-[10px] text-emerald-600">Present</span>
                                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                        {attendanceSummary.present}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-rose-50 p-2.5 dark:bg-rose-950/20">
                                    <span className="text-[10px] text-rose-600">Absent</span>
                                    <div className="text-sm font-bold text-rose-700 dark:text-rose-400">
                                        {attendanceSummary.absent}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-950/20">
                                    <span className="text-[10px] text-amber-600">Late</span>
                                    <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                        {attendanceSummary.late}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enrolled Subjects Snapshot */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Class Curriculum Subjects ({sectionSubjects.length})
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('subjects')}
                                    className="text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
                                >
                                    Full Schedule →
                                </button>
                            </div>

                            {sectionSubjects.length === 0 ? (
                                <p className="text-xs text-slate-500">No subjects assigned to this section yet.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {sectionSubjects.slice(0, 6).map((item) => (
                                        <span
                                            key={item.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                        >
                                            {item.subject?.name}
                                        </span>
                                    ))}
                                    {sectionSubjects.length > 6 && (
                                        <span className="rounded-lg bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                            +{sectionSubjects.length - 6} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PERSONAL INFORMATION TAB */}
            {activeTab === 'personal' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                    <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                        Full Personal & Residential Details
                    </h3>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 text-xs">
                        <div className="space-y-4">
                            <h4 className="border-b border-slate-100 pb-2 font-bold uppercase tracking-wider text-purple-600 dark:border-slate-800 dark:text-purple-400">
                                Identification & Demographic
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-slate-400">Legal Name:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Gender:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white capitalize">{profile?.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Date of Birth:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{profile?.dob || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Nationality:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{profile?.nationality || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">B-Form / ID Number:</span>
                                    <p className="font-mono font-semibold text-slate-900 dark:text-white">{profile?.identity_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Blood Group:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{profile?.blood_group || 'N/A'}</p>
                                </div>
                            </div>

                            <h4 className="mt-6 border-b border-slate-100 pb-2 font-bold uppercase tracking-wider text-purple-600 dark:border-slate-800 dark:text-purple-400">
                                Previous Academic Background
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-slate-400">Previous School:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{profile?.previous_school || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Previous Class Passed:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">{profile?.previous_class || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="border-b border-slate-100 pb-2 font-bold uppercase tracking-wider text-purple-600 dark:border-slate-800 dark:text-purple-400">
                                Residential Address & Emergency
                            </h4>
                            <div>
                                <span className="text-slate-400">Street Address:</span>
                                <p className="font-semibold text-slate-900 dark:text-white">{profile?.address || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-slate-400">City / State:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {profile?.city ? `${profile.city}, ${profile.state || ''}` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Postal Code & Country:</span>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {profile?.postal_code ? `${profile.postal_code}, ` : ''}{profile?.country || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    Alternative Emergency Contact
                                </span>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {profile?.emergency_contact_name || 'None listed'}
                                    </span>
                                    <span className="font-mono text-purple-600 dark:text-purple-400">
                                        {profile?.emergency_contact_phone || '—'}
                                    </span>
                                </div>
                                {profile?.emergency_contact_relation && (
                                    <span className="text-[11px] text-slate-500">
                                        Relationship: {profile.emergency_contact_relation}
                                    </span>
                                )}
                            </div>

                            {profile?.medical_notes && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/20">
                                    <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                                        <HeartPulse className="size-4" />
                                        <span>Confidential Medical Information</span>
                                    </div>
                                    <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">
                                        {profile.medical_notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. PARENTS & GUARDIANS TAB */}
            {activeTab === 'guardians' && (
                <div className="space-y-4">
                    {guardians.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-[#0B1220]">
                            <Users className="mx-auto size-8 text-slate-400" />
                            <p className="mt-2 text-xs">No guardian records linked to this student yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {guardians.map((g) => (
                                <div
                                    key={g.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                                <User className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {g.name}
                                                </h4>
                                                <span className="text-xs font-semibold capitalize text-purple-600 dark:text-purple-400">
                                                    {g.relationship}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {g.is_primary && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                    Primary
                                                </span>
                                            )}
                                            {g.is_emergency_contact && (
                                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                                                    Emergency
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                            <span className="text-slate-400">Phone:</span>
                                            <span className="font-mono font-semibold">{g.phone}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                            <span className="text-slate-400">Email:</span>
                                            <span>{g.email || 'None on file'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                            <span className="text-slate-400">Occupation:</span>
                                            <span>{g.occupation || 'N/A'}</span>
                                        </div>
                                        {g.address && (
                                            <div className="text-slate-700 dark:text-slate-300">
                                                <span className="text-slate-400">Address:</span>
                                                <p className="mt-0.5">{g.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. ACADEMICS TAB */}
            {activeTab === 'academics' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                    <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                        Institutional Enrollment History
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <th className="pb-3 font-semibold">Academic Session</th>
                                    <th className="pb-3 font-semibold">Class</th>
                                    <th className="pb-3 font-semibold">Section & Room</th>
                                    <th className="pb-3 font-semibold">Roll #</th>
                                    <th className="pb-3 font-semibold">Enrolled Date</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {enrollments.map((enr) => (
                                    <tr key={enr.id}>
                                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                                            {enr.academic_year?.name || 'Active Session'}
                                        </td>
                                        <td className="py-3 text-slate-800 dark:text-slate-200">
                                            {enr.class_section?.school_class?.name || 'Class'}
                                        </td>
                                        <td className="py-3 text-purple-600 dark:text-purple-400 font-semibold">
                                            {enr.class_section?.name || 'Section'} {enr.class_section?.room ? `(${enr.class_section.room})` : ''}
                                        </td>
                                        <td className="py-3 font-mono">{enr.roll_number || '—'}</td>
                                        <td className="py-3 text-slate-500">{new Date(enr.created_at).toLocaleDateString()}</td>
                                        <td className="py-3">
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 capitalize dark:bg-emerald-500/20 dark:text-emerald-400">
                                                {enr.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 5. ATTENDANCE TAB */}
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    {/* Metrics Banner */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Marked Days</span>
                            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{attendanceSummary.total}</div>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                            <span className="text-[10px] font-semibold text-emerald-600 uppercase">Present Days</span>
                            <div className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">{attendanceSummary.present}</div>
                        </div>
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
                            <span className="text-[10px] font-semibold text-rose-600 uppercase">Absent Days</span>
                            <div className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">{attendanceSummary.absent}</div>
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-950/20">
                            <span className="text-[10px] font-semibold text-amber-600 uppercase">Late Days</span>
                            <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">{attendanceSummary.late}</div>
                        </div>
                        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-500/20 dark:bg-purple-950/20">
                            <span className="text-[10px] font-semibold text-purple-700 uppercase">Attendance Rate</span>
                            <div className="mt-1 text-xl font-bold text-purple-700 dark:text-purple-300">{attendanceSummary.rate}%</div>
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Recent Daily Attendance Log (Latest 20 Records)
                        </h4>
                        {recentAttendance.length === 0 ? (
                            <p className="text-xs text-slate-500">No attendance marked for this student yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                                            <th className="pb-3 font-semibold">Date</th>
                                            <th className="pb-3 font-semibold">Attendance Status</th>
                                            <th className="pb-3 font-semibold">Remarks / Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {recentAttendance.map((rec) => (
                                            <tr key={rec.id}>
                                                <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                                                    {rec.date}
                                                </td>
                                                <td className="py-2.5">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                                                            rec.status === 'present'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                                : rec.status === 'absent'
                                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                                : rec.status === 'late'
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                                        }`}
                                                    >
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-slate-500">
                                                    {rec.remarks || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 6. SUBJECTS & TIMETABLE TAB */}
            {activeTab === 'subjects' && (
                <div className="space-y-6">
                    {/* Section Subjects */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Class Curriculum Subjects & Assigned Instructors
                        </h4>
                        {sectionSubjects.length === 0 ? (
                            <p className="text-xs text-slate-500">No subjects currently assigned to this section.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {sectionSubjects.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />
                                            <h5 className="font-bold text-slate-900 dark:text-white">
                                                {item.subject?.name}
                                            </h5>
                                        </div>
                                        {item.subject?.code && (
                                            <span className="font-mono text-[10px] text-slate-400">
                                                {item.subject.code}
                                            </span>
                                        )}
                                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                            <span>Instructor: </span>
                                            <strong className="text-slate-800 dark:text-slate-200">
                                                {item.teacher?.name || 'Unassigned'}
                                            </strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section Timetable Entries */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Weekly Class Timetable Schedule
                        </h4>
                        {timetableEntries.length === 0 ? (
                            <p className="text-xs text-slate-500">No timetable entries published for this section.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                                            <th className="pb-3 font-semibold">Day of Week</th>
                                            <th className="pb-3 font-semibold">Time Slot</th>
                                            <th className="pb-3 font-semibold">Subject</th>
                                            <th className="pb-3 font-semibold">Teacher</th>
                                            <th className="pb-3 font-semibold">Room</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {timetableEntries.map((slot) => (
                                            <tr key={slot.id}>
                                                <td className="py-2.5 font-bold text-slate-900 capitalize dark:text-white">
                                                    {slot.day_of_week}
                                                </td>
                                                <td className="py-2.5 font-mono text-purple-600 dark:text-purple-400">
                                                    {slot.start_time} - {slot.end_time}
                                                </td>
                                                <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    {slot.subject?.name}
                                                </td>
                                                <td className="py-2.5 text-slate-600 dark:text-slate-400">
                                                    {slot.teacher?.name || '—'}
                                                </td>
                                                <td className="py-2.5 text-slate-500">
                                                    {slot.room || 'Main Room'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 7. FEES & FINANCIALS TAB (Authorized Staff Only) */}
            {activeTab === 'fees' && canViewFinancials && (
                <div className="space-y-6">
                    {feeStructure ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Monthly Tuition
                                    </span>
                                    <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                        {currency} {Number(feeStructure.monthly_tuition_fee).toLocaleString()}
                                    </div>
                                    {feeStructure.transport_fee && Number(feeStructure.transport_fee) > 0 ? (
                                        <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400">
                                            + {currency} {Number(feeStructure.transport_fee).toLocaleString()} transport
                                        </div>
                                    ) : null}
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Other Recurring
                                    </span>
                                    <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                        {currency} {Number(feeStructure.other_recurring_charges).toLocaleString()}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-950/20">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                        Discount / Scholarship
                                    </span>
                                    <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                                        {feeStructure.discount_type === 'percentage'
                                            ? `${feeStructure.discount_value}%`
                                            : feeStructure.discount_type === 'fixed'
                                            ? `${currency} ${Number(feeStructure.discount_value).toLocaleString()}`
                                            : 'None'}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/20">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                        Net Monthly Payable
                                    </span>
                                    <div className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                                        {currency} {Number(feeStructure.net_monthly_fee).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Fee Plan Policy & Schedule Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                                    <div>
                                        <span className="text-slate-400">Billing Category:</span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                            {feeStructure.fee_category}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Billing Frequency:</span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                            {feeStructure.payment_frequency}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Due Day Rule:</span>
                                        <p className="font-semibold text-purple-600 dark:text-purple-400">
                                            {feeStructure.due_day}th of every billing cycle
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Effective Date:</span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                            {feeStructure.effective_date || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Admission Fee (One-Time):</span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                            {currency} {Number(feeStructure.admission_fee).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Annual Charges:</span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                            {currency} {Number(feeStructure.annual_fee).toLocaleString()}
                                        </p>
                                    </div>
                                    {feeStructure.transport_fee && Number(feeStructure.transport_fee) > 0 && (
                                        <div>
                                            <span className="text-slate-400">Transport / Bus Fee:</span>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                {currency} {Number(feeStructure.transport_fee).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {feeStructure.discount_reason && (
                                        <div className="col-span-2">
                                            <span className="text-slate-400">Discount Rationale:</span>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                {feeStructure.discount_reason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Invoices & Challan History */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Fee Invoices & Challans ({feeInvoices.length})
                                    </h4>
                                    <Link
                                        href="/school/fees"
                                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
                                    >
                                        Institutional Ledger &rarr;
                                    </Link>
                                </div>

                                {feeInvoices.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-slate-400">
                                        No invoices generated for this student yet.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                                                    <th className="pb-3 font-semibold">Invoice #</th>
                                                    <th className="pb-3 font-semibold">Month</th>
                                                    <th className="pb-3 font-semibold">Total</th>
                                                    <th className="pb-3 font-semibold">Paid</th>
                                                    <th className="pb-3 font-semibold">Balance</th>
                                                    <th className="pb-3 font-semibold">Due Date</th>
                                                    <th className="pb-3 font-semibold">Status</th>
                                                    <th className="pb-3 font-semibold text-right">Voucher</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {feeInvoices.map((inv) => {
                                                    const bal = Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount));
                                                    return (
                                                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                            <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                                                                {inv.invoice_number}
                                                            </td>
                                                            <td className="py-3 font-medium text-slate-700 dark:text-slate-300">
                                                                {inv.billing_month}
                                                            </td>
                                                            <td className="py-3 font-bold text-slate-900 dark:text-white">
                                                                {currency} {Number(inv.total_amount).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                                                {currency} {Number(inv.paid_amount).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 font-bold text-rose-600 dark:text-rose-400">
                                                                {bal > 0 ? `${currency} ${bal.toLocaleString()}` : '—'}
                                                            </td>
                                                            <td className="py-3 text-slate-500">
                                                                {inv.due_date}
                                                            </td>
                                                            <td className="py-3">
                                                                <span
                                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                                                        inv.status === 'paid'
                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                            : inv.status === 'partially_paid'
                                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                                            : inv.status === 'overdue'
                                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                    }`}
                                                                >
                                                                    {inv.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                <a
                                                                    href={`/school/fees/invoices/${inv.id}/download`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                                >
                                                                    <Download className="size-3" />
                                                                    <span>Voucher</span>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Payment Receipts History */}
                            {feePayments.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                                    <h4 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                                        Verified Offline Payments & Receipts ({feePayments.length})
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                                                    <th className="pb-3 font-semibold">Receipt #</th>
                                                    <th className="pb-3 font-semibold">Payment Date</th>
                                                    <th className="pb-3 font-semibold">Amount</th>
                                                    <th className="pb-3 font-semibold">Method</th>
                                                    <th className="pb-3 font-semibold">Reference #</th>
                                                    <th className="pb-3 font-semibold text-right">Receipt</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {feePayments.map((pmt) => (
                                                    <tr key={pmt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                                                            {pmt.receipt_number}
                                                        </td>
                                                        <td className="py-3 text-slate-600 dark:text-slate-400">
                                                            {pmt.payment_date}
                                                        </td>
                                                        <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                                                            {currency} {Number(pmt.amount).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 capitalize text-slate-700 dark:text-slate-300">
                                                            {pmt.payment_method.replace('_', ' ')}
                                                        </td>
                                                        <td className="py-3 font-mono text-slate-500">
                                                            {pmt.transaction_reference || '—'}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <a
                                                                href={`/school/fees/payments/${pmt.id}/receipt`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-950/30 dark:text-purple-300"
                                                            >
                                                                <Download className="size-3" />
                                                                <span>Receipt</span>
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-[#0B1220]">
                            <CreditCard className="mx-auto size-8 text-slate-400" />
                            <p className="mt-2 text-xs">No fee structure assigned to this student yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* 8. DOCUMENTS TAB */}
            {activeTab === 'documents' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                    <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                        Uploaded Admission Certificates & Documents ({documents.length})
                    </h3>

                    {documents.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <FileText className="mx-auto size-8 text-slate-400" />
                            <p className="mt-2 text-xs">No digital documents attached to this admission record.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                            <FileText className="size-5" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                                                {doc.title}
                                            </h5>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href={`/school/students/${student.id}/documents/${doc.id}/download`}
                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                                    >
                                        <Download className="size-3.5" />
                                        <span>Download</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </TenantLayout>
    );
}
