import { Head, router } from '@inertiajs/react';
import { confirmDialog } from '@/components/philobooth/confirm-dialog';
import { Icon } from '@/components/philobooth/icon';
import {
    KioskFooter,
    KioskHeader,
} from '@/components/philobooth/kiosk-chrome';

type FrameSlot = {
    slot_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

type Props = {
    session: {
        session_code: string;
    };
    photos: Array<{ slot_number: number; url: string }>;
    composite_url?: string | null;
    frame: {
        id: number;
        name: string;
        photo_slots: number;
        thumbnail_url: string | null;
        image_size: { width: number; height: number } | null;
        slots: FrameSlot[];
    } | null;
};

export default function KioskPreview({
    session,
    photos,
    frame,
    composite_url,
}: Props) {
    const photoBySlot = new Map(photos.map((p) => [p.slot_number, p.url]));

    function goNext() {
        router.visit('/kiosk/filter');
    }

    async function retake() {
        const ok = await confirmDialog({
            title: 'Ambil ulang semua foto?',
            description:
                'Semua foto yang sudah kamu ambil akan dihapus dan kamu akan kembali ke layar capture.',
            confirmText: 'Ya, ambil ulang',
            cancelText: 'Tidak',
            tone: 'warning',
            icon: 'camera',
        });

        if (!ok) {
            return;
        }

        router.visit('/kiosk/capture');
    }

    if (!frame) {
        return (
            <div
                className="pb-root"
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FAFAF7',
                }}
            >
                <p>Frame belum dipilih.</p>
            </div>
        );
    }

    return (
        <>
            <Head title="Preview foto — Philobooth" />
            <div
                className="pb-root"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#FAFAF7',
                }}
            >
                {/* Subtle dot grid bg */}
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'radial-gradient(rgba(10,10,10,0.06) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        opacity: 0.5,
                        pointerEvents: 'none',
                    }}
                />

                <KioskHeader step={6} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        padding: 'clamp(20px, 3vw, 40px)',
                        display: 'grid',
                        gridTemplateColumns:
                            'minmax(0, 1fr) minmax(0, 1.1fr)',
                        gap: 'clamp(24px, 4vw, 56px)',
                        alignItems: 'center',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — Copy + actions */}
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
                                marginBottom: 'clamp(16px, 2vw, 24px)',
                            }}
                        >
                            <span
                                style={{
                                    width: 28,
                                    height: 1,
                                    background: 'var(--pb-text-faint)',
                                }}
                            />
                            Langkah 6 · Preview
                        </div>

                        <h1
                            style={{
                                fontSize: 'clamp(36px, 5.5vw, 72px)',
                                fontWeight: 700,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.02,
                                margin: 0,
                                color: 'var(--pb-ink)',
                            }}
                        >
                            Hasilmu{' '}
                            <em
                                style={{
                                    fontStyle: 'italic',
                                    fontWeight: 700,
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                kece.
                                <svg
                                    aria-hidden
                                    viewBox="0 0 200 12"
                                    preserveAspectRatio="none"
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        bottom: '-0.1em',
                                        width: '100%',
                                        height: '0.18em',
                                        color: 'var(--pb-primary)',
                                    }}
                                >
                                    <path
                                        d="M2 8 Q 50 2, 100 7 T 198 6"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </em>
                        </h1>

                        <p
                            style={{
                                fontSize: 'clamp(15px, 1.3vw, 19px)',
                                color: 'var(--pb-text-muted)',
                                marginTop: 'clamp(16px, 2vw, 24px)',
                                marginBottom: 'clamp(28px, 3.5vw, 40px)',
                                lineHeight: 1.5,
                                maxWidth: 520,
                            }}
                        >
                            Cek dulu hasilnya. Kalau mau ada yang ditukar, kamu
                            bisa ambil ulang semua foto.
                        </p>

                        {/* Stat strip */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(3, minmax(0, 1fr))',
                                gap: 'clamp(8px, 1.2vw, 16px)',
                                marginBottom: 'clamp(28px, 3.5vw, 40px)',
                            }}
                        >
                            <Stat label="Frame" value={frame.name} />
                            <Stat
                                label="Foto"
                                value={`${photos.length} / ${frame.photo_slots}`}
                            />
                            <Stat label="Order ID" value={session.session_code} mono />
                        </div>

                        {/* Actions */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                type="button"
                                onClick={goNext}
                                style={{
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
                                    cursor: 'pointer',
                                    boxShadow:
                                        '0 1px 2px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.12)',
                                    transition:
                                        'transform 160ms ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform =
                                        'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                        'translateY(0)';
                                }}
                            >
                                Lanjut, kasih filter
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

                            <button
                                type="button"
                                onClick={retake}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding:
                                        'clamp(14px, 1.8vw, 20px) clamp(20px, 2.4vw, 28px)',
                                    background: 'transparent',
                                    border: '1.5px solid var(--pb-border)',
                                    color: 'var(--pb-ink)',
                                    borderRadius: 999,
                                    fontSize: 'clamp(14px, 1.2vw, 16px)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <Icon name="camera" size={16} />
                                Ambil ulang
                            </button>
                        </div>
                    </div>

                    {/* RIGHT — Composite preview */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: 0,
                        }}
                    >
                        {composite_url ? (
                            <CompositeImage
                                src={composite_url}
                                alt={frame.name}
                                aspect={
                                    frame.image_size
                                        ? `${frame.image_size.width} / ${frame.image_size.height}`
                                        : '3 / 4'
                                }
                            />
                        ) : (
                            <FrameComposite
                                frame={frame}
                                photoBySlot={photoBySlot}
                            />
                        )}
                    </div>
                </main>

                <KioskFooter
                    back="← Ambil ulang"
                    next="Lanjut, kasih filter →"
                    nextIcon="arrow-right"
                    onNext={goNext}
                    onBack={retake}
                />
            </div>
        </>
    );
}

