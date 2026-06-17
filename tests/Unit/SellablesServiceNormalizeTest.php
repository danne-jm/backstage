<?php

namespace Tests\Unit;

use App\Services\SellablesService;
use Tests\TestCase;

class SellablesServiceNormalizeTest extends TestCase
{
    private SellablesService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SellablesService;
    }

    // -------------------------------------------------------------------------
    // variable_amount = true path
    // -------------------------------------------------------------------------

    public function test_variable_amount_clears_universal_quantity(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => true,
            'quantity' => 50,
        ]);

        $this->assertNull($result['quantity']);
        $this->assertFalse($result['unlimited_quantity']);
    }

    public function test_variable_amount_sets_unlimited_with_card_when_null(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => true,
        ]);

        $this->assertNull($result['quantity_with_card']);
        $this->assertTrue($result['unlimited_quantity_with_card']);
    }

    public function test_variable_amount_uses_explicit_with_card_quantity(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => true,
            'quantity_with_card' => 100,
        ]);

        $this->assertSame(100, $result['quantity_with_card']);
        $this->assertFalse($result['unlimited_quantity_with_card']);
    }

    public function test_variable_amount_sets_unlimited_without_card_when_null(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => true,
        ]);

        $this->assertNull($result['quantity_without_card']);
        $this->assertTrue($result['unlimited_quantity_without_card']);
    }

    public function test_variable_amount_uses_explicit_without_card_quantity(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => true,
            'quantity_without_card' => 50,
        ]);

        $this->assertSame(50, $result['quantity_without_card']);
        $this->assertFalse($result['unlimited_quantity_without_card']);
    }

    public function test_variable_amount_clears_variants_config(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => true,
            'variants_config' => [['size' => 'M']],
        ]);

        $this->assertNull($result['variants_config']);
    }

    // -------------------------------------------------------------------------
    // variable_amount = false path
    // -------------------------------------------------------------------------

    public function test_non_variable_with_quantity_sets_unlimited_false(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => false,
            'quantity' => 200,
        ]);

        $this->assertSame(200, $result['quantity']);
        $this->assertFalse($result['unlimited_quantity']);
    }

    public function test_non_variable_without_quantity_sets_unlimited_true(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => false,
        ]);

        $this->assertNull($result['quantity']);
        $this->assertTrue($result['unlimited_quantity']);
    }

    public function test_non_variable_null_quantity_sets_unlimited_true(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => false,
            'quantity' => null,
        ]);

        $this->assertTrue($result['unlimited_quantity']);
    }

    public function test_non_variable_clears_split_pool_fields(): void
    {
        $result = $this->service->normalizeInput([
            'variable_amount' => false,
            'quantity' => 10,
        ]);

        $this->assertNull($result['quantity_with_card']);
        $this->assertNull($result['quantity_without_card']);
        $this->assertFalse($result['unlimited_quantity_with_card']);
        $this->assertFalse($result['unlimited_quantity_without_card']);
    }
}
