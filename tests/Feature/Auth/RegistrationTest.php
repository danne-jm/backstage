<?php

use Laravel\Fortify\Features;

test('registration screen can be rendered', function () {
    if (! Features::enabled(Features::registration())) {
        $this->markTestSkipped('Registration is disabled.');
    }

    $response = $this->get(route('register'));

    $response->assertStatus(200);
});

test('new users can register', function () {
    if (! Features::enabled(Features::registration())) {
        $this->markTestSkipped('Registration is disabled.');
    }

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});
