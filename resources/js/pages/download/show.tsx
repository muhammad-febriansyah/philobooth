import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { Logo } from '@/components/philobooth/logo';

type ItemKind = 'composite' | 'gif' | 'video' | 'photo';

type GalleryItem = {
    kind: ItemKind;
    label: string;
    url: string;
    download: string;
    slot_number?: number;
};

type Props = {
    session: {
        session_code: string;
        branch: string | null;
        completed_at: string | null;
        download_expires_at: string | null;
        download_count: number;
    };
    items: GalleryItem[];
    download_url: string;
    zip_url: string;
};

function formatRemaining(ms: number): string {
    if (ms <= 0) return '0 Hari, 00:00:00';

    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${days} Hari, ${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function DownloadShow({ session, items, zip_url }: Props) {
    const [active, setActive] = useState(0);
    const [now, setNow] = useState(() => Date.now());

    const expiresAt = useMemo(
        () =>
            session.download_expires_at
                ? new Date(session.download_expires_at).getTime()
                : null,
        [session.download_expires_at],
    );

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(t);
    }, []);

    if (items.length === 0) {
        return (
            <>
                <Head title={`Hasil · ${session.session_code}`} />
                <div
                    style={{
                        minHeight: '100vh',
                        background: '#0A0A0A',
                        color: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                    }}
                >
                    <p>Hasil belum tersedia. Coba refresh sebentar lagi.</p>
                </div>
            </>
        );
    }

    const total = items.length;
    const current = items[active];
    const code = '#'.concat(
        session.session_code.replace(/^PB-\d+-/, '').toUpperCase(),
    );

    function go(delta: number) {
        setActive((prev) => (prev + delta + total) % total);
    }

    return (
        <>
            <Head title={`Download · ${session.session_code}`} />
            <div
                style={{
                    minHeight: '100vh',
                    background: '#0A0A0A',
                    color: '#fafafa',
                    padding: '24px 16px 56px',
                }}
            >
                <div
                    style={{
                        maxWidth: 720,
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 24,
                    }}
                >
                    {/* Top brand row */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Logo size={28} dark />
                        <span
                            style={{
                                fontSize: 11,
                                color: '#9a9a9a',
                                fontFamily: 'monospace',
                            }}
                        >
                            {session.branch ?? 'philobooth'}
                        </span>
                    </div>

                    {/* Title block */}
                    <div style={{ textAlign: 'center' }}>
                        <h1
                            style={{
                                fontSize: 'clamp(28px, 5vw, 38px)',
                                fontWeight: 800,
                                letterSpacing: '-0.025em',
                                margin: 0,
                            }}
                        >
                            Download Your Photos
                        </h1>
                        <p
                            style={{
                                margin: '6px 0 0',
                                fontSize: 14,
                                color: '#9a9a9a',
                                fontFamily: 'monospace',
                            }}
                        >
                            {code}
                        </p>
                        {expiresAt && (
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginTop: 14,
                                    padding: '7px 14px',
                                    borderRadius: 999,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    fontSize: 13,
                                    color: '#cfcfcf',
                                }}
                            >
                                <Icon name="clock" size={14} />
                                <span>Link kadaluarsa dalam</span>
                                <strong
                                    style={{
                                        fontFamily: 'monospace',
                                        color: '#fff',
                                    }}
                                >
                                    {formatRemaining(expiresAt - now)}
                                </strong>
                            </div>
                        )}
                    </div>

                    {/* Hero carousel */}
                    <div
                        style={{
                            position: 'relative',
                            borderRadius: 20,
                            background: '#0F0F0F',
                            border: '1px solid rgba(255,255,255,0.08)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                aspectRatio:
                                    current.kind === 'gif' || current.kind === 'video'
                                        ? '9/16'
                                        : '3/4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#000',
                            }}
                        >
                            {current.kind === 'video' ? (
                                <video
                                    src={current.url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <img
                                    src={current.url}
                                    alt={current.label}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            )}
                        </div>

                        {/* Kind badge top-left */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                padding: '5px 10px',
                                borderRadius: 999,
                                background: 'rgba(0,0,0,0.55)',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            {(current.kind === 'gif' || current.kind === 'video') && (
                                <Icon name="play" size={12} />
                            )}
                            {current.label}
                        </div>

                        {/* Counter bottom-center */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 12,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '4px 12px',
                                borderRadius: 999,
                                background: 'rgba(0,0,0,0.55)',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                                backdropFilter: 'blur(4px)',
                            }}
                        >
                            {active + 1} / {total}
                        </div>

                        {total > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => go(-1)}
                                    aria-label="Sebelumnya"
                                    style={navBtnStyle('left')}
                                >
                                    <Icon name="chevron-left" size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => go(1)}
                                    aria-label="Berikutnya"
                                    style={navBtnStyle('right')}
                                >
                                    <Icon name="chevron-right" size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {total > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: 10,
                                overflowX: 'auto',
                                paddingBottom: 4,
                            }}
                        >
                            {items.map((it, i) => (
                                <button
                                    key={`${it.kind}-${it.slot_number ?? i}`}
                                    type="button"
                                    onClick={() => setActive(i)}
                                    style={{
                                        position: 'relative',
                                        flex: '0 0 auto',
                                        width: 78,
                                        aspectRatio: '3/4',
                                        borderRadius: 10,
                                        overflow: 'hidden',
                                        border:
                                            i === active
                                                ? '2px solid var(--pb-primary, #F5FA0C)'
                                                : '2px solid transparent',
                                        background: '#1a1a1a',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    {it.kind === 'video' ? (
                                        <video
                                            src={it.url}
                                            muted
                                            playsInline
                                            preload="metadata"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={it.url}
                                            alt={it.label}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    )}
                                    {(it.kind === 'gif' || it.kind === 'video') && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background:
                                                    'rgba(0,0,0,0.35)',
                                                color: '#fff',
                                            }}
                                        >
                                            <Icon name="play" size={20} />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <a
                            href={zip_url}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '15px 20px',
                                borderRadius: 14,
                                background: '#fff',
                                color: '#0A0A0A',
                                fontWeight: 700,
                                fontSize: 15,
                                textDecoration: 'none',
                            }}
                        >
                            <Icon name="download" size={18} />
                            Download Semua ({total} file)
                        </a>
                        <a
                            href={current.download}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '13px 20px',
                                borderRadius: 14,
                                background: 'rgba(255,255,255,0.06)',
                                color: '#fafafa',
                                fontWeight: 600,
                                fontSize: 14,
                                border: '1px solid rgba(255,255,255,0.08)',
                                textDecoration: 'none',
                            }}
                        >
                            <Icon name="download" size={16} />
                            Hanya yang ini ({current.label})
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
    return {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [side]: 8,
        width: 38,
        height: 38,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.5)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
    };
}
