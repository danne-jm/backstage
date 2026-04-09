<?php

namespace Tests\Feature;

use App\Http\Resources\OfficeShiftResource;
use App\Models\OfficeShift;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\User;
use App\Services\OfficeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class OfficeShiftTotalsIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_office_index_last_shift_and_all_shifts_include_online_sales_in_card_totals(): void
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $shift = OfficeShift::create([
            'started_by' => $user->id,
            'started_at' => now()->subHours(2),
            'ended_at' => now()->subHour(),
            'status' => 'closed',
            'cash_total' => 7,
            'card_total' => 5,
            'start_cash' => 0,
            'start_card' => 0,
            'total_cash' => 7,
            'total_card' => 5,
        ]);

        $transaction = OnlineTransaction::create([
            'reference_id' => 'office-index-completed-1',
            'total_amount' => 20,
            'processing_fee' => 0,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'buyer@example.com',
            'mail_success' => true,
            'completed_at' => now()->subHour(),
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'office_shift_id' => $shift->id,
            'method' => 'card',
            'amount' => 20,
            'ticket_type' => null,
            'details' => [],
            'sold_at' => now()->subMinutes(95),
        ]);

        $response = $this->actingAs($user)
            ->get(route('office'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('lastShift.card_total', 25.0)
            ->where('lastShift.total', 32.0)
            ->where('allShifts.0.card_total', 25.0)
            ->where('allShifts.0.total', 32.0)
        );
    }

    public function test_claiming_orphan_online_sales_does_not_double_count_card_totals(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $shift = OfficeShift::create([
            'started_by' => $user->id,
            'started_at' => now()->subHour(),
            'status' => 'open',
            'cash_total' => 0,
            'card_total' => 0,
            'start_cash' => 0,
            'start_card' => 0,
            'total_cash' => 0,
            'total_card' => 0,
        ]);

        $transaction = OnlineTransaction::create([
            'reference_id' => 'orphan-completed-1',
            'total_amount' => 42.50,
            'processing_fee' => 0,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'buyer@example.com',
            'mail_success' => false,
            'completed_at' => now(),
        ]);

        OnlineSale::create([
            'online_transaction_id' => $transaction->id,
            'office_shift_id' => null,
            'method' => 'card',
            'amount' => 42.50,
            'ticket_type' => null,
            'details' => [],
            'sold_at' => now()->subMinutes(5),
        ]);

        app(OfficeService::class)->claimStrayOnlineSales($shift);

        $shift->refresh();

        // card_total tracks POS/manual card sales, not claimed online sales.
        $this->assertEquals(0.0, (float) $shift->card_total);

        $payload = (new OfficeShiftResource($shift->fresh()))->toArray(Request::create('/'));

        // Resource-level card_total/total include assigned online sales exactly once.
        $this->assertSame(42.5, (float) $payload['card_total']);
        $this->assertSame(42.5, (float) $payload['total']);
    }

    public function test_start_shift_ignores_pending_orphan_online_sales(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $completedTx = OnlineTransaction::create([
            'reference_id' => 'orphan-completed-2',
            'total_amount' => 20,
            'processing_fee' => 0,
            'discount_codes' => null,
            'payment_status' => 'completed',
            'payment_gateway' => 'sumup',
            'email' => 'completed@example.com',
            'mail_success' => false,
            'completed_at' => now(),
        ]);

        $pendingTx = OnlineTransaction::create([
            'reference_id' => 'orphan-pending-1',
            'total_amount' => 30,
            'processing_fee' => 0,
            'discount_codes' => null,
            'payment_status' => 'pending',
            'payment_gateway' => 'sumup',
            'email' => 'pending@example.com',
            'mail_success' => false,
        ]);

        $completedSale = OnlineSale::create([
            'online_transaction_id' => $completedTx->id,
            'office_shift_id' => null,
            'method' => 'card',
            'amount' => 20,
            'ticket_type' => null,
            'details' => [],
            'sold_at' => now()->subMinutes(10),
        ]);

        $pendingSale = OnlineSale::create([
            'online_transaction_id' => $pendingTx->id,
            'office_shift_id' => null,
            'method' => 'card',
            'amount' => 30,
            'ticket_type' => null,
            'details' => [],
            'sold_at' => now()->subMinutes(8),
        ]);

        $shift = app(OfficeService::class)->startShift($user);

        $shift->refresh();
        $completedSale->refresh();
        $pendingSale->refresh();

        $this->assertSame(20.0, (float) $shift->start_card);
        $this->assertSame($shift->id, $completedSale->office_shift_id);
        $this->assertNull($pendingSale->office_shift_id);
    }
}
