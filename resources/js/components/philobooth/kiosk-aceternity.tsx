import * as React from 'react';
import type { ReactNode } from 'react';

/**
 * Aceternity-inspired components, tailored ke brand philobooth.
 * Tidak butuh framer-motion — hanya CSS animations.
 */

/**
 * Spotlight — large radial glow positioned absolutely.
 * Pakai sebagai bg accent di hero areas.
 */
export function Spotlight({
    position = 'top-right',
    color = '#F5FA0C',
    size = 800,
    opacity = 0.35,
    blur = 100,
}: {
    position?:
        | 'top-left'
        | 'top-right'
        | 'top-center'
        | 'bottom-left'
        | 'bottom-right'
        | 'center';
    color?: string;
    size?: number;
    opacity?: number;
    blur?: number;
}) {
    const positions: Record<string, React.CSSProperties> = {
        'top-left': { left: -size / 3, top: -size / 3 },
        'top-right': { right: -size / 3, top: -size / 3 },
        'top-center': { left: '50%', top: -size / 3, transform: 'translateX(-50%)' },
        'bottom-left': { left: -size / 3, bottom: -size / 3 },
        'bottom-right': { right: -size / 3, bottom: -size / 3 },
        center: {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
        },
    };

    return (
        <div
            aria-hidden
            style={{
                position: 'absolute',
                width: size,
                height: size,
                pointerEvents: 'none',
                zIndex: 0,
                background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
                opacity,
                filter: `blur(${blur}px)`,
                animation: 'pb-spotlight-drift 12s ease-in-out infinite',
                ...positions[position],
            }}
        />
    );
}

/**
 * GlowingCard — card dengan halo glow di belakang saat hover.
 * Aceternity-inspired (CardSpotlight feel).
 */
