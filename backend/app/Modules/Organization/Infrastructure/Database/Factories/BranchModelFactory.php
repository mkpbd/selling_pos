<?php

declare(strict_types=1);

namespace App\Modules\Organization\Infrastructure\Database\Factories;

use App\Modules\Organization\Infrastructure\Persistence\BranchModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BranchModel>
 */
final class BranchModelFactory extends Factory
{
    protected $model = BranchModel::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('BR-####')),
            'name' => fake()->city().' Branch',
            'phone' => fake()->numerify('+8801#########'),
            'email' => fake()->unique()->companyEmail(),
            'address' => fake()->address(),
            'is_active' => true,
        ];
    }

    public function inactive(): self
    {
        return $this->state(['is_active' => false]);
    }
}
