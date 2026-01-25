<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://localhost']);
    }

    public function test_admin_can_view_user_list()
    {
        $admin = User::factory()->create(['permissions' => ['view_settings_users', 'manage_users']]);

        $this->actingAs($admin)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->get('http://localhost/settings/users')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Backstage/settings/users')
            );
    }

    public function test_admin_can_create_user()
    {
        $admin = User::factory()->create(['permissions' => ['create_user', 'view_settings_users', 'manage_users']]);

        $this->actingAs($admin)
            ->post('http://localhost/settings/users', [
                'first_name' => 'New',
                'last_name' => 'User',
                'email' => 'new@example.com',
                'password' => 'password',
                'permissions' => ['view_office'],
            ])
            ->assertRedirect(); // Usually redirects back

        $this->assertDatabaseHas('users', [
            'email' => 'new@example.com',
            'first_name' => 'New',
        ]);

        $newUser = User::where('email', 'new@example.com')->first();
        $this->assertTrue(in_array('view_office', $newUser->permissions));
    }

    public function test_admin_can_update_user_permissions()
    {
        $admin = User::factory()->create(['permissions' => ['update_user', 'view_settings_users', 'manage_users']]);
        $targetUser = User::factory()->create(['permissions' => []]);

        $this->actingAs($admin)
            ->patch("http://localhost/settings/users/{$targetUser->id}", [
                'first_name' => 'Updated',
                'last_name' => 'Name',
                'email' => $targetUser->email,
                'permissions' => ['view_office'],
            ])
            ->assertRedirect();

        $targetUser->refresh();
        $this->assertTrue(in_array('view_office', $targetUser->permissions));
        $this->assertEquals('Updated', $targetUser->first_name);
    }

    public function test_non_admin_cannot_access_user_management()
    {
        $user = User::factory()->create(['permissions' => []]); // No permissions

        $this->actingAs($user)
            ->get('http://localhost/settings/users')
            ->assertForbidden();
    }
}
