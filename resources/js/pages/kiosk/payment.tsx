import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import type { IconName } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type MethodId = 'qris' | 'voucher' | 'cash';

type Method = {
    id: MethodId;
    icon: IconName;
    title: string;
    sub: string;
    badges?: string[];
    accent: string;
    accentSoft: string;
    tag?: { label: string; tone: 'recommended' | 'soon' };
    eta: string;
    disabled?: boolean;
};

const METHODS: Method[] = [
    {
        id: 'qris',
        icon: 'qr',
        title: 'QRIS',
        sub: 'Scan QR pakai e-wallet, m-banking, atau kartu',
        badges: ['GoPay', 'OVO', 'Dana', 'ShopeePay', 'BCA', 'BRI'],
        accent: '#0A0A0A',
        accentSoft: 'rgba(10,10,10,0.08)',
        tag: { label: 'Recommended', tone: 'recommended' },
        eta: '~30 detik',
    },
    {
        id: 'voucher',
        icon: 'ticket',
        title: 'Voucher',
        sub: 'Punya kode dari event atau partner? Pakai di sini',
        badges: ['8 karakter', 'Gratis sesi'],
        accent: '#7C3AED',
        accentSoft: 'rgba(124,58,237,0.10)',
        eta: 'Instan',
    },
    {
        id: 'cash',
        icon: 'wallet',
        title: 'Bayar di kasir',
        sub: 'Tunjukkan total ke operator cabang',
        accent: '#525252',
        accentSoft: 'rgba(82,82,82,0.08)',
        tag: { label: 'Soon', tone: 'soon' },
        eta: 'Manual',
        disabled: true,
    },
];

type Props = {
    session: {
        session_code: string;
        final_amount: number;
        total_amount: number;
        payment_method: string | null;
    };
};

function rupiah(n: number): string {
    return 'Rp ' + n.toLocaleString('id-ID');
}

