<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

use App\Modules\Products\Domain\Events\UnitChanged;
use App\Shared\Domain\AggregateRoot;
use InvalidArgumentException;

/** Unit of measure (PCS, KG, ...). */
final class Unit extends AggregateRoot
{
    public const string CODE_PATTERN = '/^[A-Z0-9]{1,10}$/';

    private function __construct(
        public readonly string $id,
        private string $code,
        private string $name,
        private bool $allowsDecimal,
    ) {
        self::assertCode($code);
    }

    public static function define(string $id, string $code, string $name, bool $allowsDecimal): self
    {
        $unit = new self($id, strtoupper(trim($code)), trim($name), $allowsDecimal);
        $unit->record(new UnitChanged($id, $unit->code, $allowsDecimal));

        return $unit;
    }

    public static function reconstitute(string $id, string $code, string $name, bool $allowsDecimal): self
    {
        return new self($id, $code, $name, $allowsDecimal);
    }

    public function change(string $code, string $name, bool $allowsDecimal): void
    {
        $code = strtoupper(trim($code));
        self::assertCode($code);

        $published = $code !== $this->code || $allowsDecimal !== $this->allowsDecimal;

        $this->code = $code;
        $this->name = trim($name);
        $this->allowsDecimal = $allowsDecimal;

        if ($published) {
            $this->record(new UnitChanged($this->id, $code, $allowsDecimal));
        }
    }

    public function code(): string
    {
        return $this->code;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function allowsDecimal(): bool
    {
        return $this->allowsDecimal;
    }

    private static function assertCode(string $code): void
    {
        if (preg_match(self::CODE_PATTERN, $code) !== 1) {
            throw new InvalidArgumentException("Invalid unit code [{$code}].");
        }
    }
}
