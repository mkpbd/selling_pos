<?php

declare(strict_types=1);

namespace App\Modules\Products\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** 1-10 letters/digits, stored uppercase. @example KG */
            'code' => ['required', 'string', 'regex:/^[A-Za-z0-9]{1,10}$/'],
            /** @example Kilogram */
            'name' => ['required', 'string', 'min:1', 'max:50'],
            /** Whether stock quantities may have decimals. */
            'allows_decimal' => ['required', 'boolean'],
        ];
    }
}
