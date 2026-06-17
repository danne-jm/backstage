<?php

use App\Models\Item;

it('creates an item and sets last_modified and changed_by', function () {
    $user = $this->createUserWithPermissions(['create_item', 'view_inventory'], ['email' => 'tester@example.com']);

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

it('can update an item', function () {
    $user = $this->createUserWithPermissions(['update_item', 'view_inventory'], ['email' => 'editor@example.com']);

    $item = Item::create([
        'name' => 'Original Name',
        'quantity' => 10,
        'category' => ['cat1'],
        'last_modified' => now(),
        'changed_by' => 'creator',
    ]);

    $this->actingAs($user)
        ->put(route('warehouse.items.update', $item), [
            'name' => 'Updated Name',
            'quantity' => 20,
            'category' => ['cat1', 'cat2'],
        ])
        ->assertRedirect(route('warehouse'));

    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'name' => 'Updated Name',
        'quantity' => 20,
        'changed_by' => 'editor@example.com',
    ]);
});

it('can delete an item', function () {
    $user = $this->createUserWithPermissions(['delete_item', 'view_inventory'], ['email' => 'deleter@example.com']);

    $item = Item::create([
        'name' => 'To Delete',
        'quantity' => 5,
        'category' => [],
        'last_modified' => now(),
        'changed_by' => 'creator',
    ]);

    $this->actingAs($user)
        ->delete(route('warehouse.items.destroy', $item))
        ->assertRedirect(route('warehouse'));

    $this->assertDatabaseMissing('items', ['id' => $item->id]);
});
