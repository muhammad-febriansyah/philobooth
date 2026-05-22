import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { PhotoPH } from '@/components/philobooth/extras';
import { Icon  } from '@/components/philobooth/icon';
import type {IconName} from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

const TOOLS: Array<{ i: IconName; l: string }> = [
    { i: 'type', l: 'Teks' },
    { i: 'image', l: 'Foto' },
    { i: 'shapes', l: 'Shape' },
    { i: 'sticker', l: 'Sticker' },
];

const STICKER_CATS = ['Semua', 'Birthday', 'Wedding', 'K-pop', 'Cute', 'Doodle'];
const STICKERS = [
    '🎂',
    '🎉',
    '🎈',
    '🎁',
    '✨',
    '🍰',
    '🥳',
    '🎊',
    '💛',
    '⭐',
    '🌟',
    '🪩',
];

const LAYERS: Array<{
    i: IconName;
    l: string;
    sub: string;
    active?: boolean;
}> = [
    { i: 'type', l: 'Happy Birthday', sub: 'Teks · Poppins 24' },
    { i: 'image', l: 'Slot foto 1', sub: 'Foto · 280×200' },
    {
        i: 'image',
        l: 'Slot foto 2 (utama)',
        sub: 'Foto · 280×200',
        active: true,
    },
    { i: 'image', l: 'Slot foto 3', sub: 'Foto · 280×200' },
    { i: 'image', l: 'Slot foto 4', sub: 'Foto · 280×200' },
    { i: 'sticker', l: '🎂 Cake', sub: 'Sticker' },
];

