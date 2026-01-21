<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'event_date' => $this->faker->date(),
            'start_sell_date' => $this->faker->date(),
            'end_sell_date' => $this->faker->date(),
            'price_with_card' => $this->faker->randomFloat(2, 5, 50),
            'price_without_card' => $this->faker->randomFloat(2, 5, 50),
            'quantity' => $this->faker->numberBetween(10, 100),
            'unlimited_quantity' => false,
            'variable_amount' => false,
            'quantity_with_card' => null,
            'quantity_without_card' => null,
            'responsible_user_id' => null,
            'is_online_sellable' => false,
        ];
    }
}
