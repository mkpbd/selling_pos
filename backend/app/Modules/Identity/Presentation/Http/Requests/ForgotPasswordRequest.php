<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

final class ForgotPasswordRequest extends AuthRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return ['email' => ['required', 'string', 'email', 'max:255']];
    }
}
