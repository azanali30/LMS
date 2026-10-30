import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    Building2,
    KeyRound,
    Sparkles,
    Check,
    ArrowRight,
    Loader2,
    School,
    BookOpen,
    GraduationCap,
    Laptop,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    monthly_price: number;
    max_students: number;
    max_teachers: number;
    max_storage_gb: number;
    features: string[];
}

interface OnboardingProps {
    plans?: Plan[];
    isInitial?: boolean;
}

export default function Onboarding({
    plans = [],
    isInitial = false,
}: OnboardingProps) {
    const [tab, setTab] = useState<'create' | 'join'>('create');
    const [inviteToken, setInviteToken] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        organization_type: 'school',
        email: '',
        phone: '',
        address: '',
        timezone: 'UTC',
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        setData((prev) => ({
            ...prev,
            name,
            slug,
        }));
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/organizations');
    };

    const submitJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteToken.trim()) return;
        router.get(`/invitations/${inviteToken.trim()}`);
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#070b14] font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
            <Head title="Organization Setup" />

            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-800/80 bg-[#0B1220]/80 px-6 py-5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-600/30">
                        <GraduationCap className="size-5 text-white" />
                    </div>
                    <div>
                        <span className="block text-base font-extrabold tracking-tight text-white">
                            School Portal
                        </span>
                        <span className="text-[10px] font-semibold tracking-wider text-purple-400 uppercase">
                            Setup Wizard
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="text-xs font-semibold text-slate-400 transition hover:text-purple-400"
                    >
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-12">
                <div className="mb-8 text-center">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                        <Sparkles className="size-3.5" />
                        {isInitial
                            ? 'Welcome to Campus Setup'
                            : 'Add New Organization'}
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Set up your educational workspace
                    </h1>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                        Create an isolated institutional tenant for your school,
                        academy, or coaching center, or join an existing
                        organization using an invitation token.
                    </p>

                    {/* Tab Switcher */}
                    <div className="mt-6 inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
                        <button
                            type="button"
                            onClick={() => setTab('create')}
                            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition ${
                                tab === 'create'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Building2 className="size-4" />
                            <span>Create New Organization</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('join')}
                            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition ${
                                tab === 'join'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <KeyRound className="size-4" />
                            <span>Join with Invitation</span>
                        </button>
                    </div>
                </div>

                {tab === 'create' ? (
                    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl sm:p-8">
                        <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 rounded-full bg-purple-600/5 blur-3xl" />

                        <form
                            onSubmit={submitCreate}
                            className="relative space-y-6"
                        >
                            {/* Organization Type Selector */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
                                    Organization Type
                                </label>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {[
                                        {
                                            id: 'school',
                                            label: 'School (K-12)',
                                            icon: School,
                                        },
                                        {
                                            id: 'academy',
                                            label: 'Academy / College',
                                            icon: GraduationCap,
                                        },
                                        {
                                            id: 'coaching_center',
                                            label: 'Coaching Center',
                                            icon: BookOpen,
                                        },
                                        {
                                            id: 'online_course_provider',
                                            label: 'E-Learning Portal',
                                            icon: Laptop,
                                        },
                                    ].map((type) => {
                                        const Icon = type.icon;
                                        const selected =
                                            data.organization_type === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'organization_type',
                                                        type.id,
                                                    )
                                                }
                                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition ${
                                                    selected
                                                        ? 'border-purple-500 bg-purple-600/15 text-white shadow-inner shadow-purple-500/20'
                                                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                                }`}
                                            >
                                                <Icon
                                                    className={`size-5 ${selected ? 'text-purple-400' : 'text-slate-500'}`}
                                                />
                                                <span className="text-xs font-semibold">
                                                    {type.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.organization_type && (
                                    <p className="mt-1.5 text-xs text-rose-400">
                                        {errors.organization_type}
                                    </p>
                                )}
                            </div>

                            {/* Name & Slug */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                    >
                                        Organization Name *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        placeholder="e.g. Horizon STEM Academy"
                                        value={data.name}
                                        onChange={handleNameChange}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-rose-400">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="slug"
                                        className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                    >
                                        Subdomain / Tenant Slug *
                                    </label>
                                    <div className="flex overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
                                        <input
                                            id="slug"
                                            type="text"
                                            required
                                            placeholder="horizon-stem"
                                            value={data.slug}
                                            onChange={(e) =>
                                                setData('slug', e.target.value)
                                            }
                                            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                                        />
                                        <span className="flex items-center border-l border-slate-800 bg-slate-800/80 px-3 py-2.5 font-mono text-xs text-slate-400">
                                            .lms.app
                                        </span>
                                    </div>
                                    {errors.slug && (
                                        <p className="mt-1 text-xs text-rose-400">
                                            {errors.slug}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                    >
                                        Official Contact Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="admin@school.edu"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-rose-400">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                    >
                                        Contact Phone
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 234-5678"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-xs text-rose-400">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Address & Timezone */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="address"
                                        className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                    >
                                        Campus Address
                                    </label>
                                    <input
                                        id="address"
                                        type="text"
                                        placeholder="123 Innovation Boulevard, Suite 400"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="timezone"
                                        className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                    >
                                        Timezone
                                    </label>
                                    <select
                                        id="timezone"
                                        value={data.timezone}
                                        onChange={(e) =>
                                            setData('timezone', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="UTC">
                                            UTC (Coordinated Universal Time)
                                        </option>
                                        <option value="America/New_York">
                                            Eastern Time (US & Canada)
                                        </option>
                                        <option value="America/Chicago">
                                            Central Time (US & Canada)
                                        </option>
                                        <option value="America/Los_Angeles">
                                            Pacific Time (US & Canada)
                                        </option>
                                        <option value="Europe/London">
                                            London (GMT/BST)
                                        </option>
                                        <option value="Asia/Karachi">
                                            Karachi, Islamabad (PKT)
                                        </option>
                                        <option value="Asia/Dubai">
                                            Dubai, Gulf (GST)
                                        </option>
                                        <option value="Asia/Singapore">
                                            Singapore (SGT)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Founder Security Notice */}
                            <div className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-xs text-purple-300">
                                <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-400" />
                                <div>
                                    <span className="block font-semibold text-white">
                                        Multi-Tenant Isolation Notice
                                    </span>
                                    As the organization creator, you will
                                    automatically be assigned the{' '}
                                    <strong className="text-white">
                                        Owner
                                    </strong>{' '}
                                    role. All academic records, student
                                    profiles, and lessons created under this
                                    workspace are strictly scoped and
                                    inaccessible to other organizations.
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Provisioning Workspace...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>
                                            Create Organization & Launch
                                            Dashboard
                                        </span>
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Join with Invitation Code */
                    <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-2xl sm:p-8">
                        <form onSubmit={submitJoin} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="token"
                                    className="mb-2 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
                                >
                                    Invitation Token / Secret Key
                                </label>
                                <input
                                    id="token"
                                    type="text"
                                    required
                                    placeholder="Paste 40-character invitation token provided by your institution..."
                                    value={inviteToken}
                                    onChange={(e) =>
                                        setInviteToken(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    Invitation links are issued by your school
                                    administrator and automatically associate
                                    your account with the correct role (Teacher,
                                    Student, or Parent).
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={!inviteToken.trim()}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-50"
                            >
                                <span>Validate & Join Organization</span>
                                <ArrowRight className="size-4" />
                            </button>
                        </form>
                    </div>
                )}

                {/* Available Tier Plans Preview */}
                {plans.length > 0 && (
                    <div className="mt-12 border-t border-slate-800/80 pt-10">
                        <h2 className="mb-6 text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
                            Included Multi-Tenant Infrastructure Tiers
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4"
                                >
                                    <div className="mb-1 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white">
                                            {plan.name}
                                        </h3>
                                        <span className="text-xs font-bold text-purple-400">
                                            ${plan.monthly_price}/mo
                                        </span>
                                    </div>
                                    <p className="mb-3 text-xs text-slate-400">
                                        {plan.description}
                                    </p>
                                    <div className="space-y-1 text-[11px] text-slate-300">
                                        <div className="flex items-center gap-1.5">
                                            <Check className="size-3 shrink-0 text-purple-400" />
                                            <span>
                                                Up to{' '}
                                                {plan.max_students.toLocaleString()}{' '}
                                                students
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Check className="size-3 shrink-0 text-purple-400" />
                                            <span>
                                                Up to {plan.max_teachers}{' '}
                                                teacher seats
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Check className="size-3 shrink-0 text-purple-400" />
                                            <span>
                                                {plan.max_storage_gb} GB secure
                                                storage
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
