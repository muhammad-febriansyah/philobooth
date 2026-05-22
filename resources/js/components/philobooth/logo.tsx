type Props = {
    size?: number;
    withText?: boolean;
    dark?: boolean;
};

export function Logo({ size = 28, withText = true, dark = false }: Props) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: 8,
                    background: 'var(--pb-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: 'inset 0 0 0 2px rgba(10,10,10,0.92)',
                }}
            >
                <div
                    style={{
                        width: size * 0.42,
                        height: size * 0.42,
                        borderRadius: '50%',
                        border: `${Math.max(2, size * 0.08)}px solid #0A0A0A`,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: size * 0.12,
                        right: size * 0.12,
                        width: size * 0.16,
                        height: size * 0.16,
                        borderRadius: '50%',
                        background: '#0A0A0A',
                    }}
                />
            </div>
            {withText && (
                <span
                    style={{
                        fontSize: size * 0.65,
                        fontWeight: 700,
                        letterSpacing: -0.4,
                        color: dark ? '#fff' : 'var(--pb-ink)',
                    }}
                >
                    philobooth
                </span>
            )}
        </div>
    );
}
