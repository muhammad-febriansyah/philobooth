@include('emails.layouts.header', ['eyebrow' => 'Selamat datang · Akun baru'])

<h1>Halo {{ $name }}!</h1>
<p>
    Akun {{ $role_label }} kamu di <strong>Philobooth</strong> sudah dibuat.
    @if ($branch_name)
        Kamu di-assign ke cabang <strong>{{ $branch_name }}</strong>.
    @endif
    Pakai kredensial di bawah buat login pertama kali.
</p>

<div class="info-card">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td class="info-label" style="padding: 4px 0;">Email</td>
            <td class="info-val" style="padding: 4px 0; font-family: monospace;">{{ $email }}</td>
        </tr>
        <tr>
            <td class="info-label" style="padding: 4px 0;">Password sementara</td>
            <td class="info-val" style="padding: 4px 0; font-family: monospace;">{{ $temp_password }}</td>
        </tr>
        <tr>
            <td class="info-label" style="padding: 4px 0;">Role</td>
            <td class="info-val" style="padding: 4px 0;">{{ $role_label }}</td>
        </tr>
        @if ($branch_name)
        <tr>
            <td class="info-label" style="padding: 4px 0;">Cabang</td>
            <td class="info-val" style="padding: 4px 0;">{{ $branch_name }}</td>
        </tr>
        @endif
    </table>
</div>

<div class="cta-wrap">
    <a href="{{ $login_url }}" class="cta-btn">Login sekarang →</a>
</div>

<p style="font-size: 13px; color: #737373;">
    <strong>Wajib:</strong> Ganti password kamu di
    <em>Settings → Profile</em> setelah login pertama supaya akun lebih aman.
</p>

<p style="margin-top: 18px; font-size: 13px; color: #737373;">
    Kalau kamu tidak pernah mendaftar, abaikan email ini dan hubungi admin.
</p>

@include('emails.layouts.footer')
