import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Icon  } from './icon';
import type {IconName} from './icon';

type Variant =
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'dark'
    | 'danger'
    | 'success'
    | 'warning'
    | 'info';
type Size = 'sm' | 'md' | 'lg' | 'xl';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    variant?: Variant;
    size?: Size;
    icon?: IconName;
    iconRight?: IconName;
    full?: boolean;
    children?: ReactNode;
    style?: CSSProperties;
};

export function Btn({
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    full,
    children,
    style,
    className,
    ...rest
}: Props) {
    const cls = [
        'pb-btn',
        `pb-btn-${variant}`,
        size === 'sm' ? 'pb-btn-sm' : '',
        size === 'lg' ? 'pb-btn-lg' : '',
        size === 'xl' ? 'pb-btn-xl' : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');
    const iconSize =
        size === 'xl' ? 22 : size === 'lg' ? 18 : size === 'sm' ? 14 : 16;

    return (
        <button
            className={cls}
            style={{ width: full ? '100%' : undefined, ...style }}
            {...rest}
        >
            {icon && <Icon name={icon} size={iconSize} />}
            {children}
            {iconRight && <Icon name={iconRight} size={iconSize} />}
        </button>
    );
}
