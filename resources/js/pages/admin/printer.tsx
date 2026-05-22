import { Form, Head, router } from '@inertiajs/react';
import { useEffect, useState  } from 'react';
import type {ReactNode} from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { confirmDialog } from '@/components/philobooth/confirm-dialog';
import { PageHead } from '@/components/philobooth/extras';
import { Icon  } from '@/components/philobooth/icon';
import type {IconName} from '@/components/philobooth/icon';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type PrinterRow = {
    id: number;
    branch_id: number;
    branch: string;
    name: string;
    model: string | null;
    model_label: string | null;
    connection_type: string | null;
    ip_address: string | null;
    port: number | null;
    system_printer_name: string | null;
    is_default: boolean;
    is_active: boolean;
    last_status: string | null;
    last_checked_at: string | null;
    jobs_today_count: number;
    paper_consumed?: number;
};

type Option = { value: string; label: string };

type Props = {
    printers: PrinterRow[];
    stats: { online: number; error: number; offline: number; jobs_today: number };
    branches: Array<{ id: number; name: string; code: string }>;
    filters: { search: string; branch_id: string; status: string };
    options: { models: Option[]; connections: Option[]; statuses: Option[] };
    can_pick_branch: boolean;
    flash?: { success?: string; error?: string };
};

function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon: IconName;
}) {
    return (
        <Card padding={20} style={{ position: 'relative', overflow: 'hidden' }}>
            <div
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(245,250,12,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon name={icon} size={18} />
            </div>
            <div
                className="pb-caption"
                style={{
                    color: 'var(--pb-text-muted)',
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: -0.6,
                    marginTop: 8,
                }}
            >
                {value}
            </div>
        </Card>
    );
}

function formatChecked(iso: string | null): string {
    if (!iso) {
return 'belum pernah';
}

    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.max(0, Math.floor(diff / 1000));

    if (sec < 5) {
return 'baru saja';
}

    if (sec < 60) {
return `${sec} detik lalu`;
}

    const min = Math.floor(sec / 60);

    if (min < 60) {
return `${min} menit lalu`;
}

    const hour = Math.floor(min / 60);

    if (hour < 24) {
return `${hour} jam lalu`;
}

    return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statusBadge(status: string | null) {
    if (status === 'ready' || status === 'busy') {
        return { tone: 'success' as const, label: 'Online' };
    }

    if (status === 'error') {
        return { tone: 'warning' as const, label: 'Error' };
    }

    return { tone: 'danger' as const, label: 'Offline' };
}

export default function Printer({
    printers,
    stats,
    branches,
    filters,
    options,
    can_pick_branch,
    flash,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [openForm, setOpenForm] = useState<null | PrinterRow | 'create'>(
        null,
    );
    const [pingingId, setPingingId] = useState<number | null>(null);
    const [activatingId, setActivatingId] = useState<number | null>(null);
    const [autoChecking, setAutoChecking] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAutoChecking(true);
            router.post(
                '/admin/printer/ping-all',
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['printers', 'stats'],
                    onFinish: () => setAutoChecking(false),
                },
            );
        }, 30_000);

        return () => clearInterval(interval);
    }, []);

    function applyFilter(patch: Partial<Props['filters']>) {
        router.get(
            '/admin/printer',
            { ...filters, ...patch },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function pingPrinter(printer: PrinterRow) {
        setPingingId(printer.id);
        router.post(
            `/admin/printer/${printer.id}/ping`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['printers', 'stats', 'flash'],
                onFinish: () => setPingingId(null),
            },
        );
    }

    function pingAll() {
        setAutoChecking(true);
        router.post(
            '/admin/printer/ping-all',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['printers', 'stats'],
                onFinish: () => {
                    setAutoChecking(false);
                    toast.success('Status printer diperbarui');
                },
            },
        );
    }

    function activatePrinter(printer: PrinterRow) {
        setActivatingId(printer.id);
        router.post(
            `/admin/printer/${printer.id}/activate`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['printers', 'stats', 'flash'],
                onFinish: () => setActivatingId(null),
            },
        );
    }

    return (
        <>
            <Head title="Manajemen Printer" />
            <main style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <PageHead
                    title="Manajemen printer"
                    subtitle={`${printers.length} printer terdaftar`}
                    actions={
                        <>
                            <Btn
                                variant="secondary"
                                icon="refresh"
                                onClick={pingAll}
                                disabled={autoChecking}
                            >
                                {autoChecking
                                    ? 'Memeriksa...'
                                    : 'Periksa semua'}
                            </Btn>
                            <Btn
                                variant="primary"
                                icon="plus"
                                onClick={() => setOpenForm('create')}
                            >
                                Daftarkan printer
                            </Btn>
                        </>
                    }
                />

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 16,
                        marginBottom: 24,
                    }}
                >
                    <Stat label="Online" value={stats.online} icon="wifi" />
                    <Stat label="Error" value={stats.error} icon="alert" />
                    <Stat label="Offline" value={stats.offline} icon="x" />
                    <Stat label="Job hari ini" value={stats.jobs_today} icon="package" />
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 18,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                        style={{
                            flex: 1,
                            position: 'relative',
                            maxWidth: 360,
                            minWidth: 240,
                        }}
                    >
                        <Icon
                            name="search"
                            size={16}
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--pb-text-faint)',
                            }}
                        />
                        <input
                            className="pb-input"
                            placeholder="Cari printer..."
                            style={{ paddingLeft: 38 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    {can_pick_branch && (
                        <select
                            className="pb-input"
                            style={{ maxWidth: 200 }}
                            value={filters.branch_id}
                            onChange={(e) =>
                                applyFilter({ branch_id: e.target.value })
                            }
                        >
                            <option value="">Semua cabang</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <select
                        className="pb-input"
                        style={{ maxWidth: 180 }}
                        value={filters.status}
                        onChange={(e) =>
                            applyFilter({ status: e.target.value })
                        }
                    >
                        <option value="">Semua status</option>
                        {options.statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>

                {printers.length === 0 && (
                    <Card
                        padding={48}
                        style={{
                            textAlign: 'center',
                            color: 'var(--pb-text-faint)',
                        }}
                    >
                        <Icon name="printer" size={28} />
                        <div style={{ marginTop: 8 }}>Belum ada printer</div>
                    </Card>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 16,
                    }}
                >
                    {printers.map((p) => {
                        const b = statusBadge(p.last_status);

                        return (
                            <Card
                                key={p.id}
                                padding={0}
                                style={{
                                    overflow: 'hidden',
                                    border: p.is_default
                                        ? '2px solid var(--pb-success)'
                                        : undefined,
                                }}
                            >
                                <div
                                    style={{
                                        padding: '16px 18px 14px',
                                        borderBottom:
                                            '1px solid var(--pb-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {p.name}
                                            {p.is_default && (
                                                <Badge tone="success" dot>
                                                    Aktif
                                                </Badge>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--pb-text-faint)',
                                                marginTop: 2,
                                            }}
                                        >
                                            {p.branch} · {p.model_label ?? '—'}
                                        </div>
                                    </div>
                                    <Badge tone={b.tone} dot>
                                        {b.label}
                                    </Badge>
                                </div>
                                <div style={{ padding: '16px 18px' }}>
                                    <div
                                        style={{
                                            marginBottom: 14,
                                            padding: '12px 14px',
                                            background: '#FAFAFA',
                                            borderRadius: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 10,
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    letterSpacing: '0.1em',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--pb-text-faint)',
                                                    marginBottom: 2,
                                                }}
                                            >
                                                Kertas terpakai
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 800,
                                                    color: 'var(--pb-ink)',
                                                    lineHeight: 1.05,
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                }}
                                            >
                                                {p.paper_consumed ?? 0}
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 500,
                                                        color: 'var(--pb-text-muted)',
                                                        marginLeft: 4,
                                                    }}
                                                >
                                                    lembar
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const ok = await confirmDialog({
                                                    title: 'Reset counter kertas?',
                                                    description:
                                                        'Counter akan kembali ke 0 — klik lanjutkan setelah ganti roll kertas baru.',
                                                    confirmText: 'Reset counter',
                                                    tone: 'primary',
                                                    icon: 'refresh',
                                                });

                                                if (!ok) {
                                                    return;
                                                }

                                                router.post(
                                                    `/admin/printer/${p.id}/refill`,
                                                    {},
                                                    {
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }}
                                            style={{
                                                border: '1px solid var(--pb-border)',
                                                background: '#fff',
                                                color: 'var(--pb-ink)',
                                                borderRadius: 8,
                                                fontFamily: 'inherit',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                            }}
                                            title="Reset counter setelah ganti roll kertas"
                                        >
                                            ↻ Reset
                                        </button>
                                    </div>
                                    <div
                                        style={{
                                            background: '#FAFAFA',
                                            borderRadius: 8,
                                            padding: '10px 12px',
                                            textAlign: 'center',
                                            marginBottom: 12,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 22,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {p.jobs_today_count}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: 'var(--pb-text-faint)',
                                                marginTop: 2,
                                            }}
                                        >
                                            JOB HARI INI
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--pb-text-faint)',
                                            marginBottom: 10,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Diperiksa: {formatChecked(p.last_checked_at)}
                                    </div>
                                    <Btn
                                        type="button"
                                        variant={p.is_default ? 'ghost' : 'primary'}
                                        size="sm"
                                        icon={p.is_default ? 'check' : 'sparkles'}
                                        style={{
                                            width: '100%',
                                            marginBottom: 8,
                                        }}
                                        onClick={() => activatePrinter(p)}
                                        disabled={
                                            p.is_default ||
                                            activatingId === p.id ||
                                            !p.is_active
                                        }
                                    >
                                        {p.is_default
                                            ? 'Printer aktif'
                                            : activatingId === p.id
                                              ? 'Mengaktifkan...'
                                              : 'Set aktif'}
                                    </Btn>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Btn
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon="wifi"
                                            style={{ flex: 1 }}
                                            onClick={() => pingPrinter(p)}
                                            disabled={pingingId === p.id}
                                        >
                                            {pingingId === p.id
                                                ? 'Cek...'
                                                : 'Test'}
                                        </Btn>
                                        <Btn
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon="edit"
                                            style={{ flex: 1 }}
                                            onClick={() => setOpenForm(p)}
                                        >
                                            Edit
                                        </Btn>
                                        <Btn
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon="trash"
                                            onClick={async () => {
                                                const ok = await confirmDialog({
                                                    title: `Hapus ${p.name}?`,
                                                    description:
                                                        'Printer akan dihapus dari daftar. Job aktif tidak akan terkirim ke printer ini.',
                                                    confirmText: 'Hapus printer',
                                                    tone: 'danger',
                                                    icon: 'trash',
                                                });

                                                if (!ok) {
                                                    return;
                                                }

                                                router.delete(
                                                    `/admin/printer/${p.id}`,
                                                    { preserveScroll: true },
                                                );
                                            }}
                                        >
                                            Hapus
                                        </Btn>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </main>

            <PrinterFormSheet
                target={openForm}
                onClose={() => setOpenForm(null)}
                branches={branches}
                options={options}
                canPickBranch={can_pick_branch}
            />
        </>
    );
}

function PrinterFormSheet({
    target,
    onClose,
    branches,
    options,
    canPickBranch,
}: {
    target: null | PrinterRow | 'create';
    onClose: () => void;
    branches: Array<{ id: number; name: string }>;
    options: { models: Option[]; connections: Option[] };
    canPickBranch: boolean;
}) {
    const isOpen = target !== null;
    const isCreate = target === 'create';
    const p = !isCreate && target ? target : null;

    return (
        <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[480px] overflow-y-auto"
            >
                <SheetHeader>
                    <SheetTitle>
                        {isCreate ? 'Daftarkan printer' : `Edit ${p?.name}`}
                    </SheetTitle>
                    <SheetDescription>
                        Konfigurasi printer untuk cabang & koneksi sistem.
                    </SheetDescription>
                </SheetHeader>

                <Form
                    method={isCreate ? 'post' : 'put'}
                    action={
                        isCreate
                            ? '/admin/printer'
                            : `/admin/printer/${p?.id}`
                    }
                    onSuccess={onClose}
                    options={{ preserveScroll: true }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        padding: '0 16px 16px',
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            {canPickBranch ? (
                                <Field
                                    label="Cabang"
                                    required
                                    error={errors.branch_id}
                                >
                                    <select
                                        name="branch_id"
                                        defaultValue={p?.branch_id ?? ''}
                                        className="pb-input"
                                    >
                                        <option value="">
                                            — Pilih cabang —
                                        </option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            ) : (
                                <div
                                    style={{
                                        background: '#FAFAFA',
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        fontSize: 13,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <Icon name="store" size={14} />
                                    <span
                                        style={{
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        Cabang:
                                    </span>
                                    <strong>
                                        {branches[0]?.name ?? '—'}
                                    </strong>
                                    {branches[0]?.id && (
                                        <input
                                            type="hidden"
                                            name="branch_id"
                                            value={branches[0].id}
                                        />
                                    )}
                                </div>
                            )}

                            <Field
                                label="Nama printer"
                                required
                                error={errors.name}
                            >
                                <input
                                    name="name"
                                    defaultValue={p?.name ?? ''}
                                    placeholder="Contoh: Printer Utama L8050"
                                    className="pb-input"
                                />
                            </Field>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                }}
                            >
                                <Field
                                    label="Model"
                                    required
                                    error={errors.model}
                                >
                                    <select
                                        name="model"
                                        defaultValue={p?.model ?? ''}
                                        className="pb-input"
                                    >
                                        <option value="">— Pilih —</option>
                                        {options.models.map((m) => (
                                            <option
                                                key={m.value}
                                                value={m.value}
                                            >
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="Koneksi"
                                    required
                                    error={errors.connection_type}
                                >
                                    <select
                                        name="connection_type"
                                        defaultValue={
                                            p?.connection_type ?? 'usb'
                                        }
                                        className="pb-input"
                                    >
                                        {options.connections.map((c) => (
                                            <option
                                                key={c.value}
                                                value={c.value}
                                            >
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr',
                                    gap: 12,
                                }}
                            >
                                <Field
                                    label="IP address"
                                    error={errors.ip_address}
                                >
                                    <input
                                        name="ip_address"
                                        defaultValue={p?.ip_address ?? ''}
                                        placeholder="192.168.1.10"
                                        className="pb-input"
                                    />
                                </Field>
                                <Field label="Port" error={errors.port}>
                                    <input
                                        name="port"
                                        type="number"
                                        defaultValue={p?.port ?? 9100}
                                        className="pb-input"
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Nama printer di sistem (CUPS/Windows)"
                                error={errors.system_printer_name}
                            >
                                <input
                                    name="system_printer_name"
                                    defaultValue={p?.system_printer_name ?? ''}
                                    placeholder="EPSON-L8050"
                                    className="pb-input"
                                />
                            </Field>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                }}
                            >
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: 14,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            name="is_default"
                                            value="1"
                                            defaultChecked={p?.is_default}
                                            style={{
                                                accentColor:
                                                    'var(--pb-primary)',
                                            }}
                                        />
                                        Default cabang
                                    </label>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: 14,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            value="1"
                                            defaultChecked={p?.is_active ?? true}
                                            style={{
                                                accentColor:
                                                    'var(--pb-primary)',
                                            }}
                                        />
                                        Aktif
                                    </label>
                                </div>
                                <p
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--pb-text-faint)',
                                        margin: 0,
                                        lineHeight: 1.45,
                                    }}
                                >
                                    Hanya boleh ada{' '}
                                    <strong style={{ color: 'var(--pb-ink)' }}>
                                        1 printer default
                                    </strong>{' '}
                                    per cabang. Jika kamu centang "Default
                                    cabang" di printer ini, printer default
                                    sebelumnya otomatis dinonaktifkan.
                                </p>
                            </div>

                            <SheetFooter
                                style={{
                                    padding: 0,
                                    flexDirection: 'row',
                                    gap: 8,
                                }}
                            >
                                <SheetClose asChild>
                                    <Btn
                                        type="button"
                                        variant="ghost"
                                        icon="x"
                                        style={{ flex: 1 }}
                                    >
                                        Batal
                                    </Btn>
                                </SheetClose>
                                <Btn
                                    type="submit"
                                    variant="primary"
                                    icon="check"
                                    disabled={processing}
                                    style={{ flex: 1 }}
                                >
                                    {isCreate ? 'Simpan' : 'Perbarui'}
                                </Btn>
                            </SheetFooter>
                        </>
                    )}
                </Form>
            </SheetContent>
        </Sheet>
    );
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 6,
                }}
            >
                {label}
                {required && (
                    <span style={{ color: 'var(--pb-danger)' }}>*</span>
                )}
            </label>
            {children}
            <InputError message={error} className="mt-1" />
        </div>
    );
}

Printer.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="printer">{page}</PhilobboothAdminLayout>
);
