<?php

namespace App\Http\Requests\Admin;

use App\Enums\PrinterConnectionType;
use App\Enums\PrinterModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class PrinterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', Rule::exists('branches', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'model' => ['required', new Enum(PrinterModel::class)],
            'connection_type' => ['required', new Enum(PrinterConnectionType::class)],
            'ip_address' => ['nullable', 'ip'],
            'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'system_printer_name' => ['nullable', 'string', 'max:255'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'branch_id' => 'cabang',
            'name' => 'nama printer',
            'model' => 'model printer',
            'connection_type' => 'tipe koneksi',
            'ip_address' => 'alamat IP',
            'port' => 'port',
            'system_printer_name' => 'nama printer di sistem',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'exists' => ':attribute tidak ditemukan.',
            'ip' => ':attribute tidak valid (format IP).',
            'integer' => ':attribute harus berupa angka.',
        ];
    }
}