export function GlowingCard({
    children,
    color = 'rgba(245,250,12,0.35)',
    style,
}: {
    children: ReactNode;
    color?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className="pb-glow-wrap"
            style={{
                position: 'relative',
                borderRadius: 22,
                ...style,
            }}
            onMouseEnter={(e) => {
                const glow = e.currentTarget.querySelector(
                    '.pb-glow',
                ) as HTMLElement | null;

                if (glow) glow.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
                const glow = e.currentTarget.querySelector(
                    '.pb-glow',
                ) as HTMLElement | null;

                if (glow) glow.style.opacity = '0';
            }}
        >
            <div
                aria-hidden
                className="pb-glow"
                style={{
                    position: 'absolute',
                    inset: -8,
                    borderRadius: 28,
                    background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`,
                    opacity: 0,
                    transition: 'opacity 300ms ease',
                    pointerEvents: 'none',
                    filter: 'blur(24px)',
                    zIndex: -1,
                }}
            />
            {children}
        </div>
    );
}

/**
 * AuroraBg — gradient aurora wave background untuk hero areas.
 * Subtle, doesn't dominate.
 */
export function AuroraBg({
    intensity = 'subtle',
}: {
    intensity?: 'subtle' | 'bold';
}) {
    const opacity = intensity === 'bold' ? 0.7 : 0.45;

    return (
        <div
            aria-hidden
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    width: '180%',
                    height: '180%',
                    top: '-40%',
                    left: '-40%',
                    background:
                        'conic-gradient(from 180deg at 50% 50%, ' +
                        '#F5FA0C 0deg, transparent 60deg, ' +
                        '#FFD4B8 120deg, transparent 180deg, ' +
                        '#C0B5FF 240deg, transparent 300deg, ' +
                        '#F5FA0C 360deg)',
                    filter: 'blur(120px)',
                    opacity,
                    animation: 'pb-aurora-rotate 24s linear infinite',
                }}
            />
        </div>
    );
}

/**
 * TextGenerateEffect — character-by-character fade-in.
 * Pakai useEffect with CSS opacity stagger.
 */
export function TextGenerateEffect({
    text,
    delay = 30,
    style,
}: {
    text: string;
    delay?: number;
    style?: React.CSSProperties;
}) {
    const chars = text.split('');

    return (
        <span style={style}>
            {chars.map((c, i) => (
                <span
                    key={i}
                    style={{
                        display: 'inline-block',
                        animation: `pb-fade-up 600ms ease-out ${i * delay}ms both`,
                        whiteSpace: c === ' ' ? 'pre' : undefined,
                    }}
                >
                    {c}
                </span>
            ))}
        </span>
    );
}

/**
 * BackgroundBeams — animated diagonal beams sweeping across container.
 * Subtle, perfect untuk hero areas. Pakai SVG + CSS animation.
 */
export function BackgroundBeams({
    opacity = 0.12,
}: {
    opacity?: number;
}) {
    const beams = [
        { x1: '0%', y1: '20%', x2: '100%', y2: '50%', delay: 0 },
        { x1: '0%', y1: '40%', x2: '100%', y2: '80%', delay: 1.5 },
        { x1: '0%', y1: '70%', x2: '100%', y2: '30%', delay: 3 },
    ];

    return (
        <svg
            aria-hidden
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                opacity,
            }}
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient
                    id="pb-beam-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                >
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#F5FA0C" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            {beams.map((b, i) => (
                <line
                    key={i}
                    x1={b.x1}
                    y1={b.y1}
                    x2={b.x2}
                    y2={b.y2}
                    stroke="url(#pb-beam-gradient)"
                    strokeWidth={1.5}
                    style={{
                        strokeDasharray: '8 12',
                        animation: `pb-beam-flow 8s linear infinite ${b.delay}s`,
                    }}
                />
            ))}
        </svg>
    );
}

/**
 * NumberTicker — animated number counter from 0 to target.
 * Useful untuk total/qty displays.
 */
export function NumberTicker({
    value,
    duration = 800,
    formatter = (n: number) => String(Math.round(n)),
    style,
}: {
    value: number;
    duration?: number;
    formatter?: (n: number) => string;
    style?: React.CSSProperties;
}) {
    const [display, setDisplay] = React.useState(0);
    const prevRef = React.useRef(0);

    React.useEffect(() => {
        const start = prevRef.current;
        const startTime = performance.now();

        let raf = 0;
        const tick = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            const current = start + (value - start) * eased;
            setDisplay(current);

            if (t < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                prevRef.current = value;
            }
        };

        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return (
        <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
            {formatter(display)}
        </span>
    );
}

/**
 * HoverGlow — wrapper adds yellow glow on hover (cheap version of CardSpotlight).
 */
export function HoverGlow({
    children,
    color = 'rgba(245,250,12,0.45)',
    radius = 22,
    style,
}: {
    children: ReactNode;
    color?: string;
    radius?: number;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                position: 'relative',
                borderRadius: radius,
                transition: 'transform 200ms ease, box-shadow 280ms ease',
                ...style,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 0 0 1px ${color}, 0 20px 56px ${color}`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
            }}
        >
            {children}
        </div>
    );
}

/**
 * BentoCard — clean bento-grid item dengan hover lift.
 */
export function BentoCard({
    children,
    span = 1,
    accent = false,
    style,
}: {
    children: ReactNode;
    span?: number;
    accent?: boolean;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                gridColumn: span > 1 ? `span ${span}` : undefined,
                background: accent
                    ? 'linear-gradient(135deg, var(--pb-primary) 0%, #FFD93D 100%)'
                    : '#fff',
                border: accent
                    ? 'none'
                    : '1px solid var(--pb-border)',
                borderRadius: 18,
                padding: 'clamp(18px, 2vw, 24px)',
                boxShadow: accent
                    ? '0 12px 32px rgba(245,250,12,0.32)'
                    : '0 4px 16px rgba(10,10,10,0.04)',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                ...style,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = accent
                    ? '0 20px 48px rgba(245,250,12,0.42)'
                    : '0 16px 36px rgba(10,10,10,0.08)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = accent
                    ? '0 12px 32px rgba(245,250,12,0.32)'
                    : '0 4px 16px rgba(10,10,10,0.04)';
            }}
        >
            {children}
        </div>
    );
}