export default function KioskPayment({ session }: Props) {
    const initial: MethodId =
        session.payment_method === 'voucher' ? 'voucher' : 'qris';
    const [selected, setSelected] = useState<MethodId>(initial);
    const [processing, setProcessing] = useState(false);

    function next() {
        setProcessing(true);
        router.post(
            '/kiosk/payment/method',
            { method: selected },
            {
                onFinish: () => setProcessing(false),
            },
        );
    }

    const activeMethod =
        METHODS.find((m) => m.id === selected) ?? METHODS[0];

    return (
        <>
            <Head title="Pilih cara bayar — Kiosk" />
            <KioskScene>
                <Spotlight
                    position="top-right"
                    color="#F5FA0C"
                    size={680}
                    opacity={0.28}
                />
                <KioskHeader step={1} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        padding: 'clamp(24px, 4vw, 56px) clamp(24px, 5vw, 80px)',
                        display: 'grid',
                        gridTemplateColumns:
                            'minmax(0, 1.25fr) minmax(0, 1fr)',
                        gap: 'clamp(28px, 4vw, 64px)',
                        alignItems: 'start',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — methods */}
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
                            Langkah 1 · Pembayaran
                        </div>

                        <h1
                            style={{
                                fontSize: 'clamp(36px, 5.5vw, 76px)',
                                fontWeight: 700,
                                letterSpacing: '-0.04em',
                                lineHeight: 1.0,
                                margin: 0,
                                color: 'var(--pb-ink)',
                            }}
                        >
                            Cara bayar{' '}
                            <em
                                style={{
                                    fontStyle: 'italic',
                                    fontWeight: 700,
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                kesayanganmu
                                <svg
                                    aria-hidden
                                    viewBox="0 0 200 12"
                                    preserveAspectRatio="none"
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        bottom: '-0.08em',
                                        width: '100%',
                                        height: '0.16em',
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
                            ?
                        </h1>

                        <p
                            style={{
                                fontSize: 'clamp(15px, 1.3vw, 19px)',
                                color: 'var(--pb-text-muted)',
                                marginTop: 'clamp(14px, 2vw, 22px)',
                                marginBottom: 'clamp(28px, 3.5vw, 40px)',
                                maxWidth: 520,
                                lineHeight: 1.5,
                            }}
                        >
                            Cepet, aman, terenkripsi. Pilih yang paling nyaman
                            buat kamu.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                            }}
                        >
                            {METHODS.map((m) => (
                                <MethodCard
                                    key={m.id}
                                    method={m}
                                    isSelected={selected === m.id}
                                    onSelect={() =>
                                        !m.disabled && setSelected(m.id)
                                    }
                                />
                            ))}
                        </div>

                        {/* Trust signals */}
                        <div
                            style={{
                                marginTop: 'clamp(24px, 3vw, 36px)',
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: 12,
                            }}
                        >
                            <Trust
                                icon="check-circle"
                                label="Refund auto"
                                hint="Printer error = balik 100%"
                            />
                            <Trust
                                icon="lock"
                                label="Terenkripsi"
                                hint="Transaksi via DOKU"
                            />
                            <Trust
                                icon="sparkles"
                                label="Instan"
                                hint="≤ 30 detik proses"
                            />
                        </div>
                    </div>

                    {/* RIGHT — order summary */}
                    <div
                        style={{
                            position: 'sticky',
                            top: 24,
                            background: '#fff',
                            borderRadius: 22,
                            padding: 'clamp(20px, 2.4vw, 28px)',
                            border: '1px solid var(--pb-border)',
                            boxShadow:
                                '0 24px 56px rgba(10,10,10,0.08), 0 4px 12px rgba(10,10,10,0.04)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: 'var(--pb-text-faint)',
                                marginBottom: 8,
                            }}
                        >
                            Ringkasan order
                        </div>
                        <div
                            style={{
                                fontSize: 'clamp(20px, 1.8vw, 24px)',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                color: 'var(--pb-ink)',
                                marginBottom: 4,
                            }}
                        >
                            Sesi photobooth
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: 'var(--pb-text-faint)',
                                fontFamily: 'monospace',
                                marginBottom: 18,
                            }}
                        >
                            #{session.session_code}
                        </div>

                        <SummaryRow
                            label="Tarif sesi"
                            value={rupiah(session.total_amount)}
                        />
                        <SummaryRow label="Frame + filter" value="Termasuk" />
                        <SummaryRow
                            label="1 lembar cetak"
                            value="Termasuk"
                        />
                        <SummaryRow label="Digital download" value="Termasuk" />

                        <div
                            style={{
                                height: 1,
                                background: 'var(--pb-border)',
                                margin: '14px 0',
                            }}
                        />

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'baseline',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 13,
                                    color: 'var(--pb-text-muted)',
                                    fontWeight: 600,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Total
                            </span>
                            <span
                                style={{
                                    fontSize: 'clamp(28px, 2.6vw, 36px)',
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    color: 'var(--pb-ink)',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {rupiah(session.final_amount)}
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: 'var(--pb-text-faint)',
                                marginTop: 6,
                            }}
                        >
                            Bisa tambah lembar cetak di langkah akhir
                        </div>

                        {/* Pay CTA */}
                        <button
                            type="button"
                            onClick={next}
                            disabled={processing}
                            style={{
                                marginTop: 22,
                                width: '100%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                padding:
                                    'clamp(16px, 1.8vw, 20px) clamp(24px, 2.5vw, 32px)',
                                background: 'var(--pb-ink)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 999,
                                fontSize: 'clamp(15px, 1.3vw, 17px)',
                                fontWeight: 600,
                                cursor: processing ? 'wait' : 'pointer',
                                opacity: processing ? 0.7 : 1,
                                fontFamily: 'inherit',
                                boxShadow:
                                    '0 1px 2px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.18)',
                                transition: 'transform 160ms ease',
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
                            <Icon name={activeMethod.icon} size={18} />
                            {processing
                                ? 'Memproses…'
                                : `Bayar pakai ${activeMethod.title}`}
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
                                marginTop: 14,
                                padding: 12,
                                background: 'rgba(22,163,74,0.08)',
                                border: '1px solid rgba(22,163,74,0.18)',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <Icon
                                name="check-circle"
                                size={16}
                                color="#16A34A"
                            />
                            <span
                                style={{
                                    fontSize: 12,
                                    color: '#166534',
                                    fontWeight: 600,
                                }}
                            >
                                Refund otomatis kalau printer gagal
                            </span>
                        </div>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}

function MethodCard({
    method,
    isSelected,
    onSelect,
}: {
    method: Method;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            disabled={method.disabled}
            onClick={onSelect}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: 'clamp(16px, 2vw, 22px)',
                borderRadius: 18,
                background: isSelected ? method.accentSoft : '#fff',
                border: isSelected
                    ? `2.5px solid ${method.accent}`
                    : '1px solid var(--pb-border)',
                boxShadow: isSelected
                    ? '0 12px 32px rgba(10,10,10,0.10)'
                    : '0 1px 2px rgba(10,10,10,0.04)',
                cursor: method.disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                opacity: method.disabled ? 0.5 : 1,
                position: 'relative',
                transition:
                    'border 120ms ease, background 160ms ease, transform 120ms ease',
                width: '100%',
            }}
            onMouseDown={(e) => {
                if (!method.disabled) {
                    e.currentTarget.style.transform = 'scale(0.99)';
                }
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {/* Icon block */}
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: isSelected
                        ? method.accent
                        : method.accentSoft,
                    color: isSelected ? '#fff' : method.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 160ms ease, color 160ms ease',
                }}
            >
                <Icon name={method.icon} size={24} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
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
                            fontSize: 'clamp(17px, 1.5vw, 20px)',
                            fontWeight: 700,
                            color: 'var(--pb-ink)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {method.title}
                    </span>
                    {method.tag && (
                        <span
                            style={{
                                background:
                                    method.tag.tone === 'recommended'
                                        ? 'var(--pb-ink)'
                                        : '#F4F4F5',
                                color:
                                    method.tag.tone === 'recommended'
                                        ? 'var(--pb-primary)'
                                        : 'var(--pb-text-faint)',
                                padding: '3px 9px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {method.tag.label}
                        </span>
                    )}
                    <span
                        style={{
                            marginLeft: 'auto',
                            fontSize: 11,
                            color: 'var(--pb-text-faint)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Icon name="sparkles" size={11} />
                        {method.eta}
                    </span>
                </div>
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--pb-text-muted)',
                        marginTop: 4,
                        lineHeight: 1.4,
                    }}
                >
                    {method.sub}
                </div>
                {method.badges && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 5,
                            marginTop: 10,
                            flexWrap: 'wrap',
                        }}
                    >
                        {method.badges.map((b) => (
                            <span
                                key={b}
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: '#fff',
                                    border: '1px solid var(--pb-border)',
                                    color: 'var(--pb-text-muted)',
                                    padding: '3px 8px',
                                    borderRadius: 5,
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {b}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Radio */}
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: isSelected ? method.accent : 'transparent',
                    border: isSelected
                        ? 'none'
                        : '2px solid var(--pb-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 160ms ease',
                }}
            >
                {isSelected && (
                    <Icon name="check" size={16} color="#fff" />
                )}
            </div>
        </button>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 0',
                fontSize: 14,
            }}
        >
            <span style={{ color: 'var(--pb-text-muted)' }}>{label}</span>
            <span
                style={{
                    fontWeight: 600,
                    color: 'var(--pb-ink)',
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {value}
            </span>
        </div>
    );
}

function Trust({
    icon,
    label,
    hint,
}: {
    icon: IconName;
    label: string;
    hint: string;
}) {
    return (
        <div
            style={{
                padding: '12px 14px',
                background: '#fff',
                border: '1px solid var(--pb-border)',
                borderRadius: 12,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
            }}
        >
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'rgba(245,250,12,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--pb-ink)',
                }}
            >
                <Icon name={icon} size={14} />
            </div>
            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--pb-ink)',
                        marginBottom: 2,
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: 10,
                        color: 'var(--pb-text-faint)',
                        lineHeight: 1.3,
                    }}
                >
                    {hint}
                </div>
            </div>
        </div>
    );
}
