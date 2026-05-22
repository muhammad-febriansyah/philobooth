import type { CSSProperties, ReactNode } from 'react';

type Props = {
    children: ReactNode;
    style?: CSSProperties;
    padding?: number;
    className?: string;
};

export function Card({ children, style, padding = 24, className }: Props) {
    return (
        <div
            className={`pb-card ${className ?? ''}`}
            style={{ padding, ...style }}
        >
            {children}
        </div>
    );
}
