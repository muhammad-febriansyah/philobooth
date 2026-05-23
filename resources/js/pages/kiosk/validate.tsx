import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type SessionProps = {
    session: {
        session_code: string;
        status: string;
        payment_method: string | null;
        total_amount: number;
        discount_amount: number;
        final_amount: number;
        paid: boolean;
    };
};

const REDIRECT_SECONDS = 5;

const METHOD_LABEL: Record<string, string> = {
    qris_doku: 'QRIS · DOKU',
    qris_manual: 'QRIS · Scan kasir',
    voucher: 'Voucher',
    cash: 'Tunai',
};

function formatRupiah(n: number): string {
    return 'Rp ' + n.toLocaleString('id-ID');
}

export default function KioskValidate({ session }: SessionProps) {
    const [remaining, setRemaining] = useState(REDIRECT_SECONDS);
    const method = METHOD_LABEL[session.payment_method ?? ''] ?? 'Tunai';
    const isVoucher = session.payment_method === 'voucher';

    useEffect(() => {
        const t = setInterval(() => {
            setRemaining((s) => {
                if (s <= 1) {
                    clearInterval(t);
                    router.visit('/kiosk/output-type');

                    return 0;
                }

                return s - 1;
            });
        }, 1000);

        return () => clearInterval(t);
    }, []);

    return (
        <>
            <Head title="Pembayaran berhasil — Philobooth" />
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

                {/* Confetti shapes — subtle, scattered */}
                <Confetti />

                <KioskHeader step={3} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'clamp(24px, 4vw, 64px)',
                        maxWidth: 760,
                        margin: '0 auto',
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    {/* Success check with refined ring */}
                    <div
                        style={{
                            position: 'relative',
                            width: 'clamp(120px, 14vw, 180px)',
                            height: 'clamp(120px, 14vw, 180px)',
                            borderRadius: '50%',
                            background: 'var(--pb-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 'clamp(28px, 4vw, 44px)',
                            boxShadow:
                                '0 0 0 12px rgba(245,250,12,0.12), 0 12px 36px rgba(245,250,12,0.32)',
                        }}
                    >
                        <Icon
                            name="check"
                            size={64}
                            color="#0A0A0A"
                            strokeWidth={4}
                        />
                    </div>

                    {/* Eyebrow */}
                    <div
                        style={{
                            display: 'inline-flex',
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
                        Langkah 3 · Pembayaran berhasil
                        <span
                            style={{
                                width: 28,
                                height: 1,
                                background: 'var(--pb-text-faint)',
                            }}
                        />
                    </div>

                    {/* Headline — clean, no yellow banner */}
                    <h1
                        style={{
                            fontSize: 'clamp(40px, 6vw, 80px)',
                            fontWeight: 700,
                            letterSpacing: '-0.04em',
                            lineHeight: 1.02,
                            margin: 0,
                            color: 'var(--pb-ink)',
                        }}
                    >
                        Pembayaran lunas.
                    </h1>
                    <p
                        style={{
                            fontSize: 'clamp(16px, 1.4vw, 22px)',
                            color: 'var(--pb-text-muted)',
                            marginTop: 'clamp(12px, 1.5vw, 18px)',
                            marginBottom: 'clamp(32px, 4vw, 44px)',
                            maxWidth: 520,
                            lineHeight: 1.45,
                        }}
                    >
                        {isVoucher
                            ? 'Voucher diterima. Yuk pilih frame favoritmu.'
                            : 'Terima kasih. Yuk pilih frame favoritmu.'}
                    </p>

                    {/* Order summary card */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 18,
                            border: '1px solid var(--pb-border)',
                            boxShadow:
                                '0 4px 16px rgba(10,10,10,0.04), 0 1px 2px rgba(10,10,10,0.04)',
                            padding: 'clamp(20px, 2.5vw, 28px)',
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(3, minmax(0, 1fr))',
                            gap: 'clamp(16px, 2vw, 32px)',
                            width: '100%',
                            maxWidth: 640,
                            marginBottom: 'clamp(28px, 3vw, 36px)',
                        }}
                    >
                        <Stat label="Order ID">
                            <code
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 'clamp(14px, 1.2vw, 16px)',
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {session.session_code}
                            </code>
                        </Stat>
                        <Stat label="Metode" border>
                            <span
                                style={{
                                    fontSize: 'clamp(14px, 1.2vw, 16px)',
                                    fontWeight: 700,
                                }}
                            >
                                {method}
                            </span>
                        </Stat>
                        <Stat label="Total dibayar">
                            <div>
                                <span
                                    style={{
                                        fontSize: 'clamp(16px, 1.4vw, 20px)',
                                        fontWeight: 800,
                                    }}
                                >
                                    {formatRupiah(session.final_amount)}
                                </span>
                                {isVoucher && session.discount_amount > 0 && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#16A34A',
                                            fontWeight: 600,
                                            marginTop: 2,
                                        }}
                                    >
                                        Hemat{' '}
                                        {formatRupiah(
                                            session.discount_amount,
                                        )}
                                    </div>
                                )}
                            </div>
                        </Stat>
                    </div>

                    {/* Countdown + manual CTA */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 'clamp(13px, 1.1vw, 15px)',
                                color: 'var(--pb-text-muted)',
                            }}
                        >
                            Lanjut otomatis dalam{' '}
                            <strong
                                style={{
                                    color: 'var(--pb-ink)',
                                    fontVariantNumeric: 'tabular-nums',
                                    display: 'inline-block',
                                    minWidth: '1.5em',
                                    textAlign: 'center',
                                }}
                            >
                                {remaining}
                            </strong>{' '}
                            detik
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                router.visit('/kiosk/output-type')
                            }
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 14,
                                padding:
                                    'clamp(16px, 1.8vw, 22px) clamp(28px, 3vw, 40px)',
                                background: 'var(--pb-ink)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 999,
                                fontSize: 'clamp(15px, 1.3vw, 18px)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition:
                                    'transform 160ms ease, box-shadow 160ms ease',
                                boxShadow:
                                    '0 1px 2px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.12)',
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
                            Pilih frame sekarang
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
                            onClick={() => router.post('/kiosk/cancel')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--pb-text-faint)',
                                fontSize: 12,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginTop: 4,
                            }}
                        >
                            Batalkan sesi
                        </button>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}

