<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Presentation\Http\Requests;

use App\Modules\Inventory\Domain\AdjustmentReason;
use App\Modules\Inventory\Domain\AdjustmentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class AdjustStockRequest extends FormRequest
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
        $isCount = $this->input('type') === AdjustmentType::Count->value;

        return [
            'product_id' => ['required', 'uuid'],
            /** `in` adds, `out` removes, `count` sets the absolute on-hand quantity. */
            'type' => ['required', Rule::enum(AdjustmentType::class)],
            /** Up to 3 decimals. @example 12 */
            'quantity' => ['required', 'decimal:0,3', $isCount ? 'min:0' : 'gt:0', 'max:99999999999.999'],
            'reason' => ['required', Rule::enum(AdjustmentReason::class)],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
