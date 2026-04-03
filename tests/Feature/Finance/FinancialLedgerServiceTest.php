<?php

namespace Tests\Feature\Finance;

use App\Models\FinancialLedgerEntry;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Services\FinancialLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialLedgerServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_records_online_transaction_entries_idempotently(): void
    {
        $service = app(FinancialLedgerService::class);

        $transaction = OnlineTransaction::create([
            'reference_id' => 'ledger-online-1',
            'total_amount' => 30.00,
            'processing_fee' => 1.20,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'ledger@example.com',
            'completed_at' => now(),
            'mail_success' => true,
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'reference_id' => 'ONL-1',
            'product_id' => null,
            'event_id' => null,
            'method' => 'card',
            'amount' => 10.00,
            'details' => ['ticket_type' => null],
            'ticket_type' => null,
            'sold_at' => now(),
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'reference_id' => 'ONL-2',
            'product_id' => null,
            'event_id' => null,
            'method' => 'card',
            'amount' => 20.00,
            'details' => ['ticket_type' => 'with_card'],
            'ticket_type' => 'with_card',
            'sold_at' => now(),
        ]);

        $service->recordOnlineTransactionCompleted($transaction);
        $service->recordOnlineTransactionCompleted($transaction);

        $this->assertSame(3, FinancialLedgerEntry::count());
        $this->assertSame(2, FinancialLedgerEntry::where('entry_type', 'online_sale_completed')->count());
        $this->assertSame(1, FinancialLedgerEntry::where('entry_type', 'online_processing_fee')->count());
    }

    public function test_it_records_office_sale_entries_idempotently(): void
    {
        $service = app(FinancialLedgerService::class);

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

        $sale = OfficeShiftSale::create([
            'office_shift_id' => $shift->id,
            'product_id' => null,
            'event_id' => null,
            'method' => 'cash',
            'amount' => 15.50,
            'description' => 'Manual office sale',
            'snapshot' => ['ticket_type' => null],
            'breakdown' => null,
            'sold_by' => null,
            'sold_at' => now(),
        ]);

        $service->recordOfficeSale($sale, $shift);
        $service->recordOfficeSale($sale, $shift);

        $this->assertSame(1, FinancialLedgerEntry::where('entry_type', 'office_shift_sale_recorded')->count());
        $entry = FinancialLedgerEntry::where('entry_type', 'office_shift_sale_recorded')->first();

        $this->assertNotNull($entry);
        $this->assertSame('office', $entry->channel);
        $this->assertSame('cash', $entry->payment_method);
        $this->assertEquals(15.50, (float) $entry->amount);
    }

    public function test_it_records_online_reversal_entries_idempotently(): void
    {
        $service = app(FinancialLedgerService::class);

        $transaction = OnlineTransaction::create([
            'reference_id' => 'ledger-online-reversal',
            'total_amount' => 30.00,
            'processing_fee' => 1.20,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'ledger@example.com',
            'completed_at' => now(),
            'mail_success' => true,
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'reference_id' => 'ONL-R1',
            'method' => 'card',
            'amount' => 10.00,
            'details' => ['ticket_type' => null],
            'ticket_type' => null,
            'sold_at' => now(),
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'reference_id' => 'ONL-R2',
            'method' => 'card',
            'amount' => 20.00,
            'details' => ['ticket_type' => 'with_card'],
            'ticket_type' => 'with_card',
            'sold_at' => now(),
        ]);

        $service->recordOnlineTransactionCompleted($transaction);
        $service->recordOnlineTransactionReversal($transaction, 'failed');
        $service->recordOnlineTransactionReversal($transaction, 'failed');

        $this->assertSame(2, FinancialLedgerEntry::where('entry_type', 'online_sale_reversed')->count());
        $this->assertSame(1, FinancialLedgerEntry::where('entry_type', 'online_processing_fee_reversed')->count());
    }

    public function test_it_records_office_sale_removal_reversal_idempotently(): void
    {
        $service = app(FinancialLedgerService::class);

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

        $sale = OfficeShiftSale::create([
            'office_shift_id' => $shift->id,
            'method' => 'cash',
            'amount' => 12.00,
            'description' => 'To be removed',
            'snapshot' => ['ticket_type' => null],
            'sold_at' => now(),
        ]);

        $service->recordOfficeSale($sale, $shift);
        $service->recordOfficeSaleRemoved($sale, $shift, 'removed');
        $service->recordOfficeSaleRemoved($sale, $shift, 'removed');

        $this->assertSame(1, FinancialLedgerEntry::where('entry_type', 'office_shift_sale_removed')->count());
        $entry = FinancialLedgerEntry::where('entry_type', 'office_shift_sale_removed')->first();
        $this->assertEquals(12.00, (float) $entry->amount);
        $this->assertSame('debit', $entry->direction);
    }
}
