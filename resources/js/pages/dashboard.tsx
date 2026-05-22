import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import type { IconName } from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type Stat = { value: number; delta: number };

type ChartPoint = { date: string; label: string; value: number };

type TopBranch = {
    name: string;
    revenue: number;
    percent: number;
    tx: number;
};

type PrinterRow = {
    id: number;
    code: string;
    branch: string;
    status: 'online' | 'warn' | 'offline';
    jobs: number;
    paper: number;
};

type TxRow = {
    id: string;
    branch: string;
    item: string;
    method: string;
    amount: number;
    time: string;
    status: 'paid' | 'pending';
};

type Props = {
    stats: {
        revenue: Stat;
        prints: Stat;
        transactions: Stat;
        avg_basket: Stat;
    };
    chart: ChartPoint[];
    topBranches: TopBranch[];
    printers: PrinterRow[];
    recentTx: TxRow[];
    todayLabel: string;
};

function rupiah(n: number, compact = false): string {
    if (compact) {
        if (n >= 1_000_000) {
            return `Rp ${(n / 1_000_000).toFixed(2)} jt`;
        }

        if (n >= 1_000) {
            return `Rp ${(n / 1_000).toFixed(1)}k`;
        }
    }

    return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;
}

type StatTone = 'yellow' | 'blue' | 'green' | 'purple';

const TONE_STYLE: Record<StatTone, { bg: string; fg: string }> = {
    yellow: { bg: 'rgba(245,250,12,0.18)', fg: '#7a3e00' },
    blue: { bg: 'rgba(37,99,235,0.10)', fg: '#1d4ed8' },
    green: { bg: 'rgba(22,163,74,0.10)', fg: '#15803d' },
    purple: { bg: 'rgba(124,58,237,0.10)', fg: '#6d28d9' },
};

function Sparkline({
    values,
    tone = 'yellow',
}: {
    values: number[];
    tone?: StatTone;
}) {
    const w = 92;
    const h = 28;

    if (values.length < 2) {
        return <div style={{ width: w, height: h }} />;
    }

    const max = Math.max(...values, 1);
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => {
        const x = i * step;
        const y = h - (v / max) * (h - 4) - 2;

        return [x, y] as const;
    });
    const linePath = pts
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
        .join(' ');
    const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

    const lineColor =
        tone === 'yellow'
            ? '#0a0a0a'
            : tone === 'blue'
              ? '#1d4ed8'
              : tone === 'green'
                ? '#15803d'
                : '#6d28d9';
    const fillColor =
        tone === 'yellow'
            ? 'rgba(10,10,10,0.08)'
            : tone === 'blue'
              ? 'rgba(37,99,235,0.10)'
              : tone === 'green'
                ? 'rgba(22,163,74,0.10)'
                : 'rgba(124,58,237,0.10)';

    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            style={{ display: 'block' }}
            aria-hidden="true"
        >
            <path d={areaPath} fill={fillColor} />
            <path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function StatCard({
    label,
    value,
    delta,
    icon,
    tone,
    spark,
}: {
    label: string;
    value: string;
    delta: number;
    icon: IconName;
    tone: StatTone;
    spark?: number[];
}) {
    const isUp = delta >= 0;
    const t = TONE_STYLE[tone];

    return (
        <Card padding={20} style={{ position: 'relative', overflow: 'hidden' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                }}
            >
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: t.bg,
                        color: t.fg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon name={icon} size={18} />
                </div>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: isUp ? '#15803d' : '#b91c1c',
                        background: isUp
                            ? 'rgba(22,163,74,0.10)'
                            : 'rgba(220,38,38,0.10)',
                    }}
                >
                    <Icon
                        name="trend-up"
                        size={11}
                        style={{ transform: isUp ? 'none' : 'scaleY(-1)' }}
                    />
                    {isUp ? '+' : ''}
                    {delta}%
                </span>
            </div>
            <div
                style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--pb-text-faint)',
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: -0.8,
                    marginTop: 6,
                    color: 'var(--pb-ink)',
                }}
            >
                {value}
            </div>
            <div
                style={{
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                }}
            >
                <span
                    style={{ fontSize: 11, color: 'var(--pb-text-faint)' }}
                >
                    vs kemarin
                </span>
                {spark && spark.length > 1 && (
                    <Sparkline values={spark} tone={tone} />
                )}
            </div>
        </Card>
    );
}

function MethodIcon({ method }: { method: string }) {
    const m = method.toLowerCase();
    let icon: IconName = 'credit-card';

    if (m.includes('qris') || m.includes('qr')) {
        icon = 'qr';
    } else if (m.includes('cash') || m.includes('tunai')) {
        icon = 'wallet';
    } else if (m.includes('voucher')) {
        icon = 'ticket';
    }

    return (
        <div
            style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#F4F4F5',
                color: 'var(--pb-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <Icon name={icon} size={15} />
        </div>
    );
}

