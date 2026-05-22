import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import {
    NumberTicker,
    Spotlight,
} from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type Props = {
    session: { session_code: string };
    composite_url?: string | null;
    frame: {
        id: number;
        name: string;
        photo_slots: number;
        thumbnail_url: string | null;
        image_size: { width: number; height: number } | null;
    } | null;
    pricing: {
        base_price: number;
        free_quantity: number;
        extra_per_print: number;
        max_prints: number;
    };
};

function rupiah(n: number): string {
    return 'Rp ' + n.toLocaleString('id-ID');
}

export default function KioskQty({ composite_url, frame, pricing }: Props) {
    const [qty, setQty] = useState(1);
    const [processing, setProcessing] = useState(false);

    const max = Math.max(1, pricing.max_prints);
    const extras = Math.max(0, qty - pricing.free_quantity);
    const extraTotal = extras * pricing.extra_per_print;
    const grandTotal = pricing.base_price + extraTotal;

    function submit() {
        setProcessing(true);
        router.post(
            '/kiosk/quantity',
            { quantity: qty },
            { onFinish: () => setProcessing(false) },
        );
    }

    if (!composite_url || !frame) {
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

    const aspect = frame.image_size
        ? `${frame.image_size.width} / ${frame.image_size.height}`
        : '3 / 4';

    return (
        <>
            <Head title="Jumlah cetak — Kiosk" />
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
                <KioskHeader step={8} totalSteps={8} />

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
                    {/* LEFT — final preview */}
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
                                maxWidth: 'min(380px, 100%)',
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
                                src={composite_url}
                                alt="Final"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    display: 'block',
                                }}
                            />
                            {qty > 1 && (
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
                                    ×{qty} LEMBAR
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — qty stepper + payment detail */}
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
                            Langkah 8 · Jumlah cetak
                        </div>

                        <h1
                            style={{
                                fontSize: 'clamp(32px, 5vw, 64px)',
                                fontWeight: 700,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.02,
                                margin: 0,
                            }}
                        >
                            Berapa lembar?
                        </h1>
                        <p
                            style={{
                                fontSize: 'clamp(14px, 1.2vw, 17px)',
                                color: 'var(--pb-text-muted)',
                                marginTop: 'clamp(12px, 1.5vw, 16px)',
                                marginBottom: 'clamp(20px, 2.5vw, 28px)',
                                lineHeight: 1.5,
                                maxWidth: 520,
                            }}
                        >
                            {pricing.free_quantity} lembar pertama sudah termasuk
                            harga. Tambahan {rupiah(pricing.extra_per_print)} per
                            lembar.
                        </p>

                        {/* Stepper */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 18,
                                border: '1px solid var(--pb-border)',
                                padding: 'clamp(20px, 2.5vw, 28px)',
                                marginBottom: 16,
                                boxShadow:
                                    '0 4px 16px rgba(10,10,10,0.04)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 14,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        color: 'var(--pb-text-faint)',
                                    }}
                                >
                                    Jumlah lembar
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                }}
                            >
                                <StepBtn
                                    onClick={() =>
                                        setQty((q) => Math.max(1, q - 1))
                                    }
                                    disabled={qty <= 1}
                                    icon="x"
                                />
                                <div
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        fontSize: 'clamp(48px, 6vw, 72px)',
                                        fontWeight: 800,
                                        color: 'var(--pb-ink)',
                                        fontVariantNumeric: 'tabular-nums',
                                        lineHeight: 1,
                                    }}
                                >
                                    {qty}
                                </div>
                                <StepBtn
                                    onClick={() =>
                                        setQty((q) => Math.min(max, q + 1))
                                    }
                                    disabled={qty >= max}
                                    icon="plus"
                                />
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--pb-text-faint)',
                                    textAlign: 'center',
                                    marginTop: 10,
                                }}
                            >
                                Maksimal {max} lembar per sesi
                            </div>
                        </div>

                        {/* Payment detail */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 18,
                                border: '1px solid var(--pb-border)',
                                padding: 'clamp(18px, 2.2vw, 24px)',
                                marginBottom: 'clamp(20px, 2.5vw, 28px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'var(--pb-text-faint)',
                                    marginBottom: 10,
                                }}
                            >
                                Rincian pembayaran
                            </div>
                            <Row
                                label={`Harga dasar (${pricing.free_quantity} lembar)`}
                                value={rupiah(pricing.base_price)}
                                muted
                            />
                            <Row
                                label={`Tambahan lembar (${extras}×)`}
                                value={
                                    extras > 0
                                        ? '+ ' + rupiah(extraTotal)
                                        : 'Gratis'
                                }
                                muted={extras === 0}
                                accent={extras === 0 ? 'green' : undefined}
                            />
                            <div
                                style={{
                                    height: 1,
                                    background: 'var(--pb-border)',
                                    margin: '10px 0',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'baseline',
                                    padding: '6px 0',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 'clamp(16px, 1.4vw, 19px)',
                                        color: 'var(--pb-ink)',
                                        fontWeight: 800,
                                    }}
                                >
                                    Total bayar
                                </span>
                                <NumberTicker
                                    value={grandTotal}
                                    formatter={(n) => rupiah(Math.round(n))}
                                    style={{
                                        fontSize: 'clamp(20px, 1.8vw, 24px)',
                                        fontWeight: 800,
                                        color: 'var(--pb-ink)',
                                    }}
                                />
                            </div>
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
                                boxShadow:
                                    '0 1px 2px rgba(10,10,10,0.08), 0 12px 28px rgba(245,250,12,0.45)',
                            }}
                        >
                            <Icon name="printer" size={20} />
                            {processing ? 'Memproses…' : 'Cetak foto'}
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
                    </div>
                </main>
            </KioskScene>
        </>
    );
}

function StepBtn({
    onClick,
    disabled,
    icon,
}: {
    onClick: () => void;
    disabled?: boolean;
    icon: 'plus' | 'x';
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: disabled ? '#F4F4F5' : 'var(--pb-ink)',
                color: disabled ? 'var(--pb-text-faint)' : '#fff',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                transition: 'transform 120ms ease, background 160ms ease',
            }}
            onMouseDown={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'scale(0.94)';
                }
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {icon === 'plus' ? '+' : '−'}
        </button>
    );
}

function Row({
    label,
    value,
    muted,
    bold,
    accent,
}: {
    label: string;
    value: string;
    muted?: boolean;
    bold?: boolean;
    accent?: 'green';
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                fontSize: bold ? 'clamp(16px, 1.4vw, 19px)' : 14,
                color: muted ? 'var(--pb-text-muted)' : 'var(--pb-ink)',
                fontWeight: bold ? 800 : 500,
            }}
        >
            <span>{label}</span>
            <span
                style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: accent === 'green' ? '#16A34A' : undefined,
                    fontWeight: accent === 'green' || bold ? 700 : 600,
                }}
            >
                {value}
            </span>
        </div>
    );
}
