import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type Props = {
    session: {
        session_code: string;
        final_amount: number;
        total_amount: number;
        discount_amount: number;
        print_quantity: number;
        payment_method: string | null;
        session_type?: 'photo' | 'stop_motion_video' | null;
    };
    composite_url?: string | null;
    video_url?: string | null;
    frame: {
        id: number;
        name: string;
        photo_slots: number;
        thumbnail_url: string | null;
        image_size: { width: number; height: number } | null;
    } | null;
    frame_category?: string | null;
    paper?: { code: string; name: string } | null;
    filter_label?: string;
};

const METHOD_LABEL: Record<string, string> = {
    qris_doku: 'QRIS · DOKU',
    qris_manual: 'QRIS · Scan',
    voucher: 'Voucher',
    cash: 'Tunai',
};

export default function KioskConfirm({
    session,
    composite_url,
    video_url,
    frame,
    frame_category,
    paper,
    filter_label,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const isVideo = session.session_type === 'stop_motion_video';

    function submit() {
        setProcessing(true);
        router.post(
            '/kiosk/complete',
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    const aspect = frame?.image_size
        ? `${frame.image_size.width} / ${frame.image_size.height}`
        : '3 / 4';
    const aspectValue = frame?.image_size
        ? frame.image_size.width / frame.image_size.height
        : 0.75;

    return (
        <>
            <Head title="Konfirmasi — Philobooth" />
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
                                maxWidth: `calc(78vh * ${aspectValue})`,
                                background: '#fff',
                                borderRadius: 18,
                                overflow: 'hidden',
                                boxShadow:
                                    '0 24px 56px rgba(10,10,10,0.18), 0 4px 12px rgba(10,10,10,0.06)',
                                aspectRatio: aspect,
                            }}
                        >
                            {isVideo && video_url ? (
                                <video
                                    src={video_url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                        background: '#000',
                                    }}
                                />
                            ) : composite_url ? (
                                <img
                                    src={composite_url}
                                    alt={frame?.name ?? 'Hasil'}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--pb-text-faint)',
                                        fontSize: 14,
                                    }}
                                >
                                    {isVideo
                                        ? 'Video belum siap'
                                        : 'Composite belum siap'}
                                </div>
                            )}
                            {!isVideo && session.print_quantity > 1 && (
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
                            )}
                        </div>
                    </div>

                    {/* RIGHT — copy + detail + CTA */}
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
                            Langkah 8 · Konfirmasi
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
                            Siap{' '}
                            <em
                                style={{
                                    fontStyle: 'italic',
                                    fontWeight: 700,
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                {isVideo ? 'simpan video?' : 'dicetak?'}
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
                                        height: '0.18em',
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
                            {isVideo
                                ? 'Boomerang sudah jadi. Klik tombol di bawah untuk menyelesaikan sesi dan dapatkan link download.'
                                : 'Cek detail di bawah. Setelah cetak, foto tidak bisa diubah lagi.'}
                        </p>

                        {/* Detail card */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 18,
                                border: '1px solid var(--pb-border)',
                                overflow: 'hidden',
                                marginBottom: 16,
                                boxShadow:
                                    '0 4px 16px rgba(10,10,10,0.04)',
                            }}
                        >
                            <Row
                                label="Order ID"
                                value={session.session_code}
                                mono
                            />
                            <Row
                                label="Frame"
                                value={
                                    frame
                                        ? `${frame.name}${frame_category ? ' · ' + frame_category : ''}`
                                        : '—'
                                }
                            />
                            <Row
                                label="Paper size"
                                value={
                                    paper ? `${paper.code} · ${paper.name}` : '—'
                                }
                            />
                            <Row
                                label="Filter"
                                value={filter_label ?? 'Tidak ada'}
                            />
                            <Row
                                label="Foto"
                                value={`${frame?.photo_slots ?? 0} pose`}
                            />
                            {!isVideo && (
                                <Row
                                    label="Jumlah cetak"
                                    value={`${session.print_quantity} lembar`}
                                />
                            )}
                            <Row
                                label="Metode bayar"
                                value={
                                    METHOD_LABEL[
                                        session.payment_method ?? ''
                                    ] ?? '—'
                                }
                            />
                        </div>

                        {/* Status: sudah lunas */}
                        <div
                            style={{
                                background: 'rgba(22,163,74,0.08)',
                                border: '1px solid rgba(22,163,74,0.28)',
                                borderRadius: 16,
                                padding: 'clamp(14px, 1.8vw, 20px)',
                                marginBottom: 20,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: '#16A34A',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Icon name="check" size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        color: '#15803D',
                                    }}
                                >
                                    Pembayaran lunas
                                </div>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#166534',
                                        marginTop: 2,
                                    }}
                                >
                                    {isVideo
                                        ? 'Semua sudah dibayar — boomerang siap.'
                                        : 'Semua sudah dibayar — siap dicetak.'}
                                </div>
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
                            <Icon name={isVideo ? 'check-circle' : 'printer'} size={22} />
                            {processing
                                ? isVideo
                                    ? 'Menyimpan…'
                                    : 'Mengirim ke printer…'
                                : isVideo
                                    ? 'Selesai & lanjut download'
                                    : 'Cetak sekarang'}
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
                            onClick={() => history.back()}
                            style={{
                                marginTop: 10,
                                alignSelf: 'flex-start',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--pb-text-faint)',
                                fontSize: 12,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >
                            ← Kembali ubah detail
                        </button>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}

function Row({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                fontSize: 14,
                borderBottom: '1px solid var(--pb-border)',
            }}
        >
            <span style={{ color: 'var(--pb-text-muted)', fontWeight: 500 }}>
                {label}
            </span>
            <span
                style={{
                    fontWeight: 700,
                    color: 'var(--pb-ink)',
                    fontFamily: mono ? 'monospace' : 'inherit',
                    fontSize: mono ? 13 : 14,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '60%',
                }}
                title={value}
            >
                {value}
            </span>
        </div>
    );
}
