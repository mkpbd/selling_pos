<?php

declare(strict_types=1);

namespace App\Modules\Organization\Application\DTOs;

final readonly class BranchData
{
    public function __construct(
        public string $code,
        public string $name,
        public ?string $phone = null,
        public ?string $email = null,
        public ?string $address = null,
        public bool $isActive = true,
    ) {}

    /**
     * @param  array<string, mixed>  $input  validated input
     */
    public static function fromArray(array $input): self
    {
        return new self(
            code: (string) $input['code'],
            name: (string) $input['name'],
            phone: self::nullable($input['phone'] ?? null),
            email: self::nullable(isset($input['email']) ? strtolower((string) $input['email']) : null),
            address: self::nullable($input['address'] ?? null),
            isActive: (bool) ($input['is_active'] ?? true),
        );
    }

    private static function nullable(mixed $value): ?string
    {
        $value = $value === null ? null : trim((string) $value);

        return $value === '' ? null : $value;
    }
}