function Stat({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div
            style={{
                padding: 'clamp(12px, 1.4vw, 16px)',
                background: '#fff',
                border: '1px solid var(--pb-border)',
                borderRadius: 12,
                minWidth: 0,
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--pb-text-faint)',
                    marginBottom: 4,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 'clamp(13px, 1.1vw, 15px)',
                    fontWeight: 700,
                    color: 'var(--pb-ink)',
                    fontFamily: mono ? 'monospace' : 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
                title={value}
            >
                {value}
            </div>
        </div>
    );
}

function CompositeImage({
    src,
    alt,
    aspect,
}: {
    src: string;
    alt: string;
    aspect: string;
}) {
    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: 'min(480px, 100%)',
                maxHeight: '80vh',
                background: '#fff',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow:
                    '0 24px 56px rgba(10,10,10,0.18), 0 4px 12px rgba(10,10,10,0.06)',
                aspectRatio: aspect,
            }}
        >
            <img
                src={src}
                alt={alt}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'contain',
                }}
            />
        </div>
    );
}

function FrameComposite({
    frame,
    photoBySlot,
}: {
    frame: NonNullable<Props['frame']>;
    photoBySlot: Map<number, string>;
}) {
    const size = frame.image_size;
    const aspectRatio = size
        ? `${size.width} / ${size.height}`
        : '3 / 4';

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: 'min(480px, 100%)',
                maxHeight: '80vh',
                background: '#fff',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow:
                    '0 24px 56px rgba(10,10,10,0.18), 0 4px 12px rgba(10,10,10,0.06)',
                aspectRatio,
            }}
        >
            {/* Photos in slot positions (under the frame overlay) */}
            {frame.slots.map((s) => {
                if (!size) {
return null;
}

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
                                    fontWeight: 700,
                                    color: 'var(--pb-text-faint)',
                                }}
                            >
                                #{s.slot_number}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Frame overlay */}
            {frame.thumbnail_url && (
                <img
                    src={frame.thumbnail_url}
                    alt={frame.name}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
}
