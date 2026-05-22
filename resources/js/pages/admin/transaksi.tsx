import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import type { IconName } from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type SessionRow = {
    id: number;
    session_code: string;
    branch: string | null;
    paper: string | null;
    frame: string | null;
    status: string | null;
    status_label: string | null;
    payment_method: string | null;
    payment_method_label: string | null;
    print_quantity: number;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    customer_phone: string | null;
    customer_email: string | null;
    started_at: string | null;
    paid_at: string | null;
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

type Filters = {
    search: string;
    status: string;
    method: string;
    branch_id: string;
    from: string;
    to: string;
};

type Props = {
    sessions: Paginated<SessionRow>;
    stats: { total: number; revenue: number; completed: number; prints: number };
    branches: Array<{ id: number; name: string; code: string }>;
    can_pick_branch: boolean;
    filters: Filters;
    options: { statuses: Option[]; methods: Option[] };
    flash?: { success?: string; error?: string };
};

function formatRupiah(v: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(v);
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';

    return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statusTone(
    status: string | null,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (status === 'completed') return 'success';
    if (status === 'paid' || status === 'printing') return 'info';
    if (status === 'cancelled' || status === 'expired') return 'danger';
    if (status === 'payment_pending') return 'warning';

    return 'neutral';
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
                    fontSize: 26,
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

export default function Transaksi({
    sessions,
    stats,
    branches,
    can_pick_branch,
    filters,
    options,
    flash,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    function applyFilter(patch: Partial<Filters>) {
        router.get(
            '/admin/transaksi',
            { ...filters, ...patch },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function exportQuery(): string {
        const p = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v) p.set(k, String(v));
        });

        return p.toString() ? `?${p.toString()}` : '';
    }

    return (
        <>
            <Head title="Transaksi" />
            <main style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <PageHead
                    title="Transaksi"
                    subtitle={`${sessions.total} sesi sesuai filter`}
                    actions={
                        <>
                            <a
                                className="pb-btn pb-btn-secondary"
                                href={`/admin/transaksi/export/csv${exportQuery()}`}
                            >
                                <Icon name="download" size={16} /> Excel (CSV)
                            </a>
                            <a
                                className="pb-btn pb-btn-dark"
                                href={`/admin/transaksi/export/pdf${exportQuery()}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Icon name="download" size={16} /> PDF
                            </a>
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
                    <Stat label="Total transaksi" value={stats.total} icon="receipt" />
                    <Stat
                        label="Selesai"
                        value={stats.completed}
                        icon="check-circle"
                    />
                    <Stat
                        label="Total cetak"
                        value={stats.prints}
                        icon="printer"
                    />
                    <Stat
                        label="Revenue"
                        value={formatRupiah(stats.revenue)}
                        icon="wallet"
                    />
                </div>

                <Card padding={18} style={{ marginBottom: 18 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'minmax(220px, 1fr) repeat(4, minmax(140px, 1fr)) minmax(140px, 1fr) minmax(140px, 1fr)',
                            gap: 10,
                            alignItems: 'end',
                        }}
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilter({ search });
                            }}
                            style={{ position: 'relative' }}
                        >
                            <FieldLabel label="Cari" />
                            <Icon
                                name="search"
                                size={16}
                                style={{
                                    position: 'absolute',
                                    left: 12,
                                    bottom: 12,
                                    color: 'var(--pb-text-faint)',
                                }}
                            />
                            <input
                                className="pb-input"
                                placeholder="Kode sesi / telp / email"
                                style={{ paddingLeft: 38 }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                        <div>
                            <FieldLabel label="Status" />
                            <select
                                className="pb-input"
                                value={filters.status}
                                onChange={(e) =>
                                    applyFilter({ status: e.target.value })
                                }
                            >
                                <option value="">Semua</option>
                                {options.statuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <FieldLabel label="Metode" />
                            <select
                                className="pb-input"
                                value={filters.method}
                                onChange={(e) =>
                                    applyFilter({ method: e.target.value })
                                }
                            >
                                <option value="">Semua</option>
                                {options.methods.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {can_pick_branch ? (
                            <div>
                                <FieldLabel label="Cabang" />
                                <select
                                    className="pb-input"
                                    value={filters.branch_id}
                                    onChange={(e) =>
                                        applyFilter({
                                            branch_id: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Semua</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div />
                        )}
                        <div>
                            <FieldLabel label="Dari tgl" />
                            <input
                                type="date"
                                className="pb-input"
                                value={filters.from}
                                onChange={(e) =>
                                    applyFilter({ from: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <FieldLabel label="Sampai tgl" />
                            <input
                                type="date"
                                className="pb-input"
                                value={filters.to}
                                onChange={(e) =>
                                    applyFilter({ to: e.target.value })
                                }
                            />
                        </div>
                        <Btn
                            type="button"
                            variant="ghost"
                            icon="x"
                            onClick={() =>
                                router.get(
                                    '/admin/transaksi',
                                    {},
                                    {
                                        preserveScroll: true,
                                        replace: true,
                                    },
                                )
                            }
                        >
                            Reset
                        </Btn>
                    </div>
                </Card>

                <Card padding={0}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#FAFAFA' }}>
                                {[
                                    'Kode sesi',
                                    'Tanggal',
                                    'Cabang',
                                    'Metode',
                                    'Status',
                                    'Qty',
                                    'Total',
                                    'Diskon',
                                    'Final',
                                ].map((h, i) => (
                                    <th
                                        key={i}
                                        style={{
                                            textAlign:
                                                i >= 5 ? 'right' : 'left',
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
                            {sessions.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        style={{
                                            padding: 40,
                                            textAlign: 'center',
                                            color: 'var(--pb-text-faint)',
                                        }}
                                    >
                                        <Icon
                                            name="receipt"
                                            size={28}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <div>Belum ada transaksi sesuai filter</div>
                                    </td>
                                </tr>
                            )}
                            {sessions.data.map((r, i) => (
                                <tr
                                    key={r.id}
                                    style={{
                                        borderBottom:
                                            i < sessions.data.length - 1
                                                ? '1px solid var(--pb-border-soft)'
                                                : 'none',
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 12,
                                            fontFamily:
                                                'ui-monospace, monospace',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {r.session_code}
                                        {r.customer_phone && (
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: 'var(--pb-text-faint)',
                                                    fontFamily: 'inherit',
                                                    fontWeight: 400,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {r.customer_phone}
                                            </div>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 12,
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        {formatDateTime(r.started_at)}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                        }}
                                    >
                                        {r.branch ?? '—'}
                                        {r.paper && (
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: 'var(--pb-text-faint)',
                                                }}
                                            >
                                                {r.paper}
                                            </div>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 12,
                                        }}
                                    >
                                        {r.payment_method_label ?? '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <Badge tone={statusTone(r.status)} dot>
                                            {r.status_label ?? '—'}
                                        </Badge>
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                            textAlign: 'right',
                                        }}
                                    >
                                        {r.print_quantity}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 12,
                                            textAlign: 'right',
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        {formatRupiah(r.total_amount)}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 12,
                                            textAlign: 'right',
                                            color:
                                                r.discount_amount > 0
                                                    ? 'var(--pb-success)'
                                                    : 'var(--pb-text-faint)',
                                        }}
                                    >
                                        {r.discount_amount > 0
                                            ? `−${formatRupiah(r.discount_amount)}`
                                            : '—'}
                                    </td>
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            fontSize: 13,
                                            textAlign: 'right',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {formatRupiah(r.final_amount)}
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
                            Menampilkan {sessions.from ?? 0}–{sessions.to ?? 0}{' '}
                            dari {sessions.total} transaksi
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {sessions.links.map((l, i) => {
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
        </>
    );
}

function FieldLabel({ label }: { label: string }) {
    return (
        <label
            style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: 'var(--pb-text-muted)',
                marginBottom: 4,
            }}
        >
            {label}
        </label>
    );
}

Transaksi.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="tx">{page}</PhilobboothAdminLayout>
);
