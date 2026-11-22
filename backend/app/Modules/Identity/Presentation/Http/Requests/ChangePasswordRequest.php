<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

final class ChangePasswordRequest extends AuthRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'confirmed', 'different:current_password', self::passwordRule()],
        ];
    }
}
