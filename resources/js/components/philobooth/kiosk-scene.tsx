import type { ReactNode } from 'react';

/**
 * Shared scenic background untuk semua kiosk pages.
 *
 * Layers (bottom → top):
 *  1. Cream wash background
 *  2. Soft dot grid
 *  3. Floating camera-themed SVG icons (aperture, polaroid, flash, lens, sparkles)
 *     — fixed deterministic positions, low opacity
 *  4. Optional gradient blob accents (yellow + black)
 *  5. Content children
 */
type Props = {
    children: ReactNode;
    /** Hide all decorative stickers (untuk page yang butuh fokus 100%, mis. printing) */
    minimal?: boolean;
    /** Tambah glow yellow accent di pojok (default: subtle) */
    accent?: 'none' | 'subtle' | 'bold';
};

type Sticker = {
    icon:
        | 'aperture'
        | 'polaroid'
        | 'flash'
        | 'lens'
        | 'sparkle'
        | 'star'
        | 'film'
        | 'heart';
    /** Position as percentage of viewport */
    top: string;
    left?: string;
    right?: string;
    size: number;
    rotate: number;
    opacity: number;
    color: string;
};

// Deterministic scattered stickers — gives "photobooth vibe".
const STICKERS: Sticker[] = [
    {
        icon: 'aperture',
        top: '6%',
        left: '3%',
        size: 92,
        rotate: -12,
        opacity: 0.12,
        color: '#0A0A0A',
    },
    {
        icon: 'polaroid',
        top: '14%',
        right: '5%',
        size: 80,
        rotate: 14,
        opacity: 0.22,
        color: '#0A0A0A',
    },
    {
        icon: 'flash',
        top: '36%',
        left: '1.5%',
        size: 64,
        rotate: -8,
        opacity: 0.16,
        color: '#0A0A0A',
    },
    {
        icon: 'lens',
        top: '50%',
        right: '3%',
        size: 100,
        rotate: 22,
        opacity: 0.1,
        color: '#0A0A0A',
    },
    {
        icon: 'star',
        top: '9%',
        left: '38%',
        size: 36,
        rotate: 0,
        opacity: 0.25,
        color: '#F5FA0C',
    },
    {
        icon: 'sparkle',
        top: '70%',
        left: '6%',
        size: 44,
        rotate: 10,
        opacity: 0.28,
        color: '#F5FA0C',
    },
    {
        icon: 'film',
        top: '78%',
        right: '8%',
        size: 80,
        rotate: -16,
        opacity: 0.14,
        color: '#0A0A0A',
    },
    {
        icon: 'heart',
        top: '60%',
        left: '46%',
        size: 28,
        rotate: -8,
        opacity: 0.22,
        color: '#FB7185',
    },
    {
        icon: 'sparkle',
        top: '24%',
        left: '74%',
        size: 24,
        rotate: 0,
        opacity: 0.32,
        color: '#0A0A0A',
    },
    {
        icon: 'star',
        top: '86%',
        left: '54%',
        size: 28,
        rotate: 30,
        opacity: 0.24,
        color: '#F5FA0C',
    },
    {
        icon: 'aperture',
        top: '84%',
        left: '20%',
        size: 52,
        rotate: 18,
        opacity: 0.1,
        color: '#0A0A0A',
    },
    {
        icon: 'sparkle',
        top: '46%',
        left: '92%',
        size: 18,
        rotate: 0,
        opacity: 0.3,
        color: '#F5FA0C',
    },
];

