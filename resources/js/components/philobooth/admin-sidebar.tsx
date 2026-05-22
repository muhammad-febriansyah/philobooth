import { Link, usePage } from '@inertiajs/react';
import { Icon  } from './icon';
import type {IconName} from './icon';
import { Logo } from './logo';

type NavId =
    | 'dashboard'
    | 'booth'
    | 'cabang'
    | 'printer'
    | 'frames'
    | 'voucher'
    | 'tx'
    | 'users'
    | 'pricing'
    | 'settings';

type NavItem = {
    id: NavId;
    icon: IconName;
    label: string;
    href: string;
    count?: number;
    /** Tampilkan hanya untuk role tertentu */
    roles?: Array<'admin' | 'cabang'>;
    /** Buka di tab/window baru */
    external?: boolean;
};

type NavSection = {
    title?: string;
    items: NavItem[];
};

type AuthShared = {
    user?: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
        branch_id: number | null;
        branch: { id: number; code: string; name: string } | null;
        roles: string[];
        is_admin: boolean;
    } | null;
};

const SECTIONS: NavSection[] = [
    {
        items: [
            {
                id: 'dashboard',
                icon: 'layout-dashboard',
                label: 'Dashboard',
                href: '/dashboard',
            },
            {
                id: 'booth',
                icon: 'camera',
                label: 'Booth (kiosk)',
                href: '/kiosk/welcome',
                external: true,
            },
        ],
    },
    {
        title: 'Operasional',
        items: [
            {
                id: 'cabang',
                icon: 'store',
                label: 'Cabang',
                href: '/admin/cabang',
                roles: ['admin'],
            },
            {
                id: 'printer',
                icon: 'printer',
                label: 'Printer',
                href: '/admin/printer',
            },
            {
                id: 'frames',
                icon: 'frame',
                label: 'Frame builder',
                href: '/admin/frames',
            },
            {
                id: 'voucher',
                icon: 'ticket',
                label: 'Voucher',
                href: '/admin/voucher',
                roles: ['admin', 'cabang'],
            },
            {
                id: 'tx',
                icon: 'receipt',
                label: 'Transaksi',
                href: '/admin/transaksi',
            },
        ],
    },
    {
        title: 'Pengelolaan',
        items: [
            {
                id: 'users',
                icon: 'users',
                label: 'User & role',
                href: '/admin/users',
                roles: ['admin'],
            },
            {
                id: 'settings',
                icon: 'settings',
                label: 'Pengaturan',
                href: '/admin/settings',
                roles: ['admin'],
            },
        ],
    },
];

type Props = {
    active?: NavId;
    collapsed?: boolean;
};

export function AdminSidebar({ active = 'dashboard', collapsed }: Props) {
    const { auth } = usePage<{ auth: AuthShared }>().props;
    const user = auth?.user;

    const filterByRole = (it: NavItem) => {
        if (!it.roles) {
            return true;
        }

        if (!user) {
            return false;
        }

        return it.roles.some((r) => user.roles.includes(r));
    };

    const visibleSections = SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(filterByRole),
    })).filter((section) => section.items.length > 0);

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'PB';

    const roleLabel = user?.is_admin
        ? 'Super admin'
        : user?.branch
          ? `Cabang ${user.branch.name}`
          : 'User';

    const renderNavItem = (it: NavItem) => {
        const cls = 'pb-nav ' + (it.id === active ? 'pb-nav-active' : '');

        const body = (
            <>
                <Icon name={it.icon} size={18} />
                {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
                {!collapsed && it.external && (
                    <Icon
                        name="arrow-right"
                        size={12}
                        color={
                            it.id === active
                                ? 'rgba(255,255,255,0.7)'
                                : 'var(--pb-text-faint)'
                        }
                        style={{ transform: 'rotate(-45deg)' }}
                    />
                )}
                {!collapsed && it.count && (
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 999,
                            background:
                                it.id === active
                                    ? 'var(--pb-primary)'
                                    : '#F4F4F5',
                            color:
                                it.id === active ? 'var(--pb-ink)' : '#525252',
                        }}
                    >
                        {it.count}
                    </span>
                )}
            </>
        );

        if (it.external) {
            return (
                <a
                    key={it.id}
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    title={collapsed ? it.label : undefined}
                >
                    {body}
                </a>
            );
        }

        return (
            <Link
                key={it.id}
                href={it.href}
                className={cls}
                title={collapsed ? it.label : undefined}
            >
                {body}
            </Link>
        );
    };

    return (
        <aside
            style={{
                width: collapsed ? 76 : 252,
                background: '#fff',
                borderRight: '1px solid var(--pb-border)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                height: '100vh',
                overflowY: 'auto',
                position: 'sticky',
                top: 0,
            }}
        >
            {/* Logo header — aligns with topbar height */}
            <div
                style={{
                    height: 64,
                    padding: '0 18px',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--pb-border)',
                    flexShrink: 0,
                }}
            >
                <Logo size={26} withText={!collapsed} />
            </div>

            {/* Nav scroll area */}
            <div
                style={{
                    flex: 1,
                    padding: '14px 14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    overflowY: 'auto',
                }}
            >
                {visibleSections.map((section, idx) => (
                    <div
                        key={section.title ?? `s-${idx}`}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        {!collapsed && section.title && (
                            <div className="pb-nav-section">
                                {section.title}
                            </div>
                        )}
                        {collapsed && idx > 0 && (
                            <div
                                style={{
                                    height: 1,
                                    background: 'var(--pb-border-soft)',
                                    margin: '8px 6px',
                                }}
                            />
                        )}
                        {section.items.map(renderNavItem)}
                    </div>
                ))}
            </div>

            {/* Footer — user card */}
            <div
                style={{
                    padding: 12,
                    borderTop: '1px solid var(--pb-border)',
                    flexShrink: 0,
                }}
            >
                {!collapsed && user ? (
                    <div
                        style={{
                            padding: 10,
                            background: '#FAFAFA',
                            border: '1px solid var(--pb-border-soft)',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background:
                                    'linear-gradient(135deg, #FFE9C7, #FFB37C)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                color: '#7A3E00',
                                flexShrink: 0,
                                boxShadow:
                                    '0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                            }}
                        >
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                initials
                            )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--pb-ink)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {user.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--pb-text-faint)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {roleLabel}
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                flexShrink: 0,
                            }}
                        >
                            <Link
                                href="/settings/profile"
                                className="pb-icon-btn"
                                title="Profil & akun"
                                aria-label="Profil & akun"
                                style={{
                                    width: 32,
                                    height: 32,
                                }}
                            >
                                <Icon name="settings" size={15} />
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="pb-icon-btn"
                                title="Keluar"
                                aria-label="Keluar"
                                style={{
                                    width: 32,
                                    height: 32,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <Icon name="logout" size={15} />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="pb-nav"
                        title="Keluar"
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            font: 'inherit',
                            justifyContent: collapsed ? 'center' : undefined,
                        }}
                    >
                        <Icon name="logout" size={18} />
                        {!collapsed && <span>Keluar</span>}
                    </Link>
                )}
            </div>
        </aside>
    );
}
