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

    public function test_administrator_bypass()
    {
        $user = User::factory()->create([
            'permissions' => ['administrator'],
        ]);
        
        // Administrator should have 'admin' permission which bypasses middleware
        $this->assertContains('admin', $user->getExpandedPermissions());
        
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
}
