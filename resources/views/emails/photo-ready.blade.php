@include('emails.layouts.header', ['eyebrow' => 'Hasil cetak · Siap diunduh'])

<h1>Foto kamu udah jadi, {{ $name ?? 'kak' }}!</h1>
<p>
    Sesi photobooth <strong>#{{ $session_code }}</strong> di {{ $branch_name ?? 'Philobooth' }}
    sudah selesai. Versi digital high-res siap kamu unduh — tanpa watermark,
    bisa langsung repost di Instagram &amp; story.
</p>

<div class="cta-wrap">
    <a href="{{ $download_url }}" class="cta-btn">Unduh foto digital →</a>
</div>

<div class="info-card">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td class="info-label" style="padding: 4px 0;">Order ID</td>
            <td class="info-val" style="padding: 4px 0; font-family: monospace;">{{ $session_code }}</td>
        </tr>
        <tr>
            <td class="info-label" style="padding: 4px 0;">Cabang</td>
            <td class="info-val" style="padding: 4px 0;">{{ $branch_name ?? '—' }}</td>
        </tr>
        <tr>
            <td class="info-label" style="padding: 4px 0;">Jumlah cetak</td>
            <td class="info-val" style="padding: 4px 0;">{{ $print_quantity }} lembar</td>
        </tr>
        <tr>
            <td class="info-label" style="padding: 4px 0;">Berlaku sampai</td>
            <td class="info-val" style="padding: 4px 0;">{{ $expires_at ?? '7 hari ke depan' }}</td>
        </tr>
    </table>
</div>

<p style="font-size: 13px; color: #737373;">
    Link aktif selama 7 hari. Setelah itu file otomatis terhapus untuk
    privasi kamu.
</p>

<p style="margin-top: 18px;">
    Tag <span class="accent-bar">@philobooth.id</span> kalau kamu repost — kita bakal repost balik di story!
</p>

@include('emails.layouts.footer')
