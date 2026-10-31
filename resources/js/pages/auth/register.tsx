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
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070b14] px-4 py-8 font-sans text-slate-100 selection:bg-violet-500 selection:text-white sm:px-6 sm:py-12 md:py-16">
            <Head title="Get Started — Choose Registration Journey" />

            {/* Ambient Background Lighting */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute right-1/4 bottom-0 -z-10 h-[400px] w-[600px] rounded-full bg-indigo-600/10 blur-[140px]"
            />

            {/* Top Navigation Row */}
            <div className="mb-6 w-full max-w-5xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Home</span>
                </Link>
            </div>

            {/* Main Registration Two-Column Container (900-1000px max width) */}
            <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-[#0B1220]/90 shadow-2xl shadow-black/60 backdrop-blur-xl">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left Column: Branding, Context & Platform Value (5 cols) */}
                    <div className="flex flex-col justify-between border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-[#0B1220] p-6 sm:p-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:p-10">
                        <div>
                            {/* Brand Header */}
                            <Link
                                href="/"
                                className="inline-flex items-center gap-3"
                            >
                                <div className="flex size-10 items-center justify-center rounded-xl bg-[#1769E0] text-white shadow-md ring-2 shadow-blue-500/25 ring-[#1769E0]/20">
                                    <AppLogoIcon className="size-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold tracking-tight text-white">
                                        InstitutoPropio
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-wider text-blue-400 uppercase">
                                        International SaaS
                                    </span>
                                </div>
                            </Link>

                            <div className="mt-8 space-y-3">
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                                    <Sparkles className="size-3.5 text-blue-400" />
                                    <span>Fast & Secure Onboarding</span>
                                </div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                    Join the Modern Era of Education
                                </h1>
                                <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
                                    Whether governing an entire school system,
                                    joining your department via invitation, or
                                    learning independently, our unified platform delivers
                                    a dedicated workspace.
                                </p>
                            </div>

                            {/* Journey-Specific Highlights */}
                            <div className="mt-8 space-y-3.5 border-t border-slate-800/80 pt-6">
                                {journey === 'school' && (
                                    <>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Automated Tenant
                                                    Provisioning:
                                                </strong>{' '}
                                                Dedicated data scope, custom
                                                subdomain, and default academic
                                                year.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Complete Operational Suite:
                                                </strong>{' '}
                                                Manage classes, faculty
                                                invitations, student rosters,
                                                and daily attendance.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Starter Plan Included:
                                                </strong>{' '}
                                                Active subscription tier
                                                attached on registration with
                                                zero lock-in.
                                            </span>
                                        </div>
                                    </>
                                )}

                                {journey === 'join' && (
                                    <>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Cryptographic Verification:
                                                </strong>{' '}
                                                Your invitation token guarantees
                                                assignment to your exact
                                                authorized role.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Role-Tailored Portals:
                                                </strong>{' '}
                                                Instant access to teacher
                                                grading, student courses, or
                                                parent progress hubs.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Existing Account Support:
                                                </strong>{' '}
                                                Securely attach to new schools
                                                without creating duplicate
                                                profiles.
                                            </span>
                                        </div>
                                    </>
                                )}

                                {journey === 'learner' && (
                                    <>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Independent Learning Hub:
                                                </strong>{' '}
                                                Immediate access to the public
                                                course catalog and syllabus
                                                outlines.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    HD Streaming Lessons:
                                                </strong>{' '}
                                                Interactive multimedia video
                                                lectures and real-time
                                                completion tracking.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-3 text-xs text-slate-300">
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                            <span>
                                                <strong>
                                                    Verified Digital
                                                    Certificates:
                                                </strong>{' '}
                                                Earn unique credential
                                                certificates upon reaching 100%
                                                course completion.
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Security Assurance Footer */}
                        <div className="mt-8 border-t border-slate-800 pt-5">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <ShieldCheck className="size-4 text-emerald-400" />
                                <span>
                                    256-Bit SSL Encrypted · Multi-Tenant
                                    Architecture
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: 3 Journey Cards + Registration Form (7 cols) */}
                    <div className="p-6 sm:p-8 lg:col-span-7 lg:p-10">
                        {/* 3-Journey Selector Cards */}
                        <div className="mb-6">
                            <Label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Select Your Registration Option:
                            </Label>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                {/* Option 1: Create a School */}
                                <button
                                    type="button"
                                    onClick={() => setJourney('school')}
                                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                                        journey === 'school'
                                            ? 'border-[#1769E0] bg-blue-950/40 shadow-md ring-1 shadow-blue-500/10 ring-[#1769E0]'
                                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                                    }`}
                                >
                                    <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                                        <Building2 className="size-4" />
                                    </div>
                                    <span className="text-xs font-bold text-white">
                                        Create a School
                                    </span>
                                    <span className="mt-0.5 text-[11px] text-slate-400">
                                        Owners & Founders
                                    </span>
                                </button>

                                {/* Option 2: Join a School */}
                                <button
                                    type="button"
                                    onClick={() => setJourney('join')}
                                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                                        journey === 'join'
                                            ? 'border-[#1769E0] bg-blue-950/40 shadow-md ring-1 shadow-blue-500/10 ring-[#1769E0]'
                                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                                    }`}
                                >
                                    <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                                        <KeyRound className="size-4" />
                                    </div>
                                    <span className="text-xs font-bold text-white">
                                        Join a School
                                    </span>
                                    <span className="mt-0.5 text-[11px] text-slate-400">
                                        Teachers & Students
                                    </span>
                                </button>

                                {/* Option 3: Individual Online Learner */}
                                <button
                                    type="button"
                                    onClick={() => setJourney('learner')}
                                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                                        journey === 'learner'
                                            ? 'border-[#1769E0] bg-blue-950/40 shadow-md ring-1 shadow-blue-500/10 ring-[#1769E0]'
                                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                                    }`}
                                >
                                    <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-orange-600/20 text-orange-400">
                                        <BookOpen className="size-4" />
                                    </div>
                                    <span className="text-xs font-bold text-white">
                                        Learn Online
                                    </span>
                                    <span className="mt-0.5 text-[11px] text-slate-400">
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
                                <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3.5 text-xs text-blue-200">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="size-4 text-blue-400" />
                                            <strong className="font-semibold text-white">
                                                30-Day Free Trial
                                            </strong>
                                        </div>
                                        <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-blue-300 border border-blue-400/30">
                                            Selected: {schoolForm.data.plan.toUpperCase()} • {schoolForm.data.billing_interval.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-slate-300">
                                        Unlimited students & teachers on all plans. Payment method verification required before trial activation with zero initial charges.
                                    </p>

                                    {/* Monthly / Annual Interval Toggle */}
                                    <div className="mt-3 flex items-center gap-2 border-b border-blue-900/40 pb-2.5">
                                        <button
                                            type="button"
                                            onClick={() => schoolForm.setData('billing_interval', 'monthly')}
                                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                                                schoolForm.data.billing_interval === 'monthly'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Monthly Billing
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => schoolForm.setData('billing_interval', 'annual')}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                                                schoolForm.data.billing_interval === 'annual'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <span>Annual Billing</span>
                                            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                                                ~17% Off (2 Mo Free)
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
                                                price: 'Custom',
                                            },
                                        ].map((p) => (
                                            <button
                                                key={p.slug}
                                                type="button"
                                                onClick={() => schoolForm.setData('plan', p.slug)}
                                                className={`rounded-lg p-2 text-left transition-all border ${
                                                    schoolForm.data.plan === p.slug
                                                        ? 'bg-blue-600/30 border-blue-400 text-white ring-1 ring-blue-400'
                                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-xs">{p.name}</span>
                                                    <span className="text-[10px] text-blue-300 font-semibold">{p.price}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{p.limit}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <InputError message={schoolForm.errors.plan} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="school_owner_name"
                                            className="text-xs text-slate-300"
                                        >
                                            Owner Full Name *
                                        </Label>
                                        <Input
                                            id="school_owner_name"
                                            type="text"
                                            required
                                            placeholder="Dr. Arthur Pendelton"
                                            value={schoolForm.data.name}
                                            onChange={(e) =>
                                                schoolForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
                                        />
                                        <InputError
                                            message={schoolForm.errors.name}
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="school_owner_email"
                                            className="text-xs text-slate-300"
                                        >
                                            Official Email Address *
                                        </Label>
                                        <Input
                                            id="school_owner_email"
                                            type="email"
                                            required
                                            placeholder="principal@institution.edu"
                                            value={schoolForm.data.email}
                                            onChange={(e) =>
                                                schoolForm.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                            className="text-xs text-slate-300"
                                        >
                                            Institution Legal Name *
                                        </Label>
                                        <Input
                                            id="school_name"
                                            type="text"
                                            required
                                            placeholder="Horizon STEM Academy"
                                            value={schoolForm.data.school_name}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                schoolForm.setData('school_name', val);
                                                if (!schoolForm.data.subdomain) {
                                                    // preview suggestion
                                                }
                                            }}
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
                                        />
                                        <InputError
                                            message={
                                                schoolForm.errors.school_name
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="org_type"
                                            className="text-xs text-slate-300"
                                        >
                                            Organization Type *
                                        </Label>
                                        <select
                                            id="org_type"
                                            value={
                                                schoolForm.data
                                                    .organization_type
                                            }
                                            onChange={(e) =>
                                                schoolForm.setData(
                                                    'organization_type',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs text-white outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                                        >
                                            <option value="school">
                                                School (K-12)
                                            </option>
                                            <option value="academy">
                                                College / Academy
                                            </option>
                                            <option value="coaching_center">
                                                Coaching Center
                                            </option>
                                            <option value="online_course_provider">
                                                E-Learning Provider
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* School Subdomain Input with Live Preview */}
                                <div className="grid gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="school_subdomain"
                                            className="text-xs text-slate-300"
                                        >
                                            Desired School Subdomain (Optional)
                                        </Label>
                                        <span className="text-[10px] text-slate-400">
                                            Letters, numbers and hyphens
                                        </span>
                                    </div>
                                    <div className="relative flex items-center">
                                        <Input
                                            id="school_subdomain"
                                            type="text"
                                            placeholder={
                                                schoolForm.data.school_name
                                                    ? schoolForm.data.school_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
                                                    : 'horizon-stem'
                                            }
                                            value={schoolForm.data.subdomain}
                                            onChange={(e) =>
                                                schoolForm.setData(
                                                    'subdomain',
                                                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                                )
                                            }
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 pr-32 text-xs text-white placeholder-slate-600 focus-visible:ring-violet-500"
                                        />
                                        <div className="pointer-events-none absolute right-3 text-xs font-semibold text-slate-500">
                                            .institutopropio.com
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Your dedicated portal will be accessible at:{' '}
                                        <span className="font-mono text-blue-400">
                                            https://{schoolForm.data.subdomain || (schoolForm.data.school_name ? schoolForm.data.school_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) : 'your-school')}.institutopropio.com
                                        </span>
                                    </p>
                                    <InputError message={schoolForm.errors.subdomain} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="school_password"
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
                                        />
                                        <InputError
                                            message={schoolForm.errors.password}
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="school_password_confirmation"
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                    className="h-11 w-full cursor-pointer rounded-xl bg-[#1769E0] text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#1256B8]"
                                >
                                    {schoolForm.processing ? (
                                        <span className="flex items-center gap-2">
                                            <Spinner className="size-4" />
                                            Provisioning School Workspace...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <span>
                                                Create School & Dedicated
                                                Workspace
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
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                                        <span className="font-semibold text-white">
                                            Verified Invitation:
                                        </span>{' '}
                                        You were invited to join{' '}
                                        <strong className="text-white">
                                            {invitation.organization_name}
                                        </strong>{' '}
                                        as an authorized{' '}
                                        <strong className="text-emerald-400 capitalize">
                                            {invitation.role}
                                        </strong>
                                        .
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-xs text-indigo-300">
                                        <strong className="block font-semibold text-white">
                                            Invitation Key Required
                                        </strong>
                                        Please enter the token provided by your
                                        institution administrator to join your
                                        school.
                                    </div>
                                )}

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="invitation_token"
                                        className="text-xs text-slate-300"
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
                                        className="h-10 rounded-xl border-slate-800 bg-slate-900 font-mono text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
                                        />
                                        <InputError
                                            message={joinForm.errors.name}
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="join_email"
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
                                        />
                                        <InputError
                                            message={joinForm.errors.password}
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="join_password_confirmation"
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                    className="h-11 w-full cursor-pointer rounded-xl bg-[#1769E0] text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#1256B8]"
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
                                <div className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-3 text-xs text-purple-300">
                                    <strong className="block font-semibold text-white">
                                        Independent Student Registration
                                    </strong>
                                    No school or institution affiliation
                                    required. Explore courses, stream multimedia
                                    lessons, and track personal certificates.
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="learner_name"
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
                                        />
                                        <InputError
                                            message={learnerForm.errors.name}
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="learner_email"
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                            className="text-xs text-slate-300"
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
                                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus-visible:ring-violet-500"
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
                                    className="h-11 w-full cursor-pointer rounded-xl bg-[#FF7A30] text-xs font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#E5661E]"
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
                        <div className="mt-8 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-400">
                            Already registered on the platform?{' '}
                            <Link
                                href={login()}
                                className="font-semibold text-[#1769E0] underline-offset-4 hover:text-[#1256B8] hover:underline dark:text-blue-400"
                            >
                                Log in to your account &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
