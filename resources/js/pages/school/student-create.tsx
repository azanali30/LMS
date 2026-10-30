import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useId } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    UserPlus,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    UploadCloud,
    User,
    Users,
    MapPin,
    GraduationCap,
    DollarSign,
    FileText,
    KeyRound,
    Calendar,
    Phone,
    Mail,
    Shield,
    Sparkles,
    Trash2,
    Plus,
    Info,
} from 'lucide-react';
import { ClassFeeStructure } from '@/types';

interface SchoolClass {
    id: number;
    name: string;
    sections?: ClassSection[];
}

interface ClassSection {
    id: number;
    school_class_id: number;
    name: string;
    room?: string;
    capacity?: number;
    school_class?: {
        id: number;
        name: string;
    };
}

interface AcademicYear {
    id: number;
    name: string;
    is_current: boolean;
    start_date: string;
    end_date: string;
}

interface StudentCreateProps {
    classes: SchoolClass[];
    sections: ClassSection[];
    academicYears: AcademicYear[];
    currentAcademicYear: AcademicYear | null;
    classFeeStructures?: ClassFeeStructure[];
    currency: string;
    suggestedAdmissionNumber: string;
    suggestedRollNumber: string;
}

export default function StudentCreatePage({
    classes = [],
    sections = [],
    academicYears = [],
    currentAcademicYear,
    classFeeStructures = [],
    currency = 'USD',
    suggestedAdmissionNumber = 'ADM-2026-0001',
    suggestedRollNumber = 'STU-001',
}: StudentCreateProps) {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showSecondGuardian, setShowSecondGuardian] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const initialClassId = classes[0]?.id ? String(classes[0].id) : '';
    const initialMatchingSection = sections.find(
        (s) => String(s.school_class_id) === initialClassId
    );
    const initialCfs = classFeeStructures.find(
        (cfs) => String(cfs.school_class_id) === initialClassId
    );

    // Form setup with Inertia useForm
    const form = useForm({
        // 1. Personal Info
        name: '',
        email: '',
        password: 'Student@123',
        admission_number: suggestedAdmissionNumber,
        admission_date: today,
        dob: '',
        gender: 'male',
        phone: '',
        nationality: 'Pakistani',
        identity_number: '',
        previous_school: '',
        previous_class: '',
        blood_group: '',
        medical_notes: '',
        photo: null as File | null,

        // 2. Residential Details
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Pakistan',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        remarks: '',

        // 3. Academic Placement
        school_class_id: initialClassId,
        class_section_id: initialMatchingSection?.id ? String(initialMatchingSection.id) : '',
        academic_year_id: currentAcademicYear?.id ? String(currentAcademicYear.id) : '',
        roll_number: suggestedRollNumber,
        enrollment_status: 'active',

        // 4. Guardians
        guardians: [
            {
                name: '',
                relationship: 'father',
                phone: '',
                email: '',
                occupation: '',
                address: '',
                is_primary: true,
                is_emergency_contact: true,
            },
            {
                name: '',
                relationship: 'mother',
                phone: '',
                email: '',
                occupation: '',
                address: '',
                is_primary: false,
                is_emergency_contact: false,
            },
        ],

        // 5. Fees & Financials
        fee_category: 'general',
        monthly_tuition_fee: initialCfs ? Number(initialCfs.monthly_tuition_fee) : 5000,
        transport_fee: initialCfs ? Number(initialCfs.transport_fee || 0) : 0,
        admission_fee: initialCfs ? Number(initialCfs.admission_fee) : 3000,
        annual_fee: initialCfs ? Number(initialCfs.annual_fee) : 2000,
        other_recurring_charges: initialCfs ? Number(initialCfs.other_recurring_charges) : 500,
        discount_type: 'none',
        discount_value: 0,
        discount_reason: '',
        payment_frequency: 'monthly',
        due_day: initialCfs ? Number(initialCfs.due_day) : 10,
        effective_date: today,
        fee_notes: '',

        // 6. Documents
        document_birth_cert: null as File | null,
        document_previous_school: null as File | null,
        document_leaving_cert: null as File | null,
        document_other: null as File | null,
    });

    // Filter available sections based on chosen class
    const availableSections = sections.filter((s) =>
        form.data.school_class_id ? String(s.school_class_id) === String(form.data.school_class_id) : true
    );

    const handleClassChange = (classId: string) => {
        const matchingCfs = classFeeStructures.find(
            (cfs) => String(cfs.school_class_id) === String(classId)
        );
        form.setData((prev) => {
            const matchingSecs = sections.filter((s) => String(s.school_class_id) === classId);
            return {
                ...prev,
                school_class_id: classId,
                class_section_id: matchingSecs[0]?.id ? String(matchingSecs[0].id) : '',
                ...(matchingCfs
                    ? {
                          monthly_tuition_fee: Number(matchingCfs.monthly_tuition_fee) || 0,
                          transport_fee: Number(matchingCfs.transport_fee) || 0,
                          admission_fee: Number(matchingCfs.admission_fee) || 0,
                          annual_fee: Number(matchingCfs.annual_fee) || 0,
                          other_recurring_charges: Number(matchingCfs.other_recurring_charges) || 0,
                          due_day: Number(matchingCfs.due_day) || 10,
                      }
                    : {}),
            };
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            form.setData('photo', file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    // Financial calculations
    const tuition = Number(form.data.monthly_tuition_fee) || 0;
    const transport = Number(form.data.transport_fee) || 0;
    const otherCharges = Number(form.data.other_recurring_charges) || 0;
    const baseMonthly = tuition + transport + otherCharges;

    let discountAmount = 0;
    const discountVal = Number(form.data.discount_value) || 0;
    if (form.data.discount_type === 'percentage') {
        discountAmount = (baseMonthly * discountVal) / 100;
    } else if (form.data.discount_type === 'fixed') {
        discountAmount = Math.min(baseMonthly, discountVal);
    }
    const netMonthlyPayable = Math.max(0, baseMonthly - discountAmount);
    const oneTimeCharges = (Number(form.data.admission_fee) || 0) + (Number(form.data.annual_fee) || 0);

    const steps = [
        { id: 1, name: 'Personal Details', icon: User, desc: 'Name, DOB, gender & photo' },
        { id: 2, name: 'Parents & Guardians', icon: Users, desc: 'Primary & emergency contacts' },
        { id: 3, name: 'Contact & Address', icon: MapPin, desc: 'Residence & phone details' },
        { id: 4, name: 'Academic Placement', icon: GraduationCap, desc: 'Class, section & roll #' },
        { id: 5, name: 'Fee Structure', icon: DollarSign, desc: 'Tuition, discounts & dues' },
        { id: 6, name: 'Documents & Notes', icon: FileText, desc: 'Certificates & final review' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/school/students', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <TenantLayout title="Student Admission">
            <Head title="New Student Admission — Institutional LMS" />

            {/* Top Navigation & Breadcrumb */}
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
                            <span className="flex size-6 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                <UserPlus className="size-3.5" />
                            </span>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Student Admission Portal
                            </h2>
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                Official Record
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enroll a new student, establish guardian links, assign fee structures, and generate e-portal credentials.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/school/students"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:bg-slate-800/80"
                    >
                        Cancel
                    </Link>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={form.processing}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                    >
                        {form.processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="size-4" />
                        )}
                        <span>Save & Enroll Student</span>
                    </button>
                </div>
            </div>

            {/* Stepper Navigation */}
            <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {steps.map((s) => {
                    const Icon = s.icon;
                    const isActive = currentStep === s.id;
                    const isCompleted = currentStep > s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setCurrentStep(s.id)}
                            className={`flex flex-col rounded-2xl border p-3 text-left transition ${
                                isActive
                                    ? 'border-purple-500 bg-purple-50/50 shadow-xs dark:border-purple-500/40 dark:bg-purple-950/20'
                                    : isCompleted
                                    ? 'border-slate-200 bg-white hover:border-purple-300 dark:border-slate-800 dark:bg-[#0B1220] dark:hover:border-slate-700'
                                    : 'border-slate-200 bg-white opacity-80 hover:opacity-100 dark:border-slate-800 dark:bg-[#0B1220]'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={`flex size-7 items-center justify-center rounded-xl text-xs font-bold ${
                                        isActive
                                            ? 'bg-purple-600 text-white'
                                            : isCompleted
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    {isCompleted ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}
                                </span>
                                <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">
                                    0{s.id}
                                </span>
                            </div>
                            <span className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                                {s.name}
                            </span>
                            <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                {s.desc}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Error Banner if validation failed */}
            {Object.keys(form.errors).length > 0 && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="size-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                                Please fix the validation errors before submitting the admission:
                            </h4>
                            <ul className="mt-1 list-inside list-disc text-xs text-rose-700 dark:text-rose-400">
                                {Object.entries(form.errors).slice(0, 4).map(([field, msg]) => (
                                    <li key={field}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION 1: PERSONAL INFORMATION */}
                {currentStep === 1 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Student Personal & Identity Information
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Official legal details, birth information, and student photograph
                                </p>
                            </div>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Step 1 of 6
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                            {/* Photo Upload Card */}
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/40 lg:col-span-1">
                                {photoPreview ? (
                                    <div className="relative mb-3 size-28 overflow-hidden rounded-2xl border border-purple-300 shadow-md">
                                        <img
                                            src={photoPreview}
                                            alt="Student Preview"
                                            className="size-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPhotoPreview(null);
                                                form.setData('photo', null);
                                            }}
                                            className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1 text-white hover:bg-black"
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mb-3 flex size-24 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                        <User className="size-10" />
                                    </div>
                                )}
                                <label className="cursor-pointer rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500">
                                    <span>Browse Photograph</span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </label>
                                <span className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                                    JPG, PNG, or WEBP up to 3MB
                                </span>
                                {form.errors.photo && (
                                    <p className="mt-1 text-xs text-rose-500">{form.errors.photo}</p>
                                )}
                            </div>

                            {/* Personal Fields Grid */}
                            <div className="space-y-4 lg:col-span-3">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Full Legal Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Muhammad Ahmad"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                        {form.errors.name && (
                                            <p className="mt-1 text-xs text-rose-500">{form.errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Gender *
                                        </label>
                                        <select
                                            value={form.data.gender}
                                            onChange={(e) => form.setData('gender', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer_not_to_say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={form.data.dob}
                                            onChange={(e) => form.setData('dob', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            B-Form / Identity Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="35201-1234567-1"
                                            value={form.data.identity_number}
                                            onChange={(e) => form.setData('identity_number', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Nationality
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.nationality}
                                            onChange={(e) => form.setData('nationality', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Student Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="ahmad@student.edu"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                            If empty, an institutional login will be generated automatically.
                                        </p>
                                    </div>

                                    <div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                                Portal Password *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-[10px] text-purple-600 hover:underline dark:text-purple-400"
                                            >
                                                {showPassword ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={form.data.password}
                                                onChange={(e) => form.setData('password', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-16 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.setData(
                                                        'password',
                                                        'Student@' + Math.floor(100 + Math.random() * 900)
                                                    )
                                                }
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
                                            >
                                                Gen
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Student Mobile / Phone
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="+92 300 1234567"
                                            value={form.data.phone}
                                            onChange={(e) => form.setData('phone', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Blood Group
                                        </label>
                                        <select
                                            value={form.data.blood_group}
                                            onChange={(e) => form.setData('blood_group', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="">Select blood group...</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Previous School Attended
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Beaconhouse School System"
                                            value={form.data.previous_school}
                                            onChange={(e) => form.setData('previous_school', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Previous Class Passed
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Grade 8"
                                            value={form.data.previous_class}
                                            onChange={(e) => form.setData('previous_class', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Medical Notes / Allergies (Confidential)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Any chronic health conditions, dietary allergies, or emergency medical instructions..."
                                        value={form.data.medical_notes}
                                        onChange={(e) => form.setData('medical_notes', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                            >
                                <span>Continue to Guardians</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* SECTION 2: PARENTS & GUARDIANS */}
                {currentStep === 2 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Parent & Guardian Directory
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Primary point of contact, parent e-portal access credentials, and emergency notification links
                                </p>
                            </div>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Step 2 of 6
                            </span>
                        </div>

                        {/* Primary Guardian Card */}
                        <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50/40 p-5 dark:border-purple-500/20 dark:bg-purple-950/10">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex size-7 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
                                        1
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                                        Primary Parent / Guardian (Main School Contact) *
                                    </h4>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    Primary Contact
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Guardian Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tariq Mahmood"
                                        value={form.data.guardians[0].name}
                                        onChange={(e) => {
                                            const updated = [...form.data.guardians];
                                            updated[0].name = e.target.value;
                                            form.setData('guardians', updated);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Relationship *
                                    </label>
                                    <select
                                        value={form.data.guardians[0].relationship}
                                        onChange={(e) => {
                                            const updated = [...form.data.guardians];
                                            updated[0].relationship = e.target.value;
                                            form.setData('guardians', updated);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="father">Father</option>
                                        <option value="mother">Mother</option>
                                        <option value="guardian">Legal Guardian</option>
                                        <option value="other">Other Relative</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Mobile Phone *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="+92 321 9876543"
                                        value={form.data.guardians[0].phone}
                                        onChange={(e) => {
                                            const updated = [...form.data.guardians];
                                            updated[0].phone = e.target.value;
                                            form.setData('guardians', updated);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Email Address (For Parent Portal Access)
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="tariq@gmail.com"
                                        value={form.data.guardians[0].email}
                                        onChange={(e) => {
                                            const updated = [...form.data.guardians];
                                            updated[0].email = e.target.value;
                                            form.setData('guardians', updated);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                        If provided, a Parent Account will be provisioned to view attendance and grades.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Occupation / Organization
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Civil Engineer / Govt Officer"
                                        value={form.data.guardians[0].occupation}
                                        onChange={(e) => {
                                            const updated = [...form.data.guardians];
                                            updated[0].occupation = e.target.value;
                                            form.setData('guardians', updated);
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secondary Guardian Section */}
                        {showSecondGuardian ? (
                            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/30">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-200 text-slate-700 font-bold text-xs dark:bg-slate-800 dark:text-slate-300">
                                            2
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                                            Secondary Guardian / Mother
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowSecondGuardian(false)}
                                        className="text-xs text-rose-500 hover:underline"
                                    >
                                        Remove Secondary Guardian
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Guardian Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Noreen Akhtar"
                                            value={form.data.guardians[1].name}
                                            onChange={(e) => {
                                                const updated = [...form.data.guardians];
                                                updated[1].name = e.target.value;
                                                form.setData('guardians', updated);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Relationship
                                        </label>
                                        <select
                                            value={form.data.guardians[1].relationship}
                                            onChange={(e) => {
                                                const updated = [...form.data.guardians];
                                                updated[1].relationship = e.target.value;
                                                form.setData('guardians', updated);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="mother">Mother</option>
                                            <option value="father">Father</option>
                                            <option value="guardian">Legal Guardian</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                            Mobile Phone
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="+92 301 5551234"
                                            value={form.data.guardians[1].phone}
                                            onChange={(e) => {
                                                const updated = [...form.data.guardians];
                                                updated[1].phone = e.target.value;
                                                form.setData('guardians', updated);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowSecondGuardian(true)}
                                className="mb-6 flex items-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 px-4 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-950/20 dark:text-purple-300"
                            >
                                <Plus className="size-4" />
                                <span>+ Add Secondary Guardian (e.g. Mother or Co-Guardian)</span>
                            </button>
                        )}

                        <div className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                ← Back to Personal Details
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                            >
                                <span>Continue to Address & Contact</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* SECTION 3: RESIDENTIAL & CONTACT */}
                {currentStep === 3 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Residential & Emergency Contact Details
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Home address, city, state, postal code, and emergency designated contact
                                </p>
                            </div>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Step 3 of 6
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                    Residential Street Address
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="House # 42, Street 7, Sector F-10/2"
                                    value={form.data.address}
                                    onChange={(e) => form.setData('address', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Islamabad"
                                        value={form.data.city}
                                        onChange={(e) => form.setData('city', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        State / Province
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Federal / Punjab"
                                        value={form.data.state}
                                        onChange={(e) => form.setData('state', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="44000"
                                        value={form.data.postal_code}
                                        onChange={(e) => form.setData('postal_code', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.country}
                                        onChange={(e) => form.setData('country', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Additional Emergency Contact */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                <h4 className="mb-3 text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                                    Alternative Emergency Contact (If Parents Unavailable)
                                </h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Contact Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Uncle / Relative Name"
                                            value={form.data.emergency_contact_name}
                                            onChange={(e) =>
                                                form.setData('emergency_contact_name', e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Emergency Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="+92 333 1112233"
                                            value={form.data.emergency_contact_phone}
                                            onChange={(e) =>
                                                form.setData('emergency_contact_phone', e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Relationship to Student
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Uncle / Aunt / Family Friend"
                                            value={form.data.emergency_contact_relation}
                                            onChange={(e) =>
                                                form.setData('emergency_contact_relation', e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                ← Back to Guardians
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                            >
                                <span>Continue to Academic Placement</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* SECTION 4: ACADEMIC PLACEMENT */}
                {currentStep === 4 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Academic Enrollment & Placement
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Assign target class, section cohort, academic session, admission date, and roll number
                                </p>
                            </div>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Step 4 of 6
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Admission Number *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={form.data.admission_number}
                                            onChange={(e) =>
                                                form.setData('admission_number', e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-bold text-purple-600 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-purple-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'admission_number',
                                                    `ADM-${new Date().getFullYear()}-${Math.floor(
                                                        1000 + Math.random() * 9000
                                                    )}`
                                                )
                                            }
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                    {form.errors.admission_number && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {form.errors.admission_number}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Admission Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.data.admission_date}
                                        onChange={(e) =>
                                            form.setData('admission_date', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Academic Session / Year *
                                    </label>
                                    <select
                                        value={form.data.academic_year_id}
                                        onChange={(e) =>
                                            form.setData('academic_year_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {academicYears.map((ay) => (
                                            <option key={ay.id} value={ay.id}>
                                                {ay.name} {ay.is_current ? '(Current Active)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Target Class / Grade *
                                    </label>
                                    <select
                                        value={form.data.school_class_id}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="" disabled>
                                            Select Class...
                                        </option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.school_class_id && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {form.errors.school_class_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Assigned Section *
                                    </label>
                                    <select
                                        value={form.data.class_section_id}
                                        onChange={(e) =>
                                            form.setData('class_section_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        {availableSections.length === 0 ? (
                                            <option value="">No sections found for this class</option>
                                        ) : (
                                            availableSections.map((sec) => (
                                                <option key={sec.id} value={sec.id}>
                                                    {sec.name} {sec.room ? `(${sec.room})` : ''}{' '}
                                                    {sec.capacity ? `[Max ${sec.capacity}]` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {form.errors.class_section_id && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {form.errors.class_section_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Roll / Student ID Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="STU-042"
                                        value={form.data.roll_number}
                                        onChange={(e) =>
                                            form.setData('roll_number', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Enrollment Status *
                                    </label>
                                    <select
                                        value={form.data.enrollment_status}
                                        onChange={(e) =>
                                            form.setData('enrollment_status', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="active">Active (Currently Enrolled)</option>
                                        <option value="inactive">Inactive / On Hold</option>
                                        <option value="transferred">Transferred from other Branch</option>
                                        <option value="graduated">Graduated / Alumnus</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Admission Category
                                    </label>
                                    <select
                                        value={form.data.fee_category}
                                        onChange={(e) =>
                                            form.setData('fee_category', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="general">Regular / General Admission</option>
                                        <option value="scholarship">Merit Scholarship</option>
                                        <option value="sibling_discount">Sibling Concession</option>
                                        <option value="staff_child">Faculty / Staff Ward</option>
                                        <option value="custom">Custom Quota</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                ← Back to Address
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(5)}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                            >
                                <span>Continue to Fee Structure</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* SECTION 5: FEE STRUCTURE & FINANCIAL DETAILS */}
                {currentStep === 5 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Student Fee Structure & Financial Setup
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Define monthly tuition, one-time admission dues, scholarships, and payment schedules
                                </p>
                            </div>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Step 5 of 6
                            </span>
                        </div>

                        {/* Live Financial Summary Banner */}
                        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Base Monthly Charges
                                </span>
                                <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                    {currency} {baseMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                    Tuition + recurring services
                                </span>
                            </div>

                            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-950/20">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                    Monthly Discount
                                </span>
                                <div className="mt-1 text-base font-bold text-amber-700 dark:text-amber-400">
                                    - {currency} {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                                    {form.data.discount_type === 'percentage'
                                        ? `${form.data.discount_value}% concession`
                                        : form.data.discount_type === 'fixed'
                                        ? 'Fixed amount concession'
                                        : 'No concession applied'}
                                </span>
                            </div>

                            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/20">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                    Net Monthly Payable
                                </span>
                                <div className="mt-1 text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                                    {currency} {netMonthlyPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                                    Due by {form.data.due_day}th of each month
                                </span>
                            </div>

                            <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-500/20 dark:bg-purple-950/20">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                    One-Time Admission Dues
                                </span>
                                <div className="mt-1 text-base font-bold text-purple-700 dark:text-purple-300">
                                    {currency} {oneTimeCharges.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80">
                                    Admission + Annual dues
                                </span>
                            </div>
                        </div>

                        {/* Financial Input Fields */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Monthly Tuition Fee ({currency}) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={form.data.monthly_tuition_fee}
                                        onChange={(e) =>
                                            form.setData(
                                                'monthly_tuition_fee',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Transport / Bus Charges ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        value={form.data.transport_fee}
                                        onChange={(e) =>
                                            form.setData(
                                                'transport_fee',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                    <span className="text-[10px] text-slate-400">
                                        Optional student van / bus service fee
                                    </span>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Other Recurring Charges ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="500"
                                        value={form.data.other_recurring_charges}
                                        onChange={(e) =>
                                            form.setData(
                                                'other_recurring_charges',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                    <span className="text-[10px] text-slate-400">
                                        Lab, library, sports, or IT fees
                                    </span>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Admission Fee (One-Time)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.admission_fee}
                                        onChange={(e) =>
                                            form.setData(
                                                'admission_fee',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Annual / Registration Fee
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.annual_fee}
                                        onChange={(e) =>
                                            form.setData(
                                                'annual_fee',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Discount / Scholarship Row */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                <h4 className="mb-3 text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                                    Concession / Scholarship Adjustment
                                </h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Discount Type
                                        </label>
                                        <select
                                            value={form.data.discount_type}
                                            onChange={(e) =>
                                                form.setData('discount_type', e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="none">No Discount (0%)</option>
                                            <option value="percentage">Percentage Concession (%)</option>
                                            <option value="fixed">Fixed Monthly Amount ({currency})</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Discount Value ({form.data.discount_type === 'percentage' ? '%' : currency})
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            disabled={form.data.discount_type === 'none'}
                                            value={form.data.discount_value}
                                            onChange={(e) =>
                                                form.setData(
                                                    'discount_value',
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Concession Rationale / Reason
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Sibling enrolled in Grade 5"
                                            value={form.data.discount_reason}
                                            onChange={(e) =>
                                                form.setData('discount_reason', e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Payment Frequency
                                    </label>
                                    <select
                                        value={form.data.payment_frequency}
                                        onChange={(e) =>
                                            form.setData('payment_frequency', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly (Every 3 months)</option>
                                        <option value="semi_annual">Semi-Annual (Bi-yearly)</option>
                                        <option value="annual">Annual (Lump sum)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Monthly Due Date Day (1-31)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={form.data.due_day}
                                        onChange={(e) =>
                                            form.setData('due_day', parseInt(e.target.value) || 10)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                    <span className="text-[10px] text-slate-400">
                                        Day of the month when fee challan is due
                                    </span>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                        Effective Billing Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.data.effective_date}
                                        onChange={(e) =>
                                            form.setData('effective_date', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                ← Back to Academic Placement
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(6)}
                                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-500"
                            >
                                <span>Continue to Documents</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* SECTION 6: DOCUMENTS & FINAL ADMISSION NOTES */}
                {currentStep === 6 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Official Admission Documents & Final Remarks
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Upload birth certificates, transfer certificates, and verify institutional enrollment details
                                </p>
                            </div>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                Step 6 of 6
                            </span>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Birth Certificate */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                                    <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-slate-900 dark:text-white">
                                        <FileText className="size-4 text-purple-600 dark:text-purple-400" />
                                        <span>Birth Certificate / B-Form Document</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                                        Scanned copy or photograph of government-issued birth cert (PDF, JPG, PNG up to 5MB)
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf,image/png,image/jpeg,image/jpg"
                                        onChange={(e) =>
                                            form.setData(
                                                'document_birth_cert',
                                                e.target.files ? e.target.files[0] : null
                                            )
                                        }
                                        className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-200 dark:text-slate-400 dark:file:bg-purple-950/60 dark:file:text-purple-300"
                                    />
                                    {form.data.document_birth_cert && (
                                        <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                                            ✓ {form.data.document_birth_cert.name}
                                        </p>
                                    )}
                                </div>

                                {/* Previous School Certificate */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                                    <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-slate-900 dark:text-white">
                                        <FileText className="size-4 text-purple-600 dark:text-purple-400" />
                                        <span>Previous School Report / Result Card</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                                        Last grade mark sheet or transcript from previous school (PDF, JPG, PNG up to 5MB)
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf,image/png,image/jpeg,image/jpg"
                                        onChange={(e) =>
                                            form.setData(
                                                'document_previous_school',
                                                e.target.files ? e.target.files[0] : null
                                            )
                                        }
                                        className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-200 dark:text-slate-400 dark:file:bg-purple-950/60 dark:file:text-purple-300"
                                    />
                                    {form.data.document_previous_school && (
                                        <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                                            ✓ {form.data.document_previous_school.name}
                                        </p>
                                    )}
                                </div>

                                {/* School Leaving Certificate */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                                    <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-slate-900 dark:text-white">
                                        <FileText className="size-4 text-purple-600 dark:text-purple-400" />
                                        <span>School Leaving Certificate (SLC)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                                        Official migration certificate or clearance slip from previous institution
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf,image/png,image/jpeg,image/jpg"
                                        onChange={(e) =>
                                            form.setData(
                                                'document_leaving_cert',
                                                e.target.files ? e.target.files[0] : null
                                            )
                                        }
                                        className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-200 dark:text-slate-400 dark:file:bg-purple-950/60 dark:file:text-purple-300"
                                    />
                                    {form.data.document_leaving_cert && (
                                        <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                                            ✓ {form.data.document_leaving_cert.name}
                                        </p>
                                    )}
                                </div>

                                {/* Other Admission Document */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                                    <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-slate-900 dark:text-white">
                                        <FileText className="size-4 text-purple-600 dark:text-purple-400" />
                                        <span>Additional Admission Document</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                                        Any additional affidavit, medical certificate, or scholarship letter
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf,image/png,image/jpeg,image/jpg"
                                        onChange={(e) =>
                                            form.setData(
                                                'document_other',
                                                e.target.files ? e.target.files[0] : null
                                            )
                                        }
                                        className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-200 dark:text-slate-400 dark:file:bg-purple-950/60 dark:file:text-purple-300"
                                    />
                                    {form.data.document_other && (
                                        <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                                            ✓ {form.data.document_other.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Final Remarks */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                    Admission Officer Remarks & Notes
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter any admission committee notes, special placement remarks, or enrollment comments..."
                                    value={form.data.remarks}
                                    onChange={(e) => form.setData('remarks', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Final Review Callout */}
                            <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 dark:border-purple-500/20 dark:bg-purple-950/20">
                                <div className="flex items-start gap-3">
                                    <Info className="size-5 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300">
                                            Review Summary Before Admission
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                            Upon confirmation, student <strong className="text-slate-900 dark:text-white">{form.data.name || 'Student'}</strong> will be enrolled into{' '}
                                            <strong className="text-purple-700 dark:text-purple-300">
                                                {classes.find((c) => String(c.id) === form.data.school_class_id)?.name || 'Class'} (
                                                {sections.find((s) => String(s.id) === form.data.class_section_id)?.name || 'Section'})
                                            </strong>{' '}
                                            with Admission #{' '}
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                {form.data.admission_number}
                                            </span>
                                            . Net monthly tuition is set to{' '}
                                            <strong className="text-emerald-600 dark:text-emerald-400">
                                                {currency} {netMonthlyPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </strong>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(5)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                ← Back to Fee Structure
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                            >
                                {form.processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="size-4" />
                                )}
                                <span>Complete Admission & Enroll Student</span>
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </TenantLayout>
    );
}
