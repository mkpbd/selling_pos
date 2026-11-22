<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

final class IssueTokenRequest extends AuthRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** @example admin@sellingpos.test */
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            /** Label for the token, e.g. the terminal name. @example POS-Terminal-01 */
            'device_name' => ['required', 'string', 'max:100'],
        ];
    }
}
