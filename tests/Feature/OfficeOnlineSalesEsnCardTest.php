<?php

namespace Tests\Feature;

use App\Models\OfficeShift;
use App\Models\OnlineSale;
use App\Models\User;
use App\Models\sellables\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfficeOnlineSalesEsnCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_office_shift_page_exposes_code_used_for_online_variant_sales(): void
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $shift = OfficeShift::create([
            'started_by' => $user->id,
            'started_at' => now()->subHour(),
            'status' => 'open',
        ]);

        $product = Product::create([
            'name' => 'Variant Hoodie',
            'price' => 20,
            'member_price' => 15,
            'is_variant_based' => true,
            'is_online_sellable' => true,
        ]);

        OnlineSale::create([
            'office_shift_id' => $shift->id,
            'product_id' => $product->id,
            'method' => 'card',
            'amount' => 15,
            'ticket_type' => null,
            'details' => [
                'code_used' => 'ESN-XYZ',
                'options' => [
                    'size' => 'L',
                ],
            ],
            'sold_at' => now()->subMinutes(15),
        ]);

        $response = $this->actingAs($user)
            ->get(route('office.show', $shift->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('onlineSales', 1)
            ->where('onlineSales.0.code_used', 'ESN-XYZ')
        );
    }
}
