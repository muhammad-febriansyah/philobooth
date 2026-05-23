import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type Frame = {
    id: number;
    name: string;
    category: string | null;
    thumbnail_url: string | null;
    photo_slots: number;
    is_premium: boolean;
    price_addon: number;
};

type Props = {
    session: {
        session_code: string;
        frame_id: number | null;
    };
    frames: Frame[];
};

export default function KioskFrameSelect({ session, frames }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(
        session.frame_id,
    );
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('Semua');
    const [processing, setProcessing] = useState(false);

    const categories = useMemo(() => {
        const set = new Set<string>(['Semua']);
        frames.forEach((f) => f.category && set.add(f.category));

        return Array.from(set);
    }, [frames]);

    const filtered = useMemo(
        () =>
            frames.filter((f) => {
                if (
                    activeCategory !== 'Semua' &&
                    f.category !== activeCategory
                ) {
                    return false;
                }

                if (search) {
                    return f.name
                        .toLowerCase()
                        .includes(search.toLowerCase());
                }

                return true;
            }),
        [frames, activeCategory, search],
    );

    const selected = frames.find((f) => f.id === selectedId) ?? null;

    function next() {
        if (!selectedId) {
            return;
        }

        setProcessing(true);
        router.post(
            '/kiosk/frame',
            { frame_id: selectedId },
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <>
            <Head title="Pilih frame — Philobooth" />
            <KioskScene>
                <Spotlight
                    position="top-right"
                    color="#F5FA0C"
                    size={620}
                    opacity={0.28}
                />
                <Spotlight
                    position="bottom-left"
                    color="#A78BFA"
                    size={520}
                    opacity={0.18}
                    blur={110}
                />
                <KioskHeader step={4} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        padding: 'clamp(20px, 3vw, 36px)',
                        display: 'grid',
                        gridTemplateColumns:
                            'minmax(0, 1.45fr) minmax(0, 1fr)',
                        gap: 'clamp(20px, 3vw, 40px)',
                        minHeight: 0,
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — grid + filters */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                            minHeight: 0,
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                                gap: 20,
                                marginBottom: 14,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 'clamp(11px, 1vw, 13px)',
                                        fontWeight: 700,
                                        color: 'var(--pb-text-faint)',
                                        letterSpacing: '0.18em',
                                        textTransform: 'uppercase',
                                        marginBottom: 6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 28,
                                            height: 1,
                                            background: 'var(--pb-text-faint)',
                                        }}
                                    />
                                    Langkah 4 · Pilih frame
                                </div>
                                <h1
                                    style={{
                                        fontSize: 'clamp(28px, 3.6vw, 46px)',
                                        fontWeight: 700,
                                        letterSpacing: '-0.035em',
                                        lineHeight: 1.0,
                                        margin: 0,
                                    }}
                                >
                                    Pilih frame favoritmu
                                </h1>
                                <p
                                    style={{
                                        fontSize: 'clamp(13px, 1.05vw, 15px)',
                                        color: 'var(--pb-text-muted)',
                                        margin: '6px 0 0',
                                    }}
                                >
                                    {frames.length} desain tersedia · klik untuk
                                    preview
                                </p>
                            </div>

                            {/* Search */}
                            <div
                                style={{
                                    position: 'relative',
                                    flex: '0 0 280px',
                                }}
                            >
                                <Icon
                                    name="search"
                                    size={16}
                                    style={{
                                        position: 'absolute',
                                        left: 14,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--pb-text-faint)',
                                    }}
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari frame…"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px 10px 40px',
                                        background: '#fff',
                                        border: '1px solid var(--pb-border)',
                                        borderRadius: 999,
                                        fontFamily: 'inherit',
                                        fontSize: 13,
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Category chips */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 6,
                                marginBottom: 16,
                                flexWrap: 'wrap',
                            }}
                        >
                            {categories.map((c) => {
                                const active = c === activeCategory;

                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setActiveCategory(c)}
                                        style={{
                                            padding: '7px 16px',
                                            borderRadius: 999,
                                            background: active
                                                ? 'var(--pb-ink)'
                                                : '#fff',
                                            color: active
                                                ? '#fff'
                                                : 'var(--pb-text)',
                                            border: active
                                                ? '1px solid var(--pb-ink)'
                                                : '1px solid var(--pb-border)',
                                            fontFamily: 'inherit',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition:
                                                'background 160ms ease, border 120ms ease',
                                        }}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Grid */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                paddingRight: 4,
                                marginRight: -4,
                            }}
                        >
                            {filtered.length === 0 ? (
                                <div
                                    style={{
                                        padding: 40,
                                        textAlign: 'center',
                                        color: 'var(--pb-text-muted)',
                                        background: '#fff',
                                        borderRadius: 16,
                                        border: '1px solid var(--pb-border)',
                                    }}
                                >
                                    Frame tidak ditemukan. Coba kata kunci lain.
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: 12,
                                    }}
                                >
                                    {filtered.map((f) => (
                                        <FrameCard
                                            key={f.id}
                                            frame={f}
                                            isSelected={f.id === selectedId}
                                            onClick={() => setSelectedId(f.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — big preview pane */}
                    <PreviewPane
                        selected={selected}
                        processing={processing}
                        onNext={next}
                    />
                </main>
            </KioskScene>
        </>
    );
}

function FrameCard({
    frame,
    isSelected,
    onClick,
}: {
    frame: Frame;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                position: 'relative',
                background: '#fff',
                border: isSelected
                    ? '2.5px solid var(--pb-primary)'
                    : '1px solid var(--pb-border)',
                borderRadius: 12,
                padding: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                boxShadow: isSelected
                    ? '0 8px 24px rgba(245,250,12,0.32)'
                    : '0 1px 2px rgba(10,10,10,0.04)',
                transition:
                    'border 120ms ease, transform 120ms ease, box-shadow 200ms ease',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    aspectRatio: '3 / 4',
                    background: '#FAFAFA',
                    borderRadius: 8,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {frame.thumbnail_url ? (
                    <img
                        src={frame.thumbnail_url}
                        alt={frame.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                ) : (
                    <Icon
                        name="image"
                        size={24}
                        color="var(--pb-text-faint)"
                    />
                )}

                {/* Slot count badge */}
                <span
                    style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(10,10,10,0.85)',
                        color: 'var(--pb-primary)',
                        padding: '2px 7px',
                        borderRadius: 999,
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: 0.3,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {frame.photo_slots} slot
                </span>

                {/* Premium tag */}
                {frame.is_premium && (
                    <span
                        style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            background: 'var(--pb-primary)',
                            color: 'var(--pb-ink)',
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: 0.3,
                        }}
                    >
                        PRO
                    </span>
                )}

                {/* Selected indicator */}
                {isSelected && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(245,250,12,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'var(--pb-primary)',
                                color: 'var(--pb-ink)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow:
                                    '0 4px 12px rgba(10,10,10,0.18)',
                            }}
                        >
                            <Icon name="check" size={20} />
                        </div>
                    </div>
                )}
            </div>
            <div
                style={{
                    marginTop: 8,
                    paddingLeft: 2,
                    paddingRight: 2,
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--pb-ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={frame.name}
                >
                    {frame.name}
                </div>
                <div
                    style={{
                        fontSize: 10,
                        color: 'var(--pb-text-faint)',
                        marginTop: 2,
                    }}
                >
                    {frame.category ?? '—'}
                </div>
            </div>
        </button>
    );
}

function PreviewPane({
    selected,
    processing,
    onNext,
}: {
    selected: Frame | null;
    processing: boolean;
    onNext: () => void;
}) {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid var(--pb-border)',
                boxShadow:
                    '0 24px 56px rgba(10,10,10,0.08), 0 4px 12px rgba(10,10,10,0.04)',
                padding: 'clamp(20px, 2.4vw, 28px)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                position: 'sticky',
                top: 24,
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--pb-text-faint)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                }}
            >
                Preview frame
            </div>

            {selected ? (
                <>
                    {/* Big frame preview */}
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '3 / 4',
                            background: '#FAFAFA',
                            borderRadius: 14,
                            overflow: 'hidden',
                            marginBottom: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow:
                                'inset 0 0 0 1px rgba(10,10,10,0.04)',
                        }}
                    >
                        {selected.thumbnail_url ? (
                            <img
                                src={selected.thumbnail_url}
                                alt={selected.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                }}
                            />
                        ) : (
                            <Icon
                                name="image"
                                size={48}
                                color="var(--pb-text-faint)"
                            />
                        )}

                        {selected.is_premium && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 12,
                                    background: 'var(--pb-primary)',
                                    color: 'var(--pb-ink)',
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.06em',
                                }}
                            >
                                PREMIUM
                            </span>
                        )}
                    </div>

                    {/* Info */}
                    <div
                        style={{
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 'clamp(20px, 1.8vw, 24px)',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                color: 'var(--pb-ink)',
                            }}
                        >
                            {selected.name}
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                color: 'var(--pb-text-muted)',
                                marginTop: 4,
                            }}
                        >
                            {selected.category ?? 'Tanpa kategori'}
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 8,
                            marginBottom: 18,
                        }}
                    >
                        <Stat
                            label="Slot foto"
                            value={`${selected.photo_slots}×`}
                        />
                        <Stat
                            label="Tipe"
                            value={
                                selected.is_premium ? 'Premium' : 'Standar'
                            }
                        />
                    </div>

                    <button
                        type="button"
                        onClick={onNext}
                        disabled={processing}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            padding:
                                'clamp(14px, 1.7vw, 18px) clamp(20px, 2vw, 28px)',
                            background: 'var(--pb-ink)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 999,
                            fontSize: 'clamp(14px, 1.2vw, 16px)',
                            fontWeight: 600,
                            cursor: processing ? 'wait' : 'pointer',
                            opacity: processing ? 0.7 : 1,
                            boxShadow:
                                '0 1px 2px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.18)',
                            transition: 'transform 160ms ease',
                            width: '100%',
                        }}
                        onMouseEnter={(e) => {
                            if (!processing) {
                                e.currentTarget.style.transform =
                                    'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform =
                                'translateY(0)';
                        }}
                    >
                        {processing ? 'Memproses…' : 'Pakai frame ini'}
                        <span
                            style={{
                                display: 'inline-flex',
                                width: 28,
                                height: 28,
                                borderRadius: 999,
                                background: 'var(--pb-primary)',
                                color: 'var(--pb-ink)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="arrow-right" size={14} />
                        </span>
                    </button>

                    <div
                        style={{
                            marginTop: 10,
                            fontSize: 11,
                            color: 'var(--pb-text-faint)',
                            textAlign: 'center',
                        }}
                    >
                        Selanjutnya: ambil {selected.photo_slots} foto sesuai
                        slot
                    </div>
                </>
            ) : (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: 'rgba(245,250,12,0.18)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <Icon name="frame" size={28} />
                    </div>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: 'var(--pb-ink)',
                            marginBottom: 6,
                        }}
                    >
                        Pilih dulu frame
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: 'var(--pb-text-muted)',
                            maxWidth: 220,
                            lineHeight: 1.45,
                        }}
                    >
                        Klik salah satu frame di kiri buat lihat preview &
                        detail.
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                padding: '10px 12px',
                background: '#FAFAFA',
                borderRadius: 10,
                border: '1px solid var(--pb-border)',
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--pb-text-faint)',
                    marginBottom: 3,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--pb-ink)',
                }}
            >
                {value}
            </div>
        </div>
    );
}
