<?php

use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can increment item quantity', function () {
    $user = $this->createUserWithPermissions(['update_item', 'view_inventory'], ['email' => 'tester@example.com']);

    $item = Item::create([
        'name' => 'Test Item',
        'quantity' => 10,
        'category' => ['cat1'],
        'last_modified' => now(),
        'changed_by' => 'creator',
    ]);

    $this->actingAs($user)
        ->post(route('warehouse.items.increment', $item))
        ->assertRedirect(route('warehouse'));

    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'quantity' => 11,
    ]);
});

it('can decrement item quantity', function () {
    $user = $this->createUserWithPermissions(['update_item', 'view_inventory'], ['email' => 'tester@example.com']);

    $item = Item::create([
        'name' => 'Test Item',
        'quantity' => 10,
        'category' => ['cat1'],
        'last_modified' => now(),
        'changed_by' => 'creator',
    ]);

    $this->actingAs($user)
        ->post(route('warehouse.items.decrement', $item))
        ->assertRedirect(route('warehouse'));

    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'quantity' => 9,
    ]);
});

it('cannot decrement below zero', function () {
    $user = $this->createUserWithPermissions(['update_item', 'view_inventory'], ['email' => 'tester@example.com']);

    $item = Item::create([
        'name' => 'Empty Item',
        'quantity' => 0, // Zero quantity
        'category' => ['cat1'],
        'last_modified' => now(),
        'changed_by' => 'creator',
    ]);

    $this->actingAs($user)
        ->post(route('warehouse.items.decrement', $item))
        ->assertRedirect(route('warehouse'));

    // Should stay at 0
    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'quantity' => 0,
    ]);
});
