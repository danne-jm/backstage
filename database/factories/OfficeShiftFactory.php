<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OfficeShift>
 */
class OfficeShiftFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'started_by' => User::factory(),
            'started_at' => now(),
            'status' => 'open',
            'start_cash' => 100.00,
            'start_card' => 0.00,
            'cash_total' => 100.00,
            'card_total' => 0.00,
            'total_cash' => 100.00,
            'total_card' => 0.00,
            'start_cash_breakdown' => [
                '50e' => 2,
            ],
            'cash_breakdown' => [
                '50e' => 2,
            ],
        ];
    }
}
