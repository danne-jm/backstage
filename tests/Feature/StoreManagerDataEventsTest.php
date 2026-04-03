<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\sellables\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreManagerDataEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_manager_data_includes_past_events_in_sellables_panel(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $pastEvent = Event::factory()->create([
            'name' => 'Past Event',
            'event_date' => now()->subDay(),
            'is_online_sellable' => true,
        ]);

        $response = $this->actingAs($user)
            ->get(route('store-manager.data'));

        $response->assertOk();

        $response->assertJsonFragment([
            'id' => $pastEvent->id,
            'type' => 'event',
            'name' => 'Past Event',
        ]);
    }
}
