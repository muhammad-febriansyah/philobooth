<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    @php
        $appName = config('app.name', 'Philobooth');
        $seoTitle = trim($page['props']['seoTitle'] ?? '') ?: $appName;
        $seoDescription = trim($page['props']['seoDescription'] ?? '')
            ?: 'Philobooth — platform manajemen photobooth & kiosk: kelola cabang, printer, frame, voucher, dan transaksi dalam satu dashboard.';
        $seoUrl = url()->current();
        $seoImage = url('/og-image.png');
    @endphp
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Primary SEO --}}
        <meta name="description" content="{{ $seoDescription }}">
        <meta name="application-name" content="{{ $appName }}">
        <meta name="theme-color" content="#F5FA0C">
        <meta name="color-scheme" content="light dark">
        <link rel="canonical" href="{{ $seoUrl }}">

        {{-- Open Graph --}}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ $appName }}">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:url" content="{{ $seoUrl }}">
        <meta property="og:image" content="{{ $seoImage }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:locale" content="{{ str_replace('-', '_', app()->getLocale()) }}_ID">

        {{-- Twitter --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ $seoImage }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $seoTitle }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
