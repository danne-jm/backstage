<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class EventImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_event_image()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Grant permissions roughly
        $user->update(['permissions' => ['create_event', 'view_sellables_inventory']]);

        $file = UploadedFile::fake()->image('event.jpg', 600, 600);

        $response = $this->post('/sellables/events', [
            'name' => 'Test Event',
            'event_date' => '2026-01-01',
            'start_sell_date' => '2025-12-01',
            'end_sell_date' => '2025-12-31',
            'price_with_card' => 10,
            'price_without_card' => 12,
            'quantity' => 100,
            'unlimited_quantity' => false,
            'responsible_user_id' => $user->id,
            'variable_amount' => false,
            'is_online_sellable' => true,
            'images' => [$file],
        ]);

        $response->assertRedirect();

        $event = Event::first();
        $this->assertNotNull($event);
        $this->assertTrue($event->is_online_sellable);

        $this->assertCount(1, $event->images);
        $this->assertEquals('image/jpeg', $event->images->first()->mime_type);
        $this->assertNotNull($event->images->first()->image_data);
    }

    public function test_can_retrieve_image()
    {
        $event = Event::factory()->create(['is_online_sellable' => true]);
        $image = EventImage::create([
            'event_id' => $event->id,
            'image_data' => 'fake_data',
            'mime_type' => 'text/plain',
        ]);

        $response = $this->get("/events/images/{$image->id}");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/plain');
        $this->assertEquals('fake_data', $response->content());
    }

    public function test_can_delete_image()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $user->update(['permissions' => ['update_event', 'view_sellables_inventory']]);

        $event = Event::factory()->create();
        $image = EventImage::create([
            'event_id' => $event->id,
            'image_data' => 'data',
            'mime_type' => 'text/plain',
        ]);

        $response = $this->delete("/sellables/images/{$image->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('event_images', ['id' => $image->id]);
    }
}
