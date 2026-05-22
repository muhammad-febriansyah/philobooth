import type { ReactNode } from 'react';

type Tone =
    | 'active'
    | 'neutral'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

type Props = {
    tone?: Tone;
    dot?: boolean;
    children: ReactNode;
};

export function Badge({ tone = 'neutral', dot, children }: Props) {
    return (
        <span className={`pb-badge pb-badge-${tone}`}>
            {dot && (
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: 'currentColor',
                    }}
                />
            )}
            {children}
        </span>
    );
}
