<?php

namespace App\Http\Controllers\Backstage;

use App\Actions\Backstage\ProcessPosSaleAction;
use App\DTOs\Sales\SaleLinePayload;
use App\DTOs\Sales\TransactionPayload;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\EndShiftRequest;
use App\Http\Requests\Backstage\RecordPosSaleRequest;
use App\Http\Requests\Backstage\StartShiftRequest;
use App\Models\OfficeShift;
use App\Models\OfficeShiftWorker;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    /**
     * Show the office dashboard: active shift info + live transaction feed.
     */
    public function index(Request $request): Response
    {
        $currentShift = OfficeShift::where('status', 'open')
            ->with(['starter', 'workers.user'])
            ->latest()
            ->first();

        $transactions = collect();

        if ($currentShift) {
            // Build the POS live feed: physical POS sales for this shift +
            // any online sales completed since the last closed shift.
            $lastClosed = OfficeShift::where('status', 'closed')
                ->latest('ended_at')
                ->first();

            $startTime = $lastClosed?->ended_at ?? now()->startOfDay();

            $transactions = Transaction::with('sales.purchasable')
                ->where(function ($q) use ($currentShift, $startTime) {
                    $q->where('office_shift_id', $currentShift->id)
                        ->orWhere(function ($sq) use ($startTime) {
                            $sq->where('channel', 'online')
                                ->where('status', 'completed')
                                ->where('completed_at', '>=', $startTime);
                        });
                })
                ->latest('completed_at')
                ->get()
                ->map(fn (Transaction $t) => [
                    'id' => $t->id,
                    'channel' => $t->channel,
                    'status' => $t->status,
                    'payment_method' => $t->payment_method,
                    'total_amount' => $t->total_amount,
                    'completed_at' => $t->completed_at?->toIso8601String(),
                    'customer_email' => $t->customer_email,
                    'sales' => $t->sales->map(fn ($s) => [
                        'id' => $s->id,
                        'name' => $s->snapshot['name'] ?? $s->purchasable?->getName(),
                        'quantity' => $s->quantity,
                        'subtotal' => $s->subtotal,
                        'ticket_type' => $s->ticket_type,
                    ]),
                ]);
        }

        return Inertia::render('backstage/office/index', [
            'current_shift' => $currentShift ? [
                'id' => $currentShift->id,
                'started_at' => $currentShift->started_at->toIso8601String(),
                'starter' => [
                    'id' => $currentShift->starter->id,
                    'name' => $currentShift->starter->first_name.' '.$currentShift->starter->last_name,
                ],
                'start_cash_breakdown' => $currentShift->start_cash_breakdown,
                'expected_cash_total' => $currentShift->expected_cash_total,
            ] : null,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Open a new cash drawer shift.
     */
    public function startShift(StartShiftRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        // Prevent opening a second concurrent shift
        $activeShift = OfficeShift::where('status', 'open')->exists();
        if ($activeShift) {
            return back()->withErrors(['shift' => 'A shift is already open.']);
        }

        DB::transaction(function () use ($request, $user) {
            $breakdown = $request->input('start_cash_breakdown', []);
            $openingFloat = collect($breakdown)->sum('total');

            $shift = OfficeShift::create([
                'started_by' => $user->id,
                'started_at' => now(),
                'status' => 'open',
                'start_cash_breakdown' => $breakdown,
                'expected_cash_total' => $openingFloat,
            ]);

            // Register the opening user as the first worker on this shift
            OfficeShiftWorker::create([
                'office_shift_id' => $shift->id,
                'user_id' => $user->id,
                'role' => 'opener',
            ]);
        });

        return to_route('backstage.office.index')
            ->with('success', 'Shift started successfully.');
    }

    /**
     * Close the current shift with a final cash count.
     */
    public function endShift(EndShiftRequest $request, OfficeShift $shift): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if ($shift->status !== 'open') {
            return back()->withErrors(['shift' => 'This shift is already closed.']);
        }

        $endBreakdown = $request->input('end_of_shift_cash_breakdown', []);
        $actualCash = collect($endBreakdown)->sum('total');
        $discrepancy = $actualCash - $shift->expected_cash_total;

        $shift->update([
            'ended_by' => $user->id,
            'ended_at' => now(),
            'status' => 'closed',
            'end_of_shift_cash_breakdown' => $endBreakdown,
            'discrepancy_amount' => $discrepancy,
            'notes' => $request->input('notes'),
        ]);

        return to_route('backstage.office.index')
            ->with('success', 'Shift closed. Discrepancy: '.number_format($discrepancy, 2).'.');
    }

    /**
     * Record a POS (physical) sale on the current open shift.
     */
    public function recordSale(RecordPosSaleRequest $request, ProcessPosSaleAction $action): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $shift = OfficeShift::where('status', 'open')->firstOrFail();

        $paymentMethod = $request->string('payment_method')->toString();
        $saleLines = collect($request->input('lines', []))->map(fn (array $line) => new SaleLinePayload(
            purchasableId: $line['purchasable_id'],
            purchasableType: $line['purchasable_type'],
            unitPrice: (float) $line['unit_price'],
            quantity: (int) $line['quantity'],
            subtotal: (float) $line['subtotal'],
            ticketType: $line['ticket_type'] ?? 'regular',
            variantId: $line['variant_id'] ?? null,
            snapshot: $line['snapshot'] ?? null,
            discountCodeUsed: $line['discount_code_used'] ?? null,
        ))->all();

        $totalAmount = collect($saleLines)->sum('subtotal');

        $transactionPayload = new TransactionPayload(
            channel: 'pos',
            paymentMethod: $paymentMethod,
            totalAmount: $totalAmount,
            status: 'completed',
            officeShiftId: $shift->id,
            cashTenderedAmount: $paymentMethod === 'pos_cash' ? (float) $request->input('cash_tendered_amount') : null,
            cashChangeAmount: $paymentMethod === 'pos_cash' ? (float) $request->input('cash_change_amount') : null,
            cashTenderedBreakdown: $request->input('cash_tendered_breakdown'),
            cashChangeBreakdown: $request->input('cash_change_breakdown'),
        );

        $transaction = $action->handle($transactionPayload, $saleLines);

        // Update the shift's expected cash total if paying by cash
        if ($paymentMethod === 'pos_cash') {
            $cashReceived = (float) $request->input('cash_tendered_amount', 0);
            $cashChange = (float) $request->input('cash_change_amount', 0);
            $shift->increment('expected_cash_total', $cashReceived - $cashChange);
        }

        return back()->with('success', "Sale recorded (Transaction #{$transaction->id}).");
    }

    /**
     * Remove/void a POS sale from the current shift.
     */
    public function removeSale(Request $request, Transaction $transaction): RedirectResponse
    {
        if ($transaction->channel !== 'pos' || $transaction->status !== 'completed') {
            return back()->withErrors(['sale' => 'Only completed POS transactions can be voided.']);
        }

        // Reverse the cash expected total if it was a cash transaction
        if ($transaction->payment_method === 'pos_cash') {
            $shift = $transaction->officeShift;
            if ($shift?->status === 'open') {
                $cashNet = $transaction->cash_tendered_amount - $transaction->cash_change_amount;
                $shift->decrement('expected_cash_total', $cashNet);
            }
        }

        // Soft-void the transaction
        $transaction->update(['status' => 'refunded']);

        return back()->with('success', 'Sale voided successfully.');
    }
}
