<?php

use App\Enums\UserPermission;
use App\Models\OfficeShift;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->permissions = [UserPermission::VIEW_OFFICE->value, UserPermission::UPDATE_OFFICE->value];
    $this->user->save();
    $this->actingAs($this->user);
});

it('quick add sales have empty description', function () {
    $product = Product::factory()->create([
        'name' => 'Test Product',
        'description' => 'This is a product description that should not appear in quick sales',
        'price' => 10.00,
        'quantity' => 100,
    ]);

    $shift = OfficeShift::factory()->create([
        'status' => 'open',
        'started_at' => now(),
    ]);

    $response = $this->postJson("http://localhost/office/{$shift->id}/record-sale", [
        'product_id' => $product->id,
        'item_type' => 'product',
        'method' => 'cash',
        'amount' => 10.00,
        'description' => '', // Quick sales send empty description
        'is_manual_entry' => false, // Quick sales have is_manual_entry = false
        'breakdown' => [
            '10e' => 1,
        ],
    ]);

    $response->assertRedirect();

    $sale = $shift->sales()->latest()->first();
    expect($sale)->not->toBeNull();
    expect($sale->description)->toBe('');
    expect($sale->snapshot['description'])->toBe('');
});

it('custom sales with description show the description', function () {
    $product = Product::factory()->create([
        'name' => 'Test Product',
        'description' => 'This is a product description',
        'price' => 10.00,
        'quantity' => 100,
    ]);

    $shift = OfficeShift::factory()->create([
        'status' => 'open',
        'started_at' => now(),
    ]);

    $customDescription = 'Custom sale description provided by user';

    $response = $this->postJson("http://localhost/office/{$shift->id}/record-sale", [
        'product_id' => $product->id,
        'item_type' => 'product',
        'method' => 'cash',
        'amount' => 15.00,
        'description' => $customDescription,
        'is_manual_entry' => true, // Custom sales have is_manual_entry = true
        'breakdown' => [
            '10e' => 1,
            '5e' => 1,
        ],
    ]);

    $response->assertRedirect();

    $sale = $shift->sales()->latest()->first();
    expect($sale)->not->toBeNull();
    expect($sale->description)->toBe($customDescription);
    expect($sale->snapshot['description'])->toBe($customDescription);
});

it('custom sales without description have empty description', function () {
    $product = Product::factory()->create([
        'name' => 'Test Product',
        'description' => 'This is a product description',
        'price' => 10.00,
        'quantity' => 100,
    ]);

    $shift = OfficeShift::factory()->create([
        'status' => 'open',
        'started_at' => now(),
    ]);

    $response = $this->postJson("http://localhost/office/{$shift->id}/record-sale", [
        'product_id' => $product->id,
        'item_type' => 'product',
        'method' => 'cash',
        'amount' => 15.00,
        'description' => '', // Custom sale but no description provided
        'is_manual_entry' => true,
        'breakdown' => [
            '10e' => 1,
            '5e' => 1,
        ],
    ]);

    $response->assertRedirect();

    $sale = $shift->sales()->latest()->first();
    expect($sale)->not->toBeNull();
    expect($sale->description)->toBe('');
    expect($sale->snapshot['description'])->toBe('');
});
