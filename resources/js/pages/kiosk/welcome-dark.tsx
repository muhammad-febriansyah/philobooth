import { Head, Link } from '@inertiajs/react';
import { Icon  } from '@/components/philobooth/icon';
import type {IconName} from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';

const FEATURES: Array<{ i: IconName; l: string }> = [
    { i: 'frame', l: '30+ frame' },
    { i: 'credit-card', l: 'QRIS / Voucher' },
    { i: 'printer', l: 'Cetak 60 detik' },
    { i: 'download', l: 'Download digital' },
];

export default function KioskWelcomeDark() {
    return (
        <>
            <Head title="Welcome — Kiosk" />
            <div
                className="pb-root"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    position: 'relative',
                    overflow: 'hidden',
                    background:
                        'radial-gradient(at 70% 30%, #1a1a1a 0%, #050505 70%)',
                    display: 'flex',
                    flexDirection: 'column',
                    color: '#fff',
                }}
            >
                <KioskHeader step={0} totalSteps={8} dark />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'radial-gradient(800px 600px at 25% 75%, rgba(245,250,12,0.22) 0%, transparent 60%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 460,
                        fontWeight: 900,
                        letterSpacing: -14,
                        color: 'rgba(245,250,12,0.05)',
                        lineHeight: 1,
                        pointerEvents: 'none',
                    }}
                >
                    PHILO
                </div>

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        padding: '0 56px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 18px',
                            borderRadius: 999,
                            background: 'rgba(245,250,12,0.12)',
                            color: 'var(--pb-primary)',
                            fontSize: 15,
                            fontWeight: 600,
                            marginBottom: 28,
                        }}
                    >
                        <span
                            className="pb-pulse"
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                background: 'var(--pb-primary)',
                            }}
                        />
                        Tap anywhere to begin
                    </div>

                    <h1
                        style={{
                            fontSize: 168,
                            fontWeight: 900,
                            letterSpacing: -6,
                            lineHeight: 0.9,
                            margin: 0,
                            color: '#fff',
                        }}
                    >
                        Smile,
                        <br />
                        <span
                            style={{
                                color: 'var(--pb-primary)',
                                textShadow: '0 0 80px rgba(245,250,12,0.6)',
                            }}
                        >
                            print,
                        </span>{' '}
                        repeat.
                    </h1>
                    <p
                        style={{
                            fontSize: 22,
                            color: 'rgba(255,255,255,0.6)',
                            maxWidth: 640,
                            marginTop: 28,
                            lineHeight: 1.5,
                        }}
                    >
                        Sesi 8 detik, hasil cetak HD, kirim ke HP via QR code.{' '}
                        <br />
                        Tekan tombol di bawah untuk mulai.
                    </p>

                    <Link
                        href="/kiosk/payment"
                        className="pb-btn pb-btn-primary"
                        style={{
                            marginTop: 56,
                            padding: '36px 96px',
                            fontSize: 34,
                            fontWeight: 700,
                            borderRadius: 999,
                            minHeight: 124,
                            gap: 18,
                            boxShadow:
                                '0 0 0 8px rgba(245,250,12,0.18), 0 16px 48px rgba(245,250,12,0.4)',
                        }}
                    >
                        <Icon name="camera" size={36} />
                        Mulai sesi
                        <Icon name="arrow-right" size={36} />
                    </Link>

                    <div
                        style={{
                            display: 'flex',
                            gap: 56,
                            marginTop: 64,
                            color: 'rgba(255,255,255,0.7)',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {FEATURES.map((s, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 17,
                                    fontWeight: 500,
                                }}
                            >
                                <Icon
                                    name={s.i}
                                    size={20}
                                    color="var(--pb-primary)"
                                />
                                {s.l}
                            </div>
                        ))}
                    </div>
                </main>

                <footer
                    style={{
                        padding: '0 56px 32px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 13,
                        fontWeight: 500,
                        letterSpacing: 0.5,
                    }}
                >
                    <span>v2.1 · Booth #PB-SC-01</span>
                    <span>Butuh bantuan? Tekan operator di sebelah kanan.</span>
                </footer>
            </div>
        </>
    );
}
