import type { ReactNode } from 'react';
import { Icon  } from './icon';
import type {IconName} from './icon';
import { Logo } from './logo';

export function KioskHeader({
    step = 1,
    totalSteps = 8,
    branch = 'Senayan City',
    time = '14:32',
    dark = false,
}: {
    step?: number;
    totalSteps?: number;
    branch?: string;
    time?: string;
    dark?: boolean;
}) {
    return (
        <header
            style={{
                height: 88,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 56px',
                borderBottom: dark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid var(--pb-border)',
                background: dark ? 'transparent' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                color: dark ? '#fff' : 'var(--pb-ink)',
            }}
        >
            <Logo size={36} dark={dark} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                {step > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <span
                                key={i}
                                style={{
                                    width: i < step ? 28 : 10,
                                    height: 6,
                                    borderRadius: 3,
                                    background:
                                        i < step
                                            ? 'var(--pb-primary)'
                                            : dark
                                              ? 'rgba(255,255,255,0.18)'
                                              : '#E5E5E5',
                                    transition: 'all .3s ease',
                                }}
                            />
                        ))}
                        <span
                            style={{
                                marginLeft: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                color: dark
                                    ? 'rgba(255,255,255,0.7)'
                                    : 'var(--pb-text-muted)',
                            }}
                        >
                            Langkah {step} / {totalSteps}
                        </span>
                    </div>
                )}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        opacity: dark ? 0.85 : 1,
                    }}
                >
                    <Icon
                        name="store"
                        size={16}
                        color={dark ? 'var(--pb-primary)' : 'var(--pb-ink)'}
                    />
                    {branch}
                    <span
                        style={{
                            color: dark
                                ? 'rgba(255,255,255,0.4)'
                                : 'var(--pb-text-faint)',
                        }}
                    >
                        ·
                    </span>
                    {time}
                </div>
            </div>
        </header>
    );
}

export function KioskFooter({
    back = 'Kembali',
    next = 'Lanjutkan',
    dark = false,
    hideBack,
    nextIcon = 'arrow-right',
    nextDisabled,
    helper,
    onNext,
    onBack,
}: {
    back?: string;
    next?: string;
    dark?: boolean;
    hideBack?: boolean;
    nextIcon?: IconName;
    nextDisabled?: boolean;
    helper?: ReactNode;
    onNext?: () => void;
    onBack?: () => void;
}) {
    return (
        <footer
            style={{
                height: 120,
                padding: '0 56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: dark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid var(--pb-border)',
                background: dark ? 'transparent' : 'rgba(255,255,255,0.8)',
            }}
        >
            {hideBack ? (
                <div />
            ) : (
                <button
                    type="button"
                    className="pb-btn pb-btn-secondary pb-btn-xl"
                    onClick={onBack ?? (() => window.history.back())}
                    style={{
                        background: dark ? 'rgba(255,255,255,0.06)' : '#fff',
                        color: dark ? '#fff' : 'var(--pb-ink)',
                        borderColor: dark
                            ? 'rgba(255,255,255,0.16)'
                            : 'var(--pb-border)',
                    }}
                >
                    <Icon name="chevron-left" size={22} />
                    {back}
                </button>
            )}
            {helper && (
                <div
                    style={{
                        fontSize: 16,
                        color: dark
                            ? 'rgba(255,255,255,0.6)'
                            : 'var(--pb-text-muted)',
                    }}
                >
                    {helper}
                </div>
            )}
            <button
                type="button"
                className="pb-btn pb-btn-primary pb-btn-xl"
                disabled={nextDisabled}
                onClick={onNext}
                style={{
                    opacity: nextDisabled ? 0.5 : 1,
                    cursor: nextDisabled ? 'not-allowed' : 'pointer',
                    padding: '20px 36px',
                    fontSize: 20,
                }}
            >
                {next}
                {nextIcon && <Icon name={nextIcon} size={22} />}
            </button>
        </footer>
    );
}
