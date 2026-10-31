import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import {
    Building2,
    Palette,
    Calendar,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Upload,
    Image as ImageIcon,
    ShieldCheck,
    Check,
    School,
    Globe,
    Clock,
    DollarSign,
    LogOut,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

interface Plan {
    id: number;
    name: string;
    slug: string;
    max_organizations: number | null;
}

interface DefaultAcademicSession {
    name: string;
    start_date: string;
    end_date: string;
}

interface SetupWizardProps {
    plans?: Plan[];
    initialPlan?: string;
    defaultAcademicSession: DefaultAcademicSession;
    rootDomain?: string;
    appUrl?: string;
    ownedCount?: number;
    maxAllowed?: number | null;
}

const PRESET_COLORS = [
    { label: 'Instituto Purple', value: '#7c3aed' },
    { label: 'Royal Indigo', value: '#4f46e5' },
    { label: 'Ocean Blue', value: '#2563eb' },
    { label: 'Emerald Green', value: '#059669' },
    { label: 'Amber Gold', value: '#d97706' },
    { label: 'Slate Navy', value: '#1e293b' },
];

export default function WorkspaceSetupWizard({
    plans = [],
    initialPlan = 'starter',
    defaultAcademicSession,
    rootDomain = 'localhost',
    appUrl = 'http://127.0.0.1:8000',
    ownedCount = 0,
    maxAllowed = null,
}: SetupWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    // Form data
    const [name, setName] = useState('');
    const [organizationType, setOrganizationType] = useState('school');
    const [slug, setSlug] = useState('');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Slug check state
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugMessage, setSlugMessage] = useState('');

    // Branding
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#7c3aed');
    const [skipBranding, setSkipBranding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Academic setup
    const [sessionName, setSessionName] = useState(defaultAcademicSession?.name || '2026-2027 Academic Session');
    const [startDate, setStartDate] = useState(defaultAcademicSession?.start_date || '2026-09-01');
    const [endDate, setEndDate] = useState(defaultAcademicSession?.end_date || '2027-06-30');
    const [skipAcademic, setSkipAcademic] = useState(false);
    const [timezone, setTimezone] = useState('UTC');
    const [currency, setCurrency] = useState('USD');

    // Plan & submission
    const [selectedPlan] = useState(initialPlan || 'starter');
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Auto-suggest slug from name
    const handleNameChange = (val: string) => {
        setName(val);
        setValidationError(null);
        if (!slugManuallyEdited) {
            const generated = val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setSlug(generated);
        }
    };

    // Live slug verification debounced
    useEffect(() => {
        if (!slug.trim()) {
            setSlugAvailable(null);
            setSlugMessage('');
            return;
        }

        const timer = setTimeout(async () => {
            setSlugChecking(true);
            try {
                const res = await fetch(`/workspace/setup/check-slug?slug=${encodeURIComponent(slug.trim())}`);
                const data = await res.json();
                setSlugAvailable(data.available);
                setSlugMessage(data.message);
            } catch {
                setSlugAvailable(null);
                setSlugMessage('Unable to verify subdomain at this time.');
            } finally {
                setSlugChecking(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [slug]);

    // Handle logo file upload
    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setValidationError('Logo file size must be less than 2MB.');
                return;
            }
            setLogoFile(file);
            setSkipBranding(false);
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Validation per step
    const canProceedFromStep1 = () => {
        if (!name.trim()) {
            setValidationError('Please enter your school or institution name.');
            return false;
        }
        if (!slug.trim()) {
            setValidationError('Please enter a workspace subdomain identifier.');
            return false;
        }
        if (slugAvailable === false) {
            setValidationError(slugMessage || 'Please choose an available subdomain.');
            return false;
        }
        setValidationError(null);
        return true;
    };

    const nextStep = () => {
        if (step === 1) {
            if (!canProceedFromStep1()) return;
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            if (!skipAcademic && (!startDate || !endDate || startDate > endDate)) {
                setValidationError('Academic session start date must be before end date.');
                return;
            }
            setValidationError(null);
            setStep(4);
        }
    };

    const prevStep = () => {
        setValidationError(null);
        if (step > 1) {
            setStep((step - 1) as 1 | 2 | 3 | 4);
        }
    };

    // Submit workspace creation
    const handleCreateWorkspace = () => {
        setSubmitting(true);
        setValidationError(null);

        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('slug', slug.trim());
        formData.append('organization_type', organizationType);
        formData.append('primary_color', primaryColor);
        formData.append('accent_color', '#f59e0b');
        formData.append('timezone', timezone);
        formData.append('currency', currency);
        formData.append('plan', selectedPlan);

        if (logoFile && !skipBranding) {
            formData.append('logo', logoFile);
        }

        if (skipAcademic) {
            formData.append('skip_academic_setup', '1');
        } else {
            formData.append('academic_session_name', sessionName.trim());
            formData.append('academic_start_date', startDate);
            formData.append('academic_end_date', endDate);
        }

        router.post('/workspace/setup', formData, {
            forceFormData: true,
            onError: (errs) => {
                setSubmitting(false);
                const firstErr = Object.values(errs)[0];
                setValidationError(typeof firstErr === 'string' ? firstErr : 'Failed to create workspace. Please verify all fields.');
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    };

    // Local / Subdomain preview helper
    const previewHost = rootDomain === 'localhost' || rootDomain.includes('127.0.0.1')
        ? `${appUrl}?subdomain=${slug || 'your-school'}`
        : `https://${slug || 'your-school'}.${rootDomain}`;

    const stepHeaders = [
        { num: 1, title: 'School Identity', icon: Building2 },
        { num: 2, title: 'Branding & Logo', icon: Palette },
        { num: 3, title: 'Academic Session', icon: Calendar },
        { num: 4, title: 'Review & Launch', icon: Sparkles },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-purple-500 selection:text-white dark:bg-[#070b14] dark:text-slate-100">
            <Head title="Create Your School Workspace — InstitutoPropio" />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-[#0B1220]/90">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                            <AppLogoIcon className="size-5" />
                        </div>
                        <div>
                            <span className="block text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                                InstitutoPropio
                            </span>
                            <span className="text-[10px] font-semibold tracking-wider text-purple-600 uppercase dark:text-purple-400">
                                Workspace Setup Wizard
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        <span className="hidden rounded-full border border-purple-200 bg-purple-50 px-3 py-1 font-semibold text-purple-700 sm:inline-block dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                            30-Day Free Trial Included
                        </span>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center gap-1.5 text-slate-500 transition hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                        >
                            <LogOut className="size-3.5" />
                            <span>Sign Out</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Stepper Container */}
            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:py-12">
                {/* Stepper Indicator */}
                <div className="mb-8">
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                        <span className="text-purple-600 dark:text-purple-400">
                            Step {step} of 4: {stepHeaders[step - 1].title}
                        </span>
                        <span className="text-slate-400">
                            {step === 4 ? 'Ready to Launch' : 'Progress: ' + (step * 25) + '%'}
                        </span>
                    </div>

                    {/* Stepper Bar */}
                    <div className="grid grid-cols-4 gap-2">
                        {stepHeaders.map((item) => {
                            const Icon = item.icon;
                            const isCompleted = step > item.num;
                            const isCurrent = step === item.num;
                            return (
                                <div
                                    key={item.num}
                                    className={`flex items-center gap-2 rounded-xl border p-2.5 transition-all ${
                                        isCurrent
                                            ? 'border-purple-600 bg-purple-50/70 font-bold text-purple-700 shadow-xs dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-300'
                                            : isCompleted
                                            ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-400'
                                            : 'border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900/60'
                                    }`}
                                >
                                    <div
                                        className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-xs ${
                                            isCompleted
                                                ? 'bg-emerald-600 text-white'
                                                : isCurrent
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                                    </div>
                                    <span className="hidden truncate text-xs sm:inline">
                                        {item.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                    <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                        <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>{validationError}</span>
                    </div>
                )}

                {/* Wizard Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10 dark:border-slate-800 dark:bg-[#0B1220]">
                    {/* STEP 1: ORGANIZATION IDENTITY */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Define Your Educational Workspace
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Every school or academy operates inside its own isolated database scope with its own unique identifier.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                    School / Organization Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="e.g. Oakridge International Academy"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                        Institution Classification *
                                    </label>
                                    <select
                                        value={organizationType}
                                        onChange={(e) => setOrganizationType(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 transition outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="school">K-12 School</option>
                                        <option value="academy">Academic Academy</option>
                                        <option value="college">College / University</option>
                                        <option value="training_institute">Training Institute</option>
                                        <option value="coaching_center">Coaching & Tutoring Center</option>
                                        <option value="online_course_provider">Online Course Provider</option>
                                        <option value="other">Other Educational Organization</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label className="text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                            Workspace Subdomain / Slug *
                                        </label>
                                        {slugChecking && (
                                            <span className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
                                                <Loader2 className="size-3 animate-spin" />
                                                <span>Checking...</span>
                                            </span>
                                        )}
                                        {!slugChecking && slugAvailable === true && (
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="size-3" />
                                                <span>Available</span>
                                            </span>
                                        )}
                                        {!slugChecking && slugAvailable === false && (
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                                <AlertCircle className="size-3" />
                                                <span>Unavailable</span>
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. oakridge-academy"
                                        value={slug}
                                        onChange={(e) => {
                                            setSlugManuallyEdited(true);
                                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                        }}
                                        className={`w-full rounded-xl border px-4 py-3 text-sm font-mono text-slate-900 transition outline-none focus:ring-2 ${
                                            slugAvailable === false
                                                ? 'border-rose-300 bg-rose-50/50 focus:border-rose-600 focus:ring-rose-500/20 dark:border-rose-800 dark:bg-rose-950/20'
                                                : slugAvailable === true
                                                ? 'border-emerald-300 bg-emerald-50/50 focus:border-emerald-600 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-emerald-950/20'
                                                : 'border-slate-200 bg-slate-50 focus:border-purple-600 focus:bg-white focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-900'
                                        } dark:text-white`}
                                    />
                                    {slugMessage && (
                                        <p className={`mt-1 text-xs ${slugAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                            {slugMessage}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Live Subdomain Preview Box */}
                            <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-500/20 dark:bg-purple-950/20">
                                <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    <Globe className="size-4" />
                                    <span>Isolated Workspace Address</span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-2 font-mono text-xs text-slate-800 dark:text-slate-200">
                                    <span className="truncate rounded-md bg-white px-2 py-1 font-bold shadow-xs dark:bg-slate-900">
                                        {previewHost}
                                    </span>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                    Subdomain routing is supported in production and simulated seamlessly in local development. No hosts file editing required.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: BRANDING & APPEARANCE */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    School Branding & Emblem
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Personalize your LMS with your official institution logo and primary brand palette.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Logo Upload */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                        Institution Logo (Optional)
                                    </label>
                                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-purple-400 dark:border-slate-700 dark:bg-slate-900">
                                        {logoPreview ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="size-20 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="text-xs font-medium text-rose-600 transition hover:underline dark:text-rose-400"
                                                >
                                                    Remove Logo
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                    <Upload className="size-6" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-xs font-semibold text-purple-600 transition hover:underline dark:text-purple-400"
                                                >
                                                    Click to upload emblem / logo
                                                </button>
                                                <span className="mt-1 text-[11px] text-slate-400">
                                                    PNG, JPG, SVG, or WEBP (Max 2MB)
                                                </span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoFileChange}
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Primary Brand Color */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                        Brand Accent Color
                                    </label>
                                    <div className="mb-3 flex items-center gap-3">
                                        <div
                                            className="size-10 shrink-0 rounded-xl border border-slate-300 shadow-xs dark:border-slate-700"
                                            style={{ backgroundColor: primaryColor }}
                                        />
                                        <input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            placeholder="#7c3aed"
                                            className="w-36 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {PRESET_COLORS.map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => setPrimaryColor(preset.value)}
                                                className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs transition ${
                                                    primaryColor.toLowerCase() === preset.value.toLowerCase()
                                                        ? 'border-purple-600 bg-purple-50 font-bold dark:border-purple-400 dark:bg-purple-950/40'
                                                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                                                }`}
                                            >
                                                <div
                                                    className="size-4 shrink-0 rounded-full"
                                                    style={{ backgroundColor: preset.value }}
                                                />
                                                <span className="truncate text-[11px]">{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Preview Box */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <span className="mb-2 block text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                                    Live Sidebar Header Preview
                                </span>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#0B1220]">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Preview"
                                            className="size-9 rounded-lg border border-slate-200 object-contain p-0.5 dark:border-slate-800"
                                        />
                                    ) : (
                                        <div
                                            className="flex size-9 items-center justify-center rounded-lg text-white shadow-xs"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            <Building2 className="size-5" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {name || 'Your School Name'}
                                        </h4>
                                        <span className="text-[10px] font-semibold tracking-wide text-purple-600 uppercase dark:text-purple-400">
                                            Owner Workspace &bull; {slug || 'subdomain'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: ACADEMIC CALENDAR & LOCALIZATION */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Academic Calendar & Localization
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Configure your current academic session and localized operational settings.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSkipAcademic(!skipAcademic)}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                        skipAcademic
                                            ? 'border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-950/40 dark:text-purple-300'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    {skipAcademic ? 'Customizing Dates' : 'Skip & Use Defaults'}
                                </button>
                            </div>

                            {!skipAcademic ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                            Academic Session / Year Title
                                        </label>
                                        <input
                                            type="text"
                                            value={sessionName}
                                            onChange={(e) => setSessionName(e.target.value)}
                                            placeholder="e.g. 2026-2027 Academic Session"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                                Session Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                                Session End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-xs text-purple-800 dark:border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-300">
                                    <p className="font-semibold">Standard Academic Calendar will be initialized:</p>
                                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                                        Session: {defaultAcademicSession?.name} ({defaultAcademicSession?.start_date} to {defaultAcademicSession?.end_date}). You can adjust term dates anytime from your academic dashboard.
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                        Timezone
                                    </label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                                        <option value="America/New_York">Eastern Time (US & Canada)</option>
                                        <option value="America/Chicago">Central Time (US & Canada)</option>
                                        <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                        <option value="Europe/London">London (GMT/BST)</option>
                                        <option value="Asia/Karachi">Karachi, Islamabad (PKT)</option>
                                        <option value="Asia/Dubai">Dubai (GST)</option>
                                        <option value="Asia/Singapore">Singapore (SGT)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                                        Currency
                                    </label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="USD">USD ($) — US Dollar</option>
                                        <option value="EUR">EUR (€) — Euro</option>
                                        <option value="GBP">GBP (£) — British Pound</option>
                                        <option value="CAD">CAD ($) — Canadian Dollar</option>
                                        <option value="AUD">AUD ($) — Australian Dollar</option>
                                        <option value="PKR">PKR (Rs) — Pakistani Rupee</option>
                                        <option value="AED">AED (AED) — UAE Dirham</option>
                                        <option value="SGD">SGD ($) — Singapore Dollar</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW & CREATE */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Review Workspace Details
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Confirm your configuration. Once launched, your school dashboard will be ready immediately.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                                        Institution & Subdomain
                                    </span>
                                    <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                        {name}
                                    </h4>
                                    <p className="text-xs text-purple-600 dark:text-purple-400">
                                        Subdomain: <code className="font-mono">{slug}</code>
                                    </p>
                                    <p className="mt-1 text-xs capitalize text-slate-500">
                                        Type: {organizationType.replace(/_/g, ' ')}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                                        Subscription & Trial
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-base font-bold capitalize text-slate-900 dark:text-white">
                                            {selectedPlan} Plan
                                        </span>
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            30-Day Free Trial
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Full access to classrooms, students, teachers, grades, and fees.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                                        Visual Branding
                                    </span>
                                    <div className="mt-2 flex items-center gap-3">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Logo"
                                                className="size-8 rounded-lg border object-contain p-0.5 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div
                                                className="size-8 rounded-lg"
                                                style={{ backgroundColor: primaryColor }}
                                            />
                                        )}
                                        <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                            Accent: {primaryColor}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                                        Academic Calendar & Currency
                                    </span>
                                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                                        {skipAcademic ? defaultAcademicSession?.name : sessionName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Currency: {currency} &bull; Timezone: {timezone}
                                    </p>
                                </div>
                            </div>

                            {/* Tenant Isolation Guarantee */}
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300">
                                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <span className="block font-bold">Guaranteed Tenant Isolation</span>
                                    <span>
                                        Your school will be provisioned with its own isolated scope. No other institution can access your student rosters, fee collections, or timetable entries.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons Row */}
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800/80">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={submitting}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Back</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={step === 1 && slugAvailable === false}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                            >
                                <span>Continue</span>
                                <ArrowRight className="size-3.5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCreateWorkspace}
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Creating Workspace...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4" />
                                        <span>Create Workspace & Start Trial</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
