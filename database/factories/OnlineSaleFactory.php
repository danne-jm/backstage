<?php

namespace Database\Factories;

use App\Models\OnlineSale;
use App\Models\sellables\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

class OnlineSaleFactory extends Factory
{
    protected $model = OnlineSale::class;

    public function definition(): array
    {
        return [
            'online_transaction_id' => $this->faker->uuid,
            'reference_id' => $this->faker->unique()->bothify('TCK-####-####'),
            'event_id' => Event::factory(),
            'method' => 'card',
            'amount' => 10.00,
            'details' => ['ticket_type' => 'with_card'],
            'sold_at' => now(),
        ];
    }
}
