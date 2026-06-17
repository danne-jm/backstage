<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreManagerAccountingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_manager_accounting_page_renders_with_ledger_data(): void
    {
        $this->withoutVite();

        $user = User::factory()->withAllPermissions()->create([
            'email_verified_at' => now(),
        ]);

        FinancialLedgerEntry::create([
            'entry_type' => 'office_shift_sale_recorded',
            'direction' => 'credit',
            'amount' => 50,
            'currency' => 'EUR',
            'channel' => 'office',
            'payment_method' => 'cash',
            'source_type' => 'office_shift_sale',
            'source_id' => 'sale-1',
            'source_reference' => 'SALE-1',
            'idempotency_key' => 'test-credit-1',
            'occurred_at' => now()->subDay(),
        ]);

        FinancialLedgerEntry::create([
            'entry_type' => 'online_processing_fee',
            'direction' => 'debit',
            'amount' => 2,
            'currency' => 'EUR',
            'channel' => 'online',
            'payment_method' => 'card',
            'source_type' => 'online_transaction',
            'source_id' => 'tx-1',
            'source_reference' => 'TX-1',
            'idempotency_key' => 'test-debit-1',
            'occurred_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($user)
            ->get(route('store-manager.accounting'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('summary.total_credit', 50)
            ->where('summary.total_debit', 2)
            ->where('summary.net', 48)
            ->where('summary.entries_count', 2)
            ->has('entries', 2)
            ->has('breakdowns.channels')
            ->has('breakdowns.payment_methods')
            ->has('breakdowns.entry_types')
            ->has('daily')
        );
    }
}
