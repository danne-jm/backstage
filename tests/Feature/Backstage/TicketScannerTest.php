<?php

namespace Tests\Feature\Backstage;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketScannerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://localhost']);
    }

    public function test_can_import_tickets()
    {
        // Note: import_ticket permission is required for the import action (security fix)
        $user = $this->createUserWithPermissions(['view_ticket_scanner', 'import_ticket']);
        $event = Event::factory()->create();

        $samples = [
            ['first_name' => 'John', 'last_name' => 'Doe', 'email' => 'john@example.com'],
            ['first_name' => 'Jane', 'last_name' => 'Smith', 'email' => 'jane@example.com'],
        ];

        $response = $this->actingAs($user)
            ->postJson(route('ticket-scanner.import'), [
                'event_id' => $event->id,
                'samples' => $samples,
            ]);

        $response->assertStatus(201)
            ->assertJsonCount(2, 'created');

        $this->assertDatabaseHas('tickets', [
            'event_id' => $event->id,
            // Metadata is JSON, so we can't easily assertDatabaseHas on deep keys
            // without casting or precision, but we can check if a ticket exists.
        ]);

        $this->assertEquals(2, $event->tickets()->count());
    }

    public function test_can_verify_valid_ticket()
    {
        // SECURITY FIX: User needs scan_tickets permission
        $user = $this->createUserWithPermissions(['view_ticket_scanner', 'scan_tickets']);
        $event = Event::factory()->create();

        // Create a ticket manually or via endpoint
        $ticketCode = 'TEST_CODE_123';
        $event->tickets()->create([
            'ticket_code' => $ticketCode,
            'email' => 'test@example.com',
            'metadata' => ['first_name' => 'Test'],
            'scanned_at' => null,
            'user_id' => null,
        ]);

        // Note: verify route is now POST (security fix for CSRF)
        $response = $this->actingAs($user)
            ->postJson(route('ticket-scanner.verify'), [
                'event_id' => $event->id,
                'ticket_id' => $ticketCode,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'previously_scanned' => false,
            ]);

        $this->assertNotNull($event->tickets()->first()->scanned_at);
    }

    public function test_verify_detects_already_scanned()
    {
        // SECURITY FIX: User needs scan_tickets permission
        $user = $this->createUserWithPermissions(['view_ticket_scanner', 'scan_tickets']);
        $event = Event::factory()->create();
        $ticketCode = 'TEST_CODE_SCANNED';

        $ticket = $event->tickets()->create([
            'ticket_code' => $ticketCode,
            'email' => 'test@example.com',
            'metadata' => ['first_name' => 'Test'],
            'scanned_at' => now()->subHour(),
            'user_id' => null,
        ]);

        $response = $this->actingAs($user)
            ->postJson(route('ticket-scanner.verify'), [
                'event_id' => $event->id,
                'ticket_id' => $ticketCode,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'valid' => true,
                'previously_scanned' => true,
            ]);
    }

    public function test_verify_fails_invalid_ticket()
    {
        // SECURITY FIX: User needs scan_tickets permission
        $user = $this->createUserWithPermissions(['view_ticket_scanner', 'scan_tickets']);
        $event = Event::factory()->create();

        $response = $this->actingAs($user)
            ->postJson(route('ticket-scanner.verify'), [
                'event_id' => $event->id,
                'ticket_id' => 'INVALID_CODE',
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'valid' => false,
            ]);
    }
}
