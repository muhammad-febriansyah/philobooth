import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type Sticker = {
    uid: string; // unique instance id (for React key)
    id: string; // sticker design id (heart, star, etc.)
    x: number; // 0..1 fraction of canvas width
    y: number; // 0..1 fraction of canvas height
    size: number; // pixel size at preview scale (~480 wide)
    rotate: number; // degrees
};

const STICKER_LIBRARY = [
    { id: 'heart', label: 'Hati' },
    { id: 'star', label: 'Bintang' },
    { id: 'sparkle', label: 'Kilau' },
    { id: 'lightning', label: 'Petir' },
    { id: 'flower', label: 'Bunga' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'smile', label: 'Senyum' },
    { id: 'fire', label: 'Api' },
    { id: 'kiss', label: 'Cium' },
    { id: 'sun', label: 'Matahari' },
    { id: 'cloud', label: 'Awan' },
    { id: 'crown', label: 'Mahkota' },
    { id: 'music', label: 'Musik' },
    { id: 'butterfly', label: 'Kupu-kupu' },
    { id: 'rainbow', label: 'Pelangi' },
    { id: 'snowflake', label: 'Salju' },
    { id: 'party', label: 'Party' },
    { id: 'camera', label: 'Kamera' },
    { id: 'balloon', label: 'Balon' },
    { id: 'peace', label: 'Peace' },
    { id: 'ghost', label: 'Hantu' },
    { id: 'lollipop', label: 'Permen' },
    { id: 'icecream', label: 'Es krim' },
    { id: 'moon', label: 'Bulan' },
    { id: 'pin', label: 'Pin' },
    { id: 'cherry', label: 'Ceri' },
    { id: 'leaf', label: 'Daun' },
    { id: 'thumbsup', label: 'Jempol' },
];

const STICKER_SIZE_PRESETS = [
    { id: 'sm', label: 'S', value: 56 },
    { id: 'md', label: 'M', value: 96 },
    { id: 'lg', label: 'L', value: 140 },
    { id: 'xl', label: 'XL', value: 200 },
];

function nextUid(): string {
    return Math.random().toString(36).slice(2, 10);
}

