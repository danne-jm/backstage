<?php

namespace Tests\Feature\Finance;

use App\Models\FinancialLedgerEntry;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LedgerBackfillCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_backfills_online_and_office_entries_idempotently(): void
    {
        $transaction = OnlineTransaction::create([
            'reference_id' => 'bf-online-1',
            'total_amount' => 21.00,
            'processing_fee' => 1.00,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'buyer@example.com',
            'completed_at' => now(),
            'mail_success' => true,
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'reference_id' => 'BF-ONL-1',
            'method' => 'card',
            'amount' => 20.00,
            'details' => ['ticket_type' => null],
            'ticket_type' => null,
            'sold_at' => now(),
        ]);

        $shift = OfficeShift::create([
            'status' => 'open',
            'started_at' => now(),
            'cash_total' => 0,
            'card_total' => 0,
            'start_cash' => 0,
            'start_card' => 0,
            'total_cash' => 0,
            'total_card' => 0,
        ]);

        OfficeShiftSale::create([
            'office_shift_id' => $shift->id,
            'method' => 'cash',
            'amount' => 10.00,
            'description' => 'Backfill office sale',
            'snapshot' => ['ticket_type' => null],
            'sold_at' => now(),
        ]);

        $this->artisan('ledger:backfill')
            ->assertExitCode(0);

        $this->assertSame(3, FinancialLedgerEntry::count());

        // Run again to prove idempotency.
        $this->artisan('ledger:backfill')
            ->assertExitCode(0);

        $this->assertSame(3, FinancialLedgerEntry::count());
    }

    public function test_dry_run_does_not_write_entries(): void
    {
        $transaction = OnlineTransaction::create([
            'reference_id' => 'bf-online-dry',
            'total_amount' => 11.00,
            'processing_fee' => 1.00,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'buyer@example.com',
            'completed_at' => now(),
            'mail_success' => true,
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'reference_id' => 'BF-ONL-DRY',
            'method' => 'card',
            'amount' => 10.00,
            'details' => ['ticket_type' => null],
            'ticket_type' => null,
            'sold_at' => now(),
        ]);

        $this->artisan('ledger:backfill --dry-run')
            ->assertExitCode(0);

        $this->assertSame(0, FinancialLedgerEntry::count());
    }
}