export function KioskScene({
    children,
    minimal,
    accent = 'subtle',
}: Props) {
    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                position: 'relative',
                background:
                    'linear-gradient(180deg, #FFFEF0 0%, #FAFAF7 22%, #FAFAF7 100%)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Dot grid */}
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'radial-gradient(rgba(10,10,10,0.05) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.55,
                    pointerEvents: 'none',
                }}
            />

            {/* Yellow accent blob */}
            {accent !== 'none' && (
                <>
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            right: 'clamp(-220px, -12vw, -100px)',
                            top: 'clamp(-160px, -10vw, -80px)',
                            width:
                                accent === 'bold'
                                    ? 'clamp(380px, 36vw, 600px)'
                                    : 'clamp(280px, 26vw, 460px)',
                            height:
                                accent === 'bold'
                                    ? 'clamp(380px, 36vw, 600px)'
                                    : 'clamp(280px, 26vw, 460px)',
                            borderRadius: '50%',
                            background: 'var(--pb-primary)',
                            opacity: accent === 'bold' ? 0.55 : 0.42,
                            filter: 'blur(80px)',
                            pointerEvents: 'none',
                        }}
                    />
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            left: 'clamp(-160px, -8vw, -60px)',
                            bottom: 'clamp(-180px, -10vw, -80px)',
                            width: 'clamp(220px, 20vw, 380px)',
                            height: 'clamp(220px, 20vw, 380px)',
                            borderRadius: '50%',
                            background:
                                'radial-gradient(circle, rgba(245,250,12,0.28), transparent 70%)',
                            filter: 'blur(60px)',
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}

            {/* Decorative camera icons */}
            {!minimal && (
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                >
                    {STICKERS.map((s, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                top: s.top,
                                left: s.left,
                                right: s.right,
                                width: s.size,
                                height: s.size,
                                transform: `rotate(${s.rotate}deg)`,
                                opacity: s.opacity,
                                color: s.color,
                            }}
                        >
                            <StickerIcon name={s.icon} />
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}
            >
                {children}
            </div>
        </div>
    );
}

