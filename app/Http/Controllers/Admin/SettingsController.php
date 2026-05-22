<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AppSettingRequest;
use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /** @var array<string, string> */
    protected array $stringKeys = [
        'app_name' => 'string',
        'app_tagline' => 'string',
        'support_email' => 'string',
        'support_phone' => 'string',
        'logo_path' => 'string',
        'favicon_path' => 'string',
        'currency' => 'string',
    ];

    /** @var array<string, string> */
    protected array $numberKeys = [
        'base_price' => 'float',
        'tax_percent' => 'float',
        'service_fee' => 'float',
        'extra_print_price' => 'float',
        'min_prints' => 'int',
        'max_prints' => 'int',
    ];

    public function edit(): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => [
                'app_name' => AppSetting::get('app_name', config('app.name')),
                'app_tagline' => AppSetting::get('app_tagline'),
                'support_email' => AppSetting::get('support_email'),
                'support_phone' => AppSetting::get('support_phone'),
                'logo_url' => $this->fileUrl(AppSetting::get('logo_path')),
                'favicon_url' => $this->fileUrl(AppSetting::get('favicon_path')),
                'base_price' => (float) AppSetting::get('base_price', 25000),
                'tax_percent' => (float) AppSetting::get('tax_percent', 0),
                'service_fee' => (float) AppSetting::get('service_fee', 0),
                'extra_print_price' => (float) AppSetting::get('extra_print_price', 5000),
                'min_prints' => (int) AppSetting::get('min_prints', 1),
                'max_prints' => (int) AppSetting::get('max_prints', 10),
                'currency' => AppSetting::get('currency', 'IDR'),
            ],
        ]);
    }

    public function update(AppSettingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $data) {
            foreach ($this->stringKeys as $key => $type) {
                if (in_array($key, ['logo_path', 'favicon_path'], true)) {
                    continue;
                }

                if (array_key_exists($key, $data)) {
                    AppSetting::set($key, $data[$key] ?? null, $type);
                }
            }

            foreach ($this->numberKeys as $key => $type) {
                if (array_key_exists($key, $data)) {
                    AppSetting::set($key, $data[$key], $type);
                }
            }

            $this->handleFile($request, 'logo', 'logo_path', 'remove_logo');
            $this->handleFile($request, 'favicon', 'favicon_path', 'remove_favicon');
        });

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    }

    protected function handleFile(AppSettingRequest $request, string $field, string $key, string $removeFlag): void
    {
        $existing = AppSetting::get($key);

        if ($request->boolean($removeFlag) || $request->hasFile($field)) {
            if ($existing && Storage::disk('public')->exists($existing)) {
                Storage::disk('public')->delete($existing);
            }
        }

        if ($request->hasFile($field)) {
            $path = $request->file($field)->store('app-settings', 'public');
            AppSetting::set($key, $path, 'string');

            return;
        }

        if ($request->boolean($removeFlag)) {
            AppSetting::set($key, null, 'string');
        }
    }

    protected function fileUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
