<?php

namespace Tests\Feature\Store;

use App\Models\OnlineTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CleanupAbandonedTransactionsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_marks_stale_pending_transactions_as_failed(): void
    {
        $transaction = OnlineTransaction::create([
            'reference_id' => 'stale-transaction-ref',
            'total_amount' => 100.00,
            'processing_fee' => 2.00,
            'discount_codes' => null,
            'payment_status' => 'pending',
            'payment_gateway' => 'sumup',
            'email' => 'buyer@example.com',
            'mail_success' => false,
        ]);

        $transaction->forceFill([
            'created_at' => now()->subMinutes(45),
        ])->save();

        $this->artisan('transactions:cleanup-abandoned', ['--minutes' => 30])
            ->assertExitCode(0);

        $this->assertSame('failed', $transaction->fresh()->payment_status);
    }
}
