<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Philobooth' }}</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }
        body, table, td, p, a, li, blockquote {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        body { background-color: #FAFAF7; color: #0A0A0A; line-height: 1.5; }
        a { color: #0A0A0A; text-decoration: underline; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(10,10,10,0.06); }
        .header { background: linear-gradient(135deg, #FFFEF0 0%, #FAFAF7 100%); padding: 32px 32px 24px; border-bottom: 1px solid #E5E5E5; }
        .logo-mark { display: inline-block; width: 40px; height: 40px; background: #F5FA0C; border-radius: 10px; box-shadow: 0 4px 12px rgba(245,250,12,0.4); text-align: center; line-height: 40px; font-size: 22px; vertical-align: middle; font-weight: bold; }
        .logo-text { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #0A0A0A; vertical-align: middle; padding-left: 10px; }
        .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #737373; margin-top: 16px; margin-bottom: 0; }
        .body { padding: 28px 32px 16px; }
        .body h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 12px; color: #0A0A0A; }
        .body p { font-size: 15px; color: #404040; margin: 0 0 14px; line-height: 1.6; }
        .cta-wrap { text-align: center; padding: 24px 0 8px; }
        .cta-btn { display: inline-block; padding: 14px 28px; background: #0A0A0A; color: #ffffff !important; text-decoration: none !important; font-weight: 700; font-size: 15px; border-radius: 999px; }
        .info-card { background: #FAFAF7; border: 1px solid #E5E5E5; border-radius: 12px; padding: 16px 18px; margin: 18px 0; }
        .info-label { color: #737373; font-size: 13px; }
        .info-val { color: #0A0A0A; font-weight: 600; text-align: right; font-size: 13px; }
        .accent-bar { display: inline-block; background: #F5FA0C; color: #0A0A0A; font-weight: 700; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.04em; }
        .footer { padding: 24px 32px 28px; border-top: 1px solid #E5E5E5; background: #FAFAF7; }
        .footer p { font-size: 12px; color: #737373; line-height: 1.6; margin: 0 0 8px; }
        .footer a { color: #525252; text-decoration: none; }
        .footer-brand { font-size: 12px; font-weight: 700; color: #0A0A0A; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
        .divider { height: 1px; background: #E5E5E5; margin: 16px 0; border: none; }
        @media screen and (max-width: 600px) {
            .container { border-radius: 0; }
            .header, .body, .footer { padding-left: 20px; padding-right: 20px; }
            .body h1 { font-size: 20px; }
        }
    </style>
</head>
<body>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #FAFAF7; padding: 32px 16px;">
        <tr>
            <td align="center">
                <div class="container">
                    <div class="header">
                        <a href="{{ config('app.url') }}" style="text-decoration: none;">
                            <span class="logo-mark">○</span><span class="logo-text">philobooth</span>
                        </a>
                        @isset($eyebrow)
                            <div class="eyebrow">{{ $eyebrow }}</div>
                        @endisset
                    </div>
                    <div class="body">
