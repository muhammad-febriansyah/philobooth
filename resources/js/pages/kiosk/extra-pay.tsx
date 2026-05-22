import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import type { IconName } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type Props = {
    session: {
        session_code: string;
        final_amount: number;
        print_quantity: number;
    };
    composite_url?: string | null;
    frame: {
        id: number;
        name: string;
        photo_slots: number;
        thumbnail_url: string | null;
        image_size: { width: number; height: number } | null;
    } | null;
};

type Method = {
    id: 'qris' | 'cash';
    icon: IconName;
    title: string;
    sub: string;
    accent: string;
    badges?: string[];
    eta: string;
};

const METHODS: Method[] = [
    {
        id: 'qris',
        icon: 'qr',
        title: 'QRIS',
        sub: 'Scan QR pakai e-wallet atau m-banking',
        badges: ['GoPay', 'OVO', 'Dana', 'BCA'],
        accent: '#0A0A0A',
        eta: '~30 detik',
    },
    {
        id: 'cash',
        icon: 'wallet',
        title: 'Tunai',
        sub: 'Bayar ke operator di kasir cabang',
        accent: '#525252',
        eta: 'Manual',
    },
];

function rupiah(n: number): string {
    return 'Rp ' + n.toLocaleString('id-ID');
}

export default function KioskExtraPay({ session, composite_url, frame }: Props) {
    const [selected, setSelected] = useState<Method['id']>('qris');
    const [processing, setProcessing] = useState(false);

    function submit() {
        setProcessing(true);
        router.post(
            '/kiosk/extra-pay',
            { method: selected },
            { onFinish: () => setProcessing(false) },
        );
    }

    const extraLembar = Math.max(0, session.print_quantity - 1);

    return (
        <>
            <Head title="Bayar tambahan — Kiosk" />
            <KioskScene>
                <Spotlight
                    position="top-right"
                    color="#F5FA0C"
                    size={680}
                    opacity={0.32}
                />
                <Spotlight
                    position="bottom-left"
                    color="#A78BFA"
                    size={520}
                    opacity={0.18}
                    blur={110}
                />
                <KioskHeader step={8} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        padding: 'clamp(24px, 4vw, 56px) clamp(24px, 5vw, 80px)',
                        display: 'grid',
                        gridTemplateColumns:
                            'minmax(0, 0.9fr) minmax(0, 1.1fr)',
                        gap: 'clamp(28px, 4vw, 56px)',
                        alignItems: 'center',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — Composite preview + extra info */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 'min(360px, 100%)',
                                aspectRatio: frame?.image_size
                                    ? `${frame.image_size.width} / ${frame.image_size.height}`
                                    : '3 / 4',
                                background: '#fff',
                                borderRadius: 18,
                                overflow: 'hidden',
                                boxShadow:
                                    '0 24px 56px rgba(10,10,10,0.18), 0 4px 12px rgba(10,10,10,0.06)',
                            }}
                        >
                            {composite_url ? (
                                <img
                                    src={composite_url}
                                    alt="Hasil"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : null}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 12,
                                    background: 'var(--pb-primary)',
                                    color: 'var(--pb-ink)',
                                    padding: '6px 12px',
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 800,
                                    letterSpacing: '0.04em',
                                }}
                            >
                                ×{session.print_quantity} LEMBAR
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — Payment method + summary */}
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
                            Lembar tambahan · Voucher cover 1 lembar
                        </div>

                        <h1
                            style={{
                                fontSize: 'clamp(32px, 5vw, 64px)',
                                fontWeight: 700,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.02,
                                margin: 0,
                                color: 'var(--pb-ink)',
                            }}
                        >
                            Bayar tambahan
                        </h1>
                        <p
                            style={{
                                fontSize: 'clamp(14px, 1.2vw, 17px)',
                                color: 'var(--pb-text-muted)',
                                marginTop: 'clamp(10px, 1.2vw, 14px)',
                                marginBottom: 'clamp(20px, 2.5vw, 28px)',
                                lineHeight: 1.5,
                                maxWidth: 520,
                            }}
                        >
                            Voucher kamu sudah cover 1 lembar pertama. {' '}
                            {extraLembar} lembar tambahan = {' '}
                            <strong style={{ color: 'var(--pb-ink)' }}>
                                {rupiah(session.final_amount)}
                            </strong>
                            .
                        </p>

                        {/* Amount card */}
                        <div
                            style={{
                                background: 'var(--pb-ink)',
                                color: '#fff',
                                borderRadius: 18,
                                padding: 'clamp(18px, 2.2vw, 24px)',
                                marginBottom: 20,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.55)',
                                    marginBottom: 4,
                                }}
                            >
                                Yang perlu dibayar
                            </div>
                            <div
                                style={{
                                    fontSize: 'clamp(32px, 3.2vw, 44px)',
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {rupiah(session.final_amount)}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.7)',
                                    marginTop: 6,
                                }}
                            >
                                {extraLembar} lembar × Rp{' '}
                                {(session.final_amount / Math.max(1, extraLembar))
                                    .toLocaleString('id-ID')}
                            </div>
                        </div>

                        {/* Method selection */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                marginBottom: 24,
                            }}
                        >
                            {METHODS.map((m) => {
                                const isActive = selected === m.id;

                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setSelected(m.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding:
                                                'clamp(14px, 1.6vw, 18px)',
                                            background: isActive
                                                ? 'rgba(10,10,10,0.05)'
                                                : '#fff',
                                            border: isActive
                                                ? `2.5px solid ${m.accent}`
                                                : '1px solid var(--pb-border)',
                                            borderRadius: 16,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            textAlign: 'left',
                                            width: '100%',
                                            transition:
                                                'border 120ms ease, background 160ms ease',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 12,
                                                background: isActive
                                                    ? m.accent
                                                    : '#FAFAFA',
                                                color: isActive
                                                    ? '#fff'
                                                    : m.accent,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Icon name={m.icon} size={22} />
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: 700,
                                                        color: 'var(--pb-ink)',
                                                    }}
                                                >
                                                    {m.title}
                                                </span>
                                                <span
                                                    style={{
                                                        marginLeft: 'auto',
                                                        fontSize: 11,
                                                        color: 'var(--pb-text-faint)',
                                                        fontWeight: 600,
                                                        display:
                                                            'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                >
                                                    <Icon
                                                        name="sparkles"
                                                        size={11}
                                                    />
                                                    {m.eta}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: 'var(--pb-text-muted)',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {m.sub}
                                            </div>
                                            {m.badges && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: 4,
                                                        marginTop: 6,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {m.badges.map((b) => (
                                                        <span
                                                            key={b}
                                                            style={{
                                                                fontSize: 9,
                                                                fontWeight: 700,
                                                                background:
                                                                    '#fff',
                                                                border: '1px solid var(--pb-border)',
                                                                color: 'var(--pb-text-muted)',
                                                                padding:
                                                                    '2px 6px',
                                                                borderRadius: 4,
                                                            }}
                                                        >
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                background: isActive
                                                    ? m.accent
                                                    : 'transparent',
                                                border: isActive
                                                    ? 'none'
                                                    : '2px solid var(--pb-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isActive && (
                                                <Icon
                                                    name="check"
                                                    size={14}
                                                    color="#fff"
                                                />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* CTA */}
                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            style={{
                                alignSelf: 'flex-start',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 14,
                                padding:
                                    'clamp(18px, 2.2vw, 24px) clamp(32px, 3.5vw, 48px)',
                                background: 'var(--pb-primary)',
                                color: 'var(--pb-ink)',
                                border: 'none',
                                borderRadius: 999,
                                fontSize: 'clamp(15px, 1.4vw, 18px)',
                                fontWeight: 700,
                                cursor: processing ? 'wait' : 'pointer',
                                opacity: processing ? 0.7 : 1,
                                fontFamily: 'inherit',
                                boxShadow:
                                    '0 1px 2px rgba(10,10,10,0.08), 0 12px 28px rgba(245,250,12,0.45)',
                            }}
                        >
                            <Icon
                                name={
                                    METHODS.find((m) => m.id === selected)
                                        ?.icon ?? 'qr'
                                }
                                size={20}
                            />
                            {processing
                                ? 'Memproses…'
                                : `Bayar ${rupiah(session.final_amount)}`}
                            <span
                                style={{
                                    display: 'inline-flex',
                                    width: 32,
                                    height: 32,
                                    borderRadius: 999,
                                    background: 'var(--pb-ink)',
                                    color: 'var(--pb-primary)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon name="arrow-right" size={16} />
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => router.visit('/kiosk/qty')}
                            style={{
                                marginTop: 12,
                                alignSelf: 'flex-start',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--pb-text-faint)',
                                fontSize: 12,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontFamily: 'inherit',
                            }}
                        >
                            ← Kurangi lembar (gratis kalau cuma 1)
                        </button>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}
