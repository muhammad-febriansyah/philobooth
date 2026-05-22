<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $voucherId = $this->route('voucher')?->id;

        return [
            'branch_id' => ['nullable', Rule::exists('branches', 'id')],
            'name' => ['required', 'string', 'max:120'],
            'code' => [
                'required',
                'string',
                'size:8',
                'regex:/^[A-Z0-9]+$/i',
                Rule::unique('vouchers', 'code')->ignore($voucherId),
            ],
            // Voucher selalu sekali pakai — field max_uses tidak diterima dari client.
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'branch_id' => 'cabang',
            'name' => 'nama voucher',
            'code' => 'kode voucher',
            'valid_from' => 'berlaku mulai',
            'valid_until' => 'berlaku sampai',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'exists' => ':attribute tidak ditemukan.',
            'regex' => ':attribute hanya boleh huruf dan angka (tanpa spasi atau tanda baca).',
            'unique' => ':attribute sudah dipakai voucher lain.',
            'size' => ':attribute harus tepat :size karakter.',
            'after_or_equal' => ':attribute tidak boleh lebih awal dari tanggal mulai.',
            'integer' => ':attribute harus berupa angka bulat.',
            'max' => ':attribute maksimal :max karakter.',
            'min' => ':attribute minimal :min.',
        ];
    }
}
