<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class EIMTest extends TestCase
{
    use RefreshDatabase;

    public function test_permission_expansion()
    {
        $user = User::factory()->create([
            'permissions' => ['board'],
        ]);

        $expanded = $user->getExpandedPermissions();

        // Check if granular permissions are present
        $this->assertContains('view_dashboard', $expanded);
        $this->assertContains('create_event', $expanded);
        $this->assertContains('board', $expanded);
    }

    public function test_administrator_permissions()
    {
        $user = User::factory()->create([
            'permissions' => ['administrator'],
        ]);

        $expanded = $user->getExpandedPermissions();

        // Administrator should have all permissions explicitly
        $this->assertContains('view_dashboard', $expanded);
        $this->assertContains('create_user', $expanded);
        $this->assertContains('delete_office', $expanded);

        // Verify access to a protected route
        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertStatus(200);
    }

    public function test_activity_logging_on_user_update()
    {
        $user = User::factory()->create();

        // Act: Update user
        $user->first_name = 'ChangedName';
        $user->save();

        // Assert: Log exists
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'description' => 'updated',
        ]);

        // Fetch the specific update log
        $activity = Activity::where('subject_id', $user->id)
            ->where('description', 'updated')
            ->first();

        $this->assertEquals('ChangedName', $activity->properties['attributes']['first_name']);
    }

    public function test_auth_event_logging()
    {
        // We need to ensure the listener is working.
        // Note: RefreshDatabase might clear logs, so we check after login.

        // Disable 2FA so we don't get redirected to challenge
        $user = User::factory()->withoutTwoFactor()->create([
            'permissions' => ['guest'],
            'password' => 'password',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);

        // Assert: Log exists for login
        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'auth',
            'description' => 'User logged in',
            'causer_id' => $user->id,
        ]);
    }

    public function test_model_activity_logging()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Act: Create and Update an Event
        $event = new \App\Models\Event([
            'name' => 'Old Name',
            'start_time' => now(),
            'event_date' => now(),
            'start_sell_date' => now(),
            'end_sell_date' => now()->addDays(5),
            'price_with_card' => 10.00,
            'price_without_card' => 12.00,
            'responsible_user_id' => $user->id,
        ]);
        $event->save();

        $event->name = 'New Event Name';
        $event->save();

        // Assert: Log exists
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => \App\Models\Event::class,
            'subject_id' => $event->id,
            'description' => 'updated',
        ]);

        // Create an Item to verify logging
        $item = \App\Models\Item::create([
            'name' => 'Old Item',
            'quantity' => 10,
        ]);

        $item->update(['name' => 'New Item']);

        $this->assertDatabaseHas('activity_log', [
            'subject_type' => \App\Models\Item::class,
            'subject_id' => $item->id,
            'description' => 'updated',
        ]);

        // Check MailTemplate logging
        $template = \App\Models\MailTemplate::create([
            'name' => 'Test Template',
            'html_content' => '<p>Hi</p>',
        ]);
        $template->update(['name' => 'Updated Template']);
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => \App\Models\MailTemplate::class,
            'subject_id' => $template->id,
            'description' => 'updated',
        ]);

        // Check OnlineSale logging
        // Skipped: 'online_sales' table does not exist in migrations yet.
        /*
        $onlineSale = \App\Models\OnlineSale::create([
            'product_id' => null,
            'event_id' => null,
            'method' => 'card',
            'amount' => 50.00,
            'sold_at' => now(),
        ]);
        $onlineSale->update(['amount' => 55.00]);
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => \App\Models\OnlineSale::class,
            'subject_id' => $onlineSale->id,
            'description' => 'updated',
        ]);
        */

        // Check OfficeShiftWorker logging
        $shift = \App\Models\OfficeShift::create([
            'started_at' => now(),
            'started_by' => $user->id,
            'is_open' => true,
        ]);

        $worker = \App\Models\OfficeShiftWorker::create([
            'office_shift_id' => $shift->id,
            'user_id' => $user->id,
            'role' => 'clerk',
        ]);
        $worker->update(['role' => 'manager']);
        $this->assertDatabaseHas('activity_log', [
            'subject_type' => \App\Models\OfficeShiftWorker::class,
            'subject_id' => $worker->id,
            'description' => 'updated',
        ]);
        $log = Activity::where('subject_type', \App\Models\Event::class)
            ->where('subject_id', $event->id)
            ->where('description', 'updated')
            ->first();

        $this->assertEquals('New Event Name', $log->properties['attributes']['name']);
        $this->assertEquals('Old Name', $log->properties['old']['name']);
    }
}
