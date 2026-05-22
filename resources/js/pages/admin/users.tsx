import { Form, Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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

type UserRow = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    branch_id: number | null;
    branch: string | null;
    role: string | null;
    is_active: boolean;
    last_login_at: string | null;
    avatar: string | null;
};

type Option = { value: string; label: string };

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
    users: Paginated<UserRow>;
    stats: { total: number; active: number; admins: number; cabang: number };
    branches: Array<{ id: number; name: string; code: string }>;
    filters: { search: string; role: string; branch_id: string; status: string };
    options: { roles: Option[] };
    flash?: { success?: string; error?: string };
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatDateTime(iso: string | null): string {
    if (!iso) {
return 'Belum pernah';
}

    return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

export default function UsersPage({
    users,
    stats,
    branches,
    filters,
    options,
    flash,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [openForm, setOpenForm] = useState<null | UserRow | 'create'>(null);

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
            '/admin/users',
            { ...filters, ...patch },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="User & Role" />
            <main style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <PageHead
                    title="User & role"
                    subtitle={`${users.total} user terdaftar`}
                    actions={
                        <Btn
                            variant="primary"
                            icon="plus"
                            onClick={() => setOpenForm('create')}
                        >
                            Tambah user
                        </Btn>
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
                    <Stat label="Total user" value={stats.total} icon="users" />
                    <Stat
                        label="User aktif"
                        value={stats.active}
                        icon="check-circle"
                    />
                    <Stat label="Admin" value={stats.admins} icon="sparkles" />
                    <Stat
                        label="Cabang"
                        value={stats.cabang}
                        icon="store"
                    />
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
                            placeholder="Cari nama, email, atau telepon…"
                            style={{ paddingLeft: 38 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    <select
                        className="pb-input"
                        style={{ maxWidth: 160 }}
                        value={filters.role}
                        onChange={(e) => applyFilter({ role: e.target.value })}
                    >
                        <option value="">Semua role</option>
                        {options.roles.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
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
                    <select
                        className="pb-input"
                        style={{ maxWidth: 160 }}
                        value={filters.status}
                        onChange={(e) =>
                            applyFilter({ status: e.target.value })
                        }
                    >
                        <option value="">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                </div>

                <Card padding={0}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#FAFAFA' }}>
                                {[
                                    'User',
                                    'Role',
                                    'Cabang',
                                    'Telepon',
                                    'Login terakhir',
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
                            {users.data.length === 0 && (
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
                                            name="users"
                                            size={28}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <div>Belum ada user</div>
                                    </td>
                                </tr>
                            )}
                            {users.data.map((u, i) => (
                                <tr
                                    key={u.id}
                                    style={{
                                        borderBottom:
                                            i < users.data.length - 1
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
                                                    borderRadius: '50%',
                                                    background:
                                                        'linear-gradient(135deg, #FFE9C7, #FFB37C)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    color: '#7A3E00',
                                                    fontSize: 13,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {initials(u.name)}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {u.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: 'var(--pb-text-faint)',
                                                    }}
                                                >
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <Badge
                                            tone={
                                                u.role === 'admin'
                                                    ? 'warning'
                                                    : 'info'
                                            }
                                        >
                                            {u.role === 'admin'
                                                ? 'Admin'
                                                : u.role === 'cabang'
                                                  ? 'Cabang'
                                                  : '—'}
                                        </Badge>
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                        }}
                                    >
                                        {u.branch ?? '—'}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        {u.phone ?? '—'}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 12,
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        {formatDateTime(u.last_login_at)}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <Badge
                                            tone={
                                                u.is_active
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                            dot
                                        >
                                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            textAlign: 'right',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <Btn
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon="edit"
                                            onClick={() => setOpenForm(u)}
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
                                                    title: `Hapus user ${u.name}?`,
                                                    description: `Akun ${u.email} tidak bisa login lagi. Data transaksi tetap tersimpan.`,
                                                    confirmText: 'Hapus user',
                                                    tone: 'danger',
                                                    icon: 'trash',
                                                });

                                                if (!ok) {
                                                    return;
                                                }

                                                router.delete(
                                                    `/admin/users/${u.id}`,
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
                            Menampilkan {users.from ?? 0}–{users.to ?? 0} dari{' '}
                            {users.total} user
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {users.links.map((l, i) => {
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

            <UserFormSheet
                target={openForm}
                onClose={() => setOpenForm(null)}
                branches={branches}
                roles={options.roles}
            />
        </>
    );
}

function UserFormSheet({
    target,
    onClose,
    branches,
    roles,
}: {
    target: null | UserRow | 'create';
    onClose: () => void;
    branches: Array<{ id: number; name: string }>;
    roles: Option[];
}) {
    const isOpen = target !== null;
    const isCreate = target === 'create';
    const u = !isCreate && target ? target : null;

    const [role, setRole] = useState<string>(u?.role ?? 'cabang');

    useEffect(() => {
        setRole(u?.role ?? 'cabang');
    }, [u?.id, u?.role, isCreate]);

    return (
        <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[480px] overflow-y-auto"
            >
                <SheetHeader>
                    <SheetTitle>
                        {isCreate ? 'Tambah user' : `Edit ${u?.name}`}
                    </SheetTitle>
                    <SheetDescription>
                        User cabang akan otomatis ke-scope ke cabang yang dipilih.
                    </SheetDescription>
                </SheetHeader>

                <Form
                    method={isCreate ? 'post' : 'put'}
                    action={isCreate ? '/admin/users' : `/admin/users/${u?.id}`}
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
                            <Field label="Nama" required error={errors.name}>
                                <input
                                    name="name"
                                    defaultValue={u?.name ?? ''}
                                    placeholder="Nama lengkap"
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
                                    label="Email"
                                    required
                                    error={errors.email}
                                >
                                    <input
                                        name="email"
                                        type="email"
                                        defaultValue={u?.email ?? ''}
                                        placeholder="user@philobooth.id"
                                        className="pb-input"
                                    />
                                </Field>
                                <Field label="Telepon" error={errors.phone}>
                                    <input
                                        name="phone"
                                        defaultValue={u?.phone ?? ''}
                                        placeholder="0812-3456-7890"
                                        className="pb-input"
                                    />
                                </Field>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                }}
                            >
                                <Field label="Role" required error={errors.role}>
                                    <select
                                        name="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="pb-input"
                                    >
                                        {roles.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="Cabang"
                                    required={role === 'cabang'}
                                    error={errors.branch_id}
                                >
                                    <select
                                        name="branch_id"
                                        defaultValue={u?.branch_id ?? ''}
                                        className="pb-input"
                                        disabled={role !== 'cabang'}
                                    >
                                        <option value="">
                                            {role === 'cabang'
                                                ? '— Pilih cabang —'
                                                : 'Tidak relevan'}
                                        </option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <div
                                style={{
                                    padding: 12,
                                    background: '#FAFAFA',
                                    borderRadius: 10,
                                    fontSize: 12,
                                    color: 'var(--pb-text-muted)',
                                    lineHeight: 1.5,
                                }}
                            >
                                <strong style={{ color: 'var(--pb-text)' }}>
                                    Password
                                </strong>{' '}
                                {isCreate
                                    ? '— wajib diisi minimal 8 karakter.'
                                    : '— kosongkan jika tidak ingin mengubah password.'}
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                }}
                            >
                                <Field
                                    label="Password"
                                    required={isCreate}
                                    error={errors.password}
                                >
                                    <input
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className="pb-input"
                                    />
                                </Field>
                                <Field label="Konfirmasi password">
                                    <input
                                        name="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="••••••••"
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
                                    defaultChecked={u?.is_active ?? true}
                                    style={{
                                        accentColor: 'var(--pb-primary)',
                                    }}
                                />
                                Aktifkan akun ini
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

UsersPage.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="users">{page}</PhilobboothAdminLayout>
);
