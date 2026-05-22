<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AppSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'app_name' => ['required', 'string', 'max:120'],
            'app_tagline' => ['nullable', 'string', 'max:255'],
            'support_email' => ['nullable', 'email', 'max:120'],
            'support_phone' => ['nullable', 'string', 'max:32'],

            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
            'favicon' => ['nullable', 'image', 'mimes:png,ico,svg', 'max:512'],
            'remove_favicon' => ['nullable', 'boolean'],

            'base_price' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'tax_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'service_fee' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'extra_print_price' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'min_prints' => ['required', 'integer', 'min:1', 'max:100'],
            'max_prints' => ['required', 'integer', 'min:1', 'max:100', 'gte:min_prints'],
            'currency' => ['required', 'string', 'size:3'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'app_name' => 'nama aplikasi',
            'app_tagline' => 'tagline',
            'support_email' => 'email support',
            'support_phone' => 'nomor support',
            'logo' => 'logo',
            'favicon' => 'favicon',
            'base_price' => 'harga dasar',
            'tax_percent' => 'pajak',
            'service_fee' => 'biaya layanan',
            'extra_print_price' => 'harga cetak tambahan',
            'min_prints' => 'minimal cetak',
            'max_prints' => 'maksimal cetak',
            'currency' => 'kode mata uang',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'email' => ':attribute tidak valid.',
            'image' => ':attribute harus berupa gambar.',
            'mimes' => ':attribute harus berformat: :values.',
            'max' => ':attribute maksimal :max.',
            'min' => ':attribute minimal :min.',
            'numeric' => ':attribute harus berupa angka.',
            'integer' => ':attribute harus berupa angka bulat.',
            'size' => ':attribute harus :size karakter.',
            'gte' => ':attribute harus lebih besar atau sama dengan minimal cetak.',
        ];
    }
}
