<?php

namespace Database\Factories;

use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

class ItemFactory extends Factory
{
    protected $model = Item::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'quantity' => $this->faker->numberBetween(0, 500),
            'category' => $this->faker->randomElements(['category1', 'category2', 'category3'], $this->faker->numberBetween(1, 2)),
            'last_modified' => now(),
            'changed_by' => $this->faker->safeEmail(),
        ];
    }
}
