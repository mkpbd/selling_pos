<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

final class ResetPasswordRequest extends AuthRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', self::passwordRule()],
        ];
    }
}
