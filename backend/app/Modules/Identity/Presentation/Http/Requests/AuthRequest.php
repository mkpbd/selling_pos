<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

abstract class AuthRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public static function passwordRule(): Password
    {
        return Password::min(8)->max(72)->mixedCase()->numbers()->symbols();
    }
}
