<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Presentation\Http\Requests;

use App\Modules\Authorization\Domain\Role;
use App\Shared\Application\Authorization\PermissionRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => strtolower(trim($this->input('name')))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** Lowercase letters, digits, `_` or `-`. @example supervisor */
            'name' => ['required', 'string', 'regex:'.Role::NAME_PATTERN],
            /** Permission names from `GET /permissions`. */
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', 'distinct', Rule::in(app(PermissionRegistry::class)->names())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.regex' => 'The name must be 2-50 lowercase letters, digits, underscores or dashes.',
            'permissions.*.in' => 'Unknown permission [:input].',
        ];
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        return array_values($this->validated('permissions'));
    }
}
