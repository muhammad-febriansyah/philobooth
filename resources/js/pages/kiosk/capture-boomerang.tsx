import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { confirmDialog } from '@/components/philobooth/confirm-dialog';
import { Icon } from '@/components/philobooth/icon';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import {
    KioskFooter,
    KioskHeader,
} from '@/components/philobooth/kiosk-chrome';
import { KioskScene } from '@/components/philobooth/kiosk-scene';
import { playBeep, playShutter, unlockAudio } from '@/lib/sfx';

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

type Clip = { url: string; blob: Blob } | null;

const COUNTDOWN_FROM = 3;
const RECORD_DURATION_MS = 3000;
const DELAY_BETWEEN_SHOTS = 1200;

function pickMimeType(): string {
    const candidates = [
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
    ];

    for (const t of candidates) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
            return t;
        }
    }

    return 'video/webm';
}

export default function KioskCaptureBoomerang({ frame }: Props) {
    const totalSlots = frame?.photo_slots ?? 0;

    const [clips, setClips] = useState<Clip[]>(() =>
        Array(totalSlots).fill(null),
    );
    const [activeSlot, setActiveSlot] = useState(0);
    const [phase, setPhase] = useState<
        'preview' | 'countdown' | 'recording' | 'compositing' | 'review'
    >('preview');
    const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
    const [recordProgress, setRecordProgress] = useState(0);
    const [compositeProgress, setCompositeProgress] = useState(0);
    const [cameraState, setCameraState] = useState<
        'idle' | 'ready' | 'denied' | 'unavailable'
    >('idle');
    const [autoMode, setAutoMode] = useState(true);
    const [finalUrl, setFinalUrl] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playbackRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const finalBlobRef = useRef<Blob | null>(null);
    const cameraBoxRef = useRef<HTMLDivElement | null>(null);
    const [cameraFs, setCameraFs] = useState(false);

    useEffect(() => {
        const sync = () => {
            setCameraFs(document.fullscreenElement === cameraBoxRef.current);
        };
        document.addEventListener('fullscreenchange', sync);

        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    function toggleCameraFs() {
        if (document.fullscreenElement === cameraBoxRef.current) {
            document.exitFullscreen().catch(() => {});
        } else {
            cameraBoxRef.current?.requestFullscreen().catch(() => {});
        }
    }

    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
            clips.forEach((c) => c && URL.revokeObjectURL(c.url));

            if (finalUrl) {
                URL.revokeObjectURL(finalUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function startCamera() {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setCameraState('unavailable');

            return;
        }

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
            console.error('Camera error', err);
            setCameraState('denied');
        }
    }

    function stopCamera() {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }

    // Re-bind the live stream whenever the <video> element re-mounts (e.g. after
    // leaving the review phase).
    useEffect(() => {
        const v = videoRef.current;

        if (v && streamRef.current && !v.srcObject) {
            v.srcObject = streamRef.current;
            v.play().catch(() => {});
        }
    }, [phase]);

    function startRecording() {
        if (!streamRef.current) {
            return;
        }

        chunksRef.current = [];
        const mimeType = pickMimeType();
        let recorder: MediaRecorder;

        try {
            recorder = new MediaRecorder(streamRef.current, { mimeType });
        } catch (err) {
            console.error('MediaRecorder error', err);
            setError('Browser tidak mendukung perekaman video.');

            return;
        }

        recorderRef.current = recorder;
        const slotIdx = activeSlot;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);

            setClips((prev) => {
                const next = [...prev];

                if (next[slotIdx]) {
                    URL.revokeObjectURL(next[slotIdx]!.url);
                }

                next[slotIdx] = { url, blob };

                return next;
            });

            setRecordProgress(0);

            const nextIdx = slotIdx + 1;

            if (nextIdx < totalSlots) {
                setActiveSlot(nextIdx);
                setPhase('preview');

                if (autoMode) {
                    setTimeout(() => {
                        setCountdown(COUNTDOWN_FROM);
                        setPhase('countdown');
                    }, DELAY_BETWEEN_SHOTS);
                }
            } else {
                setPhase('preview');
            }
        };

        setPhase('recording');
        setRecordProgress(0);
        // Shutter "cekrek" the moment recording starts.
        playShutter();
        recorder.start();

        const startedAt = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startedAt;
            const pct = Math.min(1, elapsed / RECORD_DURATION_MS);
            setRecordProgress(pct);

            if (elapsed < RECORD_DURATION_MS) {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);

        setTimeout(() => {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
        }, RECORD_DURATION_MS);
    }

    function onMulai() {
        if (cameraState !== 'ready' || activeSlot >= totalSlots) {
            return;
        }

        unlockAudio();
        setError(null);
        setCountdown(COUNTDOWN_FROM);
        setPhase('countdown');
    }

    useEffect(() => {
        if (phase !== 'countdown') {
            return;
        }

        if (countdown === 0) {
            startRecording();

            return;
        }

        playBeep(countdown === 1 ? 1100 : 740, 0.1, 0.16);

        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, countdown]);

    function retakeSlot(idx: number) {
        if (phase !== 'preview') {
            return;
        }

        setClips((prev) => {
            const next = [...prev];

            if (next[idx]) {
                URL.revokeObjectURL(next[idx]!.url);
            }

            next[idx] = null;

            return next;
        });
        setActiveSlot(idx);
    }

    async function finalize() {
        if (!frame) {
            return;
        }

        const filled = clips.every((c) => c !== null);

        if (!filled) {
            return;
        }

        setError(null);
        setPhase('compositing');
        setCompositeProgress(0);

        try {
            const blob = await composeBoomerang(frame, clips, (p) =>
                setCompositeProgress(p),
            );
            finalBlobRef.current = blob;
            const url = URL.createObjectURL(blob);
            setFinalUrl(url);
            setPhase('review');
        } catch (err) {
            console.error('Composite error', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Gagal menggabungkan boomerang. Coba ulang.',
            );
            setPhase('preview');
        }
    }

    function retakeAll() {
        clips.forEach((c) => c && URL.revokeObjectURL(c.url));

        if (finalUrl) {
            URL.revokeObjectURL(finalUrl);
        }

        finalBlobRef.current = null;
        setFinalUrl(null);
        setClips(Array(totalSlots).fill(null));
        setActiveSlot(0);
        setRecordProgress(0);
        setPhase('preview');
    }

    function submit() {
        const blob = finalBlobRef.current;

        if (!blob) {
            return;
        }

        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `boomerang.${ext}`, { type: blob.type });

        setProcessing(true);
        const form = new FormData();
        form.append('video', file);

        router.post('/kiosk/video', form, {
            forceFormData: true,
            onFinish: () => setProcessing(false),
            onError: (errs) =>
                setError((errs as { video?: string }).video ?? 'Upload gagal.'),
        });
    }

    const filledCount = useMemo(
        () => clips.filter(Boolean).length,
        [clips],
    );
    const allFilled = filledCount === totalSlots && totalSlots > 0;

    // Warn before refresh/close while recordings (or the composite) only exist
    // in memory.
    useEffect(() => {
        const hasUnsaved =
            (filledCount > 0 || phase === 'review') && !processing;

        if (!hasUnsaved) {
            return;
        }

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);

        return () => window.removeEventListener('beforeunload', handler);
    }, [filledCount, phase, processing]);

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

    const inReview = phase === 'review' && finalUrl;
    const inCompositing = phase === 'compositing';

    return (
        <>
            <Head title="Rekam Boomerang — Philobooth" />
            <KioskScene>
                <Spotlight
                    position="top-right"
                    color="#A78BFA"
                    size={620}
                    opacity={0.32}
                />
                <Spotlight
                    position="bottom-left"
                    color="#F5FA0C"
                    size={520}
                    opacity={0.18}
                    blur={110}
                />
                <KioskHeader step={5} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        padding: 'clamp(20px, 3vw, 40px)',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                        gap: 'clamp(20px, 3vw, 32px)',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — live camera or composite playback */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            minWidth: 0,
                        }}
                    >
                        <div
                            ref={cameraBoxRef}
                            style={{
                                position: 'relative',
                                borderRadius: cameraFs ? 0 : 20,
                                overflow: 'hidden',
                                background: '#000',
                                aspectRatio: cameraFs ? 'auto' : '16 / 9',
                                width: cameraFs ? '100%' : undefined,
                                height: cameraFs ? '100%' : undefined,
                                border: cameraFs ? 'none' : '1px solid var(--pb-border)',
                                boxShadow:
                                    '0 12px 32px rgba(10,10,10,0.18), 0 2px 6px rgba(10,10,10,0.06)',
                            }}
                        >
                            {inReview ? (
                                <video
                                    ref={playbackRef}
                                    src={finalUrl ?? undefined}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        background: '#000',
                                    }}
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)',
                                    }}
                                />
                            )}

                            {/* Status badge */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 14,
                                    left: 14,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 12px',
                                    borderRadius: 999,
                                    background: 'rgba(0,0,0,0.55)',
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 999,
                                        background:
                                            phase === 'recording'
                                                ? '#EF4444'
                                                : phase === 'review'
                                                    ? '#A78BFA'
                                                    : phase === 'compositing'
                                                        ? '#F5FA0C'
                                                        : '#22C55E',
                                        animation:
                                            phase === 'recording' ||
                                            phase === 'compositing'
                                                ? 'pulse 1s infinite'
                                                : 'none',
                                    }}
                                />
                                {phase === 'recording'
                                    ? `Slot ${activeSlot + 1}/${totalSlots} · ${Math.ceil(
                                          (1 - recordProgress) *
                                              (RECORD_DURATION_MS / 1000),
                                      )}s`
                                    : phase === 'review'
                                        ? 'Preview · Loop'
                                        : phase === 'countdown'
                                            ? `Slot ${activeSlot + 1}/${totalSlots} · Bersiap…`
                                            : phase === 'compositing'
                                                ? `Menggabungkan… ${Math.round(compositeProgress * 100)}%`
                                                : allFilled
                                                    ? 'Siap digabungkan'
                                                    : `LIVE · Slot ${activeSlot + 1}/${totalSlots}`}
                            </div>

                            {/* Countdown overlay */}
                            {phase === 'countdown' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.55)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div
                                        key={countdown}
                                        style={{
                                            width: 200,
                                            height: 200,
                                            borderRadius: '50%',
                                            background:
                                                'rgba(167,139,250,0.92)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 120,
                                            fontWeight: 800,
                                            color: '#fff',
                                            boxShadow:
                                                '0 0 0 16px rgba(167,139,250,0.16), 0 12px 36px rgba(167,139,250,0.32)',
                                            animation:
                                                'pbCountdownPulse 1s ease-out',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {countdown === 0 ? '🎬' : countdown}
                                    </div>
                                </div>
                            )}

                            {/* Recording progress */}
                            {phase === 'recording' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 14,
                                        left: 14,
                                        right: 14,
                                        height: 6,
                                        borderRadius: 999,
                                        background: 'rgba(255,255,255,0.18)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${recordProgress * 100}%`,
                                            height: '100%',
                                            background: '#EF4444',
                                            transition: 'width 50ms linear',
                                        }}
                                    />
                                </div>
                            )}

                            {/* Compositing overlay */}
                            {inCompositing && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.7)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 20,
                                    }}
                                >
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontSize: 22,
                                            fontWeight: 700,
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        Menggabungkan boomerang…
                                    </div>
                                    <div
                                        style={{
                                            width: '60%',
                                            maxWidth: 360,
                                            height: 8,
                                            borderRadius: 999,
                                            background:
                                                'rgba(255,255,255,0.18)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${compositeProgress * 100}%`,
                                                height: '100%',
                                                background: 'var(--pb-primary)',
                                                transition:
                                                    'width 120ms linear',
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            color: 'rgba(255,255,255,0.6)',
                                            fontSize: 13,
                                        }}
                                    >
                                        Tahan sebentar, tidak lama kok.
                                    </div>
                                </div>
                            )}

                            {/* Fullscreen toggle */}
                            <button
                                type="button"
                                onClick={toggleCameraFs}
                                title={
                                    cameraFs
                                        ? 'Keluar fullscreen kamera'
                                        : 'Fullscreen kamera'
                                }
                                aria-label={
                                    cameraFs
                                        ? 'Keluar fullscreen kamera'
                                        : 'Fullscreen kamera'
                                }
                                style={{
                                    position: 'absolute',
                                    top: 14,
                                    right: 14,
                                    width: 40,
                                    height: 40,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    border: 'none',
                                    borderRadius: 999,
                                    background: 'rgba(10,10,10,0.65)',
                                    backdropFilter: 'blur(8px)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                <Icon
                                    name={
                                        cameraFs
                                            ? 'fullscreen-exit'
                                            : 'fullscreen'
                                    }
                                    size={18}
                                />
                            </button>

                            {/* Floating frame preview (fullscreen mode) */}
                            {cameraFs && phase !== 'review' && phase !== 'compositing' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: 24,
                                        transform: 'translateY(-50%)',
                                        width: 'clamp(180px, 18vw, 280px)',
                                        padding: 10,
                                        background: 'rgba(10,10,10,0.65)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: 16,
                                        boxShadow:
                                            '0 16px 40px rgba(0,0,0,0.45)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: 'rgba(255,255,255,0.7)',
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Preview · {frame.name}
                                    </div>
                                    <FramePreviewBoomerang
                                        frame={frame}
                                        clips={clips}
                                        activeSlot={activeSlot}
                                        canInteract={phase === 'preview'}
                                        onSlotClick={(idx) => {
                                            if (clips[idx]) {
                                                retakeSlot(idx);
                                            } else {
                                                setActiveSlot(idx);
                                            }
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: 'rgba(255,255,255,0.7)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {filledCount}/{totalSlots} slot siap
                                    </div>
                                </div>
                            )}

                            {/* In-fullscreen controls for boomerang */}
                            {cameraFs && phase !== 'review' && phase !== 'compositing' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 32,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 14,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 6,
                                            pointerEvents: 'auto',
                                        }}
                                    >
                                        {Array.from({
                                            length: totalSlots,
                                        }).map((_, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    width: clips[i]
                                                        ? 10
                                                        : i === activeSlot
                                                            ? 24
                                                            : 10,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    background: clips[i]
                                                        ? '#22C55E'
                                                        : i === activeSlot
                                                            ? '#A78BFA'
                                                            : 'rgba(255,255,255,0.35)',
                                                    transition:
                                                        'all 200ms ease',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {phase === 'preview' && (
                                        allFilled ? (
                                            <button
                                                type="button"
                                                onClick={finalize}
                                                style={{
                                                    pointerEvents: 'auto',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 10,
                                                    padding: '18px 40px',
                                                    borderRadius: 999,
                                                    border: 'none',
                                                    background: '#22C55E',
                                                    color: '#fff',
                                                    fontSize: 18,
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    boxShadow:
                                                        '0 12px 32px rgba(0,0,0,0.45)',
                                                }}
                                            >
                                                <Icon name="check" size={22} />
                                                Gabungkan boomerang
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={onMulai}
                                                disabled={cameraState !== 'ready'}
                                                style={{
                                                    pointerEvents: 'auto',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 10,
                                                    padding: '18px 40px',
                                                    borderRadius: 999,
                                                    border: 'none',
                                                    background:
                                                        cameraState === 'ready'
                                                            ? '#A78BFA'
                                                            : 'rgba(255,255,255,0.2)',
                                                    color: '#fff',
                                                    fontSize: 18,
                                                    fontWeight: 800,
                                                    cursor:
                                                        cameraState === 'ready'
                                                            ? 'pointer'
                                                            : 'not-allowed',
                                                    boxShadow:
                                                        '0 12px 32px rgba(0,0,0,0.45)',
                                                }}
                                            >
                                                <Icon name="play" size={22} />
                                                Rekam slot {activeSlot + 1}/
                                                {totalSlots}
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action bar */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            {phase === 'preview' && !allFilled && (
                                <>
                                    <button
                                        type="button"
                                        onClick={onMulai}
                                        disabled={cameraState !== 'ready'}
                                        style={{
                                            flex: 1,
                                            minWidth: 220,
                                            padding: '18px 28px',
                                            borderRadius: 16,
                                            border: 'none',
                                            background:
                                                cameraState === 'ready'
                                                    ? '#A78BFA'
                                                    : 'rgba(0,0,0,0.08)',
                                            color:
                                                cameraState === 'ready'
                                                    ? '#fff'
                                                    : '#6b6b6b',
                                            fontSize: 17,
                                            fontWeight: 700,
                                            cursor:
                                                cameraState === 'ready'
                                                    ? 'pointer'
                                                    : 'not-allowed',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            justifyContent: 'center',
                                            boxShadow:
                                                cameraState === 'ready'
                                                    ? '0 8px 24px rgba(167,139,250,0.35)'
                                                    : 'none',
                                        }}
                                    >
                                        <Icon name="play" size={20} />
                                        {cameraState === 'ready'
                                            ? `Rekam slot ${activeSlot + 1}/${totalSlots}`
                                            : cameraState === 'denied'
                                                ? 'Izinkan akses kamera'
                                                : cameraState === 'unavailable'
                                                    ? 'Browser tidak mendukung'
                                                    : 'Menyiapkan kamera…'}
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
                                        title="Lanjut otomatis ke slot berikutnya setelah rekam"
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
                                </>
                            )}

                            {phase === 'preview' && allFilled && (
                                <button
                                    type="button"
                                    onClick={finalize}
                                    style={{
                                        flex: 1,
                                        minWidth: 220,
                                        padding: '18px 28px',
                                        borderRadius: 16,
                                        border: 'none',
                                        background: '#22C55E',
                                        color: '#fff',
                                        fontSize: 17,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        justifyContent: 'center',
                                        boxShadow:
                                            '0 8px 24px rgba(34,197,94,0.35)',
                                    }}
                                >
                                    <Icon name="check" size={20} />
                                    Gabungkan jadi boomerang frame
                                </button>
                            )}

                            {inReview && (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 10,
                                        width: '100%',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={retakeAll}
                                        disabled={processing}
                                        style={{
                                            padding: '14px 18px',
                                            borderRadius: 12,
                                            border: '1px solid var(--pb-border)',
                                            background: '#fff',
                                            color: 'var(--pb-ink)',
                                            fontWeight: 700,
                                            cursor: processing
                                                ? 'wait'
                                                : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Icon name="refresh" size={16} />
                                        Rekam ulang semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={processing}
                                        style={{
                                            padding: '14px 18px',
                                            borderRadius: 12,
                                            border: 'none',
                                            background: 'var(--pb-primary)',
                                            color: 'var(--pb-ink)',
                                            fontWeight: 700,
                                            cursor: processing
                                                ? 'wait'
                                                : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Icon name="check" size={16} />
                                        {processing
                                            ? 'Mengupload…'
                                            : 'Pakai video ini'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — controls + frame preview */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            minWidth: 0,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'var(--pb-text-faint)',
                                    letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    marginBottom: 6,
                                }}
                            >
                                Langkah 5 · Rekam Boomerang
                            </div>
                            <h1
                                style={{
                                    fontSize: 'clamp(24px, 2.6vw, 32px)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.025em',
                                    lineHeight: 1.05,
                                    margin: 0,
                                }}
                            >
                                Gerak santai, {totalSlots}x take.
                            </h1>
                            <p
                                style={{
                                    color: 'var(--pb-text-muted)',
                                    fontSize: 14,
                                    margin: '10px 0 0',
                                    lineHeight: 1.55,
                                }}
                            >
                                Tiap slot di-rekam 3 detik dengan hitungan
                                mundur. Setelah semua siap, kami gabungkan jadi
                                satu boomerang sesuai frame.
                            </p>
                        </div>

                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: 'var(--pb-ink)',
                            }}
                        >
                            {filledCount}/{totalSlots} slot siap
                        </div>

                        {/* Refresh-warning banner */}
                        {(filledCount > 0 || phase === 'review') &&
                            !processing && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        padding: '10px 14px',
                                        background:
                                            'rgba(245,158,11,0.10)',
                                        border:
                                            '1px solid rgba(245,158,11,0.35)',
                                        borderRadius: 12,
                                        color: '#92400E',
                                        fontSize: 12.5,
                                        lineHeight: 1.45,
                                    }}
                                    role="alert"
                                >
                                    <Icon
                                        name="alert"
                                        size={16}
                                        color="#D97706"
                                    />
                                    <div>
                                        <strong>Jangan refresh halaman.</strong>{' '}
                                        Rekaman boomerang masih disimpan
                                        sementara di browser dan akan hilang
                                        kalau halaman di-reload sebelum upload
                                        ke server.
                                    </div>
                                </div>
                            )}

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
                                        : '#A78BFA',
                                    transition:
                                        'width 280ms ease, background 200ms ease',
                                }}
                            />
                        </div>

                        <FramePreviewBoomerang
                            frame={frame}
                            clips={clips}
                            activeSlot={activeSlot}
                            canInteract={phase === 'preview'}
                            onSlotClick={(idx) => {
                                if (clips[idx]) {
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
                                rekam ulang
                            </strong>{' '}
                            ·{' '}
                            {totalSlots - filledCount > 0
                                ? `${totalSlots - filledCount} slot lagi`
                                : 'Semua siap digabungkan'}
                        </div>

                        {error && (
                            <div
                                style={{
                                    padding: '10px 14px',
                                    background: 'rgba(239,68,68,0.10)',
                                    border: '1px solid rgba(239,68,68,0.28)',
                                    color: '#B91C1C',
                                    borderRadius: 12,
                                    fontSize: 13,
                                }}
                            >
                                {error}
                            </div>
                        )}
                    </div>
                </main>

                <KioskFooter
                    back="← Ganti frame"
                    next=""
                    onBack={async () => {
                        if (filledCount > 0 || inReview) {
                            const ok = await confirmDialog({
                                title: 'Ganti frame?',
                                description:
                                    'Video yang sudah kamu rekam akan dihapus saat kamu pilih frame baru.',
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
                />
            </KioskScene>
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes pbCountdownPulse {
                    0% { transform: scale(0.6); opacity: 0; }
                    20% { transform: scale(1.15); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </>
    );
}

function FramePreviewBoomerang({
    frame,
    clips,
    activeSlot,
    canInteract,
    onSlotClick,
}: {
    frame: NonNullable<Props['frame']>;
    clips: Clip[];
    activeSlot: number;
    canInteract: boolean;
    onSlotClick: (idx: number) => void;
}) {
    const size = frame.image_size;
    const aspectRatio = size ? `${size.width} / ${size.height}` : '3 / 4';
    const aspectValue = size ? size.width / size.height : 0.75;

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: `calc(56vh * ${aspectValue})`,
                margin: '0 auto',
                background: '#fff',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow:
                    '0 12px 32px rgba(10,10,10,0.12), 0 2px 6px rgba(10,10,10,0.05)',
                aspectRatio,
            }}
        >
            {frame.slots.map((s, i) => {
                if (!size) {
                    return null;
                }

                const clip = clips[i];
                const isActive = i === activeSlot;

                const left = (s.x / size.width) * 100;
                const top = (s.y / size.height) * 100;
                const w = (s.width / size.width) * 100;
                const h = (s.height / size.height) * 100;

                return (
                    <button
                        key={s.slot_number}
                        type="button"
                        onClick={() => canInteract && onSlotClick(i)}
                        disabled={!canInteract}
                        title={
                            clip
                                ? `Klik untuk rekam ulang slot ${s.slot_number}`
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
                                ? '3px solid #A78BFA'
                                : clip
                                    ? 'none'
                                    : '2px dashed rgba(10,10,10,0.3)',
                            background: clip ? '#000' : '#F4F4F5',
                            cursor: canInteract ? 'pointer' : 'default',
                            overflow: 'hidden',
                            boxShadow: isActive
                                ? '0 0 0 4px rgba(167,139,250,0.28)'
                                : undefined,
                            transition:
                                'border 120ms ease, box-shadow 120ms ease',
                        }}
                    >
                        {clip ? (
                            <video
                                src={clip.url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                    transform: 'scaleX(-1)',
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

/**
 * Composite N boomerang clips into a single looping video that matches the
 * selected frame layout. Plays all clips simultaneously, draws each into its
 * slot region on an offscreen canvas, overlays the frame thumbnail, and records
 * the canvas stream for one full clip duration.
 */
async function composeBoomerang(
    frame: NonNullable<Props['frame']>,
    clips: Clip[],
    onProgress: (p: number) => void,
): Promise<Blob> {
    const size = frame.image_size ?? { width: 1080, height: 1620 };
    const maxW = 1080;
    const scale = size.width > maxW ? maxW / size.width : 1;
    const canvasW = Math.round(size.width * scale);
    const canvasH = Math.round(size.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas tidak tersedia.');
    }

    // Hidden video elements for each slot clip
    const videos: HTMLVideoElement[] = clips.map((clip) => {
        const v = document.createElement('video');

        if (clip) {
            v.src = clip.url;
        }

        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.crossOrigin = 'anonymous';

        return v;
    });

    await Promise.all(
        videos.map(
            (v) =>
                new Promise<void>((resolve, reject) => {
                    const onReady = () => {
                        v.removeEventListener('loadeddata', onReady);
                        resolve();
                    };
                    const onErr = () => {
                        v.removeEventListener('error', onErr);
                        reject(new Error('Clip gagal dimuat.'));
                    };
                    v.addEventListener('loadeddata', onReady);
                    v.addEventListener('error', onErr);
                    v.load();
                }),
        ),
    );

    // Frame overlay image
    let frameImg: HTMLImageElement | null = null;

    if (frame.thumbnail_url) {
        frameImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Frame overlay gagal dimuat.'));
            img.src = frame.thumbnail_url!;
        });
    }

    const mimeType = pickMimeType();
    const stream = canvas.captureStream(30);
    let recorder: MediaRecorder;

    try {
        recorder = new MediaRecorder(stream, { mimeType });
    } catch (err) {
        console.error(err);
        throw new Error('Browser tidak mendukung perekaman composite.');
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    // Sync-start all clips
    videos.forEach((v) => {
        v.currentTime = 0;
    });
    await Promise.all(videos.map((v) => v.play().catch(() => {})));

    recorder.start();

    const startedAt = performance.now();
    let stopped = false;

    const drawFrame = () => {
        if (stopped) {
            return;
        }

        const elapsed = performance.now() - startedAt;
        const pct = Math.min(1, elapsed / RECORD_DURATION_MS);
        onProgress(pct);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasW, canvasH);

        frame.slots.forEach((s, i) => {
            const v = videos[i];

            if (!v || v.readyState < 2) {
                return;
            }

            const x = s.x * scale;
            const y = s.y * scale;
            const w = s.width * scale;
            const h = s.height * scale;

            // object-fit: cover behavior
            const vAspect = v.videoWidth / v.videoHeight;
            const slotAspect = s.width / s.height;
            let sx = 0;
            let sy = 0;
            let sw = v.videoWidth;
            let sh = v.videoHeight;

            if (vAspect > slotAspect) {
                sw = v.videoHeight * slotAspect;
                sx = (v.videoWidth - sw) / 2;
            } else {
                sh = v.videoWidth / slotAspect;
                sy = (v.videoHeight - sh) / 2;
            }

            // Mirror horizontally (selfie style) to match the live preview.
            ctx.save();
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            ctx.drawImage(v, sx, sy, sw, sh, 0, 0, w, h);
            ctx.restore();
        });

        if (frameImg) {
            ctx.drawImage(frameImg, 0, 0, canvasW, canvasH);
        }

        if (elapsed < RECORD_DURATION_MS) {
            requestAnimationFrame(drawFrame);
        }
    };

    requestAnimationFrame(drawFrame);

    return new Promise<Blob>((resolve, reject) => {
        const stopAt = setTimeout(() => {
            stopped = true;

            if (recorder.state === 'recording') {
                recorder.stop();
            }
        }, RECORD_DURATION_MS + 80);

        recorder.onstop = () => {
            clearTimeout(stopAt);
            videos.forEach((v) => {
                v.pause();
                v.removeAttribute('src');
                v.load();
            });

            const blob = new Blob(chunks, { type: mimeType });
            onProgress(1);

            if (blob.size === 0) {
                reject(new Error('Gagal merekam composite.'));

                return;
            }

            resolve(blob);
        };

        recorder.onerror = (e) => {
            clearTimeout(stopAt);
            reject(new Error('Composite recorder error.'));
            console.error(e);
        };
    });
}
