<?php

namespace Tests\Feature;

use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class EventImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_event_image()
    {
        $user = $this->createUserWithPermissions(['create_event', 'view_sellables_inventory', 'update_event', 'delete_event', 'view_sellables']);
        $this->actingAs($user);

        $file = UploadedFile::fake()->image('event.jpg', 600, 600);

        $response = $this->post(route('sellables.events.store'), [
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
        $this->assertEquals(1, $event->is_online_sellable);

        $this->assertCount(1, $event->getMedia('images'));
        $this->assertEquals('image/jpeg', $event->getFirstMedia('images')->mime_type);
    }

    public function test_can_retrieve_image()
    {
        $event = Event::factory()->create([
            'is_online_sellable' => true,
        ]);

        $event->addMediaFromString('fake_data')
            ->usingFileName('test.txt')
            ->toMediaCollection('images');

        $this->assertCount(1, $event->getMedia('images'));
        $media = $event->getFirstMedia('images');
        $this->assertNotNull($media);
    }

    public function test_can_delete_image()
    {
        $user = $this->createUserWithPermissions(['update_event', 'view_sellables_inventory', 'delete_event', 'view_sellables']);
        $this->actingAs($user);

        $event = Event::factory()->create(['responsible_user_id' => $user->id]);

        $media = $event->addMediaFromString('data')
            ->usingFileName('test.txt')
            ->toMediaCollection('images');

        $response = $this->delete(route('sellables.images.destroy', ['image' => $media->id]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('media', ['id' => $media->id]);
    }
}
