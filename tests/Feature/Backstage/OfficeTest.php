<?php

namespace Tests\Feature\Backstage;

use App\Models\OfficeShift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class OfficeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Backstage uses localhost domain in current test setup
        config(['app.url' => 'http://localhost']);
    }

    public function test_office_dashboard_can_be_rendered()
    {
        $user = User::factory()->create(['permissions' => ['view_office']]);
        
        $this->actingAs($user)
            ->get('http://localhost/office')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Backstage/office')
            );
    }

    public function test_user_can_start_a_shift()
    {
        $user = User::factory()->create(['permissions' => ['view_office', 'create_office']]);

        $response = $this->actingAs($user)
            ->post('http://localhost/office/start', ['initial_cash' => 100.00]);
            
        // Expect redirect to the specific shift page, e.g. /office/{id}
        // Since we don't know ID easily without fetching, we can check pattern or just fetch latest.
        $shift = OfficeShift::latest('id')->first();
        $response->assertRedirect(route('office.show', $shift));

        $this->assertDatabaseHas('office_shifts', [
            'started_by' => $user->id,
            'start_cash' => 0, // Controller ignores input and uses last shift or 0
            'ended_at' => null,
        ]);
    }

    public function test_user_can_end_a_shift()
    {
        $user = User::factory()->create(['permissions' => ['view_office', 'create_office', 'update_office']]);
        $shift = OfficeShift::create([
            'started_by' => $user->id,
            'started_at' => now(),
            'start_cash' => 100.00,
            'status' => 'open'
        ]);

        $this->actingAs($user)
            ->post("http://localhost/office/{$shift->id}/end", [
                'notes' => 'Good shift',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('office_shifts', [
            'id' => $shift->id,
            'notes' => 'Good shift',
            'status' => 'closed',
        ]);
        
        $this->assertNotNull($shift->fresh()->ended_at);
    }
}
