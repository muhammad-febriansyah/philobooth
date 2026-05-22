<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;
        $isCreate = ! $userId;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId)->whereNull('deleted_at'),
            ],
            'phone' => ['nullable', 'string', 'max:32'],
            'role' => ['required', Rule::in(UserRole::names())],
            'branch_id' => [
                Rule::requiredIf(fn () => $this->input('role') === UserRole::Cabang->value),
                'nullable',
                Rule::exists('branches', 'id'),
            ],
            'password' => [
                $isCreate ? 'required' : 'nullable',
                'confirmed',
                Password::min(8),
            ],
            'is_active' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'name' => 'nama',
            'email' => 'email',
            'phone' => 'nomor telepon',
            'role' => 'role',
            'branch_id' => 'cabang',
            'password' => 'password',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'email' => ':attribute tidak valid.',
            'unique' => ':attribute sudah dipakai.',
            'exists' => ':attribute tidak ditemukan.',
            'confirmed' => ':attribute tidak cocok dengan konfirmasi.',
            'max' => ':attribute maksimal :max karakter.',
        ];
    }
}
