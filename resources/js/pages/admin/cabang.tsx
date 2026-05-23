import { Form, Head, Link, router } from '@inertiajs/react';
import { useEffect, useState  } from 'react';
import type {ReactNode} from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { confirmDialog } from '@/components/philobooth/confirm-dialog';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
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

type Branch = {
    id: number;
    code: string;
    name: string;
    city: string | null;
    province: string | null;
    phone: string | null;
    address: string | null;
    manager_name: string | null;
    is_active: boolean;
    printers_count: number;
    sessions_count: number;
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
    branches: Paginated<Branch>;
    filters: { search: string; status: string; city: string };
    cities: string[];
    flash?: { success?: string; error?: string };
};

function statusDot(active: boolean) {
    return active ? 'var(--pb-success)' : 'var(--pb-danger)';
}

export default function Cabang({ branches, filters, cities, flash }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [openForm, setOpenForm] = useState<null | Branch | 'create'>(null);

    useEffect(() => {
        if (flash?.success) {
toast.success(flash.success);
}

        if (flash?.error) {
toast.error(flash.error);
}
    }, [flash]);

    function applyFilter(patch: Partial<Props['filters']>) {
        router.get(
            '/admin/cabang',
            { ...filters, ...patch },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function onSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        applyFilter({ search });
    }

    return (
        <>
            <Head title="Manajemen Cabang" />
            <main className="pb-page-main">
                <PageHead
                    title="Manajemen cabang"
                    subtitle={`${branches.total} cabang terdaftar`}
                    actions={
                        <>
                            <Btn variant="secondary" icon="download">
                                Ekspor CSV
                            </Btn>
                            <Btn
                                variant="primary"
                                icon="plus"
                                onClick={() => setOpenForm('create')}
                            >
                                Tambah cabang
                            </Btn>
                        </>
                    }
                />

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
                        onSubmit={onSearchSubmit}
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
                            placeholder="Cari nama, kode, atau kota…"
                            style={{ paddingLeft: 38 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <select
                        className="pb-input"
                        style={{ maxWidth: 180 }}
                        value={filters.status}
                        onChange={(e) =>
                            applyFilter({ status: e.target.value })
                        }
                    >
                        <option value="">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Tidak aktif</option>
                    </select>

                    <select
                        className="pb-input"
                        style={{ maxWidth: 200 }}
                        value={filters.city}
                        onChange={(e) => applyFilter({ city: e.target.value })}
                    >
                        <option value="">Semua kota</option>
                        {cities.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <Card padding={0}>
                    <div className="pb-table-scroll">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#FAFAFA' }}>
                                {[
                                    'Cabang',
                                    'Manajer',
                                    'Printer',
                                    'Sesi total',
                                    'Telepon',
                                    'Status',
                                    '',
                                ].map((h, i) => (
                                    <th
                                        key={i}
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            letterSpacing: 0.4,
                                            color: 'var(--pb-text-muted)',
                                            textTransform: 'uppercase',
                                            borderBottom:
                                                '1px solid var(--pb-border)',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {branches.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            padding: 40,
                                            textAlign: 'center',
                                            color: 'var(--pb-text-faint)',
                                        }}
                                    >
                                        <Icon
                                            name="store"
                                            size={28}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <div>Belum ada cabang</div>
                                    </td>
                                </tr>
                            )}
                            {branches.data.map((r, i) => (
                                <tr
                                    key={r.id}
                                    style={{
                                        borderBottom:
                                            i < branches.data.length - 1
                                                ? '1px solid var(--pb-border-soft)'
                                                : 'none',
                                    }}
                                >
                                    <td style={{ padding: '14px 16px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 38,
                                                    height: 38,
                                                    borderRadius: 8,
                                                    background:
                                                        'var(--pb-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    color: '#0A0A0A',
                                                    fontSize: 14,
                                                }}
                                            >
                                                {r.name
                                                    .split(' ')
                                                    .map((w) => w[0])
                                                    .slice(0, 2)
                                                    .join('')}
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {r.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: 'var(--pb-text-faint)',
                                                    }}
                                                >
                                                    {r.code} ·{' '}
                                                    {r.city ?? '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                        }}
                                    >
                                        {r.manager_name ?? '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontSize: 13,
                                            }}
                                        >
                                            <Icon
                                                name="printer"
                                                size={14}
                                                color="var(--pb-text-faint)"
                                            />
                                            {r.printers_count}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                        }}
                                    >
                                        {r.sessions_count}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        {r.phone ?? '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontSize: 12,
                                                fontWeight: 600,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 4,
                                                    background: statusDot(
                                                        r.is_active,
                                                    ),
                                                }}
                                            />
                                            {r.is_active
                                                ? 'Aktif'
                                                : 'Tidak aktif'}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Btn
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon="edit"
                                            onClick={() => setOpenForm(r)}
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
                                                    title: `Hapus cabang ${r.name}?`,
                                                    description:
                                                        'Semua data printer, voucher, dan transaksi cabang ini akan ter-orphan. Pastikan cabang sudah tidak operasional.',
                                                    confirmText: 'Hapus cabang',
                                                    tone: 'danger',
                                                    icon: 'trash',
                                                });

                                                if (!ok) {
                                                    return;
                                                }

                                                router.delete(
                                                    `/admin/cabang/${r.id}`,
                                                    { preserveScroll: true },
                                                );
                                            }}
                                        >
                                            Hapus
                                        </Btn>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    <div
                        style={{
                            padding: '14px 22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--pb-border)',
                            flexWrap: 'wrap',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 13,
                                color: 'var(--pb-text-muted)',
                            }}
                        >
                            Menampilkan {branches.from ?? 0}–{branches.to ?? 0}{' '}
                            dari {branches.total} cabang
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {branches.links.map((l, i) => {
                                const label = l.label
                                    .replace(/&laquo;\s*\w+/, '←')
                                    .replace(/\w+\s*&raquo;/, '→');

                                if (!l.url) {
                                    return (
                                        <span
                                            key={i}
                                            className="pb-btn pb-btn-secondary"
                                            style={{
                                                minWidth: 36,
                                                opacity: 0.4,
                                                cursor: 'not-allowed',
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={i}
                                        href={l.url}
                                        preserveScroll
                                        preserveState
                                        className={
                                            'pb-btn ' +
                                            (l.active
                                                ? 'pb-btn-primary'
                                                : 'pb-btn-secondary')
                                        }
                                        style={{ minWidth: 36 }}
                                        dangerouslySetInnerHTML={{
                                            __html: label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </main>

            <CabangFormSheet
                target={openForm}
                onClose={() => setOpenForm(null)}
            />
        </>
    );
}

function CabangFormSheet({
    target,
    onClose,
}: {
    target: null | Branch | 'create';
    onClose: () => void;
}) {
    const isOpen = target !== null;
    const isCreate = target === 'create';
    const branch = !isCreate && target ? target : null;

    return (
        <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[480px] overflow-y-auto"
            >
                <SheetHeader>
                    <SheetTitle>
                        {isCreate ? 'Tambah cabang' : `Edit ${branch?.name}`}
                    </SheetTitle>
                    <SheetDescription>
                        Isi data cabang. Kode harus unik per sistem.
                    </SheetDescription>
                </SheetHeader>

                <Form
                    method={isCreate ? 'post' : 'put'}
                    action={
                        isCreate
                            ? '/admin/cabang'
                            : `/admin/cabang/${branch?.id}`
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
                            <Field
                                label="Kode cabang"
                                required
                                error={errors.code}
                            >
                                <input
                                    name="code"
                                    defaultValue={branch?.code ?? ''}
                                    placeholder="Contoh: SC-01"
                                    className="pb-input"
                                />
                            </Field>

                            <Field
                                label="Nama cabang"
                                required
                                error={errors.name}
                            >
                                <input
                                    name="name"
                                    defaultValue={branch?.name ?? ''}
                                    placeholder="Contoh: Senayan City"
                                    className="pb-input"
                                />
                            </Field>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: 12,
                                }}
                            >
                                <Field label="Kota" error={errors.city}>
                                    <input
                                        name="city"
                                        defaultValue={branch?.city ?? ''}
                                        placeholder="Jakarta Pusat"
                                        className="pb-input"
                                    />
                                </Field>
                                <Field label="Provinsi" error={errors.province}>
                                    <input
                                        name="province"
                                        defaultValue={branch?.province ?? ''}
                                        placeholder="DKI Jakarta"
                                        className="pb-input"
                                    />
                                </Field>
                            </div>

                            <Field label="Alamat" error={errors.address}>
                                <textarea
                                    name="address"
                                    defaultValue={branch?.address ?? ''}
                                    rows={3}
                                    placeholder="Alamat lengkap..."
                                    className="pb-input"
                                    style={{
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </Field>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: 12,
                                }}
                            >
                                <Field label="Telepon" error={errors.phone}>
                                    <input
                                        name="phone"
                                        defaultValue={branch?.phone ?? ''}
                                        placeholder="021-12345678"
                                        className="pb-input"
                                    />
                                </Field>
                                <Field
                                    label="Manajer"
                                    error={errors.manager_name}
                                >
                                    <input
                                        name="manager_name"
                                        defaultValue={
                                            branch?.manager_name ?? ''
                                        }
                                        placeholder="Nama manajer"
                                        className="pb-input"
                                    />
                                </Field>
                            </div>

                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    value="1"
                                    defaultChecked={branch?.is_active ?? true}
                                    style={{
                                        accentColor: 'var(--pb-primary)',
                                    }}
                                />
                                Aktifkan cabang ini
                            </label>

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

Cabang.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="cabang">{page}</PhilobboothAdminLayout>
);
