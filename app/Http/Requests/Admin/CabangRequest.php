<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CabangRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $cabangId = $this->route('cabang')?->id;

        return [
            'code' => [
                'required',
                'string',
                'max:32',
                Rule::unique('branches', 'code')->ignore($cabangId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'manager_name' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'code' => 'kode cabang',
            'name' => 'nama cabang',
            'address' => 'alamat',
            'city' => 'kota',
            'province' => 'provinsi',
            'phone' => 'nomor telepon',
            'manager_name' => 'nama manajer',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'unique' => ':attribute sudah dipakai cabang lain.',
            'max' => ':attribute maksimal :max karakter.',
        ];
    }
}
