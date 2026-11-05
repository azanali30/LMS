import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Bell,
    Plus,
    X,
    Send,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Info,
    AlertTriangle,
} from 'lucide-react';

interface AnnouncementItem {
    id: number;
    title: string;
    content: string;
    type: string;
    target_audience: string;
    is_published: boolean;
    published_at: string | null;
    creator_name: string | null;
    created_at: string;
}

interface Props {
    announcements: {
        data: AnnouncementItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

export default function PlatformAnnouncementsIndex({ announcements }: Props) {
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        content: '',
        type: 'info',
        target_audience: 'all',
        is_published: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/platform-admin/announcements', {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    const handlePublish = (id: number) => {
        router.post(`/platform-admin/announcements/${id}/publish`);
    };

    const handleDelete = (id: number, title: string) => {
        if (!confirm(`Are you sure you want to delete announcement '${title}'?`)) return;
        router.delete(`/platform-admin/announcements/${id}`);
    };

    return (
        <PlatformAdminLayout title="Platform Announcements">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Announcements</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Broadcast system updates, scheduled maintenance notices, and important alerts to institutions.
                    </p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1256B8] text-white text-xs font-bold shadow-md transition"
                >
                    <Plus className="size-4" />
                    <span>Create Announcement</span>
                </button>
            </div>

            {/* Announcements List */}
            <div className="space-y-4 mb-8">
                {announcements.data.length === 0 ? (
                    <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
                        No platform announcements have been created yet.
                    </div>
                ) : (
                    announcements.data.map((ann) => (
                        <div
                            key={ann.id}
                            className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        ann.type === 'critical'
                                            ? 'bg-rose-100 text-rose-700'
                                            : ann.type === 'warning'
                                            ? 'bg-amber-100 text-amber-800'
                                            : ann.type === 'maintenance'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {ann.type}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        Audience: {ann.target_audience}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        ann.is_published
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {ann.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900">{ann.title}</h3>
                                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                                    {ann.content}
                                </p>
                                <div className="text-[11px] text-slate-400 mt-3">
                                    By {ann.creator_name || 'Admin'} &bull; Created {ann.created_at}
                                    {ann.published_at && ` &bull; Published on ${ann.published_at}`}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                                {!ann.is_published && (
                                    <button
                                        onClick={() => handlePublish(ann.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                                    >
                                        <Send className="size-3.5" />
                                        <span>Publish</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(ann.id, ann.title)}
                                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                                    title="Delete announcement"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h3 className="text-base font-extrabold text-slate-900">Create Platform Announcement</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
                                <input
                                    type="text"
                                    required
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Scheduled Infrastructure Maintenance Window"
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Alert Category</label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                                    >
                                        <option value="info">General Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="critical">Critical / Emergency</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                                    <select
                                        value={data.target_audience}
                                        onChange={(e) => setData('target_audience', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                                    >
                                        <option value="all">All Platform Users</option>
                                        <option value="owners">Campus Owners / Directors</option>
                                        <option value="teachers">Teachers Only</option>
                                        <option value="students">Students & Parents</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Content Body</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    placeholder="Provide detailed instructions or notice details..."
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={data.is_published}
                                        onChange={(e) => setData('is_published', e.target.checked)}
                                        className="size-4 rounded text-blue-600 focus:ring-0"
                                    />
                                    <span>Publish announcement immediately</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-[#1769E0] text-white text-xs font-bold hover:bg-[#1256B8] transition disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Create Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PlatformAdminLayout>
    );
}
