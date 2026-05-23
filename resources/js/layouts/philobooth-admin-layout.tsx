import { useCallback, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/philobooth/admin-sidebar';
import { AdminTopbar } from '@/components/philobooth/admin-topbar';

type NavId =
    | 'dashboard'
    | 'cabang'
    | 'printer'
    | 'frames'
    | 'voucher'
    | 'tx'
    | 'users'
    | 'pricing'
    | 'settings';

type Props = {
    active?: NavId;
    children: ReactNode;
    /** Drop topbar (frame builder uses its own header) */
    bare?: boolean;
};

const STORAGE_KEY = 'pb-sidebar-hidden';

function subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    window.addEventListener('storage', callback);
    window.addEventListener('pb-sidebar-toggle', callback);

    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener('pb-sidebar-toggle', callback);
    };
}

function getSnapshot(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.localStorage.getItem(STORAGE_KEY) === '1';
}

function getServerSnapshot(): boolean {
    return false;
}

export default function PhilobboothAdminLayout({
    active = 'dashboard',
    children,
    bare,
}: Props) {
    const hidden = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const toggle = useCallback(() => {
        const next = !getSnapshot();
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
        window.dispatchEvent(new Event('pb-sidebar-toggle'));
    }, []);

    return (
        <div
            className="pb-root"
            style={{
                width: '100%',
                height: '100vh',
                background: '#FAFAFA',
                display: 'flex',
                overflow: 'hidden',
            }}
        >
            {!hidden && <AdminSidebar active={active} />}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    height: '100vh',
                }}
            >
                {!bare && (
                    <AdminTopbar collapsed={hidden} onToggleSidebar={toggle} />
                )}
                <main
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
