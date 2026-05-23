import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Icon } from '@/components/philobooth/icon';
import {
    KioskFooter,
    KioskHeader,
} from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

const CODE_LENGTH = 8;
const KEYS_LETTERS = [
    'Q',
    'W',
    'E',
    'R',
    'T',
    'Y',
    'U',
    'I',
    'O',
    'P',
    'A',
    'S',
    'D',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'Z',
    'X',
    'C',
    'V',
    'B',
    'N',
    'M',
];
const KEYS_NUM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

type Flash = { errors?: Record<string, string> };

export default function KioskVoucher() {
    const { errors: serverErrors } = usePage<Flash>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
    });

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const k = e.key.toUpperCase();

            if (k === 'BACKSPACE') {
                backspace();

                return;
            }

            if (k === 'ENTER') {
                submit();

                return;
            }

            if (/^[A-Z0-9]$/.test(k)) {
                append(k);
            }
        }

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function append(ch: string) {
        setData((prev) => ({
            ...prev,
            code:
                prev.code.length >= CODE_LENGTH
                    ? prev.code
                    : prev.code + ch,
        }));
    }

    function backspace() {
        setData((prev) => ({ ...prev, code: prev.code.slice(0, -1) }));
    }

    function submit() {
        post('/kiosk/voucher/apply', {
            preserveScroll: true,
            onError: () => {
                /* errors auto-shown */
            },
        });
    }

    const codeError = errors.code ?? (serverErrors as any)?.code;
    const filled = data.code.length;
    const isReady = filled === CODE_LENGTH;

    return (
        <>
            <Head title="Voucher — Philobooth" />
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
                        padding:
                            'clamp(24px, 3vw, 40px) clamp(40px, 6vw, 120px)',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
                        gap: 'clamp(40px, 5vw, 80px)',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 'clamp(11px, 1vw, 13px)',
                                fontWeight: 700,
                                color: 'var(--pb-text-faint)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.18em',
                                marginBottom: 'clamp(12px, 1.5vw, 18px)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <span
                                style={{
                                    width: 28,
                                    height: 1,
                                    background: 'var(--pb-text-faint)',
                                }}
                            />
                            Langkah 2 · Voucher
                        </div>

                        <h2
                            style={{
                                fontSize: 'clamp(32px, 4.5vw, 56px)',
                                fontWeight: 700,
                                letterSpacing: '-0.035em',
                                lineHeight: 1.05,
                                margin: '0 0 16px',
                            }}
                        >
                            Masukkan kode voucher
                        </h2>
                        <p
                            style={{
                                fontSize: 'clamp(15px, 1.3vw, 19px)',
                                color: 'var(--pb-text-muted)',
                                margin: '0 0 28px',
                                lineHeight: 1.5,
                            }}
                        >
                            Kode 8 karakter ada di balik kartu hadiah atau di
                            email konfirmasi event.
                        </p>

                        <div
                            style={{
                                background:
                                    'linear-gradient(135deg, #0A0A0A 0%, #1f1f1f 100%)',
                                color: '#fff',
                                borderRadius: 18,
                                padding: 22,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 18,
                                marginBottom: 16,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    right: -30,
                                    top: -30,
                                    width: 140,
                                    height: 140,
                                    borderRadius: '50%',
                                    background: 'var(--pb-primary)',
                                    opacity: 0.18,
                                }}
                            />
                            <div
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 12,
                                    background: 'var(--pb-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    position: 'relative',
                                    zIndex: 1,
                                    color: 'var(--pb-ink)',
                                }}
                            >
                                <Icon name="ticket" size={26} />
                            </div>
                            <div
                                style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    flex: 1,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'rgba(255,255,255,0.6)',
                                        marginBottom: 4,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Cara pakai
                                </div>
                                <div
                                    style={{ fontSize: 16, fontWeight: 600 }}
                                >
                                    Ketik kode → tap{' '}
                                    <span
                                        style={{ color: 'var(--pb-primary)' }}
                                    >
                                        Validasi
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'rgba(255,255,255,0.55)',
                                        marginTop: 4,
                                    }}
                                >
                                    Huruf besar/kecil tidak masalah · 8 karakter
                                </div>
                            </div>
                        </div>

                        {codeError ? (
                            <div
                                style={{
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.35)',
                                    borderRadius: 12,
                                    padding: 14,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    color: '#B91C1C',
                                }}
                            >
                                <Icon name="info" size={18} />
                                <span style={{ fontSize: 14 }}>
                                    {codeError}
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{
                                    background: 'rgba(245,250,12,0.16)',
                                    border: '1px solid rgba(245,250,12,0.5)',
                                    borderRadius: 12,
                                    padding: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                <Icon name="info" size={18} />
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--pb-text)',
                                    }}
                                >
                                    Sisa nominal voucher otomatis tercatat
                                    sebagai saldo philobooth.
                                </span>
                            </div>
                        )}
                    </div>

                    <div>
                        {/* PIN slots */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 10,
                                justifyContent: 'center',
                                marginBottom: 28,
                            }}
                        >
                            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                                const ch = data.code[i];
                                const isCursor = !ch && i === filled;

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            width: 'clamp(56px, 6vw, 80px)',
                                            height: 'clamp(80px, 8vw, 110px)',
                                            borderRadius: 14,
                                            background: ch
                                                ? '#fff'
                                                : isCursor
                                                  ? '#fff'
                                                  : '#fff',
                                            border: ch
                                                ? '3px solid var(--pb-primary)'
                                                : isCursor
                                                  ? '3px solid var(--pb-ink)'
                                                  : '1.5px solid var(--pb-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize:
                                                'clamp(28px, 3vw, 42px)',
                                            fontWeight: 700,
                                            color: 'var(--pb-ink)',
                                            fontFamily: 'monospace',
                                            boxShadow: ch
                                                ? '0 4px 16px rgba(245,250,12,0.22)'
                                                : 'var(--pb-shadow-sm)',
                                            transition:
                                                'border-color 120ms ease, box-shadow 120ms ease',
                                        }}
                                    >
                                        {ch ?? ''}
                                        {isCursor && (
                                            <div
                                                className="pb-pulse"
                                                style={{
                                                    width: 3,
                                                    height: '50%',
                                                    background:
                                                        'var(--pb-ink)',
                                                    borderRadius: 2,
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Keyboard */}
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 20,
                                padding: 18,
                                border: '1px solid var(--pb-border)',
                                boxShadow: 'var(--pb-shadow)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(8, 1fr)',
                                gap: 8,
                            }}
                        >
                            {[...KEYS_LETTERS, ...KEYS_NUM].map((k) => (
                                <KeyBtn key={k} onClick={() => append(k)}>
                                    {k}
                                </KeyBtn>
                            ))}

                            <button
                                type="button"
                                onClick={backspace}
                                disabled={filled === 0}
                                style={{
                                    gridColumn: 'span 4',
                                    height: 56,
                                    background: '#0A0A0A',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    cursor:
                                        filled === 0 ? 'default' : 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    opacity: filled === 0 ? 0.45 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'transform 120ms ease',
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform =
                                        'scale(0.97)';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform =
                                        'scale(1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                        'scale(1)';
                                }}
                            >
                                <Icon name="arrow-right" size={16} style={{ transform: 'rotate(180deg)' }} />
                                Hapus
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={!isReady || processing}
                                style={{
                                    gridColumn: 'span 4',
                                    height: 56,
                                    background: isReady
                                        ? 'var(--pb-primary)'
                                        : '#E6E6E6',
                                    color: isReady
                                        ? '#0A0A0A'
                                        : 'var(--pb-text-faint)',
                                    border: 'none',
                                    borderRadius: 12,
                                    cursor:
                                        isReady && !processing
                                            ? 'pointer'
                                            : 'not-allowed',
                                    fontFamily: 'inherit',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    transition:
                                        'background 160ms ease, transform 120ms ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                                onMouseDown={(e) => {
                                    if (isReady && !processing) {
                                        e.currentTarget.style.transform =
                                            'scale(0.97)';
                                    }
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform =
                                        'scale(1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                        'scale(1)';
                                }}
                            >
                                {processing
                                    ? 'Memvalidasi…'
                                    : 'Validasi voucher'}
                                {isReady && !processing && (
                                    <Icon name="check" size={18} />
                                )}
                            </button>
                        </div>

                        <div
                            style={{
                                marginTop: 14,
                                textAlign: 'center',
                                fontSize: 12,
                                color: 'var(--pb-text-faint)',
                            }}
                        >
                            Tips: bisa juga ketik pakai keyboard fisik
                        </div>
                    </div>
                </main>
                <KioskFooter
                    back="← Ganti metode bayar"
                    next={isReady ? 'Validasi' : ''}
                    nextIcon="check"
                />
            </KioskScene>
        </>
    );
}

function KeyBtn({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                aspectRatio: '1/1',
                background: '#FAFAFA',
                border: '1px solid var(--pb-border)',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'clamp(18px, 1.5vw, 22px)',
                fontWeight: 600,
                color: 'var(--pb-ink)',
                minHeight: 56,
                transition:
                    'background 120ms ease, transform 120ms ease, border-color 120ms ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#D4D4D4';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FAFAFA';
                e.currentTarget.style.borderColor = 'var(--pb-border)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
                e.currentTarget.style.background = 'var(--pb-primary)';
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#FAFAFA';
            }}
        >
            {children}
        </button>
    );
}
