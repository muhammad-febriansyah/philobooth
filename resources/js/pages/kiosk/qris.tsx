import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { QR } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import {
    KioskFooter,
    KioskHeader,
} from '@/components/philobooth/kiosk-chrome';
import { Logo } from '@/components/philobooth/logo';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type Props = {
    session?: {
        session_code: string;
        final_amount: number;
    };
};

export default function KioskQRIS({ session }: Props) {
    const [processing, setProcessing] = useState(false);

    function mockPay() {
        setProcessing(true);
        router.post(
            '/kiosk/payment/mock-pay',
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <>
            <Head title="Scan QRIS — Kiosk" />
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
                <KioskHeader step={2} />
                <main
                    style={{
                        flex: 1,
                        padding: '32px 120px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.2fr',
                        gap: 64,
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div
                            className="pb-caption"
                            style={{
                                color: 'var(--pb-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                                fontSize: 14,
                            }}
                        >
                            Langkah 2 · QRIS
                        </div>
                        <h2
                            style={{
                                fontSize: 52,
                                fontWeight: 700,
                                letterSpacing: -1.4,
                                margin: '8px 0 14px',
                            }}
                        >
                            Scan untuk bayar
                        </h2>
                        <p
                            style={{
                                fontSize: 19,
                                color: 'var(--pb-text-muted)',
                                margin: '0 0 32px',
                                lineHeight: 1.5,
                            }}
                        >
                            Buka aplikasi e-wallet atau m-banking, lalu scan
                            kode di sebelah kanan.
                        </p>

                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: 24,
                                border: '1px solid var(--pb-border)',
                                marginBottom: 24,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 14,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 14,
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    Total dibayar
                                </span>
                                <span
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 700,
                                    }}
                                >
                                    Rp{' '}
                                    {new Intl.NumberFormat('id-ID').format(
                                        session?.final_amount ?? 50000,
                                    )}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 14,
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    Order ID
                                </span>
                                <span
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {session?.session_code ?? '—'}
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '16px 20px',
                                border: '1px solid var(--pb-border)',
                                marginBottom: 24,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                            }}
                        >
                            <Icon
                                name="info"
                                size={20}
                                color="var(--pb-info)"
                            />
                            <div
                                style={{
                                    flex: 1,
                                    fontSize: 14,
                                    color: 'var(--pb-text-muted)',
                                }}
                            >
                                Layar lanjut otomatis setelah pembayaran
                                terdeteksi.
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: 'var(--pb-text)',
                                }}
                            >
                                <div
                                    className="pb-spin"
                                    style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 7,
                                        border: '2px solid var(--pb-border)',
                                        borderTopColor: 'var(--pb-ink)',
                                    }}
                                />
                                menunggu
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 24,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            {['GoPay', 'DANA', 'OVO', 'ShopeePay', 'BCA'].map(
                                (w) => (
                                    <div
                                        key={w}
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: 'var(--pb-text-muted)',
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {w}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 24,
                                padding: 32,
                                border: '1px solid var(--pb-border)',
                                boxShadow: '0 16px 60px rgba(10,10,10,0.10)',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 20,
                                }}
                            >
                                <div
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 6,
                                        background: '#ED1B24',
                                        color: '#fff',
                                        fontWeight: 800,
                                        fontSize: 18,
                                        letterSpacing: 1,
                                    }}
                                >
                                    QRIS
                                </div>
                                <Logo size={26} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <QR size={420} seed={12} />
                            </div>
                            <div
                                style={{
                                    marginTop: 18,
                                    fontSize: 14,
                                    color: 'var(--pb-text-muted)',
                                }}
                            >
                                Berlaku 5 menit · sisa{' '}
                                <strong style={{ color: 'var(--pb-ink)' }}>
                                    04:43
                                </strong>
                            </div>
                        </div>
                    </div>
                </main>
                <KioskFooter
                    next="Saya sudah bayar"
                    nextIcon="check"
                    onNext={mockPay}
                    nextDisabled={processing}
                />
            </KioskScene>
        </>
    );
}