type FrameSlot = {
    slot_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

type Props = {
    session: { session_code: string };
    photos: Array<{ slot_number: number; url: string }>;
    frame: {
        id: number;
        name: string;
        photo_slots: number;
        thumbnail_url: string | null;
        image_size: { width: number; height: number } | null;
        slots: FrameSlot[];
    } | null;
};

type Filter = { id: string; label: string; cssFilter: string };

const FILTERS: Filter[] = [
    { id: 'none', label: 'Original', cssFilter: 'none' },
    { id: 'vivid', label: 'Vivid', cssFilter: 'saturate(1.4) contrast(1.08)' },
    {
        id: 'warm',
        label: 'Warm',
        cssFilter: 'sepia(0.25) saturate(1.15) hue-rotate(-10deg)',
    },
    {
        id: 'cool',
        label: 'Cool',
        cssFilter: 'saturate(1.1) hue-rotate(180deg) brightness(1.02)',
    },
    {
        id: 'film',
        label: 'Film',
        cssFilter: 'sepia(0.15) contrast(1.1) saturate(0.92) brightness(0.98)',
    },
    { id: 'bw', label: 'B&W', cssFilter: 'grayscale(1) contrast(1.05)' },
    {
        id: 'fade',
        label: 'Fade',
        cssFilter: 'brightness(1.05) contrast(0.92) saturate(0.85)',
    },
    {
        id: 'mono',
        label: 'Mono',
        cssFilter: 'grayscale(0.85) contrast(1.1) brightness(0.95)',
    },
    {
        id: 'pastel',
        label: 'Pastel',
        cssFilter:
            'saturate(0.75) brightness(1.08) contrast(0.95) hue-rotate(5deg)',
    },
    {
        id: 'sunset',
        label: 'Sunset',
        cssFilter:
            'sepia(0.35) saturate(1.3) hue-rotate(-15deg) brightness(1.05)',
    },
    {
        id: 'vintage',
        label: 'Vintage',
        cssFilter:
            'sepia(0.5) saturate(0.85) contrast(1.05) brightness(0.92)',
    },
    {
        id: 'retro',
        label: 'Retro',
        cssFilter:
            'sepia(0.3) saturate(1.2) hue-rotate(-20deg) contrast(1.1)',
    },
    {
        id: 'polaroid',
        label: 'Polaroid',
        cssFilter:
            'sepia(0.2) saturate(0.9) brightness(1.05) contrast(0.95)',
    },
    {
        id: 'drama',
        label: 'Drama',
        cssFilter: 'contrast(1.35) saturate(1.2) brightness(0.95)',
    },
    {
        id: 'soft',
        label: 'Soft',
        cssFilter: 'brightness(1.08) contrast(0.88) saturate(0.92) blur(0.3px)',
    },
    {
        id: 'noir',
        label: 'Noir',
        cssFilter: 'grayscale(1) contrast(1.4) brightness(0.85)',
    },
    {
        id: 'vibrant',
        label: 'Vibrant',
        cssFilter: 'saturate(1.7) contrast(1.12) brightness(1.02)',
    },
    {
        id: 'cyber',
        label: 'Cyber',
        cssFilter: 'hue-rotate(280deg) saturate(1.5) contrast(1.15)',
    },
    {
        id: 'y2k',
        label: 'Y2K',
        cssFilter:
            'saturate(1.3) hue-rotate(10deg) contrast(1.08) brightness(1.04)',
    },
    {
        id: 'lomo',
        label: 'Lomo',
        cssFilter:
            'saturate(1.4) contrast(1.2) sepia(0.1) brightness(0.95)',
    },
];

export default function KioskFilter({ photos, frame }: Props) {
    const [filterId, setFilterId] = useState<string>('none');
    const [caption, setCaption] = useState('');
    const [showDateStamp, setShowDateStamp] = useState(true);
    const [tab, setTab] = useState<'filter' | 'sticker'>('filter');
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [activeSticker, setActiveSticker] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const activeFilter =
        FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];

    const photoBySlot = new Map(photos.map((p) => [p.slot_number, p.url]));

    function addSticker(id: string) {
        const uid = nextUid();
        setStickers((s) => [
            ...s,
            {
                uid,
                id,
                // Sebar posisi random sedikit biar gak tumpuk pas spam tap
                x: 0.4 + Math.random() * 0.2,
                y: 0.4 + Math.random() * 0.2,
                size: 96,
                rotate: 0,
            },
        ]);
        setActiveSticker(uid);
        setTab('sticker');
    }

    function updateSticker(uid: string, patch: Partial<Sticker>) {
        setStickers((s) =>
            s.map((st) => (st.uid === uid ? { ...st, ...patch } : st)),
        );
    }

    function removeSticker(uid: string) {
        setStickers((s) => s.filter((st) => st.uid !== uid));
        setActiveSticker(null);
    }

    function submit() {
        setProcessing(true);
        router.post(
            '/kiosk/filter',
            {
                filter_id: filterId === 'none' ? null : filterId,
                caption: caption.trim() || null,
                show_date_stamp: showDateStamp,
                stickers: stickers.map((s) => ({
                    id: s.id,
                    x: s.x,
                    y: s.y,
                    size: s.size,
                    rotate: s.rotate,
                })),
            },
            { onFinish: () => setProcessing(false) },
        );
    }

    if (!frame || !frame.image_size) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FAFAF7',
                }}
            >
                <p>Belum ada foto.</p>
            </div>
        );
    }

    return (
        <>
            <Head title="Pilih filter — Kiosk" />
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
                <KioskHeader step={7} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        padding: 'clamp(20px, 3vw, 40px)',
                        display: 'grid',
                        gridTemplateColumns:
                            'minmax(0, 0.85fr) minmax(0, 1.15fr)',
                        gap: 'clamp(24px, 4vw, 56px)',
                        alignItems: 'center',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — layered preview with filter applied ONLY to photos */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: 0,
                        }}
                    >
                        <FilterablePreview
                            frame={frame}
                            photoBySlot={photoBySlot}
                            cssFilter={activeFilter.cssFilter}
                            filterLabel={activeFilter.label}
                            stickers={stickers}
                            activeSticker={activeSticker}
                            onActivateSticker={setActiveSticker}
                            onUpdateSticker={updateSticker}
                            onRemoveSticker={removeSticker}
                        />
                    </div>

                    {/* RIGHT — copy + filter grid */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-flex',
                                alignSelf: 'flex-start',
                                alignItems: 'center',
                                gap: 10,
                                fontSize: 'clamp(11px, 1vw, 13px)',
                                fontWeight: 700,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: 'var(--pb-text-faint)',
                                marginBottom: 'clamp(12px, 1.5vw, 18px)',
                            }}
                        >
                            <span
                                style={{
                                    width: 28,
                                    height: 1,
                                    background: 'var(--pb-text-faint)',
                                }}
                            />
                            Langkah 7 · Filter
                        </div>

                        <h1
                            style={{
                                fontSize: 'clamp(28px, 4.5vw, 56px)',
                                fontWeight: 700,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.02,
                                margin: 0,
                            }}
                        >
                            {tab === 'filter' ? 'Pilih filter' : 'Tambah stiker'}
                        </h1>
                        <p
                            style={{
                                fontSize: 'clamp(13px, 1.1vw, 15px)',
                                color: 'var(--pb-text-muted)',
                                marginTop: 'clamp(10px, 1.2vw, 14px)',
                                marginBottom: 'clamp(14px, 1.8vw, 20px)',
                                lineHeight: 1.5,
                                maxWidth: 520,
                            }}
                        >
                            {tab === 'filter'
                                ? `${FILTERS.length} filter siap pakai · berlaku untuk semua ${frame.photo_slots} foto.`
                                : `Tap stiker untuk tambah, drag untuk pindahkan. ${stickers.length} dipasang.`}
                        </p>

                        {/* Tabs */}
                        <div
                            style={{
                                display: 'inline-flex',
                                gap: 6,
                                padding: 4,
                                background: '#fff',
                                border: '1px solid var(--pb-border)',
                                borderRadius: 999,
                                marginBottom: 16,
                                alignSelf: 'flex-start',
                            }}
                        >
                            {(['filter', 'sticker'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTab(t)}
                                    style={{
                                        padding: '8px 18px',
                                        background:
                                            tab === t
                                                ? 'var(--pb-ink)'
                                                : 'transparent',
                                        color: tab === t ? '#fff' : 'var(--pb-text-muted)',
                                        border: 'none',
                                        borderRadius: 999,
                                        fontFamily: 'inherit',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        transition:
                                            'background 160ms ease, color 160ms ease',
                                    }}
                                >
                                    {t === 'filter' ? 'Filter' : `Stiker${stickers.length > 0 ? ` · ${stickers.length}` : ''}`}
                                </button>
                            ))}
                        </div>

                        {tab === 'sticker' ? (
                            <>
                                {activeSticker &&
                                    stickers.find(
                                        (s) => s.uid === activeSticker,
                                    ) && (
                                        <ActiveStickerControls
                                            sticker={
                                                stickers.find(
                                                    (s) =>
                                                        s.uid ===
                                                        activeSticker,
                                                )!
                                            }
                                            onUpdate={(patch) =>
                                                updateSticker(
                                                    activeSticker,
                                                    patch,
                                                )
                                            }
                                        />
                                    )}
                                <StickerPalette onPick={addSticker} />
                            </>
                        ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill, minmax(74px, 1fr))',
                                gap: 12,
                                maxHeight: '42vh',
                                overflowY: 'auto',
                                paddingRight: 4,
                                marginRight: -4,
                            }}
                        >
                            {FILTERS.map((f) => {
                                const isActive = f.id === filterId;
                                const samplePhoto =
                                    photos[0]?.url ?? '';

                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setFilterId(f.id)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: 0,
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            position: 'relative',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1 / 1',
                                                borderRadius: '50%',
                                                overflow: 'hidden',
                                                border: isActive
                                                    ? '3px solid var(--pb-primary)'
                                                    : '2px solid transparent',
                                                boxShadow: isActive
                                                    ? '0 0 0 4px rgba(245,250,12,0.18)'
                                                    : '0 4px 12px rgba(10,10,10,0.08)',
                                                transition:
                                                    'transform 160ms ease, border 120ms ease',
                                                transform: isActive
                                                    ? 'scale(1.03)'
                                                    : 'scale(1)',
                                                background: '#FAFAFA',
                                            }}
                                        >
                                            {samplePhoto && (
                                                <img
                                                    src={samplePhoto}
                                                    alt={f.label}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        filter: f.cssFilter,
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: isActive
                                                    ? 700
                                                    : 600,
                                                color: isActive
                                                    ? 'var(--pb-ink)'
                                                    : 'var(--pb-text-muted)',
                                            }}
                                        >
                                            {f.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        )}

                        {/* Caption + date toggle */}
                        <div
                            style={{
                                marginTop: 'clamp(20px, 2.5vw, 28px)',
                                padding: 'clamp(16px, 2vw, 22px)',
                                background: '#fff',
                                border: '1px solid var(--pb-border)',
                                borderRadius: 14,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 8,
                                    marginBottom: 4,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: 'var(--pb-ink)',
                                    }}
                                >
                                    Tulisan di footer cetakan
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--pb-text-faint)',
                                        fontWeight: 500,
                                    }}
                                >
                                    · opsional
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: 'var(--pb-text-muted)',
                                    margin: '0 0 12px',
                                    lineHeight: 1.45,
                                }}
                            >
                                Tampil di bawah cetakan — contoh: nama event,
                                anniversary, atau hashtag.
                            </p>

                            {/* Mini live preview */}
                            <div
                                style={{
                                    background: '#FAFAFA',
                                    border: '1px dashed var(--pb-border)',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    marginBottom: 10,
                                    textAlign: 'center',
                                }}
                            >
                                {caption ? (
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            background: 'var(--pb-primary)',
                                            color: 'var(--pb-ink)',
                                            padding: '4px 12px',
                                            borderRadius: 4,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            letterSpacing: 0.6,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {caption}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: 'var(--pb-text-faint)',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        Preview tulisan kamu muncul di sini ↓
                                    </span>
                                )}
                                {showDateStamp && (
                                    <div
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 600,
                                            color: 'var(--pb-text-muted)',
                                            marginTop: 6,
                                            letterSpacing: 1,
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        ·{' '}
                                        {new Date()
                                            .toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            .toUpperCase()}{' '}
                                        ·
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                value={caption}
                                onChange={(e) =>
                                    setCaption(e.target.value.slice(0, 30))
                                }
                                maxLength={30}
                                placeholder="contoh: ANNIVERSARY 2026"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    fontSize: 15,
                                    fontFamily: 'inherit',
                                    background: '#fff',
                                    border: '1px solid var(--pb-border)',
                                    borderRadius: 10,
                                    outline: 'none',
                                    color: 'var(--pb-ink)',
                                    letterSpacing: 0.5,
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor =
                                        'var(--pb-ink)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor =
                                        'var(--pb-border)';
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 6,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--pb-text-faint)',
                                    }}
                                >
                                    Max 30 karakter
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'var(--pb-text-muted)',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {caption.length}/30
                                </span>
                            </div>

                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginTop: 14,
                                    cursor: 'pointer',
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    background: showDateStamp
                                        ? 'rgba(245,250,12,0.14)'
                                        : 'transparent',
                                    border: showDateStamp
                                        ? '1px solid rgba(245,250,12,0.55)'
                                        : '1px solid var(--pb-border)',
                                    transition:
                                        'background 160ms ease, border 120ms ease',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={showDateStamp}
                                    onChange={(e) =>
                                        setShowDateStamp(e.target.checked)
                                    }
                                    style={{ cursor: 'pointer' }}
                                />
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--pb-ink)',
                                    }}
                                >
                                    Cetak tanggal hari ini
                                </span>
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        fontSize: 11,
                                        fontFamily: 'monospace',
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    {new Date()
                                        .toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })
                                        .toUpperCase()}
                                </span>
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            style={{
                                marginTop: 'clamp(24px, 3vw, 32px)',
                                alignSelf: 'flex-start',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 14,
                                padding:
                                    'clamp(16px, 2vw, 22px) clamp(28px, 3vw, 40px)',
                                background: 'var(--pb-ink)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 999,
                                fontSize: 'clamp(15px, 1.3vw, 18px)',
                                fontWeight: 600,
                                cursor: processing ? 'wait' : 'pointer',
                                opacity: processing ? 0.7 : 1,
                                boxShadow:
                                    '0 1px 2px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.12)',
                            }}
                        >
                            {processing
                                ? 'Memproses…'
                                : 'Lanjut, atur jumlah cetak'}
                            <span
                                style={{
                                    display: 'inline-flex',
                                    width: 32,
                                    height: 32,
                                    borderRadius: 999,
                                    background: 'var(--pb-primary)',
                                    color: 'var(--pb-ink)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon name="arrow-right" size={16} />
                            </span>
                        </button>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}

function FilterablePreview({
    frame,
    photoBySlot,
    cssFilter,
    filterLabel,
    stickers,
    activeSticker,
    onActivateSticker,
    onUpdateSticker,
    onRemoveSticker,
}: {
    frame: NonNullable<Props['frame']>;
    photoBySlot: Map<number, string>;
    cssFilter: string;
    filterLabel: string;
    stickers: Sticker[];
    activeSticker: string | null;
    onActivateSticker: (uid: string | null) => void;
    onUpdateSticker: (uid: string, patch: Partial<Sticker>) => void;
    onRemoveSticker: (uid: string) => void;
}) {
    const size = frame.image_size!;
    const aspectRatio = `${size.width} / ${size.height}`;
    const aspectValue = size.width / size.height;
    const containerRef = useRef<HTMLDivElement | null>(null);

    function startDrag(uid: string, evt: React.PointerEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        onActivateSticker(uid);
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const rect = container.getBoundingClientRect();

        function move(e: PointerEvent) {
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            onUpdateSticker(uid, {
                x: Math.max(0, Math.min(1, x)),
                y: Math.max(0, Math.min(1, y)),
            });
        }

        function up() {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        }

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }

    return (
        <div
            ref={containerRef}
            onClick={() => onActivateSticker(null)}
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: `calc(78vh * ${aspectValue})`,
                background: '#fff',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow:
                    '0 24px 56px rgba(10,10,10,0.18), 0 4px 12px rgba(10,10,10,0.06)',
                aspectRatio,
            }}
        >
            {/* Photos in slot positions — filter applied here only */}
            {frame.slots.map((s) => {
                const url = photoBySlot.get(s.slot_number);
                const left = (s.x / size.width) * 100;
                const top = (s.y / size.height) * 100;
                const w = (s.width / size.width) * 100;
                const h = (s.height / size.height) * 100;

                return (
                    <div
                        key={s.slot_number}
                        style={{
                            position: 'absolute',
                            left: `${left}%`,
                            top: `${top}%`,
                            width: `${w}%`,
                            height: `${h}%`,
                            overflow: 'hidden',
                            background: url ? 'transparent' : '#F4F4F5',
                        }}
                    >
                        {url ? (
                            <img
                                src={url}
                                alt={`Foto ${s.slot_number}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                    filter: cssFilter,
                                    transition: 'filter 220ms ease',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    color: 'var(--pb-text-faint)',
                                }}
                            >
                                #{s.slot_number}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Frame overlay — NO filter, tetap warna original */}
            {frame.thumbnail_url && (
                <img
                    src={frame.thumbnail_url}
                    alt={frame.name}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Stickers layer */}
            {stickers.map((s) => {
                const isActive = s.uid === activeSticker;

                return (
                    <div
                        key={s.uid}
                        onPointerDown={(e) => startDrag(s.uid, e)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onActivateSticker(s.uid);
                        }}
                        style={{
                            position: 'absolute',
                            left: `${s.x * 100}%`,
                            top: `${s.y * 100}%`,
                            width: s.size,
                            height: s.size,
                            transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
                            cursor: 'grab',
                            touchAction: 'none',
                            zIndex: isActive ? 5 : 4,
                            outline: isActive
                                ? '2px dashed var(--pb-ink)'
                                : 'none',
                            outlineOffset: 4,
                            borderRadius: 8,
                        }}
                    >
                        <StickerGlyph id={s.id} />
                        {isActive && (
                            <StickerToolbar
                                sticker={s}
                                onUpdate={(patch) =>
                                    onUpdateSticker(s.uid, patch)
                                }
                                onRemove={() => onRemoveSticker(s.uid)}
                            />
                        )}
                    </div>
                );
            })}

            {/* Filter badge */}
            <div
                style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(10,10,10,0.7)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                }}
            >
                Filter · {filterLabel}
            </div>
        </div>
    );
}

function StickerGlyph({ id }: { id: string }) {
    const common = {
        width: '100%',
        height: '100%',
        style: {
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
            pointerEvents: 'none' as const,
        },
    };

    switch (id) {
        case 'heart':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M50 88 L18 56 C8 46 8 30 18 20 C28 10 44 14 50 26 C56 14 72 10 82 20 C92 30 92 46 82 56 Z"
                        fill="#FB7185"
                    />
                </svg>
            );
        case 'star':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <polygon
                        points="50,8 62,38 94,40 68,60 78,92 50,72 22,92 32,60 6,40 38,38"
                        fill="#F5FA0C"
                        stroke="#0A0A0A"
                        strokeWidth="3"
                    />
                </svg>
            );
        case 'sparkle':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <polygon
                        points="50,6 58,42 94,50 58,58 50,94 42,58 6,50 42,42"
                        fill="#F5FA0C"
                    />
                </svg>
            );
        case 'lightning':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <polygon
                        points="58,6 22,54 50,54 38,94 80,42 52,42 64,6"
                        fill="#F5FA0C"
                        stroke="#0A0A0A"
                        strokeWidth="3"
                    />
                </svg>
            );
        case 'flower':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    {[0, 72, 144, 216, 288].map((deg) => (
                        <circle
                            key={deg}
                            cx="50"
                            cy="28"
                            r="18"
                            fill="#FB7185"
                            transform={`rotate(${deg} 50 50)`}
                        />
                    ))}
                    <circle cx="50" cy="50" r="12" fill="#F5FA0C" />
                </svg>
            );
        case 'diamond':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <polygon points="50,8 92,50 50,92 8,50" fill="#60A5FA" />
                    <polygon
                        points="50,18 70,50 46,56"
                        fill="#fff"
                        opacity="0.7"
                    />
                </svg>
            );
        case 'smile':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <circle cx="50" cy="50" r="42" fill="#F5FA0C" stroke="#0A0A0A" strokeWidth="3" />
                    <circle cx="36" cy="42" r="5" fill="#0A0A0A" />
                    <circle cx="64" cy="42" r="5" fill="#0A0A0A" />
                    <path
                        d="M32 60 Q 50 78 68 60"
                        stroke="#0A0A0A"
                        strokeWidth="5"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'fire':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M50 6 C 56 30 78 36 78 60 C 78 80 64 92 50 92 C 36 92 22 80 22 60 C 22 48 30 42 36 36 C 42 50 50 36 50 22 Z"
                        fill="#FB923C"
                    />
                    <path
                        d="M50 36 C 54 50 64 54 64 68 C 64 78 58 86 50 86 C 42 86 36 78 36 68 C 36 60 44 56 50 50 Z"
                        fill="#EF4444"
                    />
                </svg>
            );
        case 'kiss':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M50 84 L18 52 C10 44 10 32 18 24 C26 16 38 18 42 26 C46 18 58 16 66 24 C74 32 74 44 66 52 Z"
                        fill="#EF4444"
                    />
                    <path
                        d="M70 36 L82 24 C84 22 88 22 90 24 C92 26 92 30 90 32 L78 44 Z"
                        fill="#FB7185"
                    />
                </svg>
            );
        case 'sun':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                        <line
                            key={deg}
                            x1="50"
                            y1="8"
                            x2="50"
                            y2="22"
                            stroke="#FB923C"
                            strokeWidth="5"
                            strokeLinecap="round"
                            transform={`rotate(${deg} 50 50)`}
                        />
                    ))}
                    <circle cx="50" cy="50" r="22" fill="#F5FA0C" />
                </svg>
            );
        case 'cloud':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <ellipse cx="35" cy="55" rx="20" ry="18" fill="#fff" stroke="#0A0A0A" strokeWidth="2" />
                    <ellipse cx="65" cy="55" rx="20" ry="18" fill="#fff" stroke="#0A0A0A" strokeWidth="2" />
                    <ellipse cx="50" cy="42" rx="24" ry="22" fill="#fff" stroke="#0A0A0A" strokeWidth="2" />
                    <rect x="18" y="55" width="64" height="18" fill="#fff" />
                </svg>
            );
        case 'crown':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <polygon
                        points="10,76 10,32 28,50 50,18 72,50 90,32 90,76"
                        fill="#F5FA0C"
                        stroke="#0A0A0A"
                        strokeWidth="3"
                    />
                    <rect x="10" y="68" width="80" height="14" fill="#F5FA0C" stroke="#0A0A0A" strokeWidth="3" />
                    <circle cx="50" cy="68" r="6" fill="#EF4444" />
                </svg>
            );
        case 'music':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M40 14 L78 8 L78 70 C 78 78 70 84 62 84 C 54 84 46 78 46 70 C 46 62 54 56 62 56 C 66 56 70 58 72 60 L72 30 L46 34 L46 78 C 46 86 38 92 30 92 C 22 92 14 86 14 78 C 14 70 22 64 30 64 C 34 64 38 66 40 68 Z"
                        fill="#0A0A0A"
                    />
                </svg>
            );
        case 'butterfly':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <ellipse cx="30" cy="40" rx="22" ry="20" fill="#FB7185" />
                    <ellipse cx="70" cy="40" rx="22" ry="20" fill="#FB7185" />
                    <ellipse cx="32" cy="68" rx="18" ry="16" fill="#A78BFA" />
                    <ellipse cx="68" cy="68" rx="18" ry="16" fill="#A78BFA" />
                    <rect x="48" y="22" width="4" height="60" rx="2" fill="#0A0A0A" />
                    <circle cx="50" cy="20" r="4" fill="#0A0A0A" />
                </svg>
            );
        case 'rainbow':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path d="M10 70 A 40 40 0 0 1 90 70" stroke="#EF4444" strokeWidth="8" fill="none" strokeLinecap="round" />
                    <path d="M18 70 A 32 32 0 0 1 82 70" stroke="#FB923C" strokeWidth="7" fill="none" strokeLinecap="round" />
                    <path d="M25 70 A 25 25 0 0 1 75 70" stroke="#F5FA0C" strokeWidth="7" fill="none" strokeLinecap="round" />
                    <path d="M32 70 A 18 18 0 0 1 68 70" stroke="#86EFAC" strokeWidth="6" fill="none" strokeLinecap="round" />
                    <path d="M39 70 A 11 11 0 0 1 61 70" stroke="#60A5FA" strokeWidth="6" fill="none" strokeLinecap="round" />
                    <ellipse cx="14" cy="78" rx="10" ry="6" fill="#fff" stroke="#0A0A0A" strokeWidth="2" />
                    <ellipse cx="86" cy="78" rx="10" ry="6" fill="#fff" stroke="#0A0A0A" strokeWidth="2" />
                </svg>
            );
        case 'snowflake':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    {[0, 60, 120].map((deg) => (
                        <g key={deg} transform={`rotate(${deg} 50 50)`}>
                            <line x1="50" y1="8" x2="50" y2="92" stroke="#60A5FA" strokeWidth="5" strokeLinecap="round" />
                            <line x1="50" y1="20" x2="40" y2="14" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
                            <line x1="50" y1="20" x2="60" y2="14" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
                            <line x1="50" y1="80" x2="40" y2="86" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
                            <line x1="50" y1="80" x2="60" y2="86" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
                        </g>
                    ))}
                    <circle cx="50" cy="50" r="6" fill="#60A5FA" />
                </svg>
            );
        case 'party':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <polygon points="10,90 60,40 50,30 0,80" fill="#F5FA0C" stroke="#0A0A0A" strokeWidth="3" />
                    <circle cx="68" cy="20" r="4" fill="#FB7185" />
                    <circle cx="82" cy="34" r="4" fill="#60A5FA" />
                    <circle cx="78" cy="58" r="4" fill="#86EFAC" />
                    <circle cx="55" cy="14" r="3" fill="#A78BFA" />
                    <circle cx="92" cy="48" r="3" fill="#FB923C" />
                </svg>
            );
        case 'camera':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <rect x="10" y="28" width="80" height="56" rx="6" fill="#0A0A0A" />
                    <rect x="36" y="20" width="28" height="14" rx="3" fill="#0A0A0A" />
                    <circle cx="50" cy="56" r="18" fill="#1f1f1f" stroke="#fff" strokeWidth="3" />
                    <circle cx="50" cy="56" r="10" fill="#F5FA0C" />
                    <circle cx="78" cy="40" r="3" fill="#EF4444" />
                </svg>
            );
        case 'balloon':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <ellipse cx="50" cy="40" rx="28" ry="34" fill="#FB7185" />
                    <ellipse cx="42" cy="32" rx="6" ry="10" fill="#fff" opacity="0.5" />
                    <polygon points="46,72 54,72 50,80" fill="#FB7185" />
                    <path d="M50 80 Q 56 88 48 96" stroke="#0A0A0A" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
            );
        case 'peace':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <circle cx="50" cy="50" r="42" fill="#fff" stroke="#0A0A0A" strokeWidth="4" />
                    <line x1="50" y1="8" x2="50" y2="92" stroke="#0A0A0A" strokeWidth="4" />
                    <line x1="50" y1="50" x2="22" y2="78" stroke="#0A0A0A" strokeWidth="4" />
                    <line x1="50" y1="50" x2="78" y2="78" stroke="#0A0A0A" strokeWidth="4" />
                </svg>
            );
        case 'ghost':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M50 8 C 28 8 16 24 16 46 L 16 84 L 28 76 L 40 86 L 50 78 L 60 86 L 72 76 L 84 84 L 84 46 C 84 24 72 8 50 8 Z"
                        fill="#fff"
                        stroke="#0A0A0A"
                        strokeWidth="3"
                    />
                    <ellipse cx="38" cy="42" rx="5" ry="8" fill="#0A0A0A" />
                    <ellipse cx="62" cy="42" rx="5" ry="8" fill="#0A0A0A" />
                    <ellipse cx="50" cy="62" rx="6" ry="4" fill="#0A0A0A" />
                </svg>
            );
        case 'lollipop':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <circle cx="50" cy="36" r="28" fill="#FB7185" />
                    <path d="M50 14 Q 64 22 50 36 Q 36 50 50 58 Q 64 50 50 36" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <rect x="46" y="62" width="8" height="32" rx="2" fill="#fff" stroke="#0A0A0A" strokeWidth="2" />
                </svg>
            );
        case 'icecream':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <circle cx="50" cy="34" r="20" fill="#FB7185" />
                    <circle cx="34" cy="40" r="14" fill="#fff" />
                    <circle cx="64" cy="42" r="13" fill="#86EFAC" />
                    <polygon points="22,52 78,52 50,94" fill="#FB923C" stroke="#0A0A0A" strokeWidth="2" />
                    <line x1="30" y1="62" x2="44" y2="80" stroke="#0A0A0A" strokeWidth="1.5" />
                    <line x1="50" y1="56" x2="50" y2="86" stroke="#0A0A0A" strokeWidth="1.5" />
                    <line x1="70" y1="62" x2="56" y2="80" stroke="#0A0A0A" strokeWidth="1.5" />
                </svg>
            );
        case 'moon':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M68 14 A 36 36 0 1 0 68 86 A 28 28 0 1 1 68 14 Z"
                        fill="#F5FA0C"
                        stroke="#0A0A0A"
                        strokeWidth="3"
                    />
                </svg>
            );
        case 'pin':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path d="M50 10 C 32 10 20 24 20 42 C 20 60 50 92 50 92 C 50 92 80 60 80 42 C 80 24 68 10 50 10 Z" fill="#EF4444" stroke="#0A0A0A" strokeWidth="3" />
                    <circle cx="50" cy="42" r="10" fill="#fff" />
                </svg>
            );
        case 'cherry':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <circle cx="34" cy="70" r="18" fill="#EF4444" stroke="#0A0A0A" strokeWidth="2" />
                    <circle cx="68" cy="74" r="16" fill="#EF4444" stroke="#0A0A0A" strokeWidth="2" />
                    <ellipse cx="38" cy="62" rx="4" ry="3" fill="#fff" opacity="0.6" />
                    <path d="M34 52 Q 50 28 78 18" stroke="#86EFAC" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M68 58 Q 60 36 78 18" stroke="#86EFAC" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M68 18 Q 78 8 88 22 Q 80 18 70 24 Z" fill="#86EFAC" />
                </svg>
            );
        case 'leaf':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M14 86 Q 14 30 86 14 Q 86 70 30 86 Z"
                        fill="#86EFAC"
                        stroke="#0A0A0A"
                        strokeWidth="3"
                    />
                    <path d="M20 80 Q 50 50 80 20" stroke="#0A0A0A" strokeWidth="2" fill="none" />
                </svg>
            );
        case 'thumbsup':
            return (
                <svg viewBox="0 0 100 100" {...common}>
                    <path
                        d="M30 86 L30 46 L42 30 L52 8 C 60 6 62 14 60 22 L56 38 L78 38 C 86 38 90 44 88 52 L82 78 C 80 84 76 86 70 86 Z"
                        fill="#F5FA0C"
                        stroke="#0A0A0A"
                        strokeWidth="3"
                    />
                    <rect x="14" y="46" width="16" height="42" rx="3" fill="#F5FA0C" stroke="#0A0A0A" strokeWidth="3" />
                </svg>
            );
        default:
            return null;
    }
}

function ActiveStickerControls({
    sticker,
    onUpdate,
}: {
    sticker: Sticker;
    onUpdate: (patch: Partial<Sticker>) => void;
}) {
    return (
        <div
            style={{
                marginBottom: 14,
                padding: 12,
                background: '#fff',
                border: '1px solid var(--pb-border)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--pb-text-faint)',
                    }}
                >
                    Ukuran
                </span>
                <div style={{ display: 'inline-flex', gap: 4 }}>
                    {STICKER_SIZE_PRESETS.map((p) => {
                        const isActive =
                            Math.abs(sticker.size - p.value) <= 8;

                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() =>
                                    onUpdate({ size: p.value })
                                }
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    border: isActive
                                        ? '2px solid var(--pb-ink)'
                                        : '1px solid var(--pb-border)',
                                    background: isActive
                                        ? 'var(--pb-primary)'
                                        : '#fff',
                                    color: 'var(--pb-ink)',
                                    fontFamily: 'inherit',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                }}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                style={{
                    fontSize: 11,
                    color: 'var(--pb-text-faint)',
                }}
            >
                ·
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--pb-text-faint)',
                    }}
                >
                    Putar
                </span>
                <button
                    type="button"
                    onClick={() =>
                        onUpdate({ rotate: sticker.rotate - 15 })
                    }
                    style={ROT_BTN}
                    title="Putar kiri"
                >
                    ↺
                </button>
                <button
                    type="button"
                    onClick={() => onUpdate({ rotate: 0 })}
                    style={{
                        ...ROT_BTN,
                        background:
                            sticker.rotate === 0
                                ? 'var(--pb-primary)'
                                : '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                    }}
                    title="Reset"
                >
                    0°
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onUpdate({ rotate: sticker.rotate + 15 })
                    }
                    style={ROT_BTN}
                    title="Putar kanan"
                >
                    ↻
                </button>
            </div>
        </div>
    );
}

const ROT_BTN: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid var(--pb-border)',
    background: '#fff',
    color: 'var(--pb-ink)',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

function StickerToolbar({
    sticker,
    onUpdate,
    onRemove,
}: {
    sticker: Sticker;
    onUpdate: (patch: Partial<Sticker>) => void;
    onRemove: () => void;
}) {
    function bump(delta: number) {
        const next = Math.max(36, Math.min(260, sticker.size + delta));
        onUpdate({ size: next });
    }

    function rot(delta: number) {
        onUpdate({ rotate: sticker.rotate + delta });
    }

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
                position: 'absolute',
                top: -42,
                left: '50%',
                transform: 'translateX(-50%) rotate(0deg)',
                display: 'inline-flex',
                gap: 2,
                padding: 4,
                background: 'var(--pb-ink)',
                borderRadius: 999,
                boxShadow:
                    '0 8px 24px rgba(10,10,10,0.32), 0 2px 6px rgba(10,10,10,0.16)',
                whiteSpace: 'nowrap',
                touchAction: 'none',
                cursor: 'default',
            }}
        >
            <ToolBtn label="Kecilkan" onClick={() => bump(-20)}>
                −
            </ToolBtn>
            <ToolBtn label="Besarkan" onClick={() => bump(20)}>
                +
            </ToolBtn>
            <ToolDivider />
            <ToolBtn label="Rotate kiri" onClick={() => rot(-15)}>
                ↺
            </ToolBtn>
            <ToolBtn label="Rotate kanan" onClick={() => rot(15)}>
                ↻
            </ToolBtn>
            <ToolDivider />
            <ToolBtn label="Hapus" onClick={onRemove} danger>
                ×
            </ToolBtn>
        </div>
    );
}

function ToolBtn({
    children,
    onClick,
    label,
    danger,
}: {
    children: React.ReactNode;
    onClick: () => void;
    label: string;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: 'none',
                background: danger ? '#EF4444' : 'transparent',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => {
                if (!danger) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                }
            }}
            onMouseLeave={(e) => {
                if (!danger) {
                    e.currentTarget.style.background = 'transparent';
                }
            }}
        >
            {children}
        </button>
    );
}

function ToolDivider() {
    return (
        <span
            aria-hidden
            style={{
                width: 1,
                background: 'rgba(255,255,255,0.18)',
                margin: '4px 2px',
            }}
        />
    );
}

function StickerPalette({ onPick }: { onPick: (id: string) => void }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                gap: 10,
                maxHeight: '42vh',
                overflowY: 'auto',
                paddingRight: 4,
                marginRight: -4,
            }}
        >
            {STICKER_LIBRARY.map((s) => (
                <button
                    key={s.id}
                    type="button"
                    onClick={() => onPick(s.id)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: 10,
                        background: '#fff',
                        border: '1px solid var(--pb-border)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition:
                            'transform 120ms ease, border 120ms ease, box-shadow 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'var(--pb-ink)';
                        e.currentTarget.style.boxShadow =
                            '0 8px 20px rgba(10,10,10,0.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor =
                            'var(--pb-border)';
                        e.currentTarget.style.boxShadow = '';
                    }}
                    title={s.label}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <StickerGlyph id={s.id} />
                    </div>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'var(--pb-text-muted)',
                        }}
                    >
                        {s.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
