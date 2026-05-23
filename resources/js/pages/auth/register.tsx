import { Form, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { AuthBrandPanel } from '@/components/philobooth/auth-brand-panel';
import { Btn } from '@/components/philobooth/btn';
import { Icon } from '@/components/philobooth/icon';
import { Logo } from '@/components/philobooth/logo';
import { useRecaptcha } from '@/hooks/use-recaptcha';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    recaptchaEnabled?: boolean;
    recaptchaSiteKey?: string | null;
};

const FEATURES = [
    'Akses semua fitur admin console',
    'Kelola booth, voucher, dan frame',
    'Monitoring revenue real-time',
];

export default function Register({
    recaptchaEnabled,
    recaptchaSiteKey,
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const { active: recaptchaActive, execute: executeRecaptcha } = useRecaptcha(
        {
            enabled: recaptchaEnabled,
            siteKey: recaptchaSiteKey,
        },
    );

    // Pre-fetch & refresh token agar selalu fresh saat user submit.
    useEffect(() => {
        if (!recaptchaActive) return;

        let cancelled = false;
        const fetchToken = async () => {
            const token = await executeRecaptcha('register');

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
            <Head title="Daftar" />
            <div
                className="pb-root pb-login-shell"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    background: '#FAFAFA',
                }}
            >
                <AuthBrandPanel
                    pill="Buat akun · gratis"
                    heroPrimary="Mulai kelola"
                    heroAccent="booth-mu."
                    subtitle="Daftarkan akun admin philobooth — satu console untuk semua cabang, printer, voucher, dan revenue."
                    features={FEATURES}
                    stats={[
                        { k: '12', v: 'cabang aktif' },
                        { k: '248', v: 'cetakan / hari' },
                        { k: '99.4%', v: 'uptime printer' },
                    ]}
                />

                {/* Right form panel */}
                <main className="pb-login-form">
                    <div className="pb-login-form__inner">
                        <div className="pb-login-form__brand-mobile">
                            <Logo size={28} />
                        </div>

                        <h2 className="pb-login-title">Buat akun baru</h2>
                        <p className="pb-login-desc">
                            Isi data berikut untuk membuat akun admin
                            philobooth.
                        </p>

                        <Form
                            {...store.form()}
                            resetOnSuccess={[
                                'password',
                                'password_confirmation',
                            ]}
                            disableWhileProcessing
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
                                        htmlFor="name"
                                    >
                                        Nama lengkap
                                    </label>
                                    <div className="pb-field">
                                        <Icon
                                            name="user"
                                            size={16}
                                            className="pb-field__icon"
                                        />
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            autoFocus
                                            autoComplete="name"
                                            className="pb-field__input"
                                            placeholder="Nama kamu"
                                            aria-invalid={Boolean(errors.name)}
                                        />
                                    </div>
                                    <InputError
                                        message={errors.name}
                                        className="mb-2"
                                    />

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

                                    <label
                                        className="pb-field-label"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
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
                                            autoComplete="new-password"
                                            className="pb-field__input"
                                            style={{ paddingRight: 44 }}
                                            placeholder="Minimal 8 karakter"
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

                                    <label
                                        className="pb-field-label"
                                        htmlFor="password_confirmation"
                                    >
                                        Konfirmasi password
                                    </label>
                                    <div className="pb-field">
                                        <Icon
                                            name="lock"
                                            size={16}
                                            className="pb-field__icon"
                                        />
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={
                                                showConfirm
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                            autoComplete="new-password"
                                            className="pb-field__input"
                                            style={{ paddingRight: 44 }}
                                            placeholder="Ulangi password"
                                            aria-invalid={Boolean(
                                                errors.password_confirmation,
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirm((v) => !v)
                                            }
                                            className="pb-field__action"
                                            aria-label={
                                                showConfirm
                                                    ? 'Sembunyikan konfirmasi'
                                                    : 'Tampilkan konfirmasi'
                                            }
                                        >
                                            <Icon
                                                name={
                                                    showConfirm
                                                        ? 'eye-off'
                                                        : 'eye'
                                                }
                                                size={16}
                                            />
                                        </button>
                                    </div>
                                    <InputError
                                        message={errors.password_confirmation}
                                        className="mb-2"
                                    />

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
                                        style={{ marginTop: 10 }}
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
                                        {processing
                                            ? 'Membuat akun…'
                                            : 'Buat akun'}
                                    </Btn>
                                </>
                            )}
                        </Form>

                        <div
                            style={{
                                marginTop: 18,
                                fontSize: 13,
                                color: 'var(--pb-text-muted)',
                                textAlign: 'center',
                            }}
                        >
                            Sudah punya akun?{' '}
                            <a href="/login" className="pb-link-subtle">
                                Masuk di sini
                            </a>
                        </div>

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
