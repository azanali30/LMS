import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import TenantLayout from '@/layouts/tenant-layout';
import {
    UserPlus,
    Users,
    Mail,
    Shield,
    Clock,
    Copy,
    Check,
    Loader2,
    Send,
    KeyRound,
    Sparkles,
    UserCheck,
    Briefcase,
    Zap,
    Eye,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    AlertCircle,
    Building2,
    ShieldAlert,
} from 'lucide-react';
import type { Auth } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Member {
    id: number;
    role: string;
    title?: string;
    status: string;
    created_at: string;
    user: User;
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    token: string;
    expires_at: string;
}

interface MembersProps {
    organization: {
        id: number;
        name: string;
    };
    members: {
        data: Member[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    invitations?: Invitation[];
}

export default function OrganizationMembers({
    organization,
    members,
    invitations = [],
}: MembersProps) {
    const page = usePage<{ auth: Auth }>();
    const currentUserId = page.props.auth.user?.id;

    const [activeTab, setActiveTab] = useState<'direct' | 'invite'>('direct');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [activatingInviteId, setActivatingInviteId] = useState<number | null>(null);

    // Modals state
    const [viewingMember, setViewingMember] = useState<Member | null>(null);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [deletingMember, setDeletingMember] = useState<Member | null>(null);
    const [revokingInvitation, setRevokingInvitation] = useState<Invitation | null>(null);

    // Form for Direct Account Creation
    const directForm = useForm({
        name: '',
        email: '',
        password: 'Password@123',
        role: 'teacher',
        title: 'Faculty Member',
    });

    // Form for Editing Existing Member
    const editForm = useForm({
        name: '',
        email: '',
        role: 'teacher',
        title: '',
        status: 'active',
        password: '',
    });

    // Form for Invite Link / Email Dispatch
    const inviteForm = useForm({
        email: '',
        role: 'teacher',
    });

    const submitDirectMember = (e: React.FormEvent) => {
        e.preventDefault();
        directForm.post('/organizations/members/direct', {
            preserveScroll: true,
            onSuccess: () => {
                directForm.reset();
                directForm.setData({
                    name: '',
                    email: '',
                    password: 'Password@123',
                    role: 'teacher',
                    title: 'Faculty Member',
                });
            },
        });
    };

    const submitInvite = (e: React.FormEvent) => {
        e.preventDefault();
        inviteForm.post('/organizations/members/invite', {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset(),
        });
    };

    const openEditModal = (mem: Member) => {
        setEditingMember(mem);
        editForm.setData({
            name: mem.user.name,
            email: mem.user.email,
            role: mem.role,
            title: mem.title || '',
            status: mem.status || 'active',
            password: '',
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;
        editForm.put(`/organizations/members/${editingMember.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingMember(null);
                editForm.reset();
            },
        });
    };

    const submitDelete = () => {
        if (!deletingMember) return;
        router.delete(`/organizations/members/${deletingMember.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingMember(null),
        });
    };

    const submitRevokeInvitation = () => {
        if (!revokingInvitation) return;
        router.delete(`/organizations/invitations/${revokingInvitation.id}`, {
            preserveScroll: true,
            onSuccess: () => setRevokingInvitation(null),
        });
    };

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/invitations/${token}`;
        void navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    const handleDirectActivate = (inviteId: number) => {
        setActivatingInviteId(inviteId);
        router.post(
            `/organizations/invitations/${inviteId}/activate`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setActivatingInviteId(null),
            }
        );
    };

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        directForm.setData('password', pass);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'admin':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            case 'teacher':
                return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <TenantLayout title="Faculty & Staff">
            <Head title="Organization Faculty & Staff" />

            <div className="mb-8">
                <div className="mb-1 flex items-center gap-2">
                    <Users className="size-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Faculty & Staff Management
                    </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage teachers, faculty members, and staff administrators directly or dispatch invitations for {organization.name}
                </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={() => setActiveTab('direct')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                        activeTab === 'direct'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
                    }`}
                >
                    <UserCheck className="size-4" />
                    <span>Direct Add Teacher & Staff (Instant Login)</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('invite')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                        activeTab === 'invite'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-[#0B1220] dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
                    }`}
                >
                    <Mail className="size-4" />
                    <span>Issue Invitation via Email / Link</span>
                </button>
            </div>

            {/* DIRECT ADD FORM (TAB 1) */}
            {activeTab === 'direct' && (
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                <UserPlus className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Directly Enroll Teacher or Staff Member
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Creates active credentials immediately so faculty can sign in right away without waiting for email delivery.
                                </p>
                            </div>
                        </div>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Instant Access Enabled
                        </span>
                    </div>

                    <form onSubmit={submitDirectMember} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Prof. John Smith"
                                    value={directForm.data.name}
                                    onChange={(e) =>
                                        directForm.setData('name', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                />
                                {directForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {directForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="teacher@institution.edu"
                                    value={directForm.data.email}
                                    onChange={(e) =>
                                        directForm.setData('email', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                />
                                {directForm.errors.email && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {directForm.errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Institutional Role *
                                </label>
                                <select
                                    value={directForm.data.role}
                                    onChange={(e) =>
                                        directForm.setData('role', e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="teacher">Teacher / Faculty</option>
                                    <option value="admin">Institutional Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                    Designation / Title
                                </label>
                                <div className="relative">
                                    <Briefcase className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Science Department Head"
                                        value={directForm.data.title}
                                        onChange={(e) =>
                                            directForm.setData('title', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                            <div className="lg:col-span-2">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        Initial Login Password *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={generateRandomPassword}
                                        className="flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                    >
                                        <Sparkles className="size-3" />
                                        <span>Generate Random</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <KeyRound className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        value={directForm.data.password}
                                        onChange={(e) =>
                                            directForm.setData('password', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={directForm.processing}
                                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-60"
                                >
                                    {directForm.processing ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="size-4" />
                                            <span>Add & Activate Member Immediately</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* INVITATION FORM (TAB 2) */}
            {activeTab === 'invite' && (
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="mb-4 flex items-center gap-2">
                        <Mail className="size-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Issue Secure Member Invitation Link
                        </h3>
                    </div>

                    <form
                        onSubmit={submitInvite}
                        className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3"
                    >
                        <div className="sm:col-span-1">
                            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                Member Email *
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="colleague@institution.edu"
                                value={inviteForm.data.email}
                                onChange={(e) =>
                                    inviteForm.setData('email', e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                Institutional Role *
                            </label>
                            <select
                                value={inviteForm.data.role}
                                onChange={(e) =>
                                    inviteForm.setData('role', e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            >
                                <option value="teacher">Teacher / Faculty</option>
                                <option value="admin">Organization Admin</option>
                            </select>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={inviteForm.processing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 disabled:opacity-60"
                            >
                                {inviteForm.processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="size-3.5" />
                                        <span>Dispatch Invitation</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Pending Invitations Table */}
            {invitations.length > 0 && (
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Mail className="size-4 text-amber-500 dark:text-amber-400" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Active Pending Invitations ({invitations.length})
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            If email delivery is failing, click <strong className="text-purple-600 dark:text-purple-400">Instant Activate</strong> to create active credentials immediately.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <th className="pb-3 font-semibold">Invited Email</th>
                                    <th className="pb-3 font-semibold">Role</th>
                                    <th className="pb-3 font-semibold">Expiry</th>
                                    <th className="pb-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {invitations.map((inv) => (
                                    <tr key={inv.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                                            {inv.email}
                                        </td>
                                        <td className="py-3">
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRoleBadge(inv.role)}`}>
                                                {inv.role}
                                            </span>
                                        </td>
                                        <td className="flex items-center gap-1 py-3 text-slate-500 dark:text-slate-400">
                                            <Clock className="size-3 text-slate-400" />
                                            <span>{inv.expires_at}</span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDirectActivate(inv.id)}
                                                    disabled={activatingInviteId === inv.id}
                                                    title="Directly activate without requiring email verification"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white disabled:opacity-50"
                                                >
                                                    {activatingInviteId === inv.id ? (
                                                        <Loader2 className="size-3 animate-spin" />
                                                    ) : (
                                                        <Zap className="size-3 text-purple-600 dark:text-purple-400" />
                                                    )}
                                                    <span>Instant Activate</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => copyInviteLink(inv.token)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                                                >
                                                    {copiedToken === inv.token ? (
                                                        <>
                                                            <Check className="size-3 text-emerald-500" />
                                                            <span className="font-medium text-emerald-600 dark:text-emerald-400">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="size-3 text-slate-400" />
                                                            <span>Copy Link</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setRevokingInvitation(inv)}
                                                    title="Cancel / Revoke Invitation"
                                                    className="inline-flex size-6 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Current Members Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B1220]">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="size-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Enrolled Faculty & Staff ({members.data.length})
                        </h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <th className="pb-3 font-semibold">User</th>
                                <th className="pb-3 font-semibold">Tenant Role</th>
                                <th className="pb-3 font-semibold">Status</th>
                                <th className="pb-3 font-semibold">Member Since</th>
                                <th className="pb-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {members.data.map((mem) => (
                                <tr key={mem.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                    <td className="flex items-center gap-2.5 py-3 font-medium text-slate-900 dark:text-white">
                                        <div className="flex size-7 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-[10px] font-bold text-purple-700 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300">
                                            {mem.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {mem.user.name}
                                                {mem.user.id === currentUserId && (
                                                    <span className="ml-1.5 rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {mem.user.email}
                                                {mem.title && (
                                                    <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                                                        • {mem.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRoleBadge(mem.role)}`}>
                                            {mem.role}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                            {mem.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-slate-500 dark:text-slate-400">
                                        {mem.created_at?.slice(0, 10)}
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setViewingMember(mem)}
                                                title="View Staff Member Details"
                                                className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:text-white"
                                            >
                                                <Eye className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(mem)}
                                                title="Edit Staff Member & Password"
                                                className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-purple-300 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:text-white"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            {mem.user.id !== currentUserId && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingMember(mem)}
                                                    title="Remove Member from Organization"
                                                    className="inline-flex size-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {members.links && members.links.length > 3 && (
                    <div className="mt-6 flex justify-center gap-1 border-t border-slate-200 pt-4 dark:border-slate-800">
                        {members.links.map((link, idx) => (
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

            {/* VIEW STAFF MEMBER DETAILS MODAL */}
            {viewingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl zoom-in-95 dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                    <Shield className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Faculty & Staff Details
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Institutional credentials & role configuration
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingMember(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Profile Banner */}
                            <div className="flex items-center gap-4 rounded-xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-500/20 dark:bg-purple-950/20">
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-xl font-bold text-white shadow-md">
                                    {viewingMember.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                        {viewingMember.user.name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <Mail className="size-3" />
                                        <span>{viewingMember.user.email}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRoleBadge(viewingMember.role)}`}>
                                            {viewingMember.role}
                                        </span>
                                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase dark:text-emerald-400">
                                            {viewingMember.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Official Title / Designation
                                    </span>
                                    <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {viewingMember.title || 'Staff Member'}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Organization
                                    </span>
                                    <div className="mt-1 text-sm font-semibold text-purple-600 dark:text-purple-400">
                                        {organization.name}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Member Since
                                    </span>
                                    <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {viewingMember.created_at?.slice(0, 10)}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Portal Login Access
                                    </span>
                                    <div className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        Active Account
                                    </div>
                                </div>
                            </div>

                            {/* Credentials notice */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/80">
                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                    <KeyRound className="size-4 text-purple-600 dark:text-purple-400" />
                                    <span>Faculty Portal Authentication</span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                                    This staff member can sign in at <code className="rounded bg-slate-200 px-1 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-200">/login</code> using their email address (<strong className="text-slate-900 dark:text-white">{viewingMember.user.email}</strong>). You can update their credentials or assign a new password directly from the Edit Member dialog.
                                </p>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const m = viewingMember;
                                        setViewingMember(null);
                                        openEditModal(m);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300"
                                >
                                    <Pencil className="size-3.5" />
                                    <span>Edit Member</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingMember(null)}
                                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT STAFF MEMBER MODAL */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl zoom-in-95 dark:border-slate-800 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                    <Pencil className="size-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Edit Staff Member
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingMember(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                    Member Full Name *
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
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                        Role *
                                    </label>
                                    <select
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="teacher">Teacher / Faculty</option>
                                        <option value="admin">Institutional Admin</option>
                                        <option value="owner">Organization Owner</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                        Status *
                                    </label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                    Designation / Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Senior Faculty Member"
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Password Update Field */}
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-700 uppercase dark:text-slate-300">
                                        Reset Login Password
                                    </label>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        (Leave blank to keep current)
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
                                        onClick={() => editForm.setData('password', 'Staff@' + Math.floor(100 + Math.random() * 900))}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
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

            {/* DELETE MEMBER CONFIRMATION MODAL */}
            {deletingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm animate-in rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl zoom-in-95 dark:border-rose-900/50 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Remove Staff Member?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to remove {deletingMember.user.name} from {organization.name}?
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingMember(null)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitDelete}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500"
                            >
                                Confirm Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REVOKE INVITATION CONFIRMATION MODAL */}
            {revokingInvitation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm animate-in rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl zoom-in-95 dark:border-rose-900/50 dark:bg-[#0B1220]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Revoke Invitation?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Cancel invitation link for {revokingInvitation.email}.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setRevokingInvitation(null)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitRevokeInvitation}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500"
                            >
                                Revoke Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
