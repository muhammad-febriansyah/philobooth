import { useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light';
export type Appearance = ResolvedAppearance;

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

export function initializeTheme(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
}

export function useAppearance(): UseAppearanceReturn {
    const appearance = useSyncExternalStore(
        subscribe,
        () => 'light' as const,
        () => 'light' as const,
    );

    return {
        appearance,
        resolvedAppearance: appearance,
        updateAppearance: () => {},
    } as const;
}
