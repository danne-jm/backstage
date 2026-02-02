<?php

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($this->createUserWithPermissions(['view_dashboard']));

    $this->get(route('dashboard'))->assertOk();
});
