<?php

use App\Models\User;

it('returns json from distribution endpoint', function () {
    // create a user instance and act as them
    $user = $this->createUserWithPermissions(['send_tickets']);
    $this->actingAs($user);

    $recipients = [
        ['email' => 'test@example.com', 'subject' => 'Hello', 'body' => '<p>test</p>'],
    ];

    $response = $this->postJson(route('distribute-emails'), ['recipients' => $recipients]);

    $response->assertSuccessful();
    $json = $response->json();
    expect($json)->toHaveKey('sent_count');
    expect(is_int($json['sent_count']))->toBeTrue();
});
