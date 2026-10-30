import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        // Public pages manage their own PublicLayout (no sidebar or dashboard header)
        const publicPages = [
            'welcome',
            'benefits',
            'pricing',
            'how-it-works',
            'about',
            'download',
            'contact',
            'courses',
            'learning/courses',
            'learning/course-show',
            'auth/register',
        ];

        if (
            publicPages.includes(name) ||
            name.startsWith('tenant/') ||
            name.startsWith('school/') ||
            name.startsWith('admin/') ||
            name.startsWith('learning/') ||
            name.startsWith('organizations/')
        ) {
            return null;
        }

        switch (true) {
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return SettingsLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
