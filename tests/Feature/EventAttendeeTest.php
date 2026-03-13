<?php

namespace Tests\Feature;

use App\Models\sellables\Event;
use App\Models\User;
use App\Services\GoogleSheetsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class EventAttendeeTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Event $event;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->user = User::factory()->create([
            'gmail_refresh_token' => 'fake-token'
        ]);
        $this->event = Event::factory()->create([
            'google_spreadsheet_id' => 'spreadsheet-123',
            'google_sheet_name' => 'Sheet1'
        ]);
    }

    public function test_can_access_attendees_page()
    {
        $response = $this->actingAs($this->user)
            ->get(route('events.attendees', $this->event));

        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) => $page
                ->component('sellables/attendees')
                ->has('event')
        );
    }

    public function test_can_update_configuration()
    {
        $response = $this->actingAs($this->user)
            ->post(route('events.attendees.config', $this->event), [
                'google_spreadsheet_id' => 'new-id',
                'google_sheet_name' => 'New Sheet'
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('events', [
            'id' => $this->event->id,
            'google_spreadsheet_id' => 'new-id',
            'google_sheet_name' => 'New Sheet'
        ]);
    }

    public function test_can_list_sheets()
    {
        $this->mock(GoogleSheetsService::class, function (MockInterface $mock) {
            $mock->shouldReceive('getSheetNames')
                ->with('spreadsheet-123')
                ->andReturn(['Sheet1', 'Sheet2']);
        });

        $response = $this->actingAs($this->user)
            ->get(route('events.attendees.sheets', $this->event));

        $response->assertStatus(200);
        $response->assertJson(['sheets' => ['Sheet1', 'Sheet2']]);
    }

    public function test_can_get_sheet_data_with_filters()
    {
        $this->event->update([
            'attendee_filter_config' => [
                ['column' => 'Status', 'operator' => 'equals', 'value' => 'Confirmed']
            ]
        ]);

        $this->mock(GoogleSheetsService::class, function (MockInterface $mock) {
            $mock->shouldReceive('getSheetData')
                ->andReturn([
                    ['Name', 'Status'],
                    ['Alice', 'Confirmed'],
                    ['Bob', 'Pending']
                ]);
        });

        $response = $this->actingAs($this->user)
            ->get(route('events.attendees.sheet-data', $this->event));

        $response->assertStatus(200);
        $response->assertJsonPath('rows', [
            ['Name', 'Status'],
            ['Alice', 'Confirmed']
        ]);
    }
}
