import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-sm shadow-violet-500/20">
                <AppLogoIcon className="size-5 text-white" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-foreground">
                    {name || 'SkillForge LMS'}
                </span>
                <span className="truncate text-[11px] font-medium text-muted-foreground">
                    Online Learning
                </span>
            </div>
        </>
    );
}
