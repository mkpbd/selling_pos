<?php

declare(strict_types=1);

namespace App\Modules\Products\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Create / replace a product. SKU and barcode uniqueness are domain rules (409).
 */
final class ProductRequest extends FormRequest
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
            /** Letters, digits, `.`, `_` or `-`; stored uppercase. @example COKE-500 */
            'sku' => ['required', 'string', 'regex:/^[A-Za-z0-9._-]{2,40}$/'],
            /** @example 8901234567890 */
            'barcode' => ['nullable', 'string', 'regex:/^[A-Za-z0-9-]{4,64}$/'],
            /** @example Coca-Cola 500ml */
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['nullable', 'uuid'],
            'unit_id' => ['required', 'uuid'],
            /** Decimal string or number, max 2 decimals. @example 35.00 */
            'cost_price' => ['required', 'decimal:0,2', 'min:0', 'max:999999999999.99'],
            /** @example 45.00 */
            'selling_price' => ['required', 'decimal:0,2', 'min:0', 'max:999999999999.99'],
            /** Percent 0-100. @example 5 */
            'tax_rate' => ['sometimes', 'decimal:0,2', 'min:0', 'max:100'],
            'track_stock' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sku.regex' => 'The SKU must be 2-40 characters: letters, digits, dot, underscore or dash.',
            'barcode.regex' => 'The barcode must be 4-64 letters, digits or dashes.',
        ];
    }
}
