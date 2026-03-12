<?php

namespace App\Services;

use App\Models\OfficeShift;
use App\Models\OfficeShiftWorker;
use App\Models\OfficeShiftSale;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OfficeService
{
    public function __construct(protected SaleService $saleService) {}

    public function startShift(User $user): OfficeShift
    {
        return DB::transaction(function () use ($user) {
            // Find the last closed shift to carry over its totals
            $lastShift = OfficeShift::where('status', 'closed')
                ->orderBy('ended_at', 'desc')
                ->first();

            $startCash = 0;
            $startCard = 0;
            $startCashBreakdown = null;

            if ($lastShift) {
                $startCash = (float) ($lastShift->total_cash ?? 0);
                $startCard = (float) ($lastShift->total_card ?? 0);
                $startCashBreakdown = $lastShift->end_of_shift_cash_breakdown;
            }

            $shift = OfficeShift::create([
                'started_by' => $user->id,
                'started_at' => now(),
                'status' => 'open',
                'cash_total' => 0,
                'card_total' => 0,
                'start_cash' => $startCash,
                'start_card' => $startCard,
                'start_cash_breakdown' => $startCashBreakdown,
                'total_cash' => $startCash,
                'total_card' => $startCard,
            ]);

            // Add the starter as a worker immediately
            OfficeShiftWorker::create([
                'office_shift_id' => $shift->id,
                'user_id' => $user->id,
                'role' => $user->role ?? 'staff',
            ]);

            return $shift;
        });
    }

    public function endShift(OfficeShift $office, ?string $notes, User $user): void
    {
        $finalBreakdown = OfficeShift::mergeBreakdowns(
            $office->start_cash_breakdown,
            $office->cash_breakdown
        );

        $office->update([
            'ended_at' => now(),
            'ended_by' => $user->id,
            'status' => 'closed',
            'notes' => $notes,
            'end_of_shift_cash_breakdown' => $finalBreakdown,
        ]);
    }

    public function recordSale(OfficeShift $office, array $data): OfficeShiftSale
    {
        return $this->saleService->recordOfficeSale($office, $data);
    }

    public function removeSale(OfficeShift $office, string $saleId): void
    {
        DB::transaction(function () use ($office, $saleId) {
            $sale = OfficeShiftSale::where('office_shift_id', $office->id)
                ->where('id', $saleId)
                ->first();

            if ($sale) {
                if ($sale->method === 'cash') {
                    $office->decrement('cash_total', $sale->amount);
                } else {
                    $office->decrement('card_total', $sale->amount);
                }

                $sale->delete();

                // Recalculate global breakdown
                $allCashSales = OfficeShiftSale::where('office_shift_id', $office->id)
                    ->where('method', 'cash')
                    ->get();

                $globalBreakdown = array_fill_keys(OfficeShift::DENOMINATIONS, 0);
                foreach ($allCashSales as $s) {
                    if ($s->breakdown && is_array($s->breakdown)) {
                        foreach (OfficeShift::DENOMINATIONS as $k) {
                            $globalBreakdown[$k] += ($s->breakdown[$k] ?? 0);
                        }
                    }
                }
                $office->cash_breakdown = $globalBreakdown;

                $office->refresh();
                $office->cash_breakdown = $globalBreakdown;
                $office->total_cash = (float) (($office->start_cash ?? 0) + ($office->cash_total ?? 0));
                $office->total_card = (float) (($office->start_card ?? 0) + ($office->card_total ?? 0));
                $office->save();
            }
        });
    }

    public function updateCashBreakdown(OfficeShift $office, array $data): void
    {
        $cleanBreakdown = [];
        foreach (OfficeShift::DENOMINATIONS as $k) {
            $val = $data['breakdown'][$k] ?? 0;
            $cleanBreakdown[$k] = max(0, intval($val));
        }

        $total = $office->totalFromBreakdown($cleanBreakdown);

        if (($data['target'] ?? 'current') === 'start') {
            $office->start_cash = (float) round($total, 2);
            $office->start_cash_breakdown = $cleanBreakdown;
        } else {
            $office->cash_breakdown = $cleanBreakdown;
        }

        $office->save();
        $this->syncTotals($office);
    }

    public function updateStartTotals(OfficeShift $office, float $cash, float $card): void
    {
        $office->start_cash = $cash;
        $office->start_card = $card;
        $office->save();
        $this->syncTotals($office);
    }

    public function updateSaleBreakdown(OfficeShift $office, string $saleId, array $breakdown): void
    {
        DB::transaction(function () use ($office, $saleId, $breakdown) {
            $sale = OfficeShiftSale::where('office_shift_id', $office->id)
                ->where('id', $saleId)
                ->firstOrFail();

            $cleanBreakdown = [];
            foreach (OfficeShift::DENOMINATIONS as $k) {
                $val = $breakdown[$k] ?? 0;
                $cleanBreakdown[$k] = max(0, intval($val));
            }

            $sale->breakdown = $cleanBreakdown;
            $sale->amount = $office->totalFromBreakdown($cleanBreakdown);
            $sale->save();

            // Recalculate the shift's global cash details
            $allCashSales = OfficeShiftSale::where('office_shift_id', $office->id)
                ->where('method', 'cash')
                ->get();

            $globalBreakdown = array_fill_keys(OfficeShift::DENOMINATIONS, 0);
            $totalCashSales = 0;
            foreach ($allCashSales as $s) {
                $totalCashSales += $s->amount;
                if ($s->breakdown && is_array($s->breakdown)) {
                    foreach (OfficeShift::DENOMINATIONS as $k) {
                        $globalBreakdown[$k] += ($s->breakdown[$k] ?? 0);
                    }
                }
            }

            $office->refresh();
            $office->cash_total = (float) $totalCashSales;
            $office->cash_breakdown = $globalBreakdown;
            $office->save();
            $this->syncTotals($office);
        });
    }

    protected function syncTotals(OfficeShift $office): void
    {
        $office->refresh();
        $office->total_cash = (float) (($office->start_cash ?? 0) + ($office->cash_total ?? 0));
        $office->total_card = (float) (($office->start_card ?? 0) + ($office->card_total ?? 0));
        $office->save();
    }
}
