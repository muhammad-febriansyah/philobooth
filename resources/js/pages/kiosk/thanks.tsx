import { Head } from '@inertiajs/react';
import { Icon } from '@/components/philobooth/icon';

export default function KioskThanks() {
    return (
        <>
            <Head title="Terima kasih — Kiosk" />
            <div
                className="pb-root"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0A0A0A',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'radial-gradient(circle at 30% 40%, rgba(245,250,12,0.16) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(245,250,12,0.12) 0%, transparent 50%)',
                    }}
                />
                <svg
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                    }}
                >
                    {Array.from({ length: 22 }).map((_, i) => {
                        const x = (i * 73) % 1900;
                        const y = ((i * 137) % 980) + 40;
                        const s = (i % 4) + 4;
                        const colors = [
                            '#F5FA0C',
                            '#fff',
                            '#FB7185',
                            '#60A5FA',
                        ];
                        const c = colors[i % 4];
                        const r = (i * 31) % 60;
                        const shape = i % 3;

                        return shape === 0 ? (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={s / 2}
                                fill={c}
                                opacity={0.7}
                            />
                        ) : shape === 1 ? (
                            <rect
                                key={i}
                                x={x}
                                y={y}
                                width={s}
                                height={s}
                                fill={c}
                                opacity={0.7}
                                transform={`rotate(${r} ${x + s / 2} ${y + s / 2})`}
                            />
                        ) : (
                            <path
                                key={i}
                                d={`M ${x} ${y - s} L ${x + s} ${y} L ${x} ${y + s} L ${x - s} ${y} Z`}
                                fill={c}
                                opacity={0.7}
                            />
                        );
                    })}
                </svg>

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 56px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: 160,
                            height: 160,
                            borderRadius: '50%',
                            background: 'var(--pb-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow:
                                '0 0 0 14px rgba(245,250,12,0.16), 0 16px 60px rgba(245,250,12,0.4)',
                            marginBottom: 40,
                        }}
                    >
                        <Icon
                            name="check"
                            size={86}
                            color="#0A0A0A"
                            strokeWidth={3.5}
                        />
                    </div>

                    <h1
                        style={{
                            fontSize: 140,
                            fontWeight: 900,
                            letterSpacing: -6,
                            lineHeight: 0.9,
                            margin: 0,
                        }}
                    >
                        <span style={{ color: 'var(--pb-primary)' }}>
                            Sampai
                        </span>
                        <br />
                        jumpa lagi!
                    </h1>
                    <p
                        style={{
                            fontSize: 24,
                            color: 'rgba(255,255,255,0.6)',
                            marginTop: 32,
                            maxWidth: 700,
                            lineHeight: 1.5,
                        }}
                    >
                        Ambil foto di slot keluaran &amp; scan QR di belakang
                        booth untuk versi digital.
                    </p>

                    <div style={{ display: 'flex', gap: 20, marginTop: 56 }}>
                        <button
                            className="pb-btn pb-btn-primary"
                            style={{
                                padding: '20px 36px',
                                fontSize: 19,
                                minHeight: 70,
                                gap: 12,
                                borderRadius: 16,
                            }}
                        >
                            <Icon name="camera" size={22} />
                            Sesi baru
                        </button>
                        <button
                            className="pb-btn pb-btn-secondary"
                            style={{
                                padding: '20px 36px',
                                fontSize: 19,
                                minHeight: 70,
                                gap: 12,
                                background: 'rgba(255,255,255,0.06)',
                                borderColor: 'rgba(255,255,255,0.16)',
                                color: '#fff',
                                borderRadius: 16,
                            }}
                        >
                            <Icon name="heart" size={22} color="#FB7185" />
                            Beri rating sesi
                        </button>
                    </div>
                </main>

                <footer
                    style={{
                        padding: 32,
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 14,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    Kembali ke layar awal dalam{' '}
                    <strong style={{ color: 'var(--pb-primary)' }}>
                        15 detik
                    </strong>
                </footer>
            </div>
        </>
    );
}
