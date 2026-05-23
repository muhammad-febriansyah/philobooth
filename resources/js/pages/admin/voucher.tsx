import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { confirmDialog } from '@/components/philobooth/confirm-dialog';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import type { IconName } from '@/components/philobooth/icon';
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

type Voucher = {
    id: number;
    name: string;
    code: string;
    branch_id: number | null;
    branch: string | null;
    max_uses: number;
    used_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    used_at: string | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    vouchers: Paginated<Voucher>;
    stats: {
        total: number;
        active: number;
        used: number;
        available: number;
    };
    branches: Array<{ id: number; name: string; code: string }>;
    can_pick_branch: boolean;
    filters: { search: string; branch_id: string; status: string };
    flash?: { success?: string; error?: string };
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function generateCode(length = CODE_LENGTH): string {
    let out = '';

    for (let i = 0; i < length; i++) {
        out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }

    return out;
}

function formatDate(iso: string | null): string {
    if (!iso) {
return '—';
}

    return new Date(iso).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

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

export default function Voucher({
    vouchers,
    stats,
    branches,
    can_pick_branch: canPickBranch,
    filters,
    flash,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Voucher | null>(null);

    useEffect(() => {
        if (flash?.success) {
toast.success(flash.success);
}

        if (flash?.error) {
toast.error(flash.error);
}
    }, [flash?.success, flash?.error]);

    function applyFilters(next: {
        search?: string;
        branch_id?: string;
        status?: string;
    }) {
        router.get(
            '/admin/voucher',
            {
                search: next.search ?? search,
                branch_id: next.branch_id ?? branchId,
                status: next.status ?? status,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function openCreate() {
        setEditing(null);
        setOpenForm(true);
    }

    function openEdit(v: Voucher) {
        setEditing(v);
        setOpenForm(true);
    }

    async function destroy(v: Voucher) {
        const ok = await confirmDialog({
            title: `Hapus voucher "${v.name}"?`,
            description: `Kode ${v.code} akan dinonaktifkan dan tidak bisa dipakai lagi. Tindakan ini tidak bisa dibatalkan.`,
            confirmText: 'Hapus voucher',
            tone: 'danger',
            icon: 'trash',
        });

        if (!ok) {
            return;
        }

        router.delete(`/admin/voucher/${v.id}`, { preserveScroll: true });
    }

    return (
        <PhilobboothAdminLayout active="voucher">
            <Head title="Voucher — Philobooth" />
            <main className="pb-page-main">
                <PageHead
                    title="Manajemen voucher"
                    subtitle={`${stats.total} voucher terdaftar`}
                    actions={
                        <Btn variant="primary" onClick={openCreate} icon="plus">
                            Tambah voucher
                        </Btn>
                    }
                />

                <div className="pb-stat-grid">
                <Stat label="Total voucher" value={stats.total} icon="ticket" />
                <Stat label="Aktif" value={stats.active} icon="check" />
                <Stat label="Tersedia" value={stats.available} icon="store" />
                <Stat label="Sudah dipakai" value={stats.used} icon="receipt" />
            </div>

            <Card padding={0}>
                <div className="pb-filter-bar">
                    <div className="pb-filter-search">
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
                            placeholder="Cari nama atau kode voucher…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
applyFilters({ search });
}
                            }}
                            style={{ paddingLeft: 36, width: '100%' }}
                        />
                    </div>
                    {canPickBranch && (
                        <select
                            className="pb-input pb-filter-select"
                            value={branchId}
                            onChange={(e) => {
                                setBranchId(e.target.value);
                                applyFilters({ branch_id: e.target.value });
                            }}
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
                        className="pb-input pb-filter-select"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            applyFilters({ status: e.target.value });
                        }}
                    >
                        <option value="">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                </div>

                <div className="pb-table-scroll">
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: 14,
                            tableLayout: 'fixed',
                        }}
                    >
                        <colgroup>
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '17%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '9%' }} />
                            <col style={{ width: '8%' }} />
                        </colgroup>
                        <thead>
                            <tr
                                style={{
                                    background: '#FAFAFA',
                                    borderBottom: '1px solid var(--pb-border)',
                                }}
                            >
                                <Th>Nama</Th>
                                <Th>Kode</Th>
                                <Th>Cabang</Th>
                                <Th align="center">Pakai</Th>{/* "Pakai" header tetap, content jadi badge */}
                                <Th>Berlaku</Th>
                                <Th align="center">Status</Th>
                                <Th align="right">Aksi</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            padding: 60,
                                            textAlign: 'center',
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        Belum ada voucher. Klik “Tambah
                                        voucher” untuk membuat satu.
                                    </td>
                                </tr>
                            ) : (
                                vouchers.data.map((v) => {
                                    const remaining = v.max_uses - v.used_count;
                                    const isExhausted = remaining <= 0;

                                    return (
                                        <tr
                                            key={v.id}
                                            style={{
                                                borderBottom:
                                                    '1px solid var(--pb-border)',
                                            }}
                                        >
                                            <Td>
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                    title={v.name ?? ''}
                                                >
                                                    {v.name ?? (
                                                        <span
                                                            style={{
                                                                color: 'var(--pb-text-faint)',
                                                                fontWeight: 400,
                                                                fontStyle:
                                                                    'italic',
                                                            }}
                                                        >
                                                            (tanpa nama)
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>
                                            <Td>
                                                <code
                                                    style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: 13,
                                                        background: '#F4F4F5',
                                                        padding: '3px 8px',
                                                        borderRadius: 6,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {v.code}
                                                </code>
                                            </Td>
                                            <Td>
                                                <span
                                                    style={{
                                                        color: v.branch
                                                            ? 'inherit'
                                                            : 'var(--pb-text-faint)',
                                                    }}
                                                >
                                                    {v.branch ??
                                                        'Semua cabang'}
                                                </span>
                                            </Td>
                                            <Td align="center">
                                                {v.used_count > 0 ? (
                                                    <Badge tone="muted">
                                                        Terpakai
                                                    </Badge>
                                                ) : (
                                                    <Badge tone="success">
                                                        Belum
                                                    </Badge>
                                                )}
                                            </Td>
                                            <Td>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        color: 'var(--pb-text-muted)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                    title={
                                                        v.valid_from ||
                                                        v.valid_until
                                                            ? `${formatDate(v.valid_from)} – ${formatDate(v.valid_until)}`
                                                            : ''
                                                    }
                                                >
                                                    {v.valid_from ||
                                                    v.valid_until
                                                        ? `${formatDate(v.valid_from)} – ${formatDate(v.valid_until)}`
                                                        : 'Tanpa batas'}
                                                </div>
                                            </Td>
                                            <Td align="center">
                                                {isExhausted ? (
                                                    <Badge tone="muted">
                                                        Habis
                                                    </Badge>
                                                ) : v.is_active ? (
                                                    <Badge tone="success">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge tone="muted">
                                                        Nonaktif
                                                    </Badge>
                                                )}
                                            </Td>
                                            <Td align="right">
                                                <div
                                                    style={{
                                                        display: 'inline-flex',
                                                        gap: 4,
                                                    }}
                                                >
                                                    <Btn
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        icon="download"
                                                        title="Cetak voucher PDF"
                                                        aria-label="Cetak voucher PDF"
                                                        onClick={() =>
                                                            window.open(
                                                                `/admin/voucher/${v.id}/pdf`,
                                                                '_blank',
                                                                'noopener,noreferrer',
                                                            )
                                                        }
                                                    >
                                                        PDF
                                                    </Btn>
                                                    <Btn
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        icon="edit"
                                                        title="Edit voucher"
                                                        aria-label="Edit voucher"
                                                        onClick={() =>
                                                            openEdit(v)
                                                        }
                                                    >
                                                        Edit
                                                    </Btn>
                                                    <Btn
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        icon="trash"
                                                        title="Hapus voucher"
                                                        aria-label="Hapus voucher"
                                                        onClick={() =>
                                                            destroy(v)
                                                        }
                                                    >
                                                        Hapus
                                                    </Btn>
                                                </div>
                                            </Td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {vouchers.last_page > 1 && (
                    <div
                        style={{
                            padding: '14px 18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid var(--pb-border)',
                            fontSize: 13,
                            color: 'var(--pb-text-muted)',
                        }}
                    >
                        <span>
                            Menampilkan {vouchers.from ?? 0}–{vouchers.to ?? 0}{' '}
                            dari {vouchers.total} voucher
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {vouchers.links.map((l, i) => {
                                const cleanLabel = l.label
                                    .replace(/pagination\./g, '')
                                    .replace(/&laquo;|&raquo;/g, '')
                                    .trim();
                                const label =
                                    l.label.includes('previous') ||
                                    l.label.includes('&laquo;')
                                        ? '←'
                                        : l.label.includes('next') ||
                                            l.label.includes('&raquo;')
                                          ? '→'
                                          : cleanLabel || '…';

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={!l.url}
                                        onClick={() =>
                                            l.url &&
                                            router.get(
                                                l.url,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            )
                                        }
                                        style={{
                                            minWidth: 32,
                                            height: 32,
                                            border: l.active
                                                ? '1px solid var(--pb-primary)'
                                                : '1px solid var(--pb-border)',
                                            background: l.active
                                                ? 'var(--pb-primary)'
                                                : '#fff',
                                            color: 'var(--pb-ink)',
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            fontSize: 13,
                                            cursor: l.url
                                                ? 'pointer'
                                                : 'not-allowed',
                                            opacity: l.url ? 1 : 0.4,
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                </Card>

                <VoucherFormSheet
                    open={openForm}
                    onOpenChange={setOpenForm}
                    voucher={editing}
                    branches={branches}
                    canPickBranch={canPickBranch}
                />
            </main>
        </PhilobboothAdminLayout>
    );
}

function Th({
    children,
    align = 'left',
}: {
    children: React.ReactNode;
    align?: 'left' | 'right' | 'center';
}) {
    return (
        <th
            style={{
                padding: '12px 16px',
                textAlign: align,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--pb-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    align = 'left',
}: {
    children: React.ReactNode;
    align?: 'left' | 'right' | 'center';
}) {
    return (
        <td
            style={{
                padding: '14px 16px',
                textAlign: align,
                verticalAlign: 'middle',
            }}
        >
            {children}
        </td>
    );
}

function VoucherFormSheet({
    open,
    onOpenChange,
    voucher,
    branches,
    canPickBranch,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    voucher: Voucher | null;
    branches: Array<{ id: number; name: string; code: string }>;
    canPickBranch: boolean;
}) {
    const isEdit = voucher !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: voucher?.name ?? '',
            code: voucher?.code ?? '',
            branch_id: voucher?.branch_id ? String(voucher.branch_id) : '',
            max_uses: voucher?.max_uses ?? 1,
            valid_from: voucher?.valid_from
                ? voucher.valid_from.slice(0, 10)
                : '',
            valid_until: voucher?.valid_until
                ? voucher.valid_until.slice(0, 10)
                : '',
            is_active: voucher?.is_active ?? true,
        });

    useEffect(() => {
        if (open) {
            clearErrors();
            const initialCode = voucher?.code ?? generateCode();
            setData({
                name: voucher?.name ?? '',
                code: initialCode,
                branch_id: voucher?.branch_id
                    ? String(voucher.branch_id)
                    : '',
                max_uses: voucher?.max_uses ?? 1,
                valid_from: voucher?.valid_from
                    ? voucher.valid_from.slice(0, 10)
                    : '',
                valid_until: voucher?.valid_until
                    ? voucher.valid_until.slice(0, 10)
                    : '',
                is_active: voucher?.is_active ?? true,
            });
        } else {
            reset();
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, voucher]);

    function submit(e: React.FormEvent) {
        e.preventDefault();

        const url = isEdit
            ? `/admin/voucher/${voucher!.id}`
            : '/admin/voucher';
        const method = isEdit ? put : post;

        method(url, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    }

    function genRandomCode() {
        setData('code', generateCode());
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                style={{
                    width: 'min(520px, 100vw)',
                    maxWidth: 520,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <SheetHeader>
                    <SheetTitle>
                        {isEdit ? 'Edit voucher' : 'Tambah voucher'}
                    </SheetTitle>
                    <SheetDescription>
                        Isi data voucher. Kode harus unik dan akan dipakai
                        customer di kiosk.
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={submit}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                    }}
                >
                    <Field
                        label="Nama voucher"
                        hint="Untuk identifikasi internal. Contoh: Kupon Birthday 2026"
                        error={errors.name}
                    >
                        <input
                            className="pb-input"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Kupon promo, hadiah event, dst."
                            autoFocus
                        />
                    </Field>

                    <Field
                        label="Kode voucher"
                        hint={`Tepat ${CODE_LENGTH} karakter huruf/angka. Customer ketik kode ini di kiosk.`}
                        error={errors.code}
                    >
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="pb-input"
                                value={data.code}
                                onChange={(e) =>
                                    setData(
                                        'code',
                                        e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, '')
                                            .slice(0, CODE_LENGTH),
                                    )
                                }
                                placeholder="DEMO2026"
                                style={{
                                    flex: 1,
                                    fontFamily: 'monospace',
                                    letterSpacing: 1,
                                }}
                                maxLength={CODE_LENGTH}
                            />
                            <Btn
                                type="button"
                                variant="secondary"
                                icon="refresh"
                                onClick={genRandomCode}
                                title="Generate kode acak"
                            >
                                Acak
                            </Btn>
                        </div>
                    </Field>

                    {canPickBranch ? (
                        <Field label="Cabang" error={errors.branch_id}>
                            <select
                                className="pb-input"
                                value={data.branch_id}
                                onChange={(e) =>
                                    setData('branch_id', e.target.value)
                                }
                            >
                                <option value="">Semua cabang</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    ) : (
                        branches[0] && (
                            <div
                                style={{
                                    padding: '10px 12px',
                                    background: '#FAFAFA',
                                    border: '1px solid var(--pb-border-soft)',
                                    borderRadius: 8,
                                    fontSize: 12.5,
                                    color: 'var(--pb-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <Icon
                                    name="store"
                                    size={14}
                                    color="var(--pb-text-faint)"
                                />
                                Cabang:{' '}
                                <strong style={{ color: 'var(--pb-ink)' }}>
                                    {branches[0].name}
                                </strong>
                            </div>
                        )
                    )}

                    <div
                        style={{
                            padding: '10px 14px',
                            background: 'rgba(245,250,12,0.18)',
                            border: '1px solid rgba(245,250,12,0.5)',
                            borderRadius: 10,
                            fontSize: 12,
                            color: 'var(--pb-text)',
                            lineHeight: 1.4,
                        }}
                    >
                        <strong style={{ fontWeight: 700 }}>
                            Sekali pakai.
                        </strong>{' '}
                        Setiap kode voucher otomatis habis setelah satu kali
                        validasi di kiosk.
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: 14,
                        }}
                    >
                        <Field
                            label="Berlaku mulai"
                            hint="Kosongkan kalau langsung berlaku."
                            error={errors.valid_from}
                        >
                            <input
                                className="pb-input"
                                type="date"
                                value={data.valid_from}
                                onChange={(e) =>
                                    setData('valid_from', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            label="Berlaku sampai"
                            hint="Kosongkan kalau tanpa expired."
                            error={errors.valid_until}
                        >
                            <input
                                className="pb-input"
                                type="date"
                                value={data.valid_until}
                                onChange={(e) =>
                                    setData('valid_until', e.target.value)
                                }
                            />
                        </Field>
                    </div>

                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 14px',
                            border: '1px solid var(--pb-border)',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: data.is_active
                                ? 'rgba(245,250,12,0.08)'
                                : '#fff',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) =>
                                setData('is_active', e.target.checked)
                            }
                        />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                                Voucher aktif
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--pb-text-muted)',
                                }}
                            >
                                Nonaktif = tidak bisa dipakai di kiosk.
                            </div>
                        </div>
                    </label>
                </form>

                <SheetFooter
                    style={{
                        borderTop: '1px solid var(--pb-border)',
                        padding: '14px 22px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8,
                    }}
                >
                    <SheetClose asChild>
                        <Btn variant="ghost" icon="x">
                            Batal
                        </Btn>
                    </SheetClose>
                    <Btn
                        type="button"
                        variant="primary"
                        onClick={submit}
                        disabled={processing}
                        icon={isEdit ? 'check' : 'plus'}
                    >
                        {isEdit ? 'Simpan perubahan' : 'Tambah voucher'}
                    </Btn>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function Field({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--pb-ink)',
                    display: 'block',
                    marginBottom: 6,
                }}
            >
                {label}
            </label>
            {children}
            {hint && !error && (
                <div
                    style={{
                        fontSize: 12,
                        color: 'var(--pb-text-faint)',
                        marginTop: 5,
                    }}
                >
                    {hint}
                </div>
            )}
            {error && <InputError message={error} />}
        </div>
    );
}
