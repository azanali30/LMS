import { Head } from '@inertiajs/react';
import { Palette, Sparkles } from 'lucide-react';
import AppearanceToggleTab from '@/components/appearance-tabs';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance Settings" />

            <div className="space-y-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-[#0B1220] dark:shadow-xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                                <Palette className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Interface Theme & Appearance
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Select your preferred visual style across all LMS portal workspaces
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                            <Sparkles className="size-3 text-purple-600 dark:text-purple-400" />
                            <span>Live Theme Engine</span>
                        </div>
                    </div>

                    <AppearanceToggleTab />
                </div>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
