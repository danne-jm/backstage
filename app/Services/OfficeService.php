<?php

namespace App\Services;

use App\Models\OfficeShift;
use App\Models\OfficeShiftWorker;
use App\Models\OfficeShiftSale;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OfficeService
{
    public function __construct(
        protected SaleService $saleService,
        protected FinancialLedgerService $financialLedgerService,
    ) {
    }

    public function startShift(User $user): OfficeShift
    {
        return DB::transaction(function () use ($user) {
            // Find the last closed shift to carry over its totals
            $lastShift = OfficeShift::where('status', 'closed')
                ->orderBy('ended_at', 'desc')
                ->first();

            $startCash = 0;
            $startCashBreakdown = null;

            if ($lastShift) {
                $startCash = (float) ($lastShift->total_cash ?? 0);
                $startCashBreakdown = $lastShift->end_of_shift_cash_breakdown;
            }

            // New shift card total always starts with all unclaimed orphaned online sales.
            // No date filtering — orphaned sales claim the first shift that becomes live.
            $orphanedCardSum = (float) \App\Models\OnlineSale::whereNull('office_shift_id')
                ->whereHas('transaction', function ($query) {
                    $query->where('payment_status', 'completed');
                })
                ->sum('amount');

            $shiftStartedAt = now();

            $shift = OfficeShift::create([
                'started_by' => $user->id,
                'started_at' => $shiftStartedAt,
                'status' => 'open',
                'cash_total' => 0,
                'card_total' => 0,
                'start_cash' => $startCash,
                'start_card' => $orphanedCardSum,
                'start_cash_breakdown' => $startCashBreakdown,
                'total_cash' => $startCash,
                'total_card' => $orphanedCardSum,
            ]);

            // Claim orphans immediately — uses the same date-filtered logic so only
            // sales belonging to this shift (none claimed by any earlier shift) are linked.
            $this->saleService->claimStrayOnlineSales($shift);

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

    public function claimStrayOnlineSales(OfficeShift $office): void
    {
        $this->saleService->claimStrayOnlineSales($office);
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

                $this->saleService->restoreStock($sale);

                $this->financialLedgerService->recordOfficeSaleRemoved($sale, $office, 'removed');

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

    public function updateSaleVariant(OfficeShift $office, string $saleId, string $variantId): void
    {
        DB::transaction(function () use ($office, $saleId, $variantId) {
            $sale = OfficeShiftSale::where('office_shift_id', $office->id)
                ->where('id', $saleId)
                ->firstOrFail();

            $snapshot = $sale->snapshot;
            $oldVariantId = $snapshot['variant_id'] ?? null;

            if ($oldVariantId === $variantId) {
                return; // No change
            }

            $newVariant = \App\Models\SellableVariant::lockForUpdate()->findOrFail($variantId);

            // Check capacity on the new variant (the old sale still counts toward oldVariant,
            // but the snapshot update below re-points it to newVariant, so we check new + 1
            // against new capacity while the old one is freed implicitly).
            if ($newVariant->quantity !== null && $newVariant->computedSoldCount() + 1 > $newVariant->quantity) {
                throw \Illuminate\Validation\ValidationException::withMessages(['stock' => "Selected variant is sold out."]);
            }

            // Update snapshot
            $snapshot['variant_id'] = $newVariant->id;
            $snapshot['variant_options'] = $newVariant->options;
            $sale->snapshot = $snapshot;
            $sale->save();
        });
    }

    public function syncTotals(OfficeShift $office): void
    {
        $office->refresh();
        $office->total_cash = (float) (($office->start_cash ?? 0) + ($office->cash_total ?? 0));
        $office->total_card = (float) (($office->start_card ?? 0) + ($office->card_total ?? 0));
        $office->save();
    }
}
