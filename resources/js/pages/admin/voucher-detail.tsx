import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type Voucher = {
    id: number;
    code: string;
    used_count: number;
    max_uses: number;
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
    batch: {
        id: number;
        name: string;
        code_prefix: string;
        total_generated: number;
        total_used: number;
    };
    vouchers: Paginated<Voucher>;
    filters: { search: string; status: string };
};

export default function VoucherDetail({ batch, vouchers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(patch: Partial<Props['filters']>) {
        router.get(
            `/admin/voucher/${batch.id}/codes`,
            { ...filters, ...patch },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function copyCode(code: string) {
        navigator.clipboard?.writeText(code);
    }

    function copyAll() {
        const text = vouchers.data.map((v) => v.code).join('\n');
        navigator.clipboard?.writeText(text);
    }

    return (
        <>
            <Head title={`Voucher · ${batch.name}`} />
            <main style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <Link
                    href="/admin/voucher"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: 'var(--pb-text-muted)',
                        textDecoration: 'none',
                        marginBottom: 12,
                    }}
                >
                    <Icon name="chevron-left" size={14} /> Kembali ke daftar batch
                </Link>

                <PageHead
                    title={batch.name}
                    subtitle={`Prefix: ${batch.code_prefix} · Akses gratis kiosk`}
                    actions={
                        <Btn
                            variant="secondary"
                            icon="copy"
                            onClick={copyAll}
                        >
                            Salin halaman ini
                        </Btn>
                    }
                />

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 16,
                        marginBottom: 24,
                    }}
                >
                    <Card padding={20}>
                        <div
                            className="pb-caption"
                            style={{
                                color: 'var(--pb-text-muted)',
                                textTransform: 'uppercase',
                            }}
                        >
                            Total dibuat
                        </div>
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                marginTop: 6,
                            }}
                        >
                            {batch.total_generated}
                        </div>
                    </Card>
                    <Card padding={20}>
                        <div
                            className="pb-caption"
                            style={{
                                color: 'var(--pb-text-muted)',
                                textTransform: 'uppercase',
                            }}
                        >
                            Terpakai
                        </div>
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                marginTop: 6,
                            }}
                        >
                            {batch.total_used}
                        </div>
                    </Card>
                    <Card padding={20}>
                        <div
                            className="pb-caption"
                            style={{
                                color: 'var(--pb-text-muted)',
                                textTransform: 'uppercase',
                            }}
                        >
                            Total di halaman
                        </div>
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                marginTop: 6,
                            }}
                        >
                            {vouchers.total}
                        </div>
                    </Card>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 18,
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
                            placeholder="Cari kode..."
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
                        <option value="">Semua</option>
                        <option value="unused">Belum dipakai</option>
                        <option value="used">Sudah dipakai</option>
                    </select>
                </div>

                <Card padding={0}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#FAFAFA' }}>
                                {['Kode', 'Pemakaian', 'Status', 'Terakhir dipakai', ''].map(
                                    (h, i) => (
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
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        style={{
                                            padding: 40,
                                            textAlign: 'center',
                                            color: 'var(--pb-text-faint)',
                                        }}
                                    >
                                        <Icon
                                            name="ticket"
                                            size={28}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <div>
                                            Belum ada kode. Generate dari halaman
                                            sebelumnya.
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {vouchers.data.map((v, i) => (
                                <tr
                                    key={v.id}
                                    style={{
                                        borderBottom:
                                            i < vouchers.data.length - 1
                                                ? '1px solid var(--pb-border-soft)'
                                                : 'none',
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: 13,
                                            fontFamily:
                                                'ui-monospace, monospace',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {v.code}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: 13,
                                        }}
                                    >
                                        {v.used_count} / {v.max_uses}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <Badge
                                            tone={
                                                v.used_count > 0
                                                    ? 'warning'
                                                    : v.is_active
                                                      ? 'success'
                                                      : 'danger'
                                            }
                                            dot
                                        >
                                            {v.used_count > 0
                                                ? 'Terpakai'
                                                : v.is_active
                                                  ? 'Belum dipakai'
                                                  : 'Nonaktif'}
                                        </Badge>
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: 12,
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        {v.used_at
                                            ? new Date(v.used_at).toLocaleString(
                                                  'id-ID',
                                              )
                                            : '—'}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Btn
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon="copy"
                                            onClick={() => copyCode(v.code)}
                                        >
                                            Salin
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
                            Menampilkan {vouchers.from ?? 0}–{vouchers.to ?? 0}{' '}
                            dari {vouchers.total} kode
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {vouchers.links.map((l, i) => {
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

VoucherDetail.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="voucher">{page}</PhilobboothAdminLayout>
);
