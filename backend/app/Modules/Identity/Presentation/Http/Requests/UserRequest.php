<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Create (POST) or replace (PUT) a user. On update the password is optional.
 * Email uniqueness and assignment rules are enforced by the domain.
 */
final class UserRequest extends FormRequest
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
        $creating = $this->isMethod('post');

        return [
            /** @example Rahim Uddin */
            'name' => ['required', 'string', 'min:2', 'max:150'],
            /** @example rahim@example.com */
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            /** Required on create; omit on update to keep the current password. */
            'password' => [$creating ? 'required' : 'nullable', 'string', 'confirmed', AuthRequest::passwordRule()],
            'is_active' => ['sometimes', 'boolean'],
            /** Must be one of the branches in `branch_roles`. Defaults to the first one. */
            'default_branch_id' => ['nullable', 'uuid'],
            /** Branch memberships with the roles granted in each branch. */
            'branch_roles' => ['present', 'array', 'max:100'],
            'branch_roles.*.branch_id' => ['required', 'uuid', 'distinct'],
            'branch_roles.*.roles' => ['required', 'array', 'min:1'],
            'branch_roles.*.roles.*' => ['string', 'distinct', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'branch_roles.*.branch_id' => 'branch',
            'branch_roles.*.roles' => 'roles',
        ];
    }
}
