import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { confirmDialog } from '@/components/philobooth/confirm-dialog';
import { Icon } from '@/components/philobooth/icon';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import {
    KioskFooter,
    KioskHeader,
} from '@/components/philobooth/kiosk-chrome';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type FrameSlot = {
    slot_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

type Props = {
    session?: {
        session_code: string;
        frame_id: number | null;
    };
    frame: {
        id: number;
        name: string;
        photo_slots: number;
        thumbnail_url: string | null;
        image_size: { width: number; height: number } | null;
        slots: FrameSlot[];
    } | null;
};

type Slot = { url: string; file: File } | null;

const COUNTDOWN_FROM = 3;
const DELAY_BETWEEN_SHOTS = 1200; // ms — kasih waktu user reset pose

export default function KioskCapture({ frame }: Props) {
    const totalSlots = frame?.photo_slots ?? 0;
    const [slots, setSlots] = useState<Slot[]>(() =>
        Array(totalSlots).fill(null),
    );
    const [activeSlot, setActiveSlot] = useState(0);
    const [cameraState, setCameraState] = useState<
        'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable'
    >('idle');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [flash, setFlash] = useState(false);
    const [autoMode, setAutoMode] = useState(true);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fallbackInputRef = useRef<HTMLInputElement | null>(null);

    const { setData, post, processing } = useForm<{ photos: File[] }>({
        photos: [],
    });

    // --- Camera lifecycle ---
    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
            slots.forEach((s) => s && URL.revokeObjectURL(s.url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function startCamera() {
        if (
            typeof navigator === 'undefined' ||
            !navigator.mediaDevices?.getUserMedia
        ) {
            setCameraState('unavailable');

            return;
        }

        setCameraState('requesting');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }

            setCameraState('ready');
        } catch (err) {
            console.warn('Camera access denied:', err);
            setCameraState('denied');
        }
    }

    function stopCamera() {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }

    // --- Capture logic ---
    function startCountdown() {
        if (cameraState !== 'ready' || countdown !== null) {
return;
}

        if (activeSlot >= totalSlots) {
return;
}

        setCountdown(COUNTDOWN_FROM);
    }

    useEffect(() => {
        if (countdown === null) {
return;
}

        if (countdown === 0) {
            takeShot();

            return;
        }

        const t = setTimeout(() => {
            setCountdown((c) => (c === null ? null : c - 1));
        }, 1000);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    function takeShot() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            setCountdown(null);

            return;
        }

        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setCountdown(null);

            return;
        }

        // Mirror horizontally (selfie style)
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setCountdown(null);

                    return;
                }

                const file = new File(
                    [blob],
                    `slot-${activeSlot + 1}.jpg`,
                    { type: 'image/jpeg' },
                );
                const url = URL.createObjectURL(blob);

                const next = [...slots];

                if (next[activeSlot]) {
                    URL.revokeObjectURL(next[activeSlot]!.url);
                }

                next[activeSlot] = { url, file };
                setSlots(next);
                syncForm(next);

                // Flash effect
                setFlash(true);
                setTimeout(() => setFlash(false), 200);

                setCountdown(null);

                // Auto-advance to next slot
                const nextIdx = activeSlot + 1;

                if (nextIdx < totalSlots) {
                    setActiveSlot(nextIdx);

                    if (autoMode) {
                        setTimeout(() => {
                            setCountdown(COUNTDOWN_FROM);
                        }, DELAY_BETWEEN_SHOTS);
                    }
                }
            },
            'image/jpeg',
            0.92,
        );
    }

    function syncForm(next: Slot[]) {
        setData(
            'photos',
            next
                .filter((s): s is NonNullable<Slot> => s !== null)
                .map((s) => s.file),
        );
    }

    function retakeSlot(idx: number) {
        const next = [...slots];

        if (next[idx]) {
            URL.revokeObjectURL(next[idx]!.url);
        }

        next[idx] = null;
        setSlots(next);
        syncForm(next);
        setActiveSlot(idx);
    }

    function uploadFallback(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []).slice(0, totalSlots);
        const next: Slot[] = Array(totalSlots).fill(null);

        files.forEach((file, i) => {
            next[i] = { url: URL.createObjectURL(file), file };
        });

        slots.forEach((s) => s && URL.revokeObjectURL(s.url));
        setSlots(next);
        syncForm(next);
        e.target.value = '';
    }

    function submit() {
        post('/kiosk/photos');
    }

    const filledCount = slots.filter(Boolean).length;
    const allFilled = filledCount === totalSlots && totalSlots > 0;

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
                <div style={{ textAlign: 'center' }}>
                    <p>Frame belum dipilih. Kembali ke pemilihan frame.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title="Ambil foto — Kiosk" />
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
                <KioskHeader step={5} totalSteps={8} />

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <main
                    style={{
                        flex: 1,
                        padding: 'clamp(20px, 3vw, 40px)',
                        display: 'grid',
                        gridTemplateColumns:
                            'minmax(0, 1.4fr) minmax(0, 1fr)',
                        gap: 'clamp(20px, 3vw, 32px)',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — Live camera */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                background: '#0A0A0A',
                                borderRadius: 20,
                                overflow: 'hidden',
                                aspectRatio: '16 / 9',
                                boxShadow:
                                    '0 12px 32px rgba(10,10,10,0.18), 0 2px 6px rgba(10,10,10,0.06)',
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scaleX(-1)',
                                    background: '#0A0A0A',
                                }}
                            />

                            {/* Overlay states */}
                            {cameraState === 'requesting' && (
                                <CenterOverlay>
                                    <Icon name="camera" size={36} color="#fff" />
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontWeight: 600,
                                            marginTop: 8,
                                        }}
                                    >
                                        Meminta izin kamera…
                                    </div>
                                </CenterOverlay>
                            )}
                            {cameraState === 'denied' && (
                                <CenterOverlay>
                                    <Icon name="camera" size={36} color="#FCA5A5" />
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontWeight: 600,
                                            marginTop: 8,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Akses kamera ditolak.
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: 'rgba(255,255,255,0.7)',
                                                marginTop: 4,
                                                fontWeight: 400,
                                            }}
                                        >
                                            Aktifkan di address bar atau pakai
                                            tombol upload di bawah.
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        style={{
                                            marginTop: 16,
                                            padding: '10px 18px',
                                            background: 'var(--pb-primary)',
                                            color: '#0A0A0A',
                                            border: 'none',
                                            borderRadius: 8,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Coba lagi
                                    </button>
                                </CenterOverlay>
                            )}
                            {cameraState === 'unavailable' && (
                                <CenterOverlay>
                                    <Icon name="image" size={36} color="#fff" />
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontWeight: 600,
                                            marginTop: 8,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Kamera tidak tersedia di device ini.
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: 'rgba(255,255,255,0.7)',
                                                marginTop: 4,
                                                fontWeight: 400,
                                            }}
                                        >
                                            Gunakan tombol upload manual.
                                        </div>
                                    </div>
                                </CenterOverlay>
                            )}

                            {/* Countdown overlay */}
                            {countdown !== null && countdown > 0 && (
                                <CenterOverlay style={{ background: 'transparent' }}>
                                    <div
                                        key={countdown}
                                        style={{
                                            width: 200,
                                            height: 200,
                                            borderRadius: '50%',
                                            background:
                                                'rgba(245,250,12,0.92)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 120,
                                            fontWeight: 800,
                                            color: '#0A0A0A',
                                            boxShadow:
                                                '0 0 0 16px rgba(245,250,12,0.16), 0 12px 36px rgba(245,250,12,0.32)',
                                            animation:
                                                'pbCountdownPulse 1s ease-out',
                                        }}
                                    >
                                        {countdown}
                                    </div>
                                </CenterOverlay>
                            )}

                            {/* Flash effect on capture */}
                            {flash && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: '#fff',
                                        opacity: 0.85,
                                        pointerEvents: 'none',
                                        animation:
                                            'pbFlashFade 200ms ease-out forwards',
                                    }}
                                />
                            )}

                            {/* Slot badge */}
                            {cameraState === 'ready' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 16,
                                        left: 16,
                                        padding: '8px 14px',
                                        background: 'rgba(10,10,10,0.65)',
                                        backdropFilter: 'blur(8px)',
                                        color: '#fff',
                                        borderRadius: 999,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 8,
                                            height: 8,
                                            background: '#EF4444',
                                            borderRadius: 999,
                                            animation:
                                                'pbRecBlink 1.4s ease-in-out infinite',
                                        }}
                                    />
                                    LIVE · Slot {activeSlot + 1} / {totalSlots}
                                </div>
                            )}
                        </div>

                        {/* Big shoot button + auto toggle */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                type="button"
                                onClick={startCountdown}
                                disabled={
                                    cameraState !== 'ready' ||
                                    countdown !== null ||
                                    allFilled
                                }
                                style={{
                                    flex: 1,
                                    minWidth: 220,
                                    padding: '18px 28px',
                                    background: allFilled
                                        ? '#22C55E'
                                        : 'var(--pb-primary)',
                                    color: '#0A0A0A',
                                    border: 'none',
                                    borderRadius: 16,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    cursor:
                                        cameraState === 'ready' &&
                                        countdown === null &&
                                        !allFilled
                                            ? 'pointer'
                                            : 'not-allowed',
                                    opacity:
                                        cameraState === 'ready' &&
                                        !allFilled
                                            ? 1
                                            : 0.55,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 12,
                                    boxShadow:
                                        '0 8px 24px rgba(245,250,12,0.32)',
                                    transition: 'transform 120ms ease',
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform =
                                        'scale(0.98)';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform =
                                        'scale(1)';
                                }}
                            >
                                <Icon name="camera" size={22} />
                                {allFilled
                                    ? 'Semua foto siap'
                                    : countdown !== null
                                      ? `Bersiap… ${countdown}`
                                      : `Ambil foto slot ${activeSlot + 1}`}
                            </button>

                            <label
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 14px',
                                    background: '#fff',
                                    border: '1px solid var(--pb-border)',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                                title="Lanjut otomatis ke slot berikutnya setelah foto diambil"
                            >
                                <input
                                    type="checkbox"
                                    checked={autoMode}
                                    onChange={(e) =>
                                        setAutoMode(e.target.checked)
                                    }
                                />
                                Auto-lanjut
                            </label>

                            {(cameraState === 'denied' ||
                                cameraState === 'unavailable') && (
                                <>
                                    <input
                                        ref={fallbackInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={uploadFallback}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fallbackInputRef.current?.click()
                                        }
                                        style={{
                                            padding: '12px 18px',
                                            background: '#fff',
                                            border: '1px solid var(--pb-border)',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Icon name="image" size={16} /> Upload
                                        manual
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — Live frame preview composite */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                            minWidth: 0,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'var(--pb-text-faint)',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    marginBottom: 4,
                                }}
                            >
                                Preview frame · {frame.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    color: 'var(--pb-ink)',
                                }}
                            >
                                {filledCount}/{totalSlots} foto siap
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div
                            style={{
                                height: 6,
                                borderRadius: 999,
                                background: 'rgba(10,10,10,0.08)',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${(filledCount / Math.max(1, totalSlots)) * 100}%`,
                                    height: '100%',
                                    background: allFilled
                                        ? '#22C55E'
                                        : 'var(--pb-primary)',
                                    transition:
                                        'width 280ms ease, background 200ms ease',
                                }}
                            />
                        </div>

                        <FramePreview
                            frame={frame}
                            slots={slots}
                            activeSlot={activeSlot}
                            onSlotClick={(idx) => {
                                if (slots[idx]) {
                                    retakeSlot(idx);
                                } else {
                                    setActiveSlot(idx);
                                }
                            }}
                        />

                        <div
                            style={{
                                fontSize: 12,
                                color: 'var(--pb-text-faint)',
                                lineHeight: 1.45,
                                textAlign: 'center',
                            }}
                        >
                            Klik slot terisi untuk{' '}
                            <strong style={{ color: 'var(--pb-ink)' }}>
                                retake
                            </strong>{' '}
                            ·{' '}
                            {totalSlots - filledCount > 0
                                ? `${totalSlots - filledCount} foto lagi`
                                : 'Semua siap'}
                        </div>
                    </div>
                </main>

                <KioskFooter
                    back="← Ganti frame"
                    next={
                        processing
                            ? 'Mengupload…'
                            : allFilled
                              ? 'Lanjut ke preview →'
                              : ''
                    }
                    nextIcon="arrow-right"
                    onBack={async () => {
                        if (filledCount > 0) {
                            const ok = await confirmDialog({
                                title: 'Ganti frame?',
                                description:
                                    'Foto yang sudah kamu ambil akan dihapus saat kamu pilih frame baru.',
                                confirmText: 'Ya, ganti frame',
                                cancelText: 'Batal',
                                tone: 'warning',
                                icon: 'frame',
                            });

                            if (!ok) {
                                return;
                            }
                        }

                        router.visit('/kiosk/frame-select');
                    }}
                    onNext={allFilled && !processing ? submit : undefined}
                />

                {/* Inline keyframe styles */}
                <style>{`
                    @keyframes pbCountdownPulse {
                        0% { transform: scale(0.6); opacity: 0; }
                        20% { transform: scale(1.15); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes pbFlashFade {
                        0% { opacity: 0.85; }
                        100% { opacity: 0; }
                    }
                    @keyframes pbRecBlink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                `}</style>
            </KioskScene>
        </>
    );
}

function FramePreview({
    frame,
    slots,
    activeSlot,
    onSlotClick,
}: {
    frame: NonNullable<Props['frame']>;
    slots: Slot[];
    activeSlot: number;
    onSlotClick: (idx: number) => void;
}) {
    const size = frame.image_size;
    const aspectRatio = size
        ? `${size.width} / ${size.height}`
        : '3 / 4';

    // Hitung max width berdasar viewport height supaya aspect ratio konsisten — width follows height.
    const aspectValue = size ? size.width / size.height : 0.75;

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: `calc(70vh * ${aspectValue})`,
                margin: '0 auto',
                background: '#fff',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow:
                    '0 12px 32px rgba(10,10,10,0.12), 0 2px 6px rgba(10,10,10,0.05)',
                aspectRatio,
            }}
        >
            {/* Slots filled first (under the frame overlay) */}
            {frame.slots.map((s, i) => {
                if (!size) {
return null;
}

                const slot = slots[i];
                const isActive = i === activeSlot;

                const left = (s.x / size.width) * 100;
                const top = (s.y / size.height) * 100;
                const w = (s.width / size.width) * 100;
                const h = (s.height / size.height) * 100;

                return (
                    <button
                        key={s.slot_number}
                        type="button"
                        onClick={() => onSlotClick(i)}
                        title={
                            slot
                                ? `Klik untuk retake slot ${s.slot_number}`
                                : `Slot ${s.slot_number}`
                        }
                        style={{
                            position: 'absolute',
                            left: `${left}%`,
                            top: `${top}%`,
                            width: `${w}%`,
                            height: `${h}%`,
                            padding: 0,
                            border: isActive
                                ? '3px solid var(--pb-primary)'
                                : slot
                                  ? 'none'
                                  : '2px dashed rgba(10,10,10,0.3)',
                            background: slot ? 'transparent' : '#F4F4F5',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            boxShadow: isActive
                                ? '0 0 0 4px rgba(245,250,12,0.32)'
                                : undefined,
                            transition:
                                'border 120ms ease, box-shadow 120ms ease',
                        }}
                    >
                        {slot ? (
                            <img
                                src={slot.url}
                                alt={`Slot ${s.slot_number}`}
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
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                    color: isActive
                                        ? 'var(--pb-ink)'
                                        : 'var(--pb-text-faint)',
                                }}
                            >
                                <Icon
                                    name={isActive ? 'camera' : 'plus'}
                                    size={20}
                                />
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    #{s.slot_number}
                                </span>
                            </div>
                        )}
                    </button>
                );
            })}

            {/* Frame overlay (sits on top so the cut-outs reveal photos beneath) */}
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
        </div>
    );
}

function CenterOverlay({
    children,
    style,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(10,10,10,0.55)',
                pointerEvents: 'auto',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
