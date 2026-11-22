<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ReorderLevelRequest extends FormRequest
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
            /** Low-stock threshold; 0 disables low-stock alerts. @example 10 */
            'reorder_level' => ['required', 'decimal:0,3', 'min:0', 'max:99999999999.999'],
        ];
    }
}