export default function FrameBuilder() {
    return (
        <>
            <Head title="Frame Builder" />
            {/* Compact custom topbar with file controls (replaces AdminTopbar) */}
            <header
                style={{
                    height: 56,
                    borderBottom: '1px solid var(--pb-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    background: '#fff',
                    gap: 14,
                }}
            >
                <Link
                    href="/admin/frames"
                    className="pb-btn pb-btn-ghost pb-btn-icon"
                >
                    <Icon name="chevron-left" size={18} />
                </Link>
                <div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                            Birthday 2026 — Strip 2×6
                        </span>
                        <Badge tone="active">Draft</Badge>
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--pb-text-faint)',
                        }}
                    >
                        Auto-saved 2 mnt lalu
                    </div>
                </div>
                <div style={{ flex: 1 }} />
                <div
                    style={{
                        display: 'flex',
                        gap: 4,
                        padding: 3,
                        background: '#F4F4F5',
                        borderRadius: 8,
                    }}
                >
                    {['50%', '100%', '150%'].map((z, i) => (
                        <button
                            key={z}
                            style={{
                                border: 'none',
                                padding: '5px 10px',
                                background: i === 1 ? '#fff' : 'transparent',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                color:
                                    i === 1
                                        ? 'var(--pb-ink)'
                                        : 'var(--pb-text-muted)',
                                boxShadow:
                                    i === 1 ? 'var(--pb-shadow-sm)' : 'none',
                                fontFamily: 'inherit',
                            }}
                        >
                            {z}
                        </button>
                    ))}
                </div>
                <Btn variant="ghost" icon="eye">
                    Preview
                </Btn>
                <Btn variant="secondary">Simpan draft</Btn>
                <Btn variant="primary" icon="check">
                    Publish
                </Btn>
            </header>

            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr 280px',
                    minHeight: 0,
                }}
            >
                {/* Left tools */}
                <div
                    style={{
                        borderRight: '1px solid var(--pb-border)',
                        background: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                    }}
                >
                    <div
                        style={{
                            padding: 14,
                            borderBottom: '1px solid var(--pb-border)',
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: 6,
                            }}
                        >
                            {TOOLS.map((t, i) => (
                                <button
                                    key={i}
                                    style={{
                                        border: '1px solid var(--pb-border)',
                                        background:
                                            i === 0
                                                ? 'var(--pb-primary)'
                                                : '#fff',
                                        borderColor:
                                            i === 0
                                                ? 'var(--pb-primary)'
                                                : 'var(--pb-border)',
                                        borderRadius: 8,
                                        padding: '10px 4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontFamily: 'inherit',
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                >
                                    <Icon name={t.i} size={18} />
                                    {t.l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div
                        style={{
                            padding: 14,
                            flex: 1,
                            overflowY: 'auto',
                            minHeight: 0,
                        }}
                    >
                        <div
                            className="pb-caption"
                            style={{
                                color: 'var(--pb-text-muted)',
                                marginBottom: 10,
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            Sticker library
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 6,
                                marginBottom: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            {STICKER_CATS.map((c, i) => (
                                <span
                                    key={i}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 999,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background:
                                            i === 1
                                                ? 'var(--pb-ink)'
                                                : '#F4F4F5',
                                        color:
                                            i === 1
                                                ? '#fff'
                                                : 'var(--pb-text-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 8,
                            }}
                        >
                            {STICKERS.map((e, i) => (
                                <div
                                    key={i}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: 8,
                                        background: '#FAFAFA',
                                        border: '1px solid var(--pb-border-soft)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 24,
                                        cursor: 'grab',
                                    }}
                                >
                                    {e}
                                </div>
                            ))}
                        </div>
                        <div
                            className="pb-caption"
                            style={{
                                color: 'var(--pb-text-muted)',
                                margin: '20px 0 10px',
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            Slot foto
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    aspectRatio: '3/4',
                                    borderRadius: 8,
                                    border: '1.5px dashed var(--pb-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'var(--pb-text-muted)',
                                    cursor: 'pointer',
                                }}
                            >
                                <Icon
                                    name="plus"
                                    size={14}
                                    style={{ marginRight: 4 }}
                                />
                                Slot 3:4
                            </div>
                            <div
                                style={{
                                    aspectRatio: '4/3',
                                    borderRadius: 8,
                                    border: '1.5px dashed var(--pb-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'var(--pb-text-muted)',
                                    cursor: 'pointer',
                                }}
                            >
                                <Icon
                                    name="plus"
                                    size={14}
                                    style={{ marginRight: 4 }}
                                />
                                Slot 4:3
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div
                    style={{
                        background: '#FAFAFA',
                        padding: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'auto',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage:
                                'radial-gradient(rgba(10,10,10,0.06) 1px, transparent 1px)',
                            backgroundSize: '16px 16px',
                            pointerEvents: 'none',
                        }}
                    />
                    <div
                        style={{
                            width: 320,
                            height: 720,
                            background: '#fff',
                            borderRadius: 8,
                            boxShadow: '0 10px 40px rgba(10,10,10,0.10)',
                            position: 'relative',
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            zIndex: 1,
                        }}
                    >
                        <div
                            style={{
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: 18,
                            }}
                        >
                            <span
                                style={{
                                    background: 'var(--pb-primary)',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                }}
                            >
                                Happy
                            </span>{' '}
                            Birthday 🎂
                        </div>
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    border:
                                        i === 1
                                            ? '2px solid var(--pb-primary)'
                                            : 'none',
                                    position: 'relative',
                                }}
                            >
                                <PhotoPH seed={i + 2} label={`Slot ${i + 1}`} />
                                {i === 1 && (
                                    <>
                                        {[
                                            { t: 0, l: 0 },
                                            { t: 0, l: '100%' },
                                            { t: '100%', l: 0 },
                                            { t: '100%', l: '100%' },
                                        ].map((c, j) => (
                                            <span
                                                key={j}
                                                style={{
                                                    position: 'absolute',
                                                    top: c.t,
                                                    left: c.l,
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 5,
                                                    background:
                                                        'var(--pb-primary)',
                                                    border: '2px solid #fff',
                                                    transform:
                                                        'translate(-50%, -50%)',
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                        <div
                            style={{
                                marginTop: 4,
                                textAlign: 'center',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--pb-text-muted)',
                                letterSpacing: 1,
                            }}
                        >
                            22 · 05 · 2026 — PHILOBOOTH ✨
                        </div>
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            background: '#fff',
                            border: '1px solid var(--pb-border)',
                            padding: '8px 12px',
                            borderRadius: 8,
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: 'var(--pb-shadow-sm)',
                            zIndex: 2,
                        }}
                    >
                        <Icon
                            name="frame"
                            size={14}
                            color="var(--pb-text-muted)"
                        />
                        <span style={{ color: 'var(--pb-text-muted)' }}>
                            2×6&quot; · 300 DPI · 600 × 1800 px
                        </span>
                    </div>
                </div>

                {/* Right inspector */}
                <div
                    style={{
                        borderLeft: '1px solid var(--pb-border)',
                        background: '#fff',
                        padding: 18,
                        overflowY: 'auto',
                    }}
                >
                    <div
                        className="pb-caption"
                        style={{
                            color: 'var(--pb-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        Slot foto · 2
                    </div>
                    <div
                        style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}
                    >
                        Slot foto utama
                    </div>

                    <div
                        className="pb-caption"
                        style={{
                            color: 'var(--pb-text-muted)',
                            textTransform: 'uppercase',
                            marginTop: 24,
                            marginBottom: 8,
                            letterSpacing: 0.5,
                        }}
                    >
                        Posisi
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                        }}
                    >
                        {(['X', 'Y', 'W', 'H'] as const).map((l, i) => (
                            <div key={l}>
                                <div
                                    className="pb-caption"
                                    style={{
                                        color: 'var(--pb-text-faint)',
                                        marginBottom: 4,
                                    }}
                                >
                                    {l}
                                </div>
                                <input
                                    className="pb-input"
                                    defaultValue={
                                        [20, 196, 280, 200][i] as number
                                    }
                                    style={{ padding: '8px 10px' }}
                                />
                            </div>
                        ))}
                    </div>

                    <div
                        className="pb-caption"
                        style={{
                            color: 'var(--pb-text-muted)',
                            textTransform: 'uppercase',
                            marginTop: 24,
                            marginBottom: 8,
                            letterSpacing: 0.5,
                        }}
                    >
                        Bingkai slot
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <div
                                className="pb-caption"
                                style={{
                                    color: 'var(--pb-text-faint)',
                                    marginBottom: 4,
                                }}
                            >
                                Border
                            </div>
                            <input
                                className="pb-input"
                                defaultValue="2px"
                                style={{ padding: '8px 10px' }}
                            />
                        </div>
                        <div>
                            <div
                                className="pb-caption"
                                style={{
                                    color: 'var(--pb-text-faint)',
                                    marginBottom: 4,
                                }}
                            >
                                Radius
                            </div>
                            <input
                                className="pb-input"
                                defaultValue="6"
                                style={{ padding: '8px 10px' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            '#F5FA0C',
                            '#0A0A0A',
                            '#fff',
                            '#FB7185',
                            '#34D399',
                        ].map((c, i) => (
                            <div
                                key={i}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    background: c,
                                    border:
                                        c === '#fff'
                                            ? '1px solid var(--pb-border)'
                                            : 'none',
                                    cursor: 'pointer',
                                    boxShadow:
                                        i === 0
                                            ? '0 0 0 2px var(--pb-primary), 0 0 0 4px #fff'
                                            : 'none',
                                }}
                            />
                        ))}
                    </div>

                    <div
                        className="pb-caption"
                        style={{
                            color: 'var(--pb-text-muted)',
                            textTransform: 'uppercase',
                            marginTop: 24,
                            marginBottom: 8,
                            letterSpacing: 0.5,
                        }}
                    >
                        Layer
                    </div>
                    <div
                        style={{
                            borderRadius: 8,
                            border: '1px solid var(--pb-border)',
                            overflow: 'hidden',
                        }}
                    >
                        {LAYERS.map((it, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '9px 12px',
                                    background: it.active
                                        ? 'rgba(245,250,12,0.16)'
                                        : '#fff',
                                    borderBottom:
                                        i < LAYERS.length - 1
                                            ? '1px solid var(--pb-border-soft)'
                                            : 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <Icon
                                    name={it.i}
                                    size={14}
                                    color="var(--pb-text-muted)"
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: it.active ? 700 : 500,
                                        }}
                                    >
                                        {it.l}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: 'var(--pb-text-faint)',
                                        }}
                                    >
                                        {it.sub}
                                    </div>
                                </div>
                                <Icon
                                    name="eye"
                                    size={12}
                                    color="var(--pb-text-faint)"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

FrameBuilder.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="frames" bare>
        {page}
    </PhilobboothAdminLayout>
);
