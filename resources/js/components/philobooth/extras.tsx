import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './icon';

export function Sparkbars({
    data,
    color = 'var(--pb-primary)',
    height = 40,
}: {
    data: number[];
    color?: string;
    height?: number;
}) {
    const max = Math.max(...data);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 3,
                height,
                width: '100%',
            }}
        >
            {data.map((v, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        height: `${(v / max) * 100}%`,
                        background: color,
                        borderRadius: 3,
                        minHeight: 3,
                    }}
                />
            ))}
        </div>
    );
}

const PALETTES: Array<[string, string]> = [
    ['#FFE9C7', '#FFB37C'],
    ['#E7D6FF', '#A78BFA'],
    ['#D2F4E5', '#34D399'],
    ['#FFD4DE', '#FB7185'],
    ['#D7E8FF', '#60A5FA'],
    ['#FFF1A8', '#FBBF24'],
    ['#FFCBC1', '#F97373'],
    ['#CCE9D9', '#10B981'],
];

export function PhotoPH({
    seed = 0,
    label,
    style,
}: {
    seed?: number;
    label?: string;
    style?: CSSProperties;
}) {
    const [a, b] = PALETTES[seed % PALETTES.length];

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${a}, ${b})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 8,
                color: 'rgba(10,10,10,0.55)',
                ...style,
            }}
        >
            <Icon name="image" size={28} />
            {label && (
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </span>
            )}
        </div>
    );
}

export function QR({ size = 200, seed = 7 }: { size?: number; seed?: number }) {
    const N = 25;
    const cells: Array<{ x: number; y: number; on: boolean }> = [];

    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const inFinder =
                (x < 7 && y < 7) ||
                (x >= N - 7 && y < 7) ||
                (x < 7 && y >= N - 7);
            const finderDot =
                (x < 7 &&
                    y < 7 &&
                    (x === 0 ||
                        x === 6 ||
                        y === 0 ||
                        y === 6 ||
                        (x >= 2 && x <= 4 && y >= 2 && y <= 4))) ||
                (x >= N - 7 &&
                    y < 7 &&
                    (x === N - 7 ||
                        x === N - 1 ||
                        y === 0 ||
                        y === 6 ||
                        (x >= N - 5 && x <= N - 3 && y >= 2 && y <= 4))) ||
                (x < 7 &&
                    y >= N - 7 &&
                    (x === 0 ||
                        x === 6 ||
                        y === N - 7 ||
                        y === N - 1 ||
                        (x >= 2 && x <= 4 && y >= N - 5 && y <= N - 3)));
            let on = false;

            if (inFinder) {
                on = finderDot;
            } else {
                const h =
                    ((x * 9301 + y * 49297 + seed * 233280) % 233280) / 233280;
                on = h > 0.52;
            }

            cells.push({ x, y, on });
        }
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${N} ${N}`}
            style={{ background: '#fff', display: 'block' }}
        >
            {cells.map(
                (c, i) =>
                    c.on && (
                        <rect
                            key={i}
                            x={c.x}
                            y={c.y}
                            width="1"
                            height="1"
                            fill="#0A0A0A"
                        />
                    ),
            )}
        </svg>
    );
}

export function PageHead({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 24,
            }}
        >
            <div>
                <h1 className="pb-h2" style={{ margin: 0 }}>
                    {title}
                </h1>
                {subtitle && (
                    <p
                        className="pb-body-sm"
                        style={{
                            margin: '4px 0 0',
                            color: 'var(--pb-text-muted)',
                        }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
            )}
        </div>
    );
}
