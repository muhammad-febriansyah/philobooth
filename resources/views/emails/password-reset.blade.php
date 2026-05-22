@include('emails.layouts.header', ['eyebrow' => 'Reset password · Tindakan diperlukan'])

<h1>Halo{{ $name ? ' ' . $name : '' }}!</h1>
<p>
    Kami menerima permintaan reset password untuk akun Philobooth kamu.
    Klik tombol di bawah buat lanjut.
</p>

<div class="cta-wrap">
    <a href="{{ $reset_url }}" class="cta-btn">Reset password →</a>
</div>

<div class="info-card">
    <p style="margin: 0; font-size: 12px; color: #737373;">
        Link ini berlaku <strong style="color: #0A0A0A;">{{ $expires_minutes }} menit</strong>
        ke depan. Kalau expired, request ulang di halaman login.
    </p>
</div>

<p style="font-size: 13px; color: #737373;">
    Kalau kamu tidak request reset, abaikan email ini. Password kamu tetap aman.
</p>

<p style="font-size: 11px; color: #A3A3A3; margin-top: 20px;">
    Kalau tombol tidak bisa diklik, copy-paste link ini ke browser:<br>
    <code style="word-break: break-all; color: #525252;">{{ $reset_url }}</code>
</p>

@include('emails.layouts.footer')