function StickerIcon({ name }: { name: Sticker['icon'] }) {
    const common = {
        width: '100%',
        height: '100%',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    switch (name) {
        case 'aperture':
            return (
                <svg viewBox="0 0 24 24" {...common}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
                    <line x1="9.69" y1="8" x2="21.17" y2="8" />
                    <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
                    <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
                    <line x1="14.31" y1="16" x2="2.83" y2="16" />
                    <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
                </svg>
            );
        case 'polaroid':
            return (
                <svg viewBox="0 0 32 40" {...common}>
                    <rect
                        x="3"
                        y="3"
                        width="26"
                        height="34"
                        rx="2"
                        fill="currentColor"
                        fillOpacity={0.15}
                    />
                    <rect
                        x="6"
                        y="6"
                        width="20"
                        height="22"
                        rx="1"
                        fill="currentColor"
                        fillOpacity={0.3}
                    />
                </svg>
            );
        case 'flash':
            return (
                <svg viewBox="0 0 24 24" {...common}>
                    <polygon
                        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                        fill="currentColor"
                        fillOpacity={0.2}
                    />
                </svg>
            );
        case 'lens':
            return (
                <svg viewBox="0 0 24 24" {...common}>
                    <circle cx="12" cy="12" r="10" />
                    <circle
                        cx="12"
                        cy="12"
                        r="6"
                        fill="currentColor"
                        fillOpacity={0.15}
                    />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
            );
        case 'sparkle':
            return (
                <svg viewBox="0 0 24 24" {...common}>
                    <path
                        d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z"
                        fill="currentColor"
                    />
                </svg>
            );
        case 'star':
            return (
                <svg viewBox="0 0 24 24" {...common}>
                    <polygon
                        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                        fill="currentColor"
                    />
                </svg>
            );
        case 'film':
            return (
                <svg viewBox="0 0 24 24" {...common}>
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <circle cx="6" cy="9" r="0.5" fill="currentColor" />
                    <circle cx="6" cy="12" r="0.5" fill="currentColor" />
                    <circle cx="6" cy="15" r="0.5" fill="currentColor" />
                    <circle cx="18" cy="9" r="0.5" fill="currentColor" />
                    <circle cx="18" cy="12" r="0.5" fill="currentColor" />
                    <circle cx="18" cy="15" r="0.5" fill="currentColor" />
                    <rect
                        x="9"
                        y="9"
                        width="6"
                        height="6"
                        fill="currentColor"
                        fillOpacity={0.2}
                    />
                </svg>
            );
        case 'heart':
            return (
                <svg viewBox="0 0 24 24" {...common}>
                    <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                        fill="currentColor"
                    />
                </svg>
            );
    }
}

/**
 * "Magic card" — clean white card dengan subtle gradient border on hover.
 * Aceternity-inspired (CSS only, no extra deps).
 */
export function MagicCard({
    children,
    style,
}: {
    children: ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className="pb-magic-card"
            style={{
                position: 'relative',
                borderRadius: 22,
                background: '#fff',
                border: '1px solid var(--pb-border)',
                boxShadow:
                    '0 24px 56px rgba(10,10,10,0.08), 0 4px 12px rgba(10,10,10,0.04)',
                overflow: 'hidden',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

/**
 * Shiny primary CTA — yellow with subtle shimmer animation on idle.
 */
export function ShinyPrimary({
    children,
    onClick,
    disabled,
    icon,
    style,
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    icon?: ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                padding: 'clamp(18px, 2.2vw, 24px) clamp(32px, 3.5vw, 48px)',
                background:
                    'linear-gradient(135deg, #F5FA0C 0%, #F8FD3C 50%, #F5FA0C 100%)',
                color: 'var(--pb-ink)',
                border: 'none',
                borderRadius: 999,
                fontSize: 'clamp(15px, 1.4vw, 18px)',
                fontWeight: 700,
                cursor: disabled ? 'wait' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                fontFamily: 'inherit',
                boxShadow:
                    '0 1px 2px rgba(10,10,10,0.08), 0 12px 28px rgba(245,250,12,0.45), inset 0 1px 0 rgba(255,255,255,0.4)',
                transition: 'transform 160ms ease',
                ...style,
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Shimmer overlay */}
            <span
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)',
                    transform: 'translateX(-100%)',
                    animation: 'pb-shimmer 3s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />
            <span
                style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 14,
                }}
            >
                {children}
                {icon && (
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
                        {icon}
                    </span>
                )}
            </span>
        </button>
    );
}

/**
 * Dark pill CTA — secondary brand button with yellow accent chip.
 */
export function DarkPrimary({
    children,
    onClick,
    disabled,
    icon,
    style,
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    icon?: ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                padding: 'clamp(16px, 2vw, 22px) clamp(28px, 3vw, 40px)',
                background: 'var(--pb-ink)',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontSize: 'clamp(15px, 1.3vw, 18px)',
                fontWeight: 600,
                cursor: disabled ? 'wait' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                fontFamily: 'inherit',
                boxShadow:
                    '0 1px 2px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.18)',
                transition: 'transform 160ms ease',
                ...style,
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {children}
            {icon && (
                <span
                    style={{
                        display: 'inline-flex',
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: 'var(--pb-primary)',
                        color: 'var(--pb-ink)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon}
                </span>
            )}
        </button>
    );
}

/**
 * Editorial eyebrow line — small label dengan garis horizontal kiri.
 */
export function Eyebrow({
    children,
    style,
}: {
    children: ReactNode;
    style?: React.CSSProperties;
}) {
    return (
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
                ...style,
            }}
        >
            <span
                style={{
                    width: 28,
                    height: 1,
                    background: 'var(--pb-text-faint)',
                }}
            />
            {children}
        </div>
    );
}

/**
 * Italic squiggle highlight — pakai untuk highlight kata di headline.
 */
export function SquiggleWord({ children }: { children: ReactNode }) {
    return (
        <em
            style={{
                fontStyle: 'italic',
                fontWeight: 'inherit',
                position: 'relative',
                display: 'inline-block',
            }}
        >
            {children}
            <svg
                aria-hidden
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: '-0.1em',
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
    );
}
