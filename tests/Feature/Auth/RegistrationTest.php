<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_is_disabled()
    {
        // This application has registration disabled — no public sign-up route exists.
        $this->assertFalse($this->app['router']->has('register'));
    }

    public function test_registration_endpoint_returns_not_found()
    {
        $response = $this->post('/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        // Route doesn't exist → 404
        $response->assertNotFound();
    }
}
