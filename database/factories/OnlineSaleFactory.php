<?php

namespace Database\Factories;

use App\Models\OnlineSale;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OnlineSaleFactory extends Factory
{
    protected $model = OnlineSale::class;

    public function definition(): array
    {
        $date = $this->faker->dateTimeBetween('-30 days', 'now');
        return [
            'product_id' => null,
            'event_id' => null,
            'method' => $this->faker->randomElement(['card', 'paypal', 'stripe']),
            'amount' => $this->faker->randomFloat(2, 1, 50),
            'details' => ['tx' => Str::random(8)],
            'sold_at' => $date,
        ];
    }
}
