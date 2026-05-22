import { useState } from 'react';
import type { CSSProperties } from 'react';

type Props = {
    name: string;
    defaultValue?: number | string | null;
    placeholder?: string;
    className?: string;
    style?: CSSProperties;
    min?: number;
    max?: number;
};

function toDigits(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const digits = String(value).replace(/\D/g, '');

    return digits.replace(/^0+(?=\d)/, '');
}

function formatDisplay(digits: string): string {
    if (!digits) {
        return '';
    }

    const numeric = Number(digits);

    if (!Number.isFinite(numeric)) {
        return '';
    }

    return 'Rp ' + new Intl.NumberFormat('id-ID').format(numeric);
}

export function RupiahInput({
    name,
    defaultValue,
    placeholder = 'Rp 0',
    className = 'pb-input',
    style,
    min,
    max,
}: Props) {
    const [digits, setDigits] = useState<string>(() => toDigits(defaultValue));

    function handleChange(raw: string) {
        let next = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

        if (next && max !== undefined && Number(next) > max) {
            next = String(max);
        }

        setDigits(next);
    }

    function handleBlur() {
        if (digits && min !== undefined && Number(digits) < min) {
            setDigits(String(min));
        }
    }

    return (
        <>
            <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formatDisplay(digits)}
                onChange={(event) => handleChange(event.target.value)}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={className}
                style={style}
            />
            <input type="hidden" name={name} value={digits} />
        </>
    );
}
