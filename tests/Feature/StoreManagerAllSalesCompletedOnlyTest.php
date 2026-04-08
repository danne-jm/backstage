<?php

namespace Tests\Feature;

use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreManagerAllSalesCompletedOnlyTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_sales_includes_only_completed_online_transactions_and_exposes_processing_fee(): void
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $completedTx = OnlineTransaction::create([
            'reference_id' => 'sm-completed-1',
            'total_amount' => 31.5,
            'processing_fee' => 1.5,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'completed@example.com',
            'mail_success' => true,
            'completed_at' => now(),
        ]);

        $pendingTx = OnlineTransaction::create([
            'reference_id' => 'sm-pending-1',
            'total_amount' => 25,
            'processing_fee' => 1,
            'discount_codes' => null,
            'payment_status' => 'pending',
            'payment_gateway' => 'sumup',
            'email' => 'pending@example.com',
            'mail_success' => false,
        ]);

        OnlineSale::create([
            'online_transaction_id' => $completedTx->id,
            'reference_id' => 'COMP-1',
            'method' => 'card',
            'amount' => 30,
            'details' => [],
            'ticket_type' => null,
            'sold_at' => now()->subMinutes(5),
        ]);

        OnlineSale::create([
            'online_transaction_id' => $pendingTx->id,
            'reference_id' => 'PEND-1',
            'method' => 'card',
            'amount' => 24,
            'details' => [],
            'ticket_type' => null,
            'sold_at' => now()->subMinutes(4),
        ]);

        $response = $this->actingAs($user)
            ->get(route('store-manager.all-sales'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('sales', 1)
            ->where('sales.0.online_transaction_id', $completedTx->id)
            ->where('sales.0.processing_fee', 1.5)
        );
    }
}
