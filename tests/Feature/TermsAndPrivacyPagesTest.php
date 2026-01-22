<?php

it('displays terms and conditions page without authentication', function () {
    $response = $this->get('/terms-conditions');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Shared/terms-conditions')
    );
});

it('displays privacy policy page without authentication', function () {
    $response = $this->get('/privacy-policy');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Shared/privacy-policy')
    );
});

it('can navigate to terms and conditions from home page', function () {
    $response = $this->get('/');

    $response->assertSuccessful();
});

it('can navigate to privacy policy from home page', function () {
    $response = $this->get('/');

    $response->assertSuccessful();
});
