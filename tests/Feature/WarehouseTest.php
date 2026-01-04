<?php

use App\Models\Item;
use App\Models\User;

it('creates an item and sets last_modified and changed_by', function () {
    $user = User::factory()->create([
        'email' => 'tester@example.com',
        'permissions' => ['create_item', 'view_inventory'],
    ]);

    $this->actingAs($user)
        ->post(route('warehouse.items.store'), [
            'name' => 'Widget A',
            'quantity' => 10,
            'category' => ['category1', 'category2'],
        ])
        ->assertRedirect(route('warehouse'));

    $this->assertDatabaseHas('items', [
        'name' => 'Widget A',
        'quantity' => 10,
        'changed_by' => 'tester@example.com',
    ]);

    $item = Item::where('name', 'Widget A')->first();
    expect($item)->not->toBeNull();
    expect($item->last_modified)->not->toBeNull();
});
