<?php

declare(strict_types=1);

namespace App\Modules\Organization\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Create / replace a branch. Uniqueness of `code` is a domain rule (409).
 */
final class BranchRequest extends FormRequest
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
            /** Unique branch code; letters, digits and dashes. Stored uppercase. @example DHK-01 */
            'code' => ['required', 'string', 'regex:/^[A-Za-z0-9-]{2,20}$/'],
            /** @example Dhaka Main Store */
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'string', 'email:rfc', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.regex' => 'The code must be 2-20 characters: letters, digits or dashes.',
        ];
    }
}