function Stat({
    label,
    children,
    border,
}: {
    label: string;
    children: React.ReactNode;
    border?: boolean;
}) {
    return (
        <div
            style={{
                textAlign: 'left',
                position: 'relative',
                paddingLeft: border ? 'clamp(16px, 2vw, 32px)' : 0,
                paddingRight: border ? 'clamp(16px, 2vw, 32px)' : 0,
                borderLeft: border ? '1px solid var(--pb-border)' : undefined,
                borderRight: border ? '1px solid var(--pb-border)' : undefined,
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    color: 'var(--pb-text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 600,
                    marginBottom: 6,
                }}
            >
                {label}
            </div>
            {children}
        </div>
    );
}

function Confetti() {
    // Static, deterministic positions — no flashing/animation
    const items = Array.from({ length: 18 }).map((_, i) => {
        const seed = i * 137;
        const x = (seed * 23) % 100;
        const y = (seed * 41) % 100;
        const size = (i % 3) + 4;
        const colors = ['#F5FA0C', '#0A0A0A', '#FB7185', '#60A5FA'];
        const color = colors[i % 4];
        const rotation = (i * 31) % 360;
        const shape = i % 3;

        return { x, y, size, color, rotation, shape, key: i };
    });

    return (
        <svg
            aria-hidden
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            {items.map(({ x, y, size, color, rotation, shape, key }) =>
                shape === 0 ? (
                    <circle
                        key={key}
                        cx={x}
                        cy={y}
                        r={size / 30}
                        fill={color}
                        opacity={0.35}
                    />
                ) : shape === 1 ? (
                    <rect
                        key={key}
                        x={x}
                        y={y}
                        width={size / 25}
                        height={size / 25}
                        fill={color}
                        opacity={0.35}
                        transform={`rotate(${rotation} ${x} ${y})`}
                    />
                ) : (
                    <path
                        key={key}
                        d={`M ${x} ${y - size / 30} L ${x + size / 30} ${y} L ${x} ${y + size / 30} L ${x - size / 30} ${y} Z`}
                        fill={color}
                        opacity={0.35}
                    />
                ),
            )}
        </svg>
    );
}
