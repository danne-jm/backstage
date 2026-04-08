<?php

namespace Tests\Feature;

use App\Models\OfficeShift;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
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

        $transaction = OnlineTransaction::create([
            'reference_id' => 'office-online-completed',
            'total_amount' => 15,
            'processing_fee' => 0,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'buyer@example.com',
            'mail_success' => true,
            'completed_at' => now(),
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
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

    public function test_office_shift_page_excludes_pending_online_sales(): void
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
            'name' => 'Variant Hoodie 2',
            'price' => 20,
            'member_price' => 15,
            'is_variant_based' => true,
            'is_online_sellable' => true,
        ]);

        $completedTx = OnlineTransaction::create([
            'reference_id' => 'office-online-completed-2',
            'total_amount' => 15,
            'processing_fee' => 0,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'completed@example.com',
            'mail_success' => true,
            'completed_at' => now(),
        ]);

        $pendingTx = OnlineTransaction::create([
            'reference_id' => 'office-online-pending-1',
            'total_amount' => 15,
            'processing_fee' => 0,
            'discount_codes' => null,
            'payment_status' => 'pending',
            'payment_gateway' => 'sumup',
            'email' => 'pending@example.com',
            'mail_success' => false,
        ]);

        OnlineSale::create([
            'online_transaction_id' => $completedTx->id,
            'office_shift_id' => $shift->id,
            'product_id' => $product->id,
            'method' => 'card',
            'amount' => 15,
            'ticket_type' => null,
            'details' => [
                'code_used' => 'ESN-COMPLETE',
                'options' => ['size' => 'L'],
            ],
            'sold_at' => now()->subMinutes(15),
        ]);

        OnlineSale::create([
            'online_transaction_id' => $pendingTx->id,
            'office_shift_id' => $shift->id,
            'product_id' => $product->id,
            'method' => 'card',
            'amount' => 15,
            'ticket_type' => null,
            'details' => [
                'code_used' => 'ESN-PENDING',
                'options' => ['size' => 'M'],
            ],
            'sold_at' => now()->subMinutes(12),
        ]);

        $response = $this->actingAs($user)
            ->get(route('office.show', $shift->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('onlineSales', 1)
            ->where('onlineSales.0.code_used', 'ESN-COMPLETE')
        );
    }
}
