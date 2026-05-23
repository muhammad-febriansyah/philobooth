import { Head } from '@inertiajs/react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';

const STEPS: Array<{ l: string; done?: boolean; active?: boolean }> = [
    { l: 'Render frame', done: true },
    { l: 'Kirim ke printer', done: true },
    { l: 'Cetak lembar 1', active: true },
    { l: 'Cetak lembar 2' },
];

export default function KioskPrinting() {
    return (
        <>
            <Head title="Mencetak — Philobooth" />
            <div
                className="pb-root"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background:
                        'radial-gradient(at 50% 30%, #1f1f1f 0%, #050505 80%)',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <KioskHeader step={0} dark />
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '55%',
                        transform: 'translate(-50%, -50%)',
                        width: 800,
                        height: 800,
                        borderRadius: '50%',
                        background:
                            'radial-gradient(rgba(245,250,12,0.18) 0%, transparent 60%)',
                        pointerEvents: 'none',
                    }}
                />
                <main
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 56px',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <div style={{ position: 'relative', marginBottom: 64 }}>
                        <svg width="320" height="200" viewBox="0 0 320 200">
                            <g style={{ transform: 'translateY(-12px)' }}>
                                <rect
                                    x="120"
                                    y="-180"
                                    width="80"
                                    height="200"
                                    rx="4"
                                    fill="#fff"
                                />
                                <rect
                                    x="130"
                                    y="-170"
                                    width="60"
                                    height="40"
                                    rx="2"
                                    fill="#FFE9C7"
                                />
                                <rect
                                    x="130"
                                    y="-120"
                                    width="60"
                                    height="40"
                                    rx="2"
                                    fill="#E7D6FF"
                                />
                                <rect
                                    x="130"
                                    y="-70"
                                    width="60"
                                    height="40"
                                    rx="2"
                                    fill="#D2F4E5"
                                />
                                <rect
                                    x="130"
                                    y="-20"
                                    width="60"
                                    height="40"
                                    rx="2"
                                    fill="#FFD4DE"
                                />
                            </g>
                            <rect
                                x="40"
                                y="80"
                                width="240"
                                height="100"
                                rx="14"
                                fill="#fff"
                                stroke="#0A0A0A"
                                strokeWidth="3"
                            />
                            <rect
                                x="100"
                                y="80"
                                width="120"
                                height="14"
                                rx="1"
                                fill="#0A0A0A"
                            />
                            <rect
                                x="116"
                                y="80"
                                width="88"
                                height="6"
                                rx="1"
                                fill="#F5FA0C"
                            />
                            <circle cx="60" cy="120" r="8" fill="#F5FA0C" />
                            <circle cx="60" cy="120" r="3" fill="#0A0A0A" />
                            <rect
                                x="80"
                                y="140"
                                width="160"
                                height="24"
                                rx="4"
                                fill="#FAFAFA"
                            />
                            <text
                                x="160"
                                y="158"
                                textAnchor="middle"
                                fontFamily="Poppins, sans-serif"
                                fontWeight="700"
                                fontSize="13"
                                fill="#0A0A0A"
                            >
                                DNP DS620A
                            </text>
                        </svg>
                        <div
                            className="pb-pulse"
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: -32,
                                transform: 'translateX(-50%)',
                                width: 240,
                                height: 24,
                                borderRadius: 12,
                                background:
                                    'radial-gradient(ellipse, rgba(245,250,12,0.45) 0%, transparent 70%)',
                            }}
                        />
                    </div>

                    <h2
                        style={{
                            fontSize: 56,
                            fontWeight: 700,
                            letterSpacing: -1.4,
                            margin: '0 0 14px',
                            textAlign: 'center',
                        }}
                    >
                        Sedang mencetak
                        <span
                            className="pb-pulse"
                            style={{ display: 'inline-block' }}
                        >
                            …
                        </span>
                    </h2>
                    <p
                        style={{
                            fontSize: 19,
                            color: 'rgba(255,255,255,0.65)',
                            margin: '0 0 56px',
                            textAlign: 'center',
                            maxWidth: 540,
                        }}
                    >
                        Foto kamu lagi diolah. Ini biasanya butuh sekitar 45–60
                        detik.
                    </p>

                    <div
                        style={{
                            width: 'min(600px, 80%)',
                            marginBottom: 28,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            <span style={{ color: 'var(--pb-primary)' }}>
                                Mencetak lembar 1 dari 2
                            </span>
                            <span>62%</span>
                        </div>
                        <div
                            style={{
                                height: 12,
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: 6,
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    width: '62%',
                                    height: '100%',
                                    background:
                                        'linear-gradient(90deg, var(--pb-primary), #FFEA00)',
                                    borderRadius: 6,
                                    boxShadow:
                                        '0 0 24px rgba(245,250,12,0.6)',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                        {STEPS.map((s, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    color: s.active
                                        ? '#fff'
                                        : s.done
                                          ? 'rgba(255,255,255,0.7)'
                                          : 'rgba(255,255,255,0.35)',
                                    fontWeight: s.active ? 600 : 500,
                                }}
                            >
                                <div
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: s.done
                                            ? 'var(--pb-primary)'
                                            : s.active
                                              ? 'transparent'
                                              : 'rgba(255,255,255,0.08)',
                                        border: s.active
                                            ? '2px solid var(--pb-primary)'
                                            : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {s.done && (
                                        <Icon
                                            name="check"
                                            size={14}
                                            color="#0A0A0A"
                                        />
                                    )}
                                    {s.active && (
                                        <div
                                            className="pb-spin"
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                border: '2px solid var(--pb-primary)',
                                                borderTopColor: 'transparent',
                                            }}
                                        />
                                    )}
                                </div>
                                {s.l}
                            </div>
                        ))}
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
                    Jangan tinggalkan booth — ambil foto di slot keluaran
                    setelah selesai cetak.
                </footer>
            </div>
        </>
    );
}
