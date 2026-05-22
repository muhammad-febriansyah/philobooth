import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { confirmDialog } from '@/components/philobooth/confirm-dialog';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type FrameRow = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    orientation: string | null;
    photo_slots: number;
    photo_slots_count: number;
    category: { id: number; name: string } | null;
    category_id: number | null;
    paper_size: { id: number; code: string; name: string } | null;
    paper_size_id: number | null;
    price_addon: number;
    is_premium: boolean;
    is_active: boolean;
    usage_count: number;
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
    frames: Paginated<FrameRow>;
    filters: { search: string; category_id: string; status: string };
    categories: Array<{ id: number; name: string; slug: string }>;
    flash?: { success?: string; error?: string };
};

export default function Frames({ frames, filters, categories, flash }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

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
            '/admin/frames',
            { ...filters, ...patch },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Frame Builder" />
            <main style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <PageHead
                    title="Frame builder"
                    subtitle={`${frames.total} frame template tersedia · slot foto auto-detect dari PNG`}
                    actions={
                        <Link
                            href="/admin/frames/create"
                            className="pb-btn pb-btn-primary"
                        >
                            <Icon name="plus" size={16} /> Upload frame baru
                        </Link>
                    }
                />

                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 24,
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
                            placeholder="Cari nama frame..."
                            style={{ paddingLeft: 38 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    <select
                        className="pb-input"
                        style={{ maxWidth: 200 }}
                        value={filters.category_id}
                        onChange={(e) =>
                            applyFilter({ category_id: e.target.value })
                        }
                    >
                        <option value="">Semua kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
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
                </div>

                {frames.data.length === 0 && (
                    <Card
                        padding={48}
                        style={{
                            textAlign: 'center',
                            color: 'var(--pb-text-faint)',
                        }}
                    >
                        <Icon name="frame" size={32} />
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 16,
                                fontWeight: 600,
                                color: 'var(--pb-text)',
                            }}
                        >
                            Belum ada frame
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                            Upload PNG pertama untuk mulai. Slot foto akan
                            terdeteksi otomatis.
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <Link
                                href="/admin/frames/create"
                                className="pb-btn pb-btn-primary"
                            >
                                <Icon name="plus" size={16} /> Upload frame
                                baru
                            </Link>
                        </div>
                    </Card>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: 16,
                    }}
                >
                    {frames.data.map((f) => (
                        <Card
                            key={f.id}
                            padding={0}
                            style={{ overflow: 'hidden' }}
                        >
                            <div
                                style={{
                                    background: '#FAFAFA',
                                    aspectRatio: '3/4',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {f.thumbnail_url ? (
                                    <img
                                        src={f.thumbnail_url}
                                        alt={f.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                ) : (
                                    <Icon
                                        name="image"
                                        size={32}
                                        color="var(--pb-text-faint)"
                                    />
                                )}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 10,
                                        display: 'flex',
                                        gap: 6,
                                    }}
                                >
                                    {f.is_premium && (
                                        <Badge tone="active">PREMIUM</Badge>
                                    )}
                                    {!f.is_active && (
                                        <Badge tone="neutral">Nonaktif</Badge>
                                    )}
                                </div>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        background: 'rgba(10,10,10,0.85)',
                                        color: 'var(--pb-primary)',
                                        padding: '4px 10px',
                                        borderRadius: 999,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    {f.photo_slots_count} slot
                                </div>
                            </div>
                            <div style={{ padding: 14 }}>
                                <div
                                    style={{ fontSize: 14, fontWeight: 700 }}
                                >
                                    {f.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--pb-text-faint)',
                                        marginTop: 4,
                                    }}
                                >
                                    {f.category?.name ?? '—'} ·{' '}
                                    {f.paper_size?.code ?? '—'} ·{' '}
                                    {f.orientation === 'landscape'
                                        ? 'Landscape'
                                        : 'Portrait'}
                                </div>
                                <div
                                    style={{
                                        marginTop: 12,
                                        display: 'flex',
                                        gap: 6,
                                    }}
                                >
                                    <Link
                                        href={`/admin/frames/${f.id}/preview`}
                                        className="pb-btn pb-btn-secondary"
                                        style={{
                                            flex: 1,
                                            fontSize: 12,
                                            padding: '8px 10px',
                                        }}
                                    >
                                        <Icon name="eye" size={14} /> Preview
                                    </Link>
                                    <Link
                                        href={`/admin/frames/${f.id}/edit`}
                                        className="pb-btn pb-btn-secondary pb-btn-sm"
                                        style={{ fontSize: 12 }}
                                    >
                                        <Icon name="edit" size={14} /> Edit
                                    </Link>
                                    <Btn
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        icon="trash"
                                        aria-label="Hapus frame"
                                        title="Hapus frame"
                                        onClick={async () => {
                                            const ok = await confirmDialog({
                                                title: `Hapus frame "${f.name}"?`,
                                                description:
                                                    'Frame ini akan dihapus permanen. Foto yang sudah pakai frame ini tetap aman.',
                                                confirmText: 'Hapus frame',
                                                tone: 'danger',
                                                icon: 'trash',
                                            });

                                            if (ok) {
                                                router.delete(
                                                    `/admin/frames/${f.id}`,
                                                    {
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }
                                        }}
                                    >
                                        Hapus
                                    </Btn>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {frames.last_page > 1 && (
                    <div
                        style={{
                            marginTop: 24,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 13,
                            color: 'var(--pb-text-muted)',
                        }}
                    >
                        <div>
                            Menampilkan {frames.from ?? 0}–{frames.to ?? 0} dari{' '}
                            {frames.total}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {frames.links.map((l, i) => {
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
                )}
            </main>
        </>
    );
}
Frames.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="frames">{page}</PhilobboothAdminLayout>
);
