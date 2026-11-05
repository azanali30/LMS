import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    ArrowLeft,
    Send,
    ShieldAlert,
    CheckCircle2,
    Clock,
    User,
    Building2,
    Lock,
} from 'lucide-react';

interface Message {
    id: number;
    message: string;
    is_internal_note: boolean;
    user_name: string;
    user_role?: string;
    created_at: string;
}

interface Props {
    ticket: {
        id: number;
        ticket_number: string;
        subject: string;
        priority: string;
        status: string;
        organization: { id: number; name: string } | null;
        user: { id: number; name: string; email: string };
        assignee: { id: number; name: string } | null;
        created_at: string;
        messages: Message[];
    };
}

export default function PlatformSupportShow({ ticket }: Props) {
    const { data, setData, post, processing, reset } = useForm({
        message: '',
        is_internal_note: false,
        new_status: ticket.status,
    });

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/platform-admin/support/${ticket.id}/reply`, {
            onSuccess: () => reset('message'),
        });
    };

    return (
        <PlatformAdminLayout title={`Ticket: ${ticket.ticket_number}`}>
            {/* Back link */}
            <div className="mb-4">
                <Link
                    href="/platform-admin/support"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to Support Queue</span>
                </Link>
            </div>

            {/* Ticket Header Card */}
            <div className="mb-6 rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-extrabold text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                {ticket.ticket_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                ticket.priority === 'urgent'
                                    ? 'bg-rose-100 text-rose-700'
                                    : ticket.priority === 'high'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                            }`}>
                                Priority: {ticket.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{ticket.subject}</h2>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span>Requester: {ticket.user.name} ({ticket.user.email})</span>
                            {ticket.organization && (
                                <>
                                    <span>•</span>
                                    <span>Campus: {ticket.organization.name}</span>
                                </>
                            )}
                            <span>•</span>
                            <span>Created {ticket.created_at}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-4 mb-8">
                {ticket.messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`rounded-2xl p-5 border shadow-xs ${
                            msg.is_internal_note
                                ? 'bg-amber-50/70 border-amber-200 text-amber-950 ml-4 sm:ml-8'
                                : msg.user_role === 'super_admin'
                                ? 'bg-blue-50/60 border-blue-200 text-blue-950 ml-4 sm:ml-8'
                                : 'bg-white border-slate-200/80 text-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-between text-xs mb-2 border-b pb-2 border-slate-200/40">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{msg.user_name}</span>
                                {msg.is_internal_note && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                                        <Lock className="size-3" />
                                        <span>Internal Staff Note</span>
                                    </span>
                                )}
                                {msg.user_role === 'super_admin' && !msg.is_internal_note && (
                                    <span className="text-[10px] font-bold bg-blue-200/80 text-blue-900 px-1.5 py-0.5 rounded">
                                        Platform Support Admin
                                    </span>
                                )}
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">{msg.created_at}</span>
                        </div>
                        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                            {msg.message}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply Composer Card */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Compose Response or Internal Note</h3>
                <form onSubmit={handleReply} className="space-y-4">
                    <div>
                        <textarea
                            required
                            rows={4}
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            placeholder="Write your official response or private administrative note..."
                            className="w-full p-3 rounded-2xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                        <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_internal_note}
                                    onChange={(e) => setData('is_internal_note', e.target.checked)}
                                    className="size-4 rounded text-amber-600 focus:ring-0"
                                />
                                <span>Save as Internal Note (Customer won't see this)</span>
                            </label>

                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-medium">Update Status:</span>
                                <select
                                    value={data.new_status}
                                    onChange={(e) => setData('new_status', e.target.value)}
                                    className="p-1 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="waiting_response">Waiting Response</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.message.trim()}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1256B8] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                        >
                            <Send className="size-3.5" />
                            <span>{processing ? 'Submitting...' : 'Send Message'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </PlatformAdminLayout>
    );
}
