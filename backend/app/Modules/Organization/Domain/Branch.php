<?php

declare(strict_types=1);

namespace App\Modules\Organization\Domain;

use App\Modules\Organization\Domain\Events\BranchCreated;
use App\Modules\Organization\Domain\Events\BranchUpdated;
use App\Shared\Domain\AggregateRoot;

/**
 * A physical or logical selling location of the company.
 */
final class Branch extends AggregateRoot
{
    private function __construct(
        public readonly string $id,
        private BranchCode $code,
        private string $name,
        private ?string $phone,
        private ?string $email,
        private ?string $address,
        private bool $isActive,
    ) {}

    public static function open(
        string $id,
        BranchCode $code,
        string $name,
        ?string $phone = null,
        ?string $email = null,
        ?string $address = null,
        bool $isActive = true,
    ): self {
        $branch = new self($id, $code, trim($name), $phone, $email, $address, $isActive);
        $branch->record(new BranchCreated($id, $code->value, $branch->name));

        return $branch;
    }

    /** Rebuild from persistence without recording events. */
    public static function reconstitute(
        string $id,
        BranchCode $code,
        string $name,
        ?string $phone,
        ?string $email,
        ?string $address,
        bool $isActive,
    ): self {
        return new self($id, $code, $name, $phone, $email, $address, $isActive);
    }

    public function update(
        BranchCode $code,
        string $name,
        ?string $phone,
        ?string $email,
        ?string $address,
        bool $isActive,
    ): void {
        $changes = [];
        $before = $this->snapshot();

        $this->code = $code;
        $this->name = trim($name);
        $this->phone = $phone;
        $this->email = $email;
        $this->address = $address;
        $this->isActive = $isActive;

        foreach ($this->snapshot() as $field => $value) {
            if ($before[$field] !== $value) {
                $changes[$field] = ['from' => $before[$field], 'to' => $value];
            }
        }

        if ($changes !== []) {
            $this->record(new BranchUpdated($this->id, $changes));
        }
    }

    public function code(): BranchCode
    {
        return $this->code;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function phone(): ?string
    {
        return $this->phone;
    }

    public function email(): ?string
    {
        return $this->email;
    }

    public function address(): ?string
    {
        return $this->address;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    /**
     * @return array<string, string|bool|null>
     */
    private function snapshot(): array
    {
        return [
            'code' => $this->code->value,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'is_active' => $this->isActive,
        ];
    }
}
