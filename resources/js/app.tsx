import { createInertiaApp } from '@inertiajs/react';
import { ConfirmDialogProvider } from '@/components/philobooth/confirm-dialog';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            // Pages that render their own full layout (login, kiosk, admin pages)
            case name === 'welcome':
            case name.startsWith('kiosk/'):
            case name.startsWith('admin/'):
            case name === 'dashboard':
            case name.startsWith('auth/'):
            case name.startsWith('download/'):
            case name === 'settings/profile':
                return null;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
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
                <ConfirmDialogProvider />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#0A0A0A',
    },
});

initializeTheme();
