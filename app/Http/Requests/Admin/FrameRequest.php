<?php

namespace App\Http\Requests\Admin;

use App\Enums\FrameOrientation;
use App\Enums\FrameType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class FrameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $isCreate = $this->isMethod('POST') && ! $this->route('frame');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:64'],
            'paper_size_id' => ['required', 'integer', 'exists:paper_sizes,id'],
            'orientation' => ['required', new Enum(FrameOrientation::class)],
            'type' => ['required', new Enum(FrameType::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_premium' => ['boolean'],
            'is_active' => ['boolean'],
        ];

        if ($isCreate) {
            $rules['image'] = ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'];
        } else {
            $rules['image'] = ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'];
        }

        return $rules;
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'name' => 'nama frame',
            'category' => 'kategori',
            'paper_size_id' => 'ukuran kertas',
            'orientation' => 'orientasi',
            'type' => 'jenis frame',
            'image' => 'file frame',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'exists' => ':attribute tidak valid.',
            'image' => ':attribute harus berupa gambar.',
            'mimes' => ':attribute harus format PNG, JPG, atau WEBP.',
            'max' => ':attribute maksimal :max KB.',
        ];
    }
}