export default function Dashboard({
    stats,
    chart,
    topBranches,
    printers,
    recentTx,
    todayLabel,
}: Props) {
    const chartMax = Math.max(1, ...chart.map((c) => c.value));
    const todayKey = chart.length > 0 ? chart[chart.length - 1].date : '';
    const totalRevenue = chart.reduce((a, b) => a + b.value, 0);
    const avgRevenue = chart.length > 0 ? totalRevenue / chart.length : 0;

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const sparkValues = chart.map((c) => c.value);

    return (
        <>
            <Head title="Dashboard" />
            <main style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <PageHead
                    title="Dashboard overview"
                    subtitle={todayLabel}
                    actions={
                        <>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    borderRadius: 999,
                                    background: 'rgba(22,163,74,0.10)',
                                    color: '#15803d',
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                <span
                                    className="pb-pulse"
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        background: '#16a34a',
                                        display: 'inline-block',
                                    }}
                                />
                                Live
                            </span>
                            <Btn variant="secondary" icon="calendar">
                                14 hari terakhir
                            </Btn>
                            <Btn variant="secondary" icon="download">
                                Ekspor
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
                    <StatCard
                        label="Revenue hari ini"
                        value={rupiah(stats.revenue.value, true)}
                        delta={stats.revenue.delta}
                        icon="wallet"
                        tone="yellow"
                        spark={sparkValues}
                    />
                    <StatCard
                        label="Cetakan"
                        value={String(stats.prints.value)}
                        delta={stats.prints.delta}
                        icon="printer"
                        tone="blue"
                        spark={sparkValues}
                    />
                    <StatCard
                        label="Transaksi"
                        value={String(stats.transactions.value)}
                        delta={stats.transactions.delta}
                        icon="receipt"
                        tone="green"
                        spark={sparkValues}
                    />
                    <StatCard
                        label="Avg basket"
                        value={rupiah(stats.avg_basket.value, true)}
                        delta={stats.avg_basket.delta}
                        icon="trend-up"
                        tone="purple"
                    />
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr',
                        gap: 16,
                        marginBottom: 24,
                    }}
                >
                    <Card>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                marginBottom: 20,
                                gap: 16,
                            }}
                        >
                            <div>
                                <h3 className="pb-h4" style={{ margin: 0 }}>
                                    Revenue 14 hari terakhir
                                </h3>
                                <p
                                    className="pb-body-sm"
                                    style={{
                                        margin: '4px 0 0',
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    Total {rupiah(totalRevenue, true)} · rata-rata{' '}
                                    {rupiah(avgRevenue, true)}/hari
                                </p>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 14,
                                    fontSize: 11.5,
                                    color: 'var(--pb-text-muted)',
                                    paddingTop: 4,
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 3,
                                            background: '#171717',
                                            display: 'inline-block',
                                        }}
                                    />
                                    Harian
                                </span>
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 3,
                                            background: 'var(--pb-primary)',
                                            display: 'inline-block',
                                        }}
                                    />
                                    Hari ini
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '36px 1fr',
                                gap: 8,
                                height: 240,
                            }}
                        >
                            {/* Y-axis labels */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    paddingBottom: 22,
                                    paddingTop: 4,
                                    fontSize: 10,
                                    color: 'var(--pb-text-faint)',
                                    textAlign: 'right',
                                }}
                            >
                                <span>{rupiah(chartMax, true)}</span>
                                <span>{rupiah(chartMax * 0.66, true)}</span>
                                <span>{rupiah(chartMax * 0.33, true)}</span>
                                <span>Rp 0</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: '0 0 22px 0',
                                        display: 'grid',
                                        gridTemplateRows: 'repeat(3, 1fr)',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            style={{
                                                borderTop:
                                                    '1px dashed #F0F0F1',
                                            }}
                                        />
                                    ))}
                                    <div
                                        style={{
                                            borderTop: '1px solid #E5E5E5',
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        gap: 6,
                                        height: 'calc(100% - 22px)',
                                        position: 'relative',
                                    }}
                                >
                                    {chart.map((c, idx) => {
                                        const isToday = c.date === todayKey;
                                        const h = chartMax
                                            ? (c.value / chartMax) * 100
                                            : 0;
                                        const isHover = hoveredIdx === idx;

                                        return (
                                            <div
                                                key={c.date}
                                                onMouseEnter={() =>
                                                    setHoveredIdx(idx)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredIdx(null)
                                                }
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    height: '100%',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                {isHover && (
                                                    <div
                                                        style={{
                                                            position:
                                                                'absolute',
                                                            bottom: `calc(${h}% + 10px)`,
                                                            left: '50%',
                                                            transform:
                                                                'translateX(-50%)',
                                                            background:
                                                                'var(--pb-ink)',
                                                            color: '#fff',
                                                            padding:
                                                                '6px 10px',
                                                            borderRadius: 8,
                                                            fontSize: 11.5,
                                                            fontWeight: 600,
                                                            whiteSpace:
                                                                'nowrap',
                                                            zIndex: 5,
                                                            boxShadow:
                                                                '0 6px 16px -4px rgba(0,0,0,0.25)',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 10,
                                                                fontWeight: 500,
                                                                color: 'rgba(255,255,255,0.7)',
                                                            }}
                                                        >
                                                            {c.label}
                                                        </div>
                                                        {rupiah(c.value)}
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        width: '70%',
                                                        height: `${h}%`,
                                                        background: isToday
                                                            ? 'linear-gradient(180deg, var(--pb-primary) 0%, #d4d80a 100%)'
                                                            : isHover
                                                              ? 'linear-gradient(180deg, #262626 0%, #0a0a0a 100%)'
                                                              : 'linear-gradient(180deg, #1f1f1f 0%, #0a0a0a 100%)',
                                                        borderRadius: '6px 6px 0 0',
                                                        minHeight: 3,
                                                        boxShadow: isHover
                                                            ? '0 -4px 14px -4px rgba(10,10,10,0.25)'
                                                            : 'none',
                                                        transition:
                                                            'background 0.18s ease, box-shadow 0.18s ease',
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 6,
                                        marginTop: 6,
                                        height: 16,
                                    }}
                                >
                                    {chart.map((c) => (
                                        <div
                                            key={c.date}
                                            style={{
                                                flex: 1,
                                                textAlign: 'center',
                                                fontSize: 10,
                                                color:
                                                    c.date === todayKey
                                                        ? 'var(--pb-ink)'
                                                        : 'var(--pb-text-faint)',
                                                fontWeight:
                                                    c.date === todayKey
                                                        ? 700
                                                        : 400,
                                            }}
                                        >
                                            {c.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 4,
                            }}
                        >
                            <h3 className="pb-h4" style={{ margin: 0 }}>
                                Top cabang
                            </h3>
                            <Link
                                href="/admin/cabang"
                                className="pb-link-subtle"
                            >
                                Lihat semua
                            </Link>
                        </div>
                        <p
                            className="pb-body-sm"
                            style={{
                                margin: 0,
                                color: 'var(--pb-text-muted)',
                                marginBottom: 20,
                            }}
                        >
                            Berdasarkan revenue hari ini
                        </p>
                        {topBranches.length === 0 && (
                            <DashboardEmpty
                                icon="store"
                                title="Belum ada transaksi hari ini"
                                desc="Top cabang akan muncul setelah ada transaksi."
                            />
                        )}
                        {topBranches.map((b, i) => (
                            <div key={i} style={{ marginBottom: 16 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        marginBottom: 8,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 6,
                                            background:
                                                i === 0
                                                    ? 'var(--pb-primary)'
                                                    : '#F4F4F5',
                                            color:
                                                i === 0
                                                    ? 'var(--pb-ink)'
                                                    : 'var(--pb-text-muted)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                    <span
                                        style={{
                                            flex: 1,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {b.name}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: 'var(--pb-ink)',
                                        }}
                                    >
                                        {rupiah(b.revenue, true)}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: 6,
                                        background: '#F4F4F5',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${b.percent}%`,
                                            height: '100%',
                                            background:
                                                i === 0
                                                    ? 'var(--pb-primary)'
                                                    : '#171717',
                                            borderRadius: 3,
                                            transition: 'width 0.5s ease',
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--pb-text-faint)',
                                        marginTop: 4,
                                        marginLeft: 32,
                                    }}
                                >
                                    {b.tx} transaksi · {b.percent}% dari total
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.1fr 1fr',
                        gap: 16,
                    }}
                >
                    <Card padding={0}>
                        <div
                            style={{
                                padding: '18px 22px',
                                borderBottom: '1px solid var(--pb-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <h3 className="pb-h4" style={{ margin: 0 }}>
                                    Status printer
                                </h3>
                                <p
                                    className="pb-body-sm"
                                    style={{
                                        margin: '4px 0 0',
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    Top {printers.length} berdasarkan job hari ini
                                </p>
                            </div>
                            <Link
                                href="/admin/printer"
                                className="pb-link-subtle"
                            >
                                Lihat semua →
                            </Link>
                        </div>
                        <div>
                            {printers.length === 0 && (
                                <div style={{ padding: 22 }}>
                                    <DashboardEmpty
                                        icon="printer"
                                        title="Belum ada data printer"
                                        desc="Tambahkan printer di menu Printer."
                                    />
                                </div>
                            )}
                            {printers.map((p, i) => (
                                <div
                                    key={p.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'auto 1fr auto auto auto',
                                        gap: 16,
                                        alignItems: 'center',
                                        padding: '14px 22px',
                                        borderBottom:
                                            i < printers.length - 1
                                                ? '1px solid var(--pb-border-soft)'
                                                : 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 9,
                                            background: '#F4F4F5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--pb-text-muted)',
                                        }}
                                    >
                                        <Icon name="printer" size={18} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {p.code}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--pb-text-faint)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {p.branch}
                                        </div>
                                    </div>
                                    <div style={{ width: 110 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: 11,
                                                color: 'var(--pb-text-faint)',
                                                marginBottom: 4,
                                            }}
                                        >
                                            <span>Kertas</span>
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color:
                                                        p.paper < 20
                                                            ? 'var(--pb-danger)'
                                                            : p.paper < 40
                                                              ? 'var(--pb-warning)'
                                                              : 'var(--pb-text-muted)',
                                                }}
                                            >
                                                {p.paper}%
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                height: 5,
                                                background: '#F4F4F5',
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${p.paper}%`,
                                                    height: '100%',
                                                    background:
                                                        p.paper < 20
                                                            ? 'var(--pb-danger)'
                                                            : p.paper < 40
                                                              ? 'var(--pb-warning)'
                                                              : 'var(--pb-success)',
                                                    transition:
                                                        'width 0.4s ease',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: 'var(--pb-text-muted)',
                                            fontWeight: 500,
                                            width: 70,
                                            textAlign: 'right',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: 'var(--pb-ink)',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {p.jobs}
                                        </span>{' '}
                                        job
                                    </div>
                                    <Badge
                                        tone={
                                            p.status === 'online'
                                                ? 'success'
                                                : p.status === 'warn'
                                                  ? 'warning'
                                                  : 'danger'
                                        }
                                        dot
                                    >
                                        {p.status === 'online'
                                            ? 'Online'
                                            : p.status === 'warn'
                                              ? 'Error'
                                              : 'Offline'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card padding={0}>
                        <div
                            style={{
                                padding: '18px 22px',
                                borderBottom: '1px solid var(--pb-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <h3 className="pb-h4" style={{ margin: 0 }}>
                                    Transaksi terakhir
                                </h3>
                                <p
                                    className="pb-body-sm"
                                    style={{
                                        margin: '4px 0 0',
                                        color: 'var(--pb-text-muted)',
                                    }}
                                >
                                    {recentTx.length} transaksi terbaru
                                </p>
                            </div>
                            <Link
                                href="/admin/transaksi"
                                className="pb-link-subtle"
                            >
                                Lihat semua →
                            </Link>
                        </div>
                        <div>
                            {recentTx.length === 0 && (
                                <div style={{ padding: 22 }}>
                                    <DashboardEmpty
                                        icon="receipt"
                                        title="Belum ada transaksi"
                                        desc="Transaksi terbaru akan muncul di sini."
                                    />
                                </div>
                            )}
                            {recentTx.map((t, i) => (
                                <div
                                    key={t.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'auto 1fr auto',
                                        gap: 12,
                                        alignItems: 'center',
                                        padding: '12px 22px',
                                        borderBottom:
                                            i < recentTx.length - 1
                                                ? '1px solid var(--pb-border-soft)'
                                                : 'none',
                                    }}
                                >
                                    <MethodIcon method={t.method} />
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {t.id}
                                            </span>
                                            <Badge
                                                tone={
                                                    t.status === 'paid'
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                            >
                                                {t.status === 'paid'
                                                    ? 'Lunas'
                                                    : 'Pending'}
                                            </Badge>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--pb-text-faint)',
                                                marginTop: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {t.branch} · {t.item} · {t.method}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            textAlign: 'right',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 13.5,
                                                fontWeight: 700,
                                                color: 'var(--pb-ink)',
                                            }}
                                        >
                                            {rupiah(t.amount)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: 'var(--pb-text-faint)',
                                            }}
                                        >
                                            {t.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </main>
        </>
    );
}

function DashboardEmpty({
    icon,
    title,
    desc,
}: {
    icon: IconName;
    title: string;
    desc: string;
}) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--pb-text-muted)',
            }}
        >
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#F4F4F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--pb-text-faint)',
                    marginBottom: 10,
                }}
            >
                <Icon name={icon} size={20} />
            </div>
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--pb-ink)',
                    marginBottom: 4,
                }}
            >
                {title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--pb-text-faint)' }}>
                {desc}
            </div>
        </div>
    );
}

Dashboard.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="dashboard">{page}</PhilobboothAdminLayout>
);
