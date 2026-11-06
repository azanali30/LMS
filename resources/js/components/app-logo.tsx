import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-2.5">
            <img
                src="/images/logo-emblem.png"
                alt="InstitutoPropio"
                className="size-8 shrink-0 object-contain"
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-foreground">
                    {name || 'InstitutoPropio'}
                </span>
                <span className="truncate text-[11px] font-medium text-muted-foreground">
                    Online Learning
                </span>
            </div>
        </div>
    );
}
