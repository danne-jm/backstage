<?php

namespace Database\Factories\sellables;

use App\Models\sellables\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph,
            'event_date' => now()->addDays(30),
            'start_sell_date' => now(),
            'end_sell_date' => now()->addDays(29),
            'price_with_card' => 10.00,
            'price_without_card' => 12.00,
            'google_spreadsheet_id' => 'test-spreadsheet-id',
            'google_sheet_name' => 'Sheet1',
            'attendee_filter_config' => [],
        ];
    }
}
