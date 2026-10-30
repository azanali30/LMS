import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    Loader2,
    Layers,
    X,
    Building2,
    AlertCircle,
    Eye,
    Pencil,
    Trash2,
    KeyRound,
    Mail,
    GraduationCap,
    Clock,
    Shield,
    Phone,
    DollarSign,
    RotateCcw,
} from 'lucide-react';

interface Student {
    id: number;
    name: string;
    email: string;
    student_profile?: {
        admission_number?: string;
        admission_date?: string;
        photo_path?: string;
        phone?: string;
        city?: string;
    };
    student_guardians?: Array<{
        id: number;
        name: string;
        phone: string;
        relationship: string;
        is_primary: boolean;
    }>;
    student_fee_structure?: {
        net_monthly_fee?: string | number;
        fee_category?: string;
    };
}

interface ClassSection {
    id: number;
    school_class_id?: number;
    name: string;
    room?: string;
    school_class?: {
        id: number;
        name: string;
    };
}

interface SchoolClassOption {
    id: number;
    name: string;
}

interface EnrollmentItem {
    id: number;
    roll_number?: string;
    status: string;
    created_at: string;
    student: Student;
    class_section: ClassSection;
    academic_year?: {
        id: number;
        name: string;
    };
}

interface StudentsProps {
    enrollments: {
        data: EnrollmentItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    sections?: ClassSection[];
    classes?: SchoolClassOption[];
    academicYear?: {
        id: number;
        name: string;
    } | null;
    currency?: string;
    canManage?: boolean;
    canViewFinancials?: boolean;
    filters?: {
        class_id?: string;
        section_id?: string;
        status?: string;
        search?: string;
    };
}

export default function StudentsDirectoryPage({
    enrollments,
    sections = [],
    classes = [],
    academicYear,
    currency = 'USD',
    canManage = false,
    canViewFinancials = false,
    filters = {},
}: StudentsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedClass, setSelectedClass] = useState(filters.class_id || '');
    const [selectedSection, setSelectedSection] = useState(filters.section_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    // Modals for Quick Edit & Delete
    const [editingStudent, setEditingStudent] = useState<EnrollmentItem | null>(null);
    const [deletingStudent, setDeletingStudent] = useState<EnrollmentItem | null>(null);

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        class_section_id: 0,
        roll_number: '',
        status: 'active',
    });

    // Dynamic section filter based on selected class
    const filteredSections = selectedClass
        ? sections.filter((s) => String(s.school_class_id) === String(selectedClass))
        : sections;

    const handleFilter = (clsId: string, secId: string, stat: string, query: string) => {
        router.get(
            '/school/students',
            {
                class_id: clsId || undefined,
                section_id: secId || undefined,
                status: stat || undefined,
                search: query || undefined,
            },
            { preserveState: true }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedClass('');
        setSelectedSection('');
        setSelectedStatus('');
        router.get('/school/students', {}, { preserveState: true });
    };

    const openEditModal = (student: EnrollmentItem) => {
        setEditingStudent(student);
        editForm.setData({
            name: student.student.name,
            email: student.student.email,
            password: '',
            class_section_id: student.class_section?.id || 0,
            roll_number: student.roll_number || '',
            status: student.status || 'active',
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;
        editForm.put(`/school/students/${editingStudent.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingStudent(null);
                editForm.reset();
            },
        });
    };

    const submitDelete = () => {
        if (!deletingStudent) return;
        router.delete(`/school/students/${deletingStudent.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingStudent(null),
        });
    };

    return (
        <TenantLayout title="Student Directory">
            <Head title="Students Registry — Institutional LMS" />

            {/* Header with Title and New Admission CTA */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                            <Users className="size-3.5" />
                        </span>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Student Directory & Admission Registry
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manage official enrollments, section placements, guardian links, fee categories, and student profiles
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/school/sections"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
                    >
                        <Layers className="size-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Manage Sections</span>
                    </Link>

                    {canManage && (
                        <Link
                            href="/school/students/create"
                            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500"
                        >
                            <UserPlus className="size-3.5" />
                            <span>+ New Student Admission</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Search box */}
                    <div className="relative min-w-[260px] flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by student name, email, roll #, admission #, or guardian..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter(selectedClass, selectedSection, selectedStatus, e.target.value);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Class Filter */}
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                const newClass = e.target.value;
                                setSelectedClass(newClass);
                                setSelectedSection('');
                                handleFilter(newClass, '', selectedStatus, search);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="">All Classes</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>

                        {/* Section Filter */}
                        <select
                            value={selectedSection}
                            onChange={(e) => {
                                setSelectedSection(e.target.value);
                                handleFilter(selectedClass, e.target.value, selectedStatus, search);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="">All Sections</option>
                            {filteredSections.map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                    {sec.school_class?.name || 'Class'} — {sec.name}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilter(selectedClass, selectedSection, e.target.value, search);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="transferred">Transferred</option>
                            <option value="graduated">Graduated</option>
                        </select>

                        {(search || selectedClass || selectedSection || selectedStatus) && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                title="Reset Filters"
                                className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <RotateCcw className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <th className="pb-3 font-semibold">Student & Admission</th>
                                <th className="pb-3 font-semibold">Roll #</th>
                                <th className="pb-3 font-semibold">Class & Section</th>
                                <th className="pb-3 font-semibold">Primary Guardian</th>
                                <th className="pb-3 font-semibold">Academic Session</th>
                                {canViewFinancials && (
                                    <th className="pb-3 font-semibold">Monthly Dues</th>
                                )}
                                <th className="pb-3 font-semibold">Status</th>
                                <th className="pb-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {enrollments.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={canViewFinancials ? 8 : 7}
                                        className="py-12 text-center text-slate-500"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Users className="size-8 text-slate-400 dark:text-slate-600" />
                                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                                No students enrolled matching this view
                                            </span>
                                            {canManage && (
                                                <Link
                                                    href="/school/students/create"
                                                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                                >
                                                    <UserPlus className="size-3.5" />
                                                    <span>Admit your first student</span>
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                enrollments.data.map((enr) => {
                                    const profile = enr.student.student_profile;
                                    const guardians = enr.student.student_guardians || [];
                                    const primaryG = guardians.find((g) => g.is_primary) || guardians[0];
                                    const fee = enr.student.student_fee_structure;

                                    return (
                                        <tr
                                            key={enr.id}
                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
                                        >
                                            {/* Student Name & Avatar */}
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    {profile?.photo_path ? (
                                                        <img
                                                            src={`/storage/${profile.photo_path}`}
                                                            alt={enr.student.name}
                                                            className="size-9 shrink-0 rounded-xl border border-purple-200 object-cover shadow-2xs dark:border-purple-500/30"
                                                        />
                                                    ) : (
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-2xs">
                                                            {enr.student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Link
                                                            href={`/school/students/${enr.student.id}`}
                                                            className="font-bold text-slate-900 hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
                                                        >
                                                            {enr.student.name}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                            {profile?.admission_number ? (
                                                                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                                                                    {profile.admission_number}
                                                                </span>
                                                            ) : (
                                                                <span>{enr.student.email}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Roll # */}
                                            <td className="py-4 font-mono font-semibold text-purple-600 dark:text-purple-400">
                                                {enr.roll_number || '—'}
                                            </td>

                                            {/* Class & Section */}
                                            <td className="py-4 text-slate-700 dark:text-slate-300">
                                                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                                    {enr.class_section?.school_class?.name || 'Class'}
                                                </span>
                                                <span className="ml-2 font-medium text-purple-600 dark:text-purple-300">
                                                    {enr.class_section?.name || 'Section'}
                                                </span>
                                            </td>

                                            {/* Primary Guardian */}
                                            <td className="py-4 text-slate-700 dark:text-slate-300">
                                                {primaryG ? (
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {primaryG.name}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                            <Phone className="size-3 text-slate-400" />
                                                            <span className="font-mono">{primaryG.phone}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">Not recorded</span>
                                                )}
                                            </td>

                                            {/* Academic Session & Admission Date */}
                                            <td className="py-4 text-slate-600 dark:text-slate-400">
                                                <div>{enr.academic_year?.name || 'Active Term'}</div>
                                                {profile?.admission_date && (
                                                    <div className="text-[10px] text-slate-400">
                                                        Adm: {profile.admission_date}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Monthly Dues (Authorized Only) */}
                                            {canViewFinancials && (
                                                <td className="py-4 font-semibold text-slate-900 dark:text-white">
                                                    {fee?.net_monthly_fee ? (
                                                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                            {currency} {Number(fee.net_monthly_fee).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-normal">
                                                            Standard
                                                        </span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Status */}
                                            <td className="py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                                        enr.status === 'active'
                                                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : enr.status === 'graduated'
                                                            ? 'border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                            : 'border border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {enr.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Link
                                                        href={`/school/students/${enr.student.id}`}
                                                        title="View Complete Student Profile"
                                                        className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:text-white"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>

                                                    {canManage && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(enr)}
                                                                title="Quick Edit Information & Password"
                                                                className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:text-white"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingStudent(enr)}
                                                                title="Remove Student Record"
                                                                className="inline-flex size-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {enrollments.links && enrollments.links.length > 3 && (
                    <div className="mt-6 flex justify-center gap-1 border-t border-slate-200 pt-4 dark:border-slate-800">
                        {enrollments.links.map((link, idx) => (
                            <button
                                key={idx}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                    link.active
                                        ? 'bg-purple-600 text-white'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 disabled:opacity-30 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-400 dark:hover:text-white'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* QUICK EDIT STUDENT MODAL */}
            {editingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl zoom-in-95 dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                    <Pencil className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Quick Edit Student Record
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingStudent(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                    Student Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                    Student Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Password Field for Student Portal Login */}
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                        Update Portal Password
                                    </label>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        (Leave empty to keep current)
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter new password (min 6 chars)..."
                                        value={editForm.data.password}
                                        onChange={(e) => editForm.setData('password', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            editForm.setData(
                                                'password',
                                                'Student@' + Math.floor(100 + Math.random() * 900)
                                            )
                                        }
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                        Target Section *
                                    </label>
                                    <select
                                        value={editForm.data.class_section_id}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'class_section_id',
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {sections.map((sec) => (
                                            <option key={sec.id} value={sec.id}>
                                                {sec.school_class?.name || 'Class'} ({sec.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                        Roll / ID Number
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.roll_number}
                                        onChange={(e) => editForm.setData('roll_number', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                    Enrollment Status
                                </label>
                                <select
                                    value={editForm.data.status}
                                    onChange={(e) => editForm.setData('status', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="transferred">Transferred</option>
                                    <option value="graduated">Graduated</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingStudent(null)}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                                >
                                    {editForm.processing ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE STUDENT CONFIRMATION MODAL */}
            {deletingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm animate-in rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl zoom-in-95 dark:border-rose-900/50 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Delete Student Enrollment?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    This action will remove the enrollment record for {deletingStudent.student.name}.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingStudent(null)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitDelete}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
