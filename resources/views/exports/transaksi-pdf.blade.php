<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Transaksi</title>
    <style>
        @page { margin: 18mm 12mm; }
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1a1a1a;
            margin: 0;
        }
        .head {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #111;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .brand { font-size: 18px; font-weight: 700; letter-spacing: -0.4px; }
        .sub { color: #666; font-size: 10px; }
        .meta {
            font-size: 9px;
            color: #555;
            margin-bottom: 14px;
            padding: 8px 10px;
            background: #f6f6f6;
            border-radius: 4px;
        }
        .meta strong { color: #111; }
        .summary {
            display: table;
            width: 100%;
            margin-bottom: 14px;
            border-collapse: collapse;
        }
        .summary > div {
            display: table-cell;
            padding: 10px 14px;
            border: 1px solid #ddd;
            background: #fafafa;
            width: 25%;
        }
        .summary .label {
            font-size: 9px;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .summary .value {
            font-size: 14px;
            font-weight: 700;
            margin-top: 3px;
        }
        table.data {
            width: 100%;
            border-collapse: collapse;
        }
        table.data thead th {
            background: #111;
            color: #fff;
            text-align: left;
            padding: 7px 8px;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        table.data tbody td {
            padding: 6px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }
        table.data tbody tr:nth-child(even) td { background: #fafafa; }
        .right { text-align: right; }
        .footer {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #888;
        }
        .pill {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 999px;
            font-size: 8px;
            font-weight: 600;
            background: #eee;
            color: #333;
        }
        .pill.completed { background: #e6f8ee; color: #166534; }
        .pill.cancelled, .pill.expired { background: #fde8e8; color: #991b1b; }
        .pill.paid { background: #e0f2fe; color: #075985; }
        .empty { text-align: center; padding: 24px; color: #999; }
    </style>
</head>
<body>
    <div class="head">
        <div>
            <div class="brand">Philobooth</div>
            <div class="sub">Laporan transaksi sesi photobooth</div>
        </div>
        <div style="text-align: right;">
            <div class="sub">Dicetak: {{ now()->format('d M Y H:i') }}</div>
            <div class="sub">Total baris: {{ $totals['count'] }}</div>
        </div>
    </div>

    <div class="meta">
        <strong>Filter aktif:</strong>
        Periode {{ $filters['from'] ?: '—' }} s/d {{ $filters['to'] ?: '—' }}
        @if ($filters['status']) · Status: {{ $filters['status'] }} @endif
        @if ($filters['method']) · Metode: {{ $filters['method'] }} @endif
        @if ($filters['search']) · Cari: "{{ $filters['search'] }}" @endif
    </div>

    <div class="summary">
        <div>
            <div class="label">Total transaksi</div>
            <div class="value">{{ number_format($totals['count'], 0, ',', '.') }}</div>
        </div>
        <div>
            <div class="label">Total revenue</div>
            <div class="value">Rp {{ number_format($totals['revenue'], 0, ',', '.') }}</div>
        </div>
        <div>
            <div class="label">Total cetak</div>
            <div class="value">{{ number_format($totals['prints'], 0, ',', '.') }}</div>
        </div>
        <div>
            <div class="label">Rata-rata / transaksi</div>
            <div class="value">
                Rp {{ $totals['count'] > 0 ? number_format($totals['revenue'] / $totals['count'], 0, ',', '.') : 0 }}
            </div>
        </div>
    </div>

    <table class="data">
        <thead>
            <tr>
                <th>Kode</th>
                <th>Tanggal</th>
                <th>Cabang</th>
                <th>Paper</th>
                <th>Metode</th>
                <th>Status</th>
                <th class="right">Qty</th>
                <th class="right">Total</th>
                <th class="right">Diskon</th>
                <th class="right">Final</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($sessions as $s)
                <tr>
                    <td>{{ $s->session_code }}</td>
                    <td>{{ optional($s->started_at)->format('d/m/y H:i') }}</td>
                    <td>{{ $s->branch?->name ?? '—' }}</td>
                    <td>{{ $s->paperSize?->name ?? '—' }}</td>
                    <td>{{ $s->payment_method?->label() ?? '—' }}</td>
                    <td>
                        <span class="pill {{ $s->status?->value }}">{{ $s->status?->label() ?? '—' }}</span>
                    </td>
                    <td class="right">{{ $s->print_quantity }}</td>
                    <td class="right">{{ number_format((float) $s->total_amount, 0, ',', '.') }}</td>
                    <td class="right">{{ number_format((float) $s->discount_amount, 0, ',', '.') }}</td>
                    <td class="right"><strong>{{ number_format((float) $s->final_amount, 0, ',', '.') }}</strong></td>
                </tr>
            @empty
                <tr><td colspan="10" class="empty">Tidak ada data transaksi.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">Philobooth · laporan-transaksi · halaman dicetak otomatis</div>
</body>
</html>
