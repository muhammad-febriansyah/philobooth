import { Form, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Btn } from '@/components/philobooth/btn';
import { Icon } from '@/components/philobooth/icon';
import { Logo } from '@/components/philobooth/logo';
import { useRecaptcha } from '@/hooks/use-recaptcha';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
    recaptchaEnabled?: boolean;
    recaptchaSiteKey?: string | null;
};

const FEATURES = [
    'Pantau printer & cetakan real-time',
    'Kelola voucher, frame, dan transaksi',
    'Insight revenue lintas cabang',
];

export default function Login({
    status,
    canResetPassword,
    recaptchaEnabled,
    recaptchaSiteKey,
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const { active: recaptchaActive, execute: executeRecaptcha } = useRecaptcha(
        {
            enabled: recaptchaEnabled,
            siteKey: recaptchaSiteKey,
        },
    );

    // Pre-fetch & refresh token agar selalu fresh saat user submit.
    // Google reCAPTCHA v3 token valid ~2 menit, kita refresh 100 detik.
    useEffect(() => {
        if (!recaptchaActive) return;

        let cancelled = false;
        const fetchToken = async () => {
            const token = await executeRecaptcha('login');

            if (!cancelled) setRecaptchaToken(token);
        };

        fetchToken();
        const id = setInterval(fetchToken, 100_000);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recaptchaActive]);

    return (
        <>
            <Head title="Masuk" />
            <div
                className="pb-root pb-login-shell"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    background: '#FAFAFA',
                }}
            >
                {/* Left brand panel — visible on desktop */}
                <aside className="pb-login-brand" aria-hidden="true">
                    <div className="pb-login-brand__pattern" />
                    <div className="pb-login-brand__glow pb-login-brand__glow--tr" />
                    <div className="pb-login-brand__glow pb-login-brand__glow--bl" />

                    <div className="pb-login-brand__top">
                        <Logo size={30} dark />
                    </div>

                    <div className="pb-login-brand__body">
                        <span className="pb-login-pill">
                            <Icon
                                name="sparkles"
                                size={14}
                                color="var(--pb-primary)"
                            />
                            Admin console · v2.1
                        </span>
                        <h1 className="pb-login-hero">
                            Kelola setiap{' '}
                            <span className="pb-login-hero__accent">
                                booth.
                            </span>
                        </h1>
                        <p className="pb-login-sub">
                            Satu dashboard untuk printer, transaksi, voucher,
                            dan revenue di seluruh cabang philobooth.
                        </p>

                        <ul className="pb-login-features">
                            {FEATURES.map((f) => (
                                <li key={f}>
                                    <span className="pb-login-features__dot">
                                        <Icon
                                            name="check"
                                            size={12}
                                            color="#0A0A0A"
                                        />
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pb-login-brand__footer">
                        <div className="pb-login-stat">
                            <div className="pb-login-stat__k">12</div>
                            <div className="pb-login-stat__v">cabang aktif</div>
                        </div>
                        <div className="pb-login-stat">
                            <div className="pb-login-stat__k">248</div>
                            <div className="pb-login-stat__v">
                                cetakan / hari
                            </div>
                        </div>
                        <div className="pb-login-stat">
                            <div className="pb-login-stat__k">99.4%</div>
                            <div className="pb-login-stat__v">
                                uptime printer
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right form panel */}
                <main className="pb-login-form">
                    <div className="pb-login-form__inner">
                        <div className="pb-login-form__brand-mobile">
                            <Logo size={28} />
                        </div>

                        <h2 className="pb-login-title">
                            Selamat datang kembali
                        </h2>
                        <p className="pb-login-desc">
                            Masuk ke admin dashboard philobooth.
                        </p>

                        {status && (
                            <div
                                role="status"
                                style={{
                                    marginBottom: 16,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: 'rgba(22,163,74,0.10)',
                                    color: '#166534',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <Icon name="check-circle" size={16} />
                                {status}
                            </div>
                        )}

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            {({ processing, errors }) => (
                                <>
                                    {recaptchaActive && (
                                        <input
                                            type="hidden"
                                            name="recaptcha_token"
                                            value={recaptchaToken}
                                        />
                                    )}
                                    <label
                                        className="pb-field-label"
                                        htmlFor="email"
                                    >
                                        Email
                                    </label>
                                    <div className="pb-field">
                                        <Icon
                                            name="mail"
                                            size={16}
                                            className="pb-field__icon"
                                        />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            className="pb-field__input"
                                            placeholder="admin@philobooth.id"
                                            aria-invalid={Boolean(errors.email)}
                                        />
                                    </div>
                                    <InputError
                                        message={errors.email}
                                        className="mb-2"
                                    />

                                    <div className="pb-field-row">
                                        <label
                                            className="pb-field-label"
                                            htmlFor="password"
                                        >
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <a
                                                href="/forgot-password"
                                                className="pb-link-subtle"
                                            >
                                                Lupa password?
                                            </a>
                                        )}
                                    </div>
                                    <div className="pb-field">
                                        <Icon
                                            name="lock"
                                            size={16}
                                            className="pb-field__icon"
                                        />
                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                            autoComplete="current-password"
                                            className="pb-field__input"
                                            style={{ paddingRight: 44 }}
                                            placeholder="••••••••••"
                                            aria-invalid={Boolean(
                                                errors.password,
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                            className="pb-field__action"
                                            aria-label={
                                                showPassword
                                                    ? 'Sembunyikan password'
                                                    : 'Tampilkan password'
                                            }
                                        >
                                            <Icon
                                                name={
                                                    showPassword
                                                        ? 'eye-off'
                                                        : 'eye'
                                                }
                                                size={16}
                                            />
                                        </button>
                                    </div>
                                    <InputError
                                        message={errors.password}
                                        className="mb-2"
                                    />

                                    <label className="pb-check">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            defaultChecked
                                        />
                                        <span className="pb-check__box">
                                            <Icon name="check" size={11} />
                                        </span>
                                        <span>Tetap masuk di perangkat ini</span>
                                    </label>

                                    <Btn
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        full
                                        iconRight={
                                            processing
                                                ? undefined
                                                : 'arrow-right'
                                        }
                                        disabled={processing}
                                        style={{ marginTop: 6 }}
                                    >
                                        {processing && (
                                            <span
                                                className="pb-spin"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                }}
                                                aria-hidden
                                            >
                                                <Icon
                                                    name="refresh"
                                                    size={18}
                                                />
                                            </span>
                                        )}
                                        {processing ? 'Memproses…' : 'Masuk'}
                                    </Btn>

                                    {processing && <LoginLoadingOverlay />}
                                </>
                            )}
                        </Form>

                        <div className="pb-login-secure">
                            <Icon name="lock" size={12} />
                            Koneksi terenkripsi · SSL aktif
                            {recaptchaActive && ' · reCAPTCHA aktif'}
                        </div>
                        {recaptchaActive && (
                            <div
                                style={{
                                    fontSize: 10,
                                    color: 'var(--pb-text-faint)',
                                    marginTop: 8,
                                    lineHeight: 1.4,
                                }}
                            >
                                Situs ini dilindungi reCAPTCHA. Tunduk pada{' '}
                                <a
                                    href="https://policies.google.com/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    Privacy
                                </a>{' '}
                                &amp;{' '}
                                <a
                                    href="https://policies.google.com/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    Terms
                                </a>{' '}
                                Google.
                            </div>
                        )}

                        <p className="pb-login-foot">
                            © 2026 philobooth · butuh bantuan?{' '}
                            <a
                                href="mailto:support@philobooth.id"
                                className="pb-link-subtle"
                            >
                                support@philobooth.id
                            </a>
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}

function LoginLoadingOverlay() {
    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10,10,10,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999,
                animation: 'pb-fade-in 180ms ease-out',
            }}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: 18,
                    padding: '24px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow:
                        '0 24px 60px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.04)',
                    minWidth: 280,
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--pb-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 0 0 4px rgba(245,250,12,0.18)',
                    }}
                >
                    <span
                        className="pb-spin"
                        style={{ display: 'inline-flex', color: '#0A0A0A' }}
                        aria-hidden
                    >
                        <Icon name="refresh" size={20} />
                    </span>
                </div>
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: -0.2,
                        }}
                    >
                        Memverifikasi akun…
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--pb-text-muted)',
                            marginTop: 2,
                        }}
                    >
                        Tunggu sebentar, kami sedang menyiapkan dashboard.
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes pb-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
