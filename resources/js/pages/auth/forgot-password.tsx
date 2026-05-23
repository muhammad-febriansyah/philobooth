import { Form, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { AuthBrandPanel } from '@/components/philobooth/auth-brand-panel';
import { Btn } from '@/components/philobooth/btn';
import { Icon } from '@/components/philobooth/icon';
import { Logo } from '@/components/philobooth/logo';
import { useRecaptcha } from '@/hooks/use-recaptcha';
import { email as emailRoute } from '@/routes/password';

type Props = {
    status?: string;
    recaptchaEnabled?: boolean;
    recaptchaSiteKey?: string | null;
};

const FEATURES = [
    'Kirim link reset ke email kamu',
    'Link aman, valid 60 menit',
    'Tidak butuh data tambahan',
];

export default function ForgotPassword({
    status,
    recaptchaEnabled,
    recaptchaSiteKey,
}: Props) {
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
            const token = await executeRecaptcha('forgot_password');

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
            <Head title="Lupa password" />
            <div
                className="pb-root pb-login-shell"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    background: '#FAFAFA',
                }}
            >
                <AuthBrandPanel
                    pill="Reset password · aman"
                    heroPrimary="Lupa"
                    heroAccent="password?"
                    subtitle="Tenang — masukkan email akun kamu, kami kirim link reset password ke kotak masuk."
                    features={FEATURES}
                    stats={[
                        { k: '60 min', v: 'link valid' },
                        { k: 'SSL', v: 'koneksi aman' },
                        { k: '24/7', v: 'support' },
                    ]}
                />

                {/* Right form panel */}
                <main className="pb-login-form">
                    <div className="pb-login-form__inner">
                        <div className="pb-login-form__brand-mobile">
                            <Logo size={28} />
                        </div>

                        <h2 className="pb-login-title">Reset password</h2>
                        <p className="pb-login-desc">
                            Masukkan email akun kamu, link reset password akan
                            dikirim ke alamat tersebut.
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
                            {...emailRoute.form()}
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
                                            ? 'Mengirim…'
                                            : 'Kirim link reset'}
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
                            Ingat password lagi?{' '}
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
