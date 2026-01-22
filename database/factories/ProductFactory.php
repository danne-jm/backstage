<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->paragraph(),
            'price' => $this->faker->randomFloat(2, 5, 100),
            'member_price' => $this->faker->randomFloat(2, 5, 100),
            'quantity' => $this->faker->numberBetween(1, 100),
            'unlimited_quantity' => false,
            'is_online_sellable' => true,
        ];
    }
}
