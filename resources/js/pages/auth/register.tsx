import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLogoIcon from '@/components/app-logo-icon';
import { login } from '@/routes';
import OnboardingLayout from '@/layouts/onboarding-layout';
import {
    Building2,
    KeyRound,
    BookOpen,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';

interface InvitationData {
    token: string;
    email?: string;
    role: string;
    organization_name: string;
}

interface PlanData {
    id: number;
    name: string;
    slug: string;
    max_organizations: number | null;
}

interface RegisterProps {
    initialJourney?: 'school' | 'join' | 'learner';
    initialToken?: string | null;
    initialPlan?: string;
    initialInterval?: 'monthly' | 'annual';
    plans?: PlanData[];
    invitation?: InvitationData | null;
}

export default function Register({
    initialJourney = 'school',
    initialToken = null,
    initialPlan = 'starter',
    initialInterval = 'monthly',
    plans = [],
    invitation = null,
}: RegisterProps) {
    const [journey, setJourney] = useState<'school' | 'join' | 'learner'>(
        invitation || initialToken ? 'join' : initialJourney,
    );

    const resolvedInitialPlan =
        initialPlan === 'bronze'
            ? 'starter'
            : initialPlan === 'silver'
            ? 'growth'
            : initialPlan === 'gold'
            ? 'professional'
            : initialPlan === 'premium'
            ? 'enterprise'
            : initialPlan || 'starter';

    // Form A: Create a School
    const schoolForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        school_name: '',
        subdomain: '',
        plan: resolvedInitialPlan,
        billing_interval: initialInterval || 'monthly',
        organization_type: 'school',
    });

    // Form B: Join a School
    const joinForm = useForm({
        invitation_token: invitation?.token || initialToken || '',
        name: '',
        email: invitation?.email || '',
        password: '',
        password_confirmation: '',
    });

    // Form C: Individual Learner
    const learnerForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (invitation) {
            joinForm.setData((prev) => ({
                ...prev,
                invitation_token: invitation.token,
                email: invitation.email || prev.email,
            }));
            setJourney('join');
        }
    }, [invitation]);

    const handleSchoolSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        schoolForm.post('/register/school', {
            onFinish: () =>
                schoolForm.reset('password', 'password_confirmation'),
        });
    };

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        joinForm.post('/register/join', {
            onFinish: () => joinForm.reset('password', 'password_confirmation'),
        });
    };

    const handleLearnerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        learnerForm.post('/register/learner', {
            onFinish: () =>
                learnerForm.reset('password', 'password_confirmation'),
        });
    };

    return (
        <OnboardingLayout title="Get Started with InstitutoPropio — Choose Registration Journey">
            <div className="bg-[#F8FAFC] py-10 sm:py-14 md:py-16 border-b border-slate-100 min-h-[80vh]">
                <div className="mx-auto w-full max-w-[1720px] px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                    {/* Top Navigation Row */}
                    <div className="mx-auto mb-6 max-w-5xl">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-[#1769E0]"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Back to Homepage</span>
                        </Link>
                    </div>

                    {/* Main Registration Two-Column Container */}
                    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-12">
                            {/* Left Column: Branding, Context & Platform Value (5 cols) */}
                            <div className="flex flex-col justify-between border-b border-slate-200 bg-[#F7F9FC] p-6 sm:p-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:p-10">
                                <div>
                                    {/* Brand Header */}
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-3"
                                    >
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#1769E0] text-white shadow-md shadow-blue-500/20 ring-2 ring-[#1769E0]/20">
                                            <AppLogoIcon className="size-5.5 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-extrabold tracking-tight text-[#0B1528]">
                                                InstitutoPropio
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider text-[#1769E0] uppercase">
                                                Unified Education SaaS
                                            </span>
                                        </div>
                                    </Link>

                                    <div className="mt-8 space-y-3">
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 text-xs font-bold text-[#1769E0]">
                                            <Sparkles className="size-3.5" />
                                            <span>Fast & Secure Onboarding</span>
                                        </div>
                                        <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1528] sm:text-3xl">
                                            Join the Modern Era of Education
                                        </h1>
                                        <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                            Whether governing an entire school system,
                                            joining your department via invitation, or
                                            learning independently, our unified platform delivers
                                            a dedicated workspace.
                                        </p>
                                    </div>

                                    {/* Journey-Specific Highlights */}
                                    <div className="mt-8 space-y-3.5 border-t border-slate-200/80 pt-6">
                                        {journey === 'school' && (
                                            <>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Automated Tenant Provisioning:
                                                        </strong>{' '}
                                                        Dedicated data scope, custom subdomain, and academic calendars.
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Complete Operational Suite:
                                                        </strong>{' '}
                                                        Manage classes, faculty invitations, student rosters, and daily attendance.
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            30-Day Free Trial:
                                                        </strong>{' '}
                                                        Experience all institutional features with zero lock-in.
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        {journey === 'join' && (
                                            <>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Cryptographic Verification:
                                                        </strong>{' '}
                                                        Your invitation token guarantees assignment to your exact authorized role.
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Role-Tailored Portals:
                                                        </strong>{' '}
                                                        Instant access to teacher grading, student courses, or parent progress hubs.
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Existing Account Support:
                                                        </strong>{' '}
                                                        Securely attach to new schools without creating duplicate profiles.
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        {journey === 'learner' && (
                                            <>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Independent Learning Hub:
                                                        </strong>{' '}
                                                        Immediate access to the public course catalog and syllabus outlines.
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Multimedia Streaming:
                                                        </strong>{' '}
                                                        Interactive video lectures and real-time completion tracking.
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1769E0]" />
                                                    <span>
                                                        <strong className="text-slate-900">
                                                            Verified Digital Certificates:
                                                        </strong>{' '}
                                                        Earn tamper-proof credentials upon course completion.
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Security Assurance Footer */}
                                <div className="mt-8 border-t border-slate-200 pt-5">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <ShieldCheck className="size-4 text-emerald-600" />
                                        <span>
                                            256-Bit SSL Encrypted • Multi-Tenant Architecture
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: 3 Journey Cards + Registration Form (7 cols) */}
                            <div className="p-6 sm:p-8 lg:col-span-7 lg:p-10">
                                {/* 3-Journey Selector Cards */}
                                <div className="mb-6">
                                    <Label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Select Your Registration Option:
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                        {/* Option 1: Create a School */}
                                        <button
                                            type="button"
                                            onClick={() => setJourney('school')}
                                            className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                                                journey === 'school'
                                                    ? 'border-[#1769E0] bg-blue-50/70 shadow-xs ring-2 ring-[#1769E0]/20'
                                                    : 'border-slate-200 bg-[#F7F9FC] hover:border-slate-300 hover:bg-white'
                                            }`}
                                        >
                                            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-blue-100 text-[#1769E0]">
                                                <Building2 className="size-4" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">
                                                Create School
                                            </span>
                                            <span className="mt-0.5 text-[11px] text-slate-500">
                                                Owner / Director
                                            </span>
                                        </button>

                                        {/* Option 2: Join a School */}
                                        <button
                                            type="button"
                                            onClick={() => setJourney('join')}
                                            className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                                                journey === 'join'
                                                    ? 'border-[#1769E0] bg-blue-50/70 shadow-xs ring-2 ring-[#1769E0]/20'
                                                    : 'border-slate-200 bg-[#F7F9FC] hover:border-slate-300 hover:bg-white'
                                            }`}
                                        >
                                            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                                <KeyRound className="size-4" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">
                                                Join School
                                            </span>
                                            <span className="mt-0.5 text-[11px] text-slate-500">
                                                Teacher / Student / Parent
                                            </span>
                                        </button>

                                        {/* Option 3: Individual Learner */}
                                        <button
                                            type="button"
                                            onClick={() => setJourney('learner')}
                                            className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                                                journey === 'learner'
                                                    ? 'border-[#1769E0] bg-blue-50/70 shadow-xs ring-2 ring-[#1769E0]/20'
                                                    : 'border-slate-200 bg-[#F7F9FC] hover:border-slate-300 hover:bg-white'
                                            }`}
                                        >
                                            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-orange-100 text-[#FF7A30]">
                                                <BookOpen className="size-4" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">
                                                Learn Online
                                            </span>
                                            <span className="mt-0.5 text-[11px] text-slate-500">
                                                Individual Learner
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Journey A Form: Create a School */}
                                {journey === 'school' && (
                                    <form
                                        onSubmit={handleSchoolSubmit}
                                        className="space-y-4"
                                    >
                                        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="size-4 text-[#1769E0]" />
                                                    <strong className="font-bold text-[#0B1528]">
                                                        30-Day Free Trial
                                                    </strong>
                                                </div>
                                                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-[#1769E0] border border-blue-200 shadow-xs">
                                                    Selected: {schoolForm.data.plan.toUpperCase()} • {schoolForm.data.billing_interval.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 text-xs text-slate-600">
                                                Unlimited students & teachers on all plans. Payment method verification required before trial activation with zero initial charges.
                                            </p>

                                            {/* Monthly / Annual Interval Toggle */}
                                            <div className="mt-3 flex items-center gap-2 border-b border-blue-200 pb-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => schoolForm.setData('billing_interval', 'monthly')}
                                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                                        schoolForm.data.billing_interval === 'monthly'
                                                            ? 'bg-[#1769E0] text-white shadow-xs'
                                                            : 'bg-white text-slate-600 hover:text-slate-900'
                                                    }`}
                                                >
                                                    Monthly Billing
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => schoolForm.setData('billing_interval', 'annual')}
                                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                                                        schoolForm.data.billing_interval === 'annual'
                                                            ? 'bg-[#1769E0] text-white shadow-xs'
                                                            : 'bg-white text-slate-600 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <span>Annual Billing</span>
                                                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                                        2 Mo Free
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Plan Selector Buttons */}
                                            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {[
                                                    {
                                                        slug: 'starter',
                                                        name: 'Starter',
                                                        limit: '1 Institution',
                                                        price: schoolForm.data.billing_interval === 'annual' ? '$190/yr' : '$19/mo',
                                                    },
                                                    {
                                                        slug: 'growth',
                                                        name: 'Growth',
                                                        limit: 'Up to 5',
                                                        price: schoolForm.data.billing_interval === 'annual' ? '$490/yr' : '$49/mo',
                                                    },
                                                    {
                                                        slug: 'professional',
                                                        name: 'Professional',
                                                        limit: 'Up to 10',
                                                        price: schoolForm.data.billing_interval === 'annual' ? '$990/yr' : '$99/mo',
                                                    },
                                                    {
                                                        slug: 'enterprise',
                                                        name: 'Enterprise',
                                                        limit: 'Unlimited',
                                                        price: '$249/mo',
                                                    },
                                                ].map((p) => {
                                                    const isSelected = schoolForm.data.plan === p.slug;
                                                    return (
                                                        <button
                                                            key={p.slug}
                                                            type="button"
                                                            onClick={() => schoolForm.setData('plan', p.slug)}
                                                            className={`flex flex-col items-start rounded-xl border p-2 text-left transition ${
                                                                isSelected
                                                                    ? 'border-[#1769E0] bg-white ring-2 ring-[#1769E0]/20 shadow-xs'
                                                                    : 'border-slate-200 bg-white/70 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <div className="flex w-full items-center justify-between">
                                                                <span className="text-[11px] font-bold text-slate-900">{p.name}</span>
                                                                {isSelected && <CheckCircle2 className="size-3 text-[#1769E0]" />}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[#1769E0]">{p.price}</span>
                                                            <span className="text-[9px] text-slate-500">{p.limit}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="school_owner_name"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Owner / Director Full Name *
                                                </Label>
                                                <Input
                                                    id="school_owner_name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    placeholder="Dr. Eleanor Vance"
                                                    value={schoolForm.data.name}
                                                    onChange={(e) =>
                                                        schoolForm.setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={schoolForm.errors.name}
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="school_owner_email"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Administrative Email *
                                                </Label>
                                                <Input
                                                    id="school_owner_email"
                                                    type="email"
                                                    required
                                                    placeholder="director@schoolname.edu"
                                                    value={schoolForm.data.email}
                                                    onChange={(e) =>
                                                        schoolForm.setData(
                                                            'email',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={schoolForm.errors.email}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="school_name"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    School / Academy Name *
                                                </Label>
                                                <Input
                                                    id="school_name"
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Horizon STEM Academy"
                                                    value={schoolForm.data.school_name}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        schoolForm.setData('school_name', val);
                                                        if (!schoolForm.data.subdomain) {
                                                            const autoSlug = val
                                                                .toLowerCase()
                                                                .replace(/[^a-z0-9]/g, '-')
                                                                .replace(/-+/g, '-')
                                                                .slice(0, 30);
                                                            schoolForm.setData('subdomain', autoSlug);
                                                        }
                                                    }}
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={schoolForm.errors.school_name}
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="school_organization_type"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Organization Type *
                                                </Label>
                                                <select
                                                    id="school_organization_type"
                                                    value={schoolForm.data.organization_type}
                                                    onChange={(e) =>
                                                        schoolForm.setData('organization_type', e.target.value)
                                                    }
                                                    className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#1769E0] focus:outline-none"
                                                >
                                                    <option value="school">K-12 School</option>
                                                    <option value="academy">Academy / Training Center</option>
                                                    <option value="college">College / University</option>
                                                    <option value="institute">Vocational Institute</option>
                                                    <option value="other">Other Educational Organization</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="school_subdomain"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Custom Subdomain Slug *
                                                </Label>
                                                <span className="text-[10px] text-slate-500">
                                                    Subdomain for campus login portal
                                                </span>
                                            </div>
                                            <div className="relative flex items-center">
                                                <Input
                                                    id="school_subdomain"
                                                    type="text"
                                                    required
                                                    placeholder="horizon-stem"
                                                    value={schoolForm.data.subdomain}
                                                    onChange={(e) =>
                                                        schoolForm.setData(
                                                            'subdomain',
                                                            e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border-slate-300 bg-white pr-36 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <div className="pointer-events-none absolute right-3 text-xs font-bold text-slate-500">
                                                    .institutopropio.com
                                                </div>
                                            </div>
                                            <InputError message={schoolForm.errors.subdomain} />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="school_password"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Password *
                                                </Label>
                                                <PasswordInput
                                                    id="school_password"
                                                    required
                                                    value={schoolForm.data.password}
                                                    onChange={(e) =>
                                                        schoolForm.setData(
                                                            'password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Minimum 8 characters"
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={schoolForm.errors.password}
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="school_password_confirmation"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Confirm Password *
                                                </Label>
                                                <PasswordInput
                                                    id="school_password_confirmation"
                                                    required
                                                    value={
                                                        schoolForm.data
                                                            .password_confirmation
                                                    }
                                                    onChange={(e) =>
                                                        schoolForm.setData(
                                                            'password_confirmation',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Re-enter password"
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={
                                                        schoolForm.errors
                                                            .password_confirmation
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={schoolForm.processing}
                                            className="h-11 w-full cursor-pointer rounded-xl bg-[#FF7A30] text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                        >
                                            {schoolForm.processing ? (
                                                <span className="flex items-center gap-2">
                                                    <Spinner className="size-4" />
                                                    Provisioning School Workspace...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span>
                                                        Create School & Dedicated Workspace
                                                    </span>
                                                    <ArrowRight className="size-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                )}

                                {/* Journey B Form: Join Existing School */}
                                {journey === 'join' && (
                                    <form
                                        onSubmit={handleJoinSubmit}
                                        className="space-y-4"
                                    >
                                        {invitation ? (
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                                                <span className="font-bold">
                                                    Verified Invitation:
                                                </span>{' '}
                                                You were invited to join{' '}
                                                <strong className="text-emerald-950">
                                                    {invitation.organization_name}
                                                </strong>{' '}
                                                as an authorized{' '}
                                                <strong className="text-[#1769E0] capitalize">
                                                    {invitation.role}
                                                </strong>
                                                .
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700">
                                                <strong className="block font-bold text-[#0B1528]">
                                                    Invitation Key Required
                                                </strong>
                                                Please enter the token provided by your institution administrator to join your school.
                                            </div>
                                        )}

                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="invitation_token"
                                                className="text-xs font-bold text-slate-700"
                                            >
                                                Invitation Token *
                                            </Label>
                                            <Input
                                                id="invitation_token"
                                                type="text"
                                                required
                                                placeholder="Paste your 40-character invitation token"
                                                value={joinForm.data.invitation_token}
                                                onChange={(e) =>
                                                    joinForm.setData(
                                                        'invitation_token',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 rounded-xl border-slate-300 bg-white font-mono text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                            />
                                            <InputError
                                                message={
                                                    joinForm.errors.invitation_token
                                                }
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="join_name"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Your Full Name *
                                                </Label>
                                                <Input
                                                    id="join_name"
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Prof. Alice Smith"
                                                    value={joinForm.data.name}
                                                    onChange={(e) =>
                                                        joinForm.setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={joinForm.errors.name}
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="join_email"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Your Email Address *
                                                </Label>
                                                <Input
                                                    id="join_email"
                                                    type="email"
                                                    required
                                                    placeholder="alice@example.com"
                                                    value={joinForm.data.email}
                                                    onChange={(e) =>
                                                        joinForm.setData(
                                                            'email',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={joinForm.errors.email}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="join_password"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Password *
                                                </Label>
                                                <PasswordInput
                                                    id="join_password"
                                                    required
                                                    value={joinForm.data.password}
                                                    onChange={(e) =>
                                                        joinForm.setData(
                                                            'password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Choose a password"
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={joinForm.errors.password}
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="join_password_confirmation"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Confirm Password *
                                                </Label>
                                                <PasswordInput
                                                    id="join_password_confirmation"
                                                    required
                                                    value={
                                                        joinForm.data
                                                            .password_confirmation
                                                    }
                                                    onChange={(e) =>
                                                        joinForm.setData(
                                                            'password_confirmation',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Confirm password"
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={
                                                        joinForm.errors
                                                            .password_confirmation
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={joinForm.processing}
                                            className="h-11 w-full cursor-pointer rounded-xl bg-[#1769E0] text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#1256B8]"
                                        >
                                            {joinForm.processing ? (
                                                <span className="flex items-center gap-2">
                                                    <Spinner className="size-4" />
                                                    Verifying Token & Joining School...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span>
                                                        Accept Invitation & Join School
                                                    </span>
                                                    <ArrowRight className="size-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                )}

                                {/* Journey C Form: Individual Online Learner */}
                                {journey === 'learner' && (
                                    <form
                                        onSubmit={handleLearnerSubmit}
                                        className="space-y-4"
                                    >
                                        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700">
                                            <strong className="block font-bold text-[#0B1528]">
                                                Independent Student Registration
                                            </strong>
                                            No school affiliation required. Explore courses, stream multimedia lessons, and track personal certificates.
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="learner_name"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Full Name *
                                                </Label>
                                                <Input
                                                    id="learner_name"
                                                    type="text"
                                                    required
                                                    placeholder="e.g. David Williams"
                                                    value={learnerForm.data.name}
                                                    onChange={(e) =>
                                                        learnerForm.setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={learnerForm.errors.name}
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="learner_email"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Email Address *
                                                </Label>
                                                <Input
                                                    id="learner_email"
                                                    type="email"
                                                    required
                                                    placeholder="david@example.com"
                                                    value={learnerForm.data.email}
                                                    onChange={(e) =>
                                                        learnerForm.setData(
                                                            'email',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={learnerForm.errors.email}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="learner_password"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Password *
                                                </Label>
                                                <PasswordInput
                                                    id="learner_password"
                                                    required
                                                    value={learnerForm.data.password}
                                                    onChange={(e) =>
                                                        learnerForm.setData(
                                                            'password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Minimum 8 characters"
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={
                                                        learnerForm.errors.password
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label
                                                    htmlFor="learner_password_confirmation"
                                                    className="text-xs font-bold text-slate-700"
                                                >
                                                    Confirm Password *
                                                </Label>
                                                <PasswordInput
                                                    id="learner_password_confirmation"
                                                    required
                                                    value={
                                                        learnerForm.data
                                                            .password_confirmation
                                                    }
                                                    onChange={(e) =>
                                                        learnerForm.setData(
                                                            'password_confirmation',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Re-enter password"
                                                    className="h-10 rounded-xl border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1769E0]"
                                                />
                                                <InputError
                                                    message={
                                                        learnerForm.errors
                                                            .password_confirmation
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={learnerForm.processing}
                                            className="h-11 w-full cursor-pointer rounded-xl bg-[#FF7A30] text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E5661E]"
                                        >
                                            {learnerForm.processing ? (
                                                <span className="flex items-center gap-2">
                                                    <Spinner className="size-4" />
                                                    Creating Learner Account...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span>
                                                        Get Started — Start Learning Online
                                                    </span>
                                                    <ArrowRight className="size-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                )}

                                {/* Switch to Login Link */}
                                <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
                                    Already registered on the platform?{' '}
                                    <Link
                                        href={login()}
                                        className="font-bold text-[#1769E0] underline hover:text-[#1256B8]"
                                    >
                                        Log in to your account &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
