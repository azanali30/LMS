import { Monitor, Moon, Sun, Check } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const themes: {
        value: Appearance;
        title: string;
        tag: string;
        description: string;
        icon: typeof Moon;
        preview: React.ReactNode;
    }[] = [
        {
            value: 'dark',
            title: 'Dark Theme',
            tag: 'LMS Signature',
            description: 'Deep midnight palette with purple neon accents, optimized for eye comfort and focus.',
            icon: Moon,
            preview: (
                <div className="h-24 w-full rounded-xl border border-purple-500/30 bg-[#070b14] p-2.5 flex gap-2 overflow-hidden shadow-inner">
                    <div className="w-1/4 rounded-lg bg-[#0B1220] border border-slate-800 p-1.5 flex flex-col gap-1">
                        <div className="size-2 rounded bg-purple-500" />
                        <div className="h-1 w-full rounded bg-purple-500/40" />
                        <div className="h-1 w-3/4 rounded bg-slate-800" />
                        <div className="h-1 w-2/3 rounded bg-slate-800" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-2 w-full rounded bg-slate-900 border border-slate-800 flex items-center px-1">
                            <div className="size-1 rounded-full bg-purple-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                            <div className="rounded-md border border-purple-500/20 bg-purple-600/10 p-1 flex flex-col justify-end">
                                <div className="h-1 w-1/2 rounded bg-purple-400" />
                            </div>
                            <div className="rounded-md border border-slate-800 bg-slate-900/60 p-1 flex flex-col justify-end">
                                <div className="h-1 w-2/3 rounded bg-slate-700" />
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            value: 'light',
            title: 'Light Theme',
            tag: 'Clean & Crisp',
            description: 'High-luminance clean slate workspace tailored for well-lit rooms and daytime study.',
            icon: Sun,
            preview: (
                <div className="h-24 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 flex gap-2 overflow-hidden shadow-inner">
                    <div className="w-1/4 rounded-lg bg-white border border-slate-200 p-1.5 flex flex-col gap-1">
                        <div className="size-2 rounded bg-purple-600" />
                        <div className="h-1 w-full rounded bg-purple-200" />
                        <div className="h-1 w-3/4 rounded bg-slate-200" />
                        <div className="h-1 w-2/3 rounded bg-slate-200" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-2 w-full rounded bg-white border border-slate-200 flex items-center px-1">
                            <div className="size-1 rounded-full bg-purple-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                            <div className="rounded-md border border-purple-200 bg-purple-50 p-1 flex flex-col justify-end">
                                <div className="h-1 w-1/2 rounded bg-purple-600" />
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-1 flex flex-col justify-end">
                                <div className="h-1 w-2/3 rounded bg-slate-300" />
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            value: 'system',
            title: 'System Preference',
            tag: 'Auto Synchronized',
            description: "Automatically synchronizes with your device operating system's light or dark mode.",
            icon: Monitor,
            preview: (
                <div className="h-24 w-full rounded-xl border border-slate-700 overflow-hidden relative shadow-inner">
                    <div className="absolute inset-0 flex">
                        <div className="w-1/2 bg-[#070b14] border-r border-slate-800 p-2 flex flex-col gap-1.5">
                            <div className="size-2 rounded bg-purple-400" />
                            <div className="h-1 w-3/4 rounded bg-slate-700" />
                            <div className="h-8 rounded bg-slate-900 border border-slate-800 mt-auto" />
                        </div>
                        <div className="w-1/2 bg-slate-100 p-2 flex flex-col gap-1.5">
                            <div className="size-2 rounded bg-purple-600 ml-auto" />
                            <div className="h-1 w-3/4 rounded bg-slate-300 ml-auto" />
                            <div className="h-8 rounded bg-white border border-slate-200 mt-auto" />
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-3', className)} {...props}>
            {themes.map(({ value, title, tag, description, icon: Icon, preview }) => {
                const isSelected = appearance === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'group relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-200',
                            isSelected
                                ? 'border-purple-500/80 bg-purple-950/20 ring-2 ring-purple-500/50 shadow-xl shadow-purple-950/40'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                        )}
                    >
                        {/* Selected Indicator Badge */}
                        {isSelected && (
                            <div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-purple-600 text-white shadow-md shadow-purple-600/40 animate-in zoom-in-75">
                                <Check className="size-3 stroke-[3]" />
                            </div>
                        )}

                        <div className="mb-3">{preview}</div>

                        <div className="flex items-center gap-2 mb-1">
                            <Icon
                                className={cn(
                                    'size-4',
                                    isSelected ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                                )}
                            />
                            <span className="text-sm font-bold text-white">{title}</span>
                            <span
                                className={cn(
                                    'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                                    isSelected
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                )}
                            >
                                {tag}
                            </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2">
                            {description}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}
