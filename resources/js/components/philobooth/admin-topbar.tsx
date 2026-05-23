import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icon';

type SearchTransaction = {
    id: number;
    code: string;
    status: string | null;
    amount: number;
    paid_at: string | null;
    branch: string | null;
};
type SearchVoucher = {
    id: number;
    name: string | null;
    code: string;
    is_active: boolean;
    used: boolean;
    branch: string | null;
};
type SearchBranch = {
    id: number;
    name: string;
    code: string;
    city: string | null;
    is_active: boolean;
};
type SearchPrinter = {
    id: number;
    name: string;
    branch: string | null;
    is_default: boolean;
    is_active: boolean;
    status: string | null;
};
type SearchResults = {
    transactions: SearchTransaction[];
    vouchers: SearchVoucher[];
    branches: SearchBranch[];
    printers: SearchPrinter[];
    query: string;
};

const EMPTY_RESULTS: SearchResults = {
    transactions: [],
    vouchers: [],
    branches: [],
    printers: [],
    query: '',
};

function formatRupiah(n: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(n);
}

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

    // ── Global search state ─────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] =
        useState<SearchResults>(EMPTY_RESULTS);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    // Debounced fetch — query >= 2 chars.
    useEffect(() => {
        const q = searchQuery.trim();

        if (q.length < 2) {
            setSearchResults(EMPTY_RESULTS);
            setSearchLoading(false);

            return;
        }

        const controller = new AbortController();
        setSearchLoading(true);
        const id = window.setTimeout(() => {
            fetch(`/admin/search?q=${encodeURIComponent(q)}`, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
                credentials: 'same-origin',
            })
                .then((r) => (r.ok ? r.json() : Promise.reject(r)))
                .then((data: SearchResults) => {
                    setSearchResults(data);
                    setSearchLoading(false);
                })
                .catch((err) => {
                    if (err?.name === 'AbortError') return;
                    setSearchResults(EMPTY_RESULTS);
                    setSearchLoading(false);
                });
        }, 220);

        return () => {
            controller.abort();
            window.clearTimeout(id);
        };
    }, [searchQuery]);

    // ⌘K / Ctrl+K focuses search; Escape closes dropdown.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                setSearchOpen(true);
            } else if (e.key === 'Escape' && searchOpen) {
                setSearchOpen(false);
                searchInputRef.current?.blur();
            }
        };

        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, [searchOpen]);

    // Click outside closes search dropdown.
    useEffect(() => {
        if (!searchOpen) return;

        const onClick = (e: MouseEvent) => {
            if (
                !searchContainerRef.current?.contains(e.target as Node) &&
                searchInputRef.current !== e.target
            ) {
                setSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', onClick);

        return () => document.removeEventListener('mousedown', onClick);
    }, [searchOpen]);

    const navigateTo = (href: string) => {
        setSearchOpen(false);
        setSearchQuery('');
        router.visit(href);
    };

    const totalResults =
        searchResults.transactions.length +
        searchResults.vouchers.length +
        searchResults.branches.length +
        searchResults.printers.length;

    const trimmedQuery = searchQuery.trim();

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

            <div
                ref={searchContainerRef}
                className="pb-topbar-search"
                style={{ position: 'relative', maxWidth: 520, flex: 1 }}
            >
                <div className="pb-search">
                    <Icon name="search" size={16} className="pb-search-icon" />
                    <input
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Cari transaksi, cabang, voucher…"
                        aria-label="Cari"
                        aria-expanded={searchOpen}
                        aria-controls="pb-global-search-results"
                    />
                    {searchLoading ? (
                        <span
                            className="pb-spin"
                            aria-hidden
                            style={{
                                display: 'inline-flex',
                                color: 'var(--pb-text-faint)',
                                marginRight: 4,
                            }}
                        >
                            <Icon name="refresh" size={14} />
                        </span>
                    ) : searchQuery ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                searchInputRef.current?.focus();
                            }}
                            aria-label="Bersihkan pencarian"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 2,
                                color: 'var(--pb-text-faint)',
                                display: 'inline-flex',
                                marginRight: 2,
                            }}
                        >
                            <Icon name="x" size={14} />
                        </button>
                    ) : (
                        <span className="pb-kbd" aria-hidden="true">
                            ⌘K
                        </span>
                    )}
                </div>

                {searchOpen && trimmedQuery.length >= 2 && (
                    <div
                        id="pb-global-search-results"
                        role="listbox"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            background: '#fff',
                            border: '1px solid var(--pb-border)',
                            borderRadius: 12,
                            boxShadow:
                                '0 16px 40px -16px rgba(10,10,10,0.20), 0 2px 6px rgba(10,10,10,0.06)',
                            overflow: 'hidden',
                            maxHeight: 480,
                            overflowY: 'auto',
                            zIndex: 50,
                            animation:
                                'pb-menu-in 140ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {searchLoading && totalResults === 0 ? (
                            <div
                                style={{
                                    padding: '20px 16px',
                                    fontSize: 13,
                                    color: 'var(--pb-text-muted)',
                                    textAlign: 'center',
                                }}
                            >
                                Mencari "{trimmedQuery}"…
                            </div>
                        ) : totalResults === 0 ? (
                            <div
                                style={{
                                    padding: '24px 16px',
                                    textAlign: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--pb-ink)',
                                        marginBottom: 4,
                                    }}
                                >
                                    Tidak ada hasil untuk "{trimmedQuery}"
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--pb-text-faint)',
                                    }}
                                >
                                    Coba kata kunci lain — kode transaksi,
                                    nama/kode voucher, nama cabang, atau nama
                                    printer.
                                </div>
                            </div>
                        ) : (
                            <>
                                {searchResults.transactions.length > 0 && (
                                    <SearchGroup label="Transaksi">
                                        {searchResults.transactions.map((t) => (
                                            <SearchItem
                                                key={`t-${t.id}`}
                                                icon="receipt"
                                                title={t.code}
                                                subtitle={
                                                    <>
                                                        {t.branch ?? '—'} ·{' '}
                                                        {formatRupiah(t.amount)}{' '}
                                                        {t.status && (
                                                            <span
                                                                style={{
                                                                    color: 'var(--pb-text-faint)',
                                                                }}
                                                            >
                                                                · {t.status}
                                                            </span>
                                                        )}
                                                    </>
                                                }
                                                onClick={() =>
                                                    navigateTo(
                                                        `/admin/transaksi?search=${encodeURIComponent(t.code)}`,
                                                    )
                                                }
                                            />
                                        ))}
                                    </SearchGroup>
                                )}

                                {searchResults.vouchers.length > 0 && (
                                    <SearchGroup label="Voucher">
                                        {searchResults.vouchers.map((v) => (
                                            <SearchItem
                                                key={`v-${v.id}`}
                                                icon="ticket"
                                                title={v.name ?? v.code}
                                                subtitle={
                                                    <>
                                                        <code
                                                            style={{
                                                                fontFamily:
                                                                    'monospace',
                                                                fontSize: 11,
                                                                background:
                                                                    '#F4F4F5',
                                                                padding:
                                                                    '1px 6px',
                                                                borderRadius: 4,
                                                                marginRight: 6,
                                                            }}
                                                        >
                                                            {v.code}
                                                        </code>
                                                        {v.branch ?? '—'}
                                                        <span
                                                            style={{
                                                                color: v.used
                                                                    ? 'var(--pb-text-faint)'
                                                                    : '#166534',
                                                                marginLeft: 6,
                                                            }}
                                                        >
                                                            ·{' '}
                                                            {v.used
                                                                ? 'Terpakai'
                                                                : 'Belum'}
                                                        </span>
                                                    </>
                                                }
                                                onClick={() =>
                                                    navigateTo(
                                                        `/admin/voucher?search=${encodeURIComponent(v.code)}`,
                                                    )
                                                }
                                            />
                                        ))}
                                    </SearchGroup>
                                )}

                                {searchResults.branches.length > 0 && (
                                    <SearchGroup label="Cabang">
                                        {searchResults.branches.map((b) => (
                                            <SearchItem
                                                key={`b-${b.id}`}
                                                icon="store"
                                                title={b.name}
                                                subtitle={
                                                    <>
                                                        <code
                                                            style={{
                                                                fontFamily:
                                                                    'monospace',
                                                                fontSize: 11,
                                                                background:
                                                                    '#F4F4F5',
                                                                padding:
                                                                    '1px 6px',
                                                                borderRadius: 4,
                                                                marginRight: 6,
                                                            }}
                                                        >
                                                            {b.code}
                                                        </code>
                                                        {b.city ?? '—'}
                                                        {!b.is_active && (
                                                            <span
                                                                style={{
                                                                    color: 'var(--pb-danger)',
                                                                    marginLeft: 6,
                                                                }}
                                                            >
                                                                · nonaktif
                                                            </span>
                                                        )}
                                                    </>
                                                }
                                                onClick={() =>
                                                    user?.is_admin
                                                        ? navigateTo(
                                                              '/admin/cabang',
                                                          )
                                                        : navigateTo(
                                                              '/dashboard',
                                                          )
                                                }
                                            />
                                        ))}
                                    </SearchGroup>
                                )}

                                {searchResults.printers.length > 0 && (
                                    <SearchGroup label="Printer">
                                        {searchResults.printers.map((p) => (
                                            <SearchItem
                                                key={`p-${p.id}`}
                                                icon="printer"
                                                title={p.name}
                                                subtitle={
                                                    <>
                                                        {p.branch ?? '—'}
                                                        {p.is_default && (
                                                            <span
                                                                style={{
                                                                    marginLeft: 6,
                                                                    color: 'var(--pb-primary-ink)',
                                                                }}
                                                            >
                                                                · default
                                                            </span>
                                                        )}
                                                        {p.status && (
                                                            <span
                                                                style={{
                                                                    color: 'var(--pb-text-faint)',
                                                                    marginLeft: 6,
                                                                }}
                                                            >
                                                                · {p.status}
                                                            </span>
                                                        )}
                                                    </>
                                                }
                                                onClick={() =>
                                                    navigateTo(
                                                        `/admin/printer?search=${encodeURIComponent(p.name)}`,
                                                    )
                                                }
                                            />
                                        ))}
                                    </SearchGroup>
                                )}
                            </>
                        )}

                        <div
                            style={{
                                padding: '8px 14px',
                                borderTop: '1px solid var(--pb-border-soft)',
                                fontSize: 11,
                                color: 'var(--pb-text-faint)',
                                background: '#FAFAFA',
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span>
                                {totalResults > 0
                                    ? `${totalResults} hasil`
                                    : 'Tekan Esc untuk menutup'}
                            </span>
                            <span>
                                <kbd
                                    style={{
                                        fontFamily: 'inherit',
                                        fontSize: 10,
                                        padding: '1px 5px',
                                        background: '#fff',
                                        border: '1px solid var(--pb-border)',
                                        borderRadius: 4,
                                    }}
                                >
                                    ⌘K
                                </kbd>{' '}
                                untuk fokus
                            </span>
                        </div>
                    </div>
                )}
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

function SearchGroup({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div
                style={{
                    padding: '8px 14px 4px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--pb-text-faint)',
                }}
            >
                {label}
            </div>
            <div style={{ paddingBottom: 4 }}>{children}</div>
        </div>
    );
}

function SearchItem({
    icon,
    title,
    subtitle,
    onClick,
}: {
    icon: React.ComponentProps<typeof Icon>['name'];
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="option"
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                textAlign: 'left',
                color: 'var(--pb-ink)',
                transition: 'background-color 0.12s',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                    '#F8F8F8';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                    'transparent';
            }}
        >
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#F4F4F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--pb-text-muted)',
                }}
            >
                <Icon name={icon} size={15} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {title}
                </div>
                {subtitle && (
                    <div
                        style={{
                            fontSize: 11.5,
                            color: 'var(--pb-text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: 1,
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>
            <Icon
                name="arrow-right"
                size={12}
                color="var(--pb-text-faint)"
            />
        </button>
    );
}
