<?php

namespace Tests\Feature;

use App\Models\sellables\Event;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

class TicketScannerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $event;
    protected $ticket;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        
        // We need to verify if Event factory exists. If not, create manually.
        // Assuming factories exist for standard models, checking existence:
        // If EventFactory is not found, I'll fallback to manual creation.
        // For now I'll try using factory if available, or create manually if not.
        
        // Let's rely on manual creation to be safe if factory is missing or complex
        $this->event = Event::create([
            'name' => 'Test Event',
            'event_date' => now()->addDays(5),
            'start_sell_date' => now()->subDays(5),
            'end_sell_date' => now()->addDays(5),
            'price_with_card' => 10.00,
            'price_without_card' => 15.00,
            // Add other required fields if any (based on model fillable)
            'responsible_user_id' => $this->user->id,
            'sold_count_with_card' => 0,
            'sold_count_without_card' => 0,
        ]);

        $this->ticket = Ticket::create([
            'event_id' => $this->event->id,
            'ticket_code' => 'TEST-TICKET-CODE',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'scan_count' => 0,
            'scanned_at' => null,
        ]);
    }

    public function test_ticket_scanner_page_loads()
    {
        $response = $this->actingAs($this->user)->get(route('ticket-scanner'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('ticket-scanner')
            ->has('events', 1)
        );
    }

    public function test_available_tickets_endpoint()
    {
        $response = $this->actingAs($this->user)->getJson(route('ticket-scanner.available-tickets', [
            'event_id' => $this->event->id
        ]));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'tickets')
            ->assertJsonPath('tickets.0.ticket_code', 'TEST-TICKET-CODE');
    }

    public function test_scanned_tickets_endpoint()
    {
        // Initially empty
        $response = $this->actingAs($this->user)->getJson(route('ticket-scanner.scanned-tickets', [
            'event_id' => $this->event->id
        ]));

        $response->assertStatus(200)
            ->assertJsonCount(0, 'tickets');

        // Mark ticket scanned manually
        $this->ticket->update(['scanned_at' => now(), 'scan_count' => 1]);

        $response = $this->actingAs($this->user)->getJson(route('ticket-scanner.scanned-tickets', [
            'event_id' => $this->event->id
        ]));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'tickets');
    }

    public function test_verify_ticket_success()
    {
        $response = $this->actingAs($this->user)->postJson(route('ticket-scanner.verify'), [
            'ticket_id' => 'TEST-TICKET-CODE',
            'event_id' => $this->event->id
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'previously_scanned' => false,
            ]);

        $this->assertDatabaseHas('tickets', [
            'id' => $this->ticket->id,
            'scan_count' => 1,
        ]);
        
        $this->assertNotNull($this->ticket->fresh()->scanned_at);
    }

    public function test_verify_ticket_already_scanned()
    {
        // Scan once
        $this->actingAs($this->user)->postJson(route('ticket-scanner.verify'), [
            'ticket_id' => 'TEST-TICKET-CODE',
            'event_id' => $this->event->id
        ]);

        // Scan again
        $response = $this->actingAs($this->user)->postJson(route('ticket-scanner.verify'), [
            'ticket_id' => 'TEST-TICKET-CODE',
            'event_id' => $this->event->id
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'previously_scanned' => true,
            ]);

        $this->assertEquals(2, $this->ticket->fresh()->scan_count);
    }

    public function test_verify_ticket_invalid_code()
    {
        $response = $this->actingAs($this->user)->postJson(route('ticket-scanner.verify'), [
            'ticket_id' => 'INVALID-CODE',
            'event_id' => $this->event->id
        ]);

        $response->assertStatus(404) // Or 400 depending on implementation
                 ->assertJson(['valid' => false]);
    }

    public function test_verify_ticket_wrong_event()
    {
        $otherEvent = Event::create([
            'name' => 'Other Event',
            'event_date' => now()->addDays(10),
            'start_sell_date' => now(),
             'end_sell_date' => now()->addDays(10),
            'price_with_card' => 10.00,
            'price_without_card' => 15.00,
            'responsible_user_id' => $this->user->id,
            'sold_count_with_card' => 0,
            'sold_count_without_card' => 0,
        ]);

        $response = $this->actingAs($this->user)->postJson(route('ticket-scanner.verify'), [
            'ticket_id' => 'TEST-TICKET-CODE', // exists for $this->event
            'event_id' => $otherEvent->id // wrong event
        ]);

        $response->assertStatus(400)
            ->assertJson(['valid' => false]);
    }
}
