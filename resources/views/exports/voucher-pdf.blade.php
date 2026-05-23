<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Voucher {{ $voucher->code }}</title>
    <style>
        @page {
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica', Arial, sans-serif;
            color: #0A0A0A;
            background: #FAFAF7;
            font-size: 10px;
            line-height: 1.4;
        }

        .voucher {
            width: 105mm;
            height: 148mm;
            position: relative;
            overflow: hidden;
            background: #fff;
        }

        .top-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 10mm;
            background: #0A0A0A;
        }

        .accent {
            position: absolute;
            top: 10mm;
            left: 0;
            right: 0;
            height: 1.5mm;
            background: #F5FA0C;
        }

        .perforation {
            position: absolute;
            bottom: 22mm;
            left: 5mm;
            right: 5mm;
            border-top: 1px dashed #A3A3A3;
            height: 0;
            line-height: 0;
        }

        .perforation-left,
        .perforation-right {
            position: absolute;
            bottom: 20.5mm;
            width: 3mm;
            height: 3mm;
            background: #FAFAF7;
            border-radius: 50%;
        }

        .perforation-left { left: -1.5mm; }
        .perforation-right { right: -1.5mm; }

        .content {
            padding: 14mm 8mm 0;
            position: relative;
        }

        .brand {
            margin-bottom: 4mm;
        }
        .brand-logo {
            height: 20mm;
            width: 20mm;
            display: block;
        }

        .eyebrow {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #737373;
            margin-top: 1mm;
            margin-bottom: 2mm;
        }

        .voucher-name {
            font-size: 17px;
            font-weight: 800;
            letter-spacing: -0.5px;
            line-height: 1.1;
            color: #0A0A0A;
            margin-bottom: 1.5mm;
        }

        .branch {
            font-size: 9px;
            color: #525252;
            font-weight: 500;
            margin-bottom: 4mm;
        }

        .branch strong {
            color: #0A0A0A;
            font-weight: 700;
        }

        .code-box {
            background: #0A0A0A;
            color: #F5FA0C;
            padding: 3.5mm 3mm;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 3.5mm;
        }

        .code-label {
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #B8BB12;
            text-transform: uppercase;
            margin-bottom: 1mm;
        }

        .code-value {
            font-family: 'Courier', monospace;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 4px;
            line-height: 1;
            color: #F5FA0C;
        }

        .qr-table { width: 100%; margin-bottom: 3mm; }
        .qr-table td { vertical-align: middle; }
        .qr-img-cell { width: 26mm; padding-right: 3mm; }
        .qr-img {
            width: 26mm;
            height: 26mm;
            display: block;
            border: 1.5px solid #0A0A0A;
            border-radius: 4px;
            padding: 1mm;
            background: #fff;
        }
        .qr-info {
            font-size: 8.5px;
            color: #525252;
            line-height: 1.55;
        }
        .qr-info strong {
            color: #0A0A0A;
            font-weight: 700;
        }

        .meta-table {
            width: 100%;
            border-top: 1px solid #E5E5E5;
            margin-top: 2mm;
            padding-top: 2.5mm;
        }
        .meta-table td {
            font-size: 8px;
            vertical-align: top;
            padding: 0;
        }
        .meta-label {
            color: #737373;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: block;
            margin-bottom: 1mm;
        }
        .meta-value {
            color: #0A0A0A;
            font-weight: 700;
            font-size: 9.5px;
            display: block;
        }

        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 22mm;
            background: #F5F5F5;
            padding: 4mm 8mm;
        }

        .footer-title {
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #0A0A0A;
            margin-bottom: 1.5mm;
        }

        .footer-terms {
            font-size: 7px;
            line-height: 1.45;
            color: #525252;
        }

        .badge {
            display: inline-block;
            background: #F5FA0C;
            color: #0A0A0A;
            padding: 1mm 2.5mm;
            border-radius: 999px;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            vertical-align: middle;
            margin-left: 4px;
        }
        .badge-muted {
            background: #E5E5E5;
            color: #525252;
        }
    </style>
</head>
<body>
<div class="voucher">
    <div class="top-bar"></div>
    <div class="accent"></div>

    <div class="content">
        @if($logoDataUri)
            <div class="brand">
                <img class="brand-logo" src="{{ $logoDataUri }}" alt="Logo">
            </div>
        @endif

        <div class="eyebrow">Voucher photobooth</div>

        <div class="voucher-name">
            {{ $voucher->name }}
            @if($voucher->used_count >= $voucher->max_uses)
                <span class="badge badge-muted">Terpakai</span>
            @elseif(! $voucher->is_active)
                <span class="badge badge-muted">Non-aktif</span>
            @endif
        </div>

        <div class="branch">
            Berlaku di:
            <strong>{{ $voucher->branch?->name ?? 'Semua cabang' }}</strong>
            @if($voucher->branch?->city)
                · {{ $voucher->branch->city }}
            @endif
        </div>

        <div class="code-box">
            <div class="code-label">Kode voucher</div>
            <div class="code-value">{{ $voucher->code }}</div>
        </div>

        <table class="qr-table" cellpadding="0" cellspacing="0">
            <tr>
                <td class="qr-img-cell">
                    <img class="qr-img" src="{{ $qrDataUri }}" alt="QR voucher">
                </td>
                <td class="qr-info">
                    <strong>Cara pakai:</strong><br>
                    1. Pilih bayar <strong>voucher</strong> di Philobooth<br>
                    2. Ketik kode atau scan QR di samping<br>
                    3. Selamat berfoto!
                </td>
            </tr>
        </table>

        <table class="meta-table" cellpadding="0" cellspacing="0">
            <tr>
                <td width="35%">
                    <span class="meta-label">Berlaku dari</span>
                    <span class="meta-value">{{ $voucher->valid_from
                        ? $voucher->valid_from->locale('id')->translatedFormat('d M Y')
                        : 'Langsung' }}</span>
                </td>
                <td width="35%">
                    <span class="meta-label">Berlaku sampai</span>
                    <span class="meta-value">{{ $voucher->valid_until
                        ? $voucher->valid_until->locale('id')->translatedFormat('d M Y')
                        : 'Tidak ada' }}</span>
                </td>
                <td width="30%" align="right">
                    <span class="meta-label">Pemakaian</span>
                    <span class="meta-value">{{ $voucher->used_count }} / {{ $voucher->max_uses }}</span>
                </td>
            </tr>
        </table>
    </div>

    <div class="perforation"></div>
    <div class="perforation-left"></div>
    <div class="perforation-right"></div>

    <div class="footer">
        <div class="footer-title">Syarat & Ketentuan</div>
        <div class="footer-terms">
            Sekali pakai · Tidak bisa diuangkan · Tidak digabung dengan promo lain ·
            Voucher hangus jika lewat tanggal berlaku.
        </div>
    </div>
</div>
</body>
</html>
