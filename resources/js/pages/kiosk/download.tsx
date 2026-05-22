import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type Props = {
    session?: {
        session_code: string;
        final_amount: number;
        payment_method: string | null;
        print_quantity: number;
    };
    download_url?: string | null;
    final_url?: string | null;
    qr_url?: string | null;
};

const METHOD_LABEL: Record<string, string> = {
    qris_doku: 'QRIS · DOKU',
    qris_manual: 'QRIS · Scan',
    voucher: 'Voucher',
    cash: 'Tunai',
};

export default function KioskDownload({
    session,
    download_url,
    final_url,
    qr_url,
}: Props) {
    const [copied, setCopied] = useState(false);
    const [remaining, setRemaining] = useState(60); // 60 detik countdown auto-finish
    const [email, setEmail] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const shortUrl = download_url
        ? download_url.replace(/^https?:\/\//, '')
        : '—';

    // Auto-finish countdown
    useEffect(() => {
        const t = setInterval(() => {
            setRemaining((s) => {
                if (s <= 1) {
                    clearInterval(t);

                    return 0;
                }

                return s - 1;
            });
        }, 1000);

        return () => clearInterval(t);
    }, []);

    function sendEmail() {
        if (!email.trim()) {
            setEmailError('Email wajib diisi.');

            return;
        }
        setEmailSending(true);
        setEmailError(null);
        router.post(
            '/kiosk/email-receipt',
            { email: email.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEmailSent(true);
                },
                onError: (errors) => {
                    setEmailError(errors.email ?? 'Gagal kirim email.');
                },
                onFinish: () => setEmailSending(false),
            },
        );
    }

    function copyLink() {
        if (!download_url) return;
        navigator.clipboard.writeText(download_url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function finish() {
        router.post('/kiosk/cancel');
    }

    return (
        <>
            <Head title="Download — Kiosk" />
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
                            'minmax(0, 0.95fr) minmax(0, 1.05fr)',
                        gap: 'clamp(20px, 3vw, 40px)',
                        alignItems: 'start',
                        maxWidth: 1600,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    {/* LEFT — Composite preview + actions */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
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
                            }}
                        >
                            <span
                                style={{
                                    width: 28,
                                    height: 1,
                                    background: 'var(--pb-text-faint)',
                                }}
                            />
                            Selesai · Hasilmu siap
                        </div>

                        <h1
                            style={{
                                fontSize: 'clamp(28px, 4.4vw, 56px)',
                                fontWeight: 700,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.02,
                                margin: 0,
                            }}
                        >
                            Foto kamu{' '}
                            <em
                                style={{
                                    fontStyle: 'italic',
                                    fontWeight: 700,
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                jadi
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
                            !
                        </h1>

                        <p
                            style={{
                                fontSize: 'clamp(13px, 1.1vw, 16px)',
                                color: 'var(--pb-text-muted)',
                                margin: 0,
                                lineHeight: 1.45,
                            }}
                        >
                            Cetakan keluar di slot bawah booth. Scan QR di
                            kanan buat simpan versi digital ke HP kamu.
                        </p>

                        {/* Preview image */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 18,
                                padding: 14,
                                border: '1px solid var(--pb-border)',
                                boxShadow:
                                    '0 12px 32px rgba(10,10,10,0.10), 0 2px 6px rgba(10,10,10,0.04)',
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            {final_url ? (
                                <img
                                    src={final_url}
                                    alt="Hasil cetak"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '52vh',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        padding: 60,
                                        color: 'var(--pb-text-faint)',
                                    }}
                                >
                                    Hasil belum tersedia
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 10,
                            }}
                        >
                            <a
                                href={
                                    download_url
                                        ? `${download_url}/file`
                                        : final_url ?? '#'
                                }
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: '14px 18px',
                                    background: 'var(--pb-ink)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                }}
                            >
                                <Icon name="download" size={16} />
                                Download foto (PNG)
                            </a>
                            <button
                                type="button"
                                onClick={copyLink}
                                disabled={!download_url}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: '14px 18px',
                                    background: '#fff',
                                    color: 'var(--pb-ink)',
                                    border: '1.5px solid var(--pb-border)',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: download_url
                                        ? 'pointer'
                                        : 'not-allowed',
                                    opacity: download_url ? 1 : 0.5,
                                    fontFamily: 'inherit',
                                }}
                            >
                                <Icon
                                    name={copied ? 'check' : 'copy'}
                                    size={16}
                                />
                                {copied ? 'Tersalin!' : 'Salin link'}
                            </button>
                        </div>

                        {/* Email section */}
                        <div
                            style={{
                                marginTop: 8,
                                padding: 14,
                                background: emailSent
                                    ? 'rgba(22,163,74,0.08)'
                                    : '#fff',
                                border: emailSent
                                    ? '1px solid rgba(22,163,74,0.3)'
                                    : '1px solid var(--pb-border)',
                                borderRadius: 14,
                                transition:
                                    'background 200ms ease, border 200ms ease',
                            }}
                        >
                            {emailSent ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <Icon
                                        name="check-circle"
                                        size={20}
                                        color="#16A34A"
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#15803D',
                                            }}
                                        >
                                            Email terkirim
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: '#166534',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Cek inbox / spam ya
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <Icon name="mail" size={14} />
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: 'var(--pb-ink)',
                                            }}
                                        >
                                            Kirim ke email juga? (opsional)
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 6,
                                        }}
                                    >
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setEmailError(null);
                                            }}
                                            placeholder="email@contoh.com"
                                            disabled={emailSending}
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                padding: '10px 12px',
                                                fontSize: 13,
                                                fontFamily: 'inherit',
                                                background: '#FAFAFA',
                                                border: emailError
                                                    ? '1px solid #EF4444'
                                                    : '1px solid var(--pb-border)',
                                                borderRadius: 8,
                                                outline: 'none',
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={sendEmail}
                                            disabled={
                                                emailSending || !email.trim()
                                            }
                                            style={{
                                                padding: '10px 14px',
                                                background: 'var(--pb-ink)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor:
                                                    emailSending ||
                                                    !email.trim()
                                                        ? 'not-allowed'
                                                        : 'pointer',
                                                opacity:
                                                    emailSending ||
                                                    !email.trim()
                                                        ? 0.5
                                                        : 1,
                                                fontFamily: 'inherit',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {emailSending
                                                ? 'Kirim…'
                                                : 'Kirim'}
                                        </button>
                                    </div>
                                    {emailError && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: '#DC2626',
                                                marginTop: 6,
                                            }}
                                        >
                                            {emailError}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: 'var(--pb-text-faint)',
                                            marginTop: 6,
                                        }}
                                    >
                                        Kami kirim link unduh + struk ke
                                        email kamu.
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — QR + receipt */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            minWidth: 0,
                        }}
                    >
                        {/* QR card */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 22,
                                padding: 'clamp(20px, 2.4vw, 28px)',
                                border: '1px solid var(--pb-border)',
                                boxShadow:
                                    '0 24px 56px rgba(10,10,10,0.08), 0 4px 12px rgba(10,10,10,0.04)',
                                position: 'relative',
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
                                Simpan versi digital
                            </div>
                            <div
                                style={{
                                    fontSize: 'clamp(22px, 2vw, 28px)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    marginBottom: 14,
                                    lineHeight: 1.05,
                                }}
                            >
                                Scan QR pakai HP kamu
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: 18,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div
                                    style={{
                                        flexShrink: 0,
                                        background: '#fff',
                                        border: '1px solid var(--pb-border)',
                                        padding: 10,
                                        borderRadius: 14,
                                        width: 180,
                                        height: 180,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {qr_url ? (
                                        <img
                                            src={qr_url}
                                            alt="QR Code"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    ) : (
                                        <Icon
                                            name="qr"
                                            size={64}
                                            color="var(--pb-text-faint)"
                                        />
                                    )}
                                </div>

                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        fontSize: 13,
                                        color: 'var(--pb-text-muted)',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <Icon
                                            name="sparkles"
                                            size={14}
                                            color="#16A34A"
                                        />
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#16A34A',
                                            }}
                                        >
                                            Aktif 7 hari
                                        </span>
                                    </div>
                                    Berisi versi resolusi tinggi tanpa watermark.
                                    Bisa repost di Instagram &amp; story.

                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: 8,
                                            background: '#FAFAFA',
                                            borderRadius: 8,
                                            border: '1px solid var(--pb-border)',
                                            fontSize: 11,
                                            fontFamily: 'monospace',
                                            color: 'var(--pb-text-muted)',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {shortUrl}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Receipt card */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 22,
                                padding: 'clamp(18px, 2.2vw, 24px)',
                                border: '1px solid var(--pb-border)',
                                boxShadow:
                                    '0 4px 16px rgba(10,10,10,0.04)',
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
                                Struk pesanan
                            </div>
                            <ReceiptRow
                                label="Order ID"
                                value={session?.session_code ?? '—'}
                                mono
                            />
                            <ReceiptRow
                                label="Jumlah cetak"
                                value={`${session?.print_quantity ?? 1} lembar`}
                            />
                            <ReceiptRow
                                label="Metode"
                                value={
                                    METHOD_LABEL[
                                        session?.payment_method ?? ''
                                    ] ?? '—'
                                }
                            />
                            <ReceiptRow
                                label="Status"
                                value="Lunas"
                                accent="green"
                            />
                        </div>

                        {/* Finish CTA */}
                        <button
                            type="button"
                            onClick={finish}
                            style={{
                                width: '100%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                padding:
                                    'clamp(16px, 1.8vw, 20px) clamp(24px, 2.5vw, 32px)',
                                background: 'var(--pb-primary)',
                                color: 'var(--pb-ink)',
                                border: 'none',
                                borderRadius: 999,
                                fontSize: 'clamp(15px, 1.3vw, 17px)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow:
                                    '0 1px 2px rgba(10,10,10,0.08), 0 12px 28px rgba(245,250,12,0.45)',
                            }}
                        >
                            <Icon name="check" size={20} />
                            Selesai{' '}
                            {remaining > 0 && (
                                <span
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.65,
                                        fontWeight: 600,
                                    }}
                                >
                                    (auto {remaining}s)
                                </span>
                            )}
                        </button>

                        <div
                            style={{
                                fontSize: 11,
                                color: 'var(--pb-text-faint)',
                                textAlign: 'center',
                                marginTop: -6,
                            }}
                        >
                            Tag <strong>@philobooth.id</strong> kalau repost ✨
                        </div>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}

function ReceiptRow({
    label,
    value,
    mono,
    accent,
}: {
    label: string;
    value: string;
    mono?: boolean;
    accent?: 'green';
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 0',
                fontSize: 13,
            }}
        >
            <span style={{ color: 'var(--pb-text-muted)' }}>{label}</span>
            <span
                style={{
                    fontWeight: 700,
                    fontFamily: mono ? 'monospace' : 'inherit',
                    fontSize: mono ? 12 : 13,
                    color: accent === 'green' ? '#16A34A' : undefined,
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
