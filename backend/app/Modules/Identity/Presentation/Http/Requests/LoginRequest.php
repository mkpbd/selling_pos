<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

final class LoginRequest extends AuthRequest
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
            /** Keep the browser session after it closes. */
            'remember' => ['sometimes', 'boolean'],
        ];
    }
}
