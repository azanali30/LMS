import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import PlatformAdminLayout from '@/layouts/platform-admin/platform-admin-layout';
import {
    Settings,
    ShieldCheck,
    Lock,
    KeyRound,
    Server,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
} from 'lucide-react';

interface Props {
    systemInfo: {
        appName: string;
        environment: string;
        laravelVersion: string;
        phpVersion: string;
        dbConnection: string;
        mailMailer: string;
        webUrl: string;
        timezone: string;
    };
    adminProfile: {
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
    };
}

export default function PlatformSettingsIndex({ systemInfo, adminProfile }: Props) {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const { data, setData, post, processing, reset, errors, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        post('/platform-admin/settings/password', {
            onSuccess: () => reset(),
        });
    };

    return (
        <PlatformAdminLayout title="Platform Settings & Security">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Configuration</h2>
                <p className="text-xs text-slate-500 mt-1">
                    System infrastructure parameters, master credentials, and operational security settings.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* System Diagnostics Card */}
                <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                        <div className="size-10 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center">
                            <Server className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">System Telemetry</h3>
                            <p className="text-xs text-slate-500">Live Laravel Cloud runtime environment</p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                        <div className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-500">Platform Application:</span>
                            <span className="font-extrabold text-slate-900">{systemInfo.appName}</span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-500">Environment:</span>
                            <span className="font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase text-[10px]">
                                {systemInfo.environment}
                            </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-500">Laravel Framework:</span>
                            <span className="font-mono text-slate-800 font-bold">v{systemInfo.laravelVersion}</span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-500">PHP Engine:</span>
                            <span className="font-mono text-slate-800 font-bold">{systemInfo.phpVersion}</span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-500">Production Database:</span>
                            <span className="font-mono text-slate-800 font-bold capitalize">
                                {systemInfo.dbConnection} (Flex 2 GiB / MySQL 8.4)
                            </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-500">SMTP Mail Driver:</span>
                            <span className="font-mono text-slate-800 font-bold">{systemInfo.mailMailer}</span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-500">Production Web URL:</span>
                            <span className="font-mono text-blue-600 font-bold text-[11px] truncate max-w-xs">
                                {systemInfo.webUrl}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Change Master Password Card */}
                <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                        <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <KeyRound className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Change Master Password</h3>
                            <p className="text-xs text-slate-500">Update your Super Admin access credentials</p>
                        </div>
                    </div>

                    {recentlySuccessful && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>Your administrator password has been updated securely.</span>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="current_password">
                                Current Master Password
                            </label>
                            <div className="relative">
                                <input
                                    id="current_password"
                                    type={showCurrent ? 'text' : 'password'}
                                    required
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    placeholder="Enter current password..."
                                    className="w-full pr-10 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.current_password && (
                                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.current_password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="new_password">
                                New Password (Min 8 characters)
                            </label>
                            <div className="relative">
                                <input
                                    id="new_password"
                                    type={showNew ? 'text' : 'password'}
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Create strong new password..."
                                    className="w-full pr-10 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="confirm_password">
                                Confirm New Password
                            </label>
                            <input
                                id="confirm_password"
                                type="password"
                                required
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Re-type new password..."
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1256B8] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {processing ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PlatformAdminLayout>
    );
}
