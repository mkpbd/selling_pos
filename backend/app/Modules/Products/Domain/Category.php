<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

/** Product grouping used for browsing and reporting. */
final class Category
{
    private function __construct(
        public readonly string $id,
        private string $name,
        private ?string $description,
        private bool $isActive,
    ) {}

    public static function create(string $id, string $name, ?string $description, bool $isActive): self
    {
        return new self($id, trim($name), $description, $isActive);
    }

    public static function reconstitute(string $id, string $name, ?string $description, bool $isActive): self
    {
        return new self($id, $name, $description, $isActive);
    }

    public function change(string $name, ?string $description, bool $isActive): void
    {
        $this->name = trim($name);
        $this->description = $description;
        $this->isActive = $isActive;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function description(): ?string
    {
        return $this->description;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }
}
