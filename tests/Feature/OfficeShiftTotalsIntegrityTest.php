<?php

namespace Tests\Feature;

use App\Http\Resources\OfficeShiftResource;
use App\Models\OfficeShift;
use App\Models\OnlineSale;
use App\Models\User;
use App\Services\OfficeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class OfficeShiftTotalsIntegrityTest extends TestCase
{
    use RefreshDatabase;

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

        OnlineSale::create([
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
}
