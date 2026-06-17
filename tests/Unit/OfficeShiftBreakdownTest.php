<?php

namespace Tests\Unit;

use App\Models\OfficeShift;
use Tests\TestCase;

class OfficeShiftBreakdownTest extends TestCase
{
    private OfficeShift $shift;

    protected function setUp(): void
    {
        parent::setUp();
        $this->shift = new OfficeShift;
    }

    // -------------------------------------------------------------------------
    // totalFromBreakdown
    // -------------------------------------------------------------------------

    public function test_total_from_breakdown_returns_zero_for_null(): void
    {
        $this->assertSame(0.0, $this->shift->totalFromBreakdown(null));
    }

    public function test_total_from_breakdown_returns_zero_for_empty_array(): void
    {
        $this->assertSame(0.0, $this->shift->totalFromBreakdown([]));
    }

    public function test_total_from_breakdown_counts_euro_notes(): void
    {
        $breakdown = ['50e' => 2, '20e' => 1, '10e' => 3];
        // 2*50 + 1*20 + 3*10 = 150
        $this->assertEqualsWithDelta(150.0, $this->shift->totalFromBreakdown($breakdown), 0.001);
    }

    public function test_total_from_breakdown_counts_coins(): void
    {
        $breakdown = ['1e' => 3, '50c' => 2, '20c' => 1];
        // 3*1 + 2*0.50 + 1*0.20 = 4.20
        $this->assertEqualsWithDelta(4.20, $this->shift->totalFromBreakdown($breakdown), 0.001);
    }

    public function test_total_from_breakdown_tokens_count_as_zero(): void
    {
        $breakdown = ['token' => 10, '5e' => 2];
        $this->assertEqualsWithDelta(10.0, $this->shift->totalFromBreakdown($breakdown), 0.001);
    }

    public function test_total_from_breakdown_handles_large_notes(): void
    {
        $breakdown = ['500e' => 1, '200e' => 1, '100e' => 1];
        $this->assertEqualsWithDelta(800.0, $this->shift->totalFromBreakdown($breakdown), 0.001);
    }

    public function test_total_from_breakdown_ignores_unknown_keys(): void
    {
        $breakdown = ['10e' => 2, 'fake_key' => 999];
        $this->assertEqualsWithDelta(20.0, $this->shift->totalFromBreakdown($breakdown), 0.001);
    }

    public function test_total_from_breakdown_handles_string_counts(): void
    {
        $breakdown = ['2e' => '3', '1c' => '5'];
        // 6 + 0.05
        $this->assertEqualsWithDelta(6.05, $this->shift->totalFromBreakdown($breakdown), 0.001);
    }

    // -------------------------------------------------------------------------
    // mergeBreakdowns
    // -------------------------------------------------------------------------

    public function test_merge_breakdowns_sums_two_breakdowns(): void
    {
        $b1 = ['10e' => 2, '5e' => 1];
        $b2 = ['10e' => 1, '2e' => 3];
        $result = OfficeShift::mergeBreakdowns($b1, $b2);

        $this->assertSame(3, $result['10e']);
        $this->assertSame(1, $result['5e']);
        $this->assertSame(3, $result['2e']);
    }

    public function test_merge_breakdowns_with_null_first_argument(): void
    {
        $b2 = ['50e' => 2];
        $result = OfficeShift::mergeBreakdowns(null, $b2);
        $this->assertSame(2, $result['50e']);
    }

    public function test_merge_breakdowns_with_null_second_argument(): void
    {
        $b1 = ['1e' => 5];
        $result = OfficeShift::mergeBreakdowns($b1, null);
        $this->assertSame(5, $result['1e']);
    }

    public function test_merge_breakdowns_with_both_null(): void
    {
        $result = OfficeShift::mergeBreakdowns(null, null);
        foreach (OfficeShift::DENOMINATIONS as $denom) {
            $this->assertSame(0, $result[$denom]);
        }
    }

    public function test_merge_breakdowns_contains_all_denominations(): void
    {
        $result = OfficeShift::mergeBreakdowns(['10e' => 1], ['5e' => 1]);
        foreach (OfficeShift::DENOMINATIONS as $denom) {
            $this->assertArrayHasKey($denom, $result);
        }
    }

    public function test_merge_breakdowns_sums_tokens(): void
    {
        $result = OfficeShift::mergeBreakdowns(['token' => 3], ['token' => 7]);
        $this->assertSame(10, $result['token']);
    }
}
