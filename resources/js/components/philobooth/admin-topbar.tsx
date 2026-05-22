import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icon';

type AuthShared = {
    user?: {
        name: string;
        email: string;
        avatar: string | null;
        roles: string[];
        is_admin: boolean;
        branch: { name: string } | null;
    } | null;
};

type Props = {
    onToggleSidebar?: () => void;
    collapsed?: boolean;
};

export function AdminTopbar({ onToggleSidebar, collapsed }: Props) {
    const { auth } = usePage<{ auth: AuthShared }>().props;
    const user = auth?.user;

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'RA';

    const roleLabel = user?.is_admin
        ? 'Super admin'
        : user?.branch
          ? `Cabang ${user.branch.name}`
          : 'User';

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!menuOpen) {
            return;
        }

        const onClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;

            if (
                menuRef.current?.contains(target) ||
                triggerRef.current?.contains(target)
            ) {
                return;
            }

            setMenuOpen(false);
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKey);
        };
    }, [menuOpen]);

    return (
        <header
            style={{
                height: 64,
                borderBottom: '1px solid var(--pb-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 20px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'saturate(180%) blur(10px)',
                WebkitBackdropFilter: 'saturate(180%) blur(10px)',
                flexShrink: 0,
                position: 'sticky',
                top: 0,
                zIndex: 20,
            }}
        >
            <button
                type="button"
                className="pb-icon-btn"
                onClick={onToggleSidebar}
                title={collapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
                aria-label="Toggle sidebar"
            >
                <Icon name="menu" size={20} />
            </button>

            <div className="pb-search">
                <Icon name="search" size={16} className="pb-search-icon" />
                <input
                    placeholder="Cari transaksi, cabang, voucher…"
                    aria-label="Cari"
                />
                <span className="pb-kbd" aria-hidden="true">
                    ⌘K
                </span>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ position: 'relative' }}>
                <button
                    ref={triggerRef}
                    type="button"
                    className="pb-icon-btn"
                    title={user?.name ?? 'Akun'}
                    aria-label="Menu akun"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    style={{
                        width: 'auto',
                        height: 44,
                        padding: '4px 6px 4px 4px',
                        gap: 10,
                        display: 'flex',
                        alignItems: 'center',
                        background: menuOpen ? '#f6f6f6' : undefined,
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
                            boxShadow:
                                '0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,0.06)',
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
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            lineHeight: 1.1,
                            paddingRight: 4,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--pb-ink)',
                                maxWidth: 120,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user?.name ?? 'Guest'}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                color: 'var(--pb-text-faint)',
                                fontWeight: 500,
                            }}
                        >
                            {roleLabel}
                        </span>
                    </div>
                    <Icon
                        name="chevron-down"
                        size={14}
                        color="var(--pb-text-faint)"
                        style={{
                            transform: menuOpen
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',
                            transition: 'transform 0.18s ease',
                        }}
                    />
                </button>

                {menuOpen && (
                    <div
                        ref={menuRef}
                        role="menu"
                        aria-label="Menu akun"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 8px)',
                            minWidth: 240,
                            background: '#fff',
                            border: '1px solid var(--pb-border)',
                            borderRadius: 12,
                            boxShadow:
                                '0 12px 32px -12px rgba(10,10,10,0.18), 0 2px 6px rgba(10,10,10,0.06)',
                            overflow: 'hidden',
                            zIndex: 40,
                            animation:
                                'pb-menu-in 140ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {/* Header: full identity */}
                        <div
                            style={{
                                padding: '12px 14px',
                                borderBottom: '1px solid var(--pb-border-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: 38,
                                    height: 38,
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
                            <div style={{ minWidth: 0 }}>
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
                                    {user?.name ?? 'Guest'}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11.5,
                                        color: 'var(--pb-text-faint)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {user?.email ?? roleLabel}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 6 }}>
                            <Link
                                href="/settings/profile"
                                onClick={() => setMenuOpen(false)}
                                role="menuitem"
                                className="pb-menu-item"
                            >
                                <Icon name="user" size={16} />
                                <span>Profil</span>
                            </Link>
                            <Link
                                href="/settings/security"
                                onClick={() => setMenuOpen(false)}
                                role="menuitem"
                                className="pb-menu-item"
                            >
                                <Icon name="lock" size={16} />
                                <span>Keamanan</span>
                            </Link>
                            {user?.is_admin && (
                                <Link
                                    href="/admin/settings"
                                    onClick={() => setMenuOpen(false)}
                                    role="menuitem"
                                    className="pb-menu-item"
                                >
                                    <Icon name="settings" size={16} />
                                    <span>Pengaturan</span>
                                </Link>
                            )}
                        </div>

                        <div
                            style={{
                                borderTop: '1px solid var(--pb-border-soft)',
                                padding: 6,
                            }}
                        >
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                role="menuitem"
                                className="pb-menu-item pb-menu-item--danger"
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    textAlign: 'left',
                                    font: 'inherit',
                                    cursor: 'pointer',
                                }}
                            >
                                <Icon name="logout" size={16} />
                                <span>Keluar</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
