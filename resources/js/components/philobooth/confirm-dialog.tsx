import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Btn } from './btn';
import { Icon } from './icon';
import type { IconName } from './icon';

type Tone = 'danger' | 'warning' | 'primary';

export type ConfirmOptions = {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    tone?: Tone;
    icon?: IconName;
};

type Resolver = (value: boolean) => void;

type State =
    | { open: false }
    | ({ open: true; resolve: Resolver } & ConfirmOptions);

let openFnRef: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
    if (!openFnRef) {
        return Promise.resolve(
            window.confirm(opts.description ?? opts.title),
        );
    }

    return openFnRef(opts);
}

const TONE_META: Record<
    Tone,
    { icon: IconName; bg: string; color: string }
> = {
    danger: {
        icon: 'alert',
        bg: 'rgba(220, 38, 38, 0.12)',
        color: '#dc2626',
    },
    warning: {
        icon: 'alert',
        bg: 'rgba(234, 88, 12, 0.12)',
        color: '#ea580c',
    },
    primary: {
        icon: 'info',
        bg: 'rgba(245, 250, 12, 0.18)',
        color: 'var(--pb-ink)',
    },
};

export function ConfirmDialogProvider() {
    const [state, setState] = useState<State>({ open: false });

    useEffect(() => {
        openFnRef = (opts) =>
            new Promise<boolean>((resolve) => {
                setState({ open: true, resolve, ...opts });
            });

        return () => {
            openFnRef = null;
        };
    }, []);

    function close(value: boolean) {
        if (state.open) {
            state.resolve(value);
        }

        setState({ open: false });
    }

    const tone: Tone = state.open ? (state.tone ?? 'primary') : 'primary';
    const meta = TONE_META[tone];
    const iconName = state.open ? (state.icon ?? meta.icon) : meta.icon;

    return (
        <Dialog
            open={state.open}
            onOpenChange={(o) => {
                if (!o) {
                    close(false);
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div
                        style={{
                            display: 'flex',
                            gap: 14,
                            alignItems: 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: meta.bg,
                                color: meta.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Icon name={iconName} size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <DialogTitle>
                                {state.open ? state.title : ''}
                            </DialogTitle>
                            {state.open && state.description && (
                                <DialogDescription
                                    style={{ marginTop: 6 }}
                                >
                                    {state.description}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <Btn
                            type="button"
                            variant="ghost"
                            icon="x"
                            onClick={() => close(false)}
                        >
                            {(state.open && state.cancelText) || 'Batal'}
                        </Btn>
                    </DialogClose>
                    <Btn
                        type="button"
                        variant={tone === 'danger' ? 'danger' : 'primary'}
                        icon="check"
                        onClick={() => close(true)}
                    >
                        {(state.open && state.confirmText) || 'Lanjutkan'}
                    </Btn>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
