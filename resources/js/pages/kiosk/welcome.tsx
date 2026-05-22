import { Head, useForm } from '@inertiajs/react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import {
    Eyebrow,
    KioskScene,
    ShinyPrimary,
    SquiggleWord,
} from '@/components/philobooth/kiosk-scene';

type Branch = { id: number; name: string; code: string };

type Props = {
    branches?: Branch[];
    has_active_session?: boolean;
};

const STEPS = [
    { n: '01', label: 'Pilih frame' },
    { n: '02', label: 'Bayar' },
    { n: '03', label: 'Ambil foto' },
    { n: '04', label: 'Cetak & QR' },
];

export default function KioskWelcome({ branches = [] }: Props) {
    const { post, processing } = useForm({
        branch_id: branches[0]?.id ?? '',
    });

    function startSession() {
        post('/kiosk/start');
    }

    return (
        <>
            <Head title="Welcome — Kiosk" />
            <KioskScene accent="bold">
                <Spotlight
                    position="top-right"
                    color="#F5FA0C"
                    size={760}
                    opacity={0.32}
                />
                <Spotlight
                    position="bottom-left"
                    color="#A78BFA"
                    size={620}
                    opacity={0.22}
                    blur={120}
                />
                <KioskHeader step={0} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                        gap: 'clamp(32px, 5vw, 80px)',
                        padding: 'clamp(32px, 5vw, 72px) clamp(28px, 5vw, 80px)',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                        alignItems: 'center',
                    }}
                >
                    {/* LEFT — hero */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            minWidth: 0,
                        }}
                    >
                        <Eyebrow
                            style={{
                                marginBottom: 'clamp(20px, 2.5vw, 32px)',
                            }}
                        >
                            Photobooth · Edisi 2026
                        </Eyebrow>

                        <h1
                            style={{
                                fontSize: 'clamp(40px, 6.5vw, 88px)',
                                fontWeight: 600,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.02,
                                margin: 0,
                                color: 'var(--pb-ink)',
                            }}
                        >
                            Cetak momen
                            <br />
                            yang <SquiggleWord>tak terulang</SquiggleWord>.
                        </h1>

                        <p
                            style={{
                                fontSize: 'clamp(15px, 1.3vw, 19px)',
                                color: 'var(--pb-text-muted)',
                                maxWidth: 520,
                                marginTop: 'clamp(20px, 2.5vw, 32px)',
                                marginBottom: 'clamp(28px, 3.5vw, 44px)',
                                lineHeight: 1.55,
                            }}
                        >
                            Empat langkah, tiga menit. Pilih frame favoritmu,
                            bayar pakai QRIS atau voucher, lalu ambil cetakan
                            di sebelah — beres.
                        </p>

                        {/* CTA + voucher hint */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'clamp(16px, 2vw, 28px)',
                                flexWrap: 'wrap',
                            }}
                        >
                            <ShinyPrimary
                                onClick={startSession}
                                disabled={processing}
                                icon={<Icon name="arrow-right" size={16} />}
                            >
                                {processing ? 'Memulai…' : 'Mulai sesi'}
                            </ShinyPrimary>

                            <div
                                style={{
                                    fontSize: 'clamp(12px, 1.05vw, 14px)',
                                    color: 'var(--pb-text-muted)',
                                    lineHeight: 1.4,
                                }}
                            >
                                Punya voucher?
                                <br />
                                <span
                                    style={{
                                        color: 'var(--pb-ink)',
                                        fontWeight: 600,
                                        borderBottom:
                                            '1px solid var(--pb-ink)',
                                    }}
                                >
                                    Klik &quot;Mulai sesi&quot; → pilih
                                    Voucher
                                </span>
                            </div>
                        </div>

                        {/* Steps preview */}
                        <div
                            style={{
                                marginTop: 'clamp(40px, 5vw, 72px)',
                                paddingTop: 'clamp(24px, 3vw, 36px)',
                                borderTop: '1px solid rgba(10,10,10,0.08)',
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(4, minmax(0, 1fr))',
                                gap: 'clamp(12px, 1.5vw, 24px)',
                            }}
                        >
                            {STEPS.map((s) => (
                                <div
                                    key={s.n}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize:
                                                'clamp(11px, 0.9vw, 12px)',
                                            fontWeight: 700,
                                            color: 'var(--pb-text-faint)',
                                            letterSpacing: '0.1em',
                                        }}
                                    >
                                        {s.n}
                                    </div>
                                    <div
                                        style={{
                                            fontSize:
                                                'clamp(13px, 1.1vw, 15px)',
                                            fontWeight: 600,
                                            color: 'var(--pb-ink)',
                                        }}
                                    >
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — Polaroid stack */}
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                width: 'min(340px, 100%)',
                                aspectRatio: '3 / 4',
                            }}
                        >
                            <PolaroidCard
                                rotate={-6}
                                translateX={-26}
                                translateY={8}
                                zIndex={1}
                                tone="A"
                            />
                            <PolaroidCard
                                rotate={4}
                                translateX={20}
                                translateY={-6}
                                zIndex={2}
                                tone="B"
                            />
                            <PolaroidCard
                                rotate={-1}
                                translateX={0}
                                translateY={0}
                                zIndex={3}
                                tone="C"
                                isPrimary
                            />
                        </div>

                        <div
                            style={{
                                position: 'absolute',
                                bottom: 'clamp(-12px, -1vw, -4px)',
                                right: 'clamp(20px, 4vw, 60px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 14px',
                                background: '#fff',
                                borderRadius: 999,
                                boxShadow:
                                    '0 4px 16px rgba(10,10,10,0.08), 0 1px 2px rgba(10,10,10,0.06)',
                                zIndex: 4,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 999,
                                    background: '#22C55E',
                                    boxShadow:
                                        '0 0 0 4px rgba(34,197,94,0.18)',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--pb-ink)',
                                }}
                            >
                                Printer online
                            </span>
                        </div>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}

