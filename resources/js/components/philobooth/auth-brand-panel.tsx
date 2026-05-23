import { Icon } from '@/components/philobooth/icon';
import { Logo } from '@/components/philobooth/logo';

type Stat = { k: string; v: string };

type Props = {
    pill?: string;
    heroPrimary: string;
    heroAccent: string;
    subtitle: string;
    features?: string[];
    stats?: Stat[];
};

/**
 * Brand panel kiri untuk halaman auth (login / register / forgot-password).
 * Layout split-screen — pakai class CSS pb-login-* dari app.css.
 */
export function AuthBrandPanel({
    pill = 'Admin console · v2.1',
    heroPrimary,
    heroAccent,
    subtitle,
    features = [],
    stats = [],
}: Props) {
    return (
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
                    {pill}
                </span>
                <h1 className="pb-login-hero">
                    {heroPrimary}{' '}
                    <span className="pb-login-hero__accent">{heroAccent}</span>
                </h1>
                <p className="pb-login-sub">{subtitle}</p>

                {features.length > 0 && (
                    <ul className="pb-login-features">
                        {features.map((f) => (
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
                )}
            </div>

            {stats.length > 0 && (
                <div className="pb-login-brand__footer">
                    {stats.map((s) => (
                        <div key={s.k + s.v} className="pb-login-stat">
                            <div className="pb-login-stat__k">{s.k}</div>
                            <div className="pb-login-stat__v">{s.v}</div>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}