type PolaroidProps = {
    rotate: number;
    translateX: number;
    translateY: number;
    zIndex: number;
    tone: 'A' | 'B' | 'C';
    isPrimary?: boolean;
};

const TONES: Record<
    PolaroidProps['tone'],
    { a: string; b: string; c: string }
> = {
    A: { a: '#FFE9C7', b: '#FFBEA0', c: '#FFD4B8' },
    B: { a: '#E0D4FF', b: '#C0B5FF', c: '#D6CDFF' },
    C: { a: '#C8F0DC', b: '#FFE6A6', c: '#FFC2A6' },
};

function PolaroidCard({
    rotate,
    translateX,
    translateY,
    zIndex,
    tone,
    isPrimary,
}: PolaroidProps) {
    const t = TONES[tone];

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                transform: `rotate(${rotate}deg) translate(${translateX}px, ${translateY}px)`,
                zIndex,
                background: '#fff',
                borderRadius: 6,
                padding: 14,
                paddingBottom: 56,
                boxShadow: isPrimary
                    ? '0 24px 48px rgba(10,10,10,0.18), 0 4px 12px rgba(10,10,10,0.08)'
                    : '0 12px 32px rgba(10,10,10,0.12), 0 2px 6px rgba(10,10,10,0.06)',
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateRows: '1fr 1fr 1fr',
                    gap: 8,
                    height: '100%',
                }}
            >
                <PhotoTone tone={t.a} />
                <PhotoTone tone={t.b} />
                <PhotoTone tone={t.c} />
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: 14,
                    left: 14,
                    right: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--pb-ink)',
                    letterSpacing: '0.1em',
                }}
            >
                <span>PHILOBOOTH</span>
                <span style={{ color: 'var(--pb-text-faint)' }}>22·05·26</span>
            </div>
        </div>
    );
}

function PhotoTone({ tone }: { tone: string }) {
    return (
        <div
            style={{
                borderRadius: 3,
                background: tone,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4), transparent 60%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.06), transparent 50%)',
                }}
            />
        </div>
    );
}
