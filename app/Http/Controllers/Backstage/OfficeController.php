<?php

namespace App\Http\Controllers\Backstage;

use App\Actions\Backstage\ProcessPosSaleAction;
use App\DTOs\Sales\SaleLinePayload;
use App\DTOs\Sales\TransactionPayload;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\EndShiftRequest;
use App\Http\Requests\Backstage\RecordPosSaleRequest;
use App\Http\Requests\Backstage\StartShiftRequest;
use App\Models\Event;
use App\Models\OfficeShift;
use App\Models\OfficeShiftWorker;
use App\Models\Product;
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

        $lastClosed = OfficeShift::where('status', 'closed')
            ->with(['starter', 'workers.user'])
            ->latest('ended_at')
            ->first();

        if ($currentShift) {
            // Build the POS live feed: physical POS sales for this shift +
            // any online sales completed since the last closed shift.
            $startTime = $lastClosed->ended_at ?? now()->startOfDay();

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
                ->map(function (Transaction $t): array {
                    return [
                        'id' => $t->id,
                        'channel' => $t->channel,
                        'status' => $t->status,
                        'payment_method' => $t->payment_method,
                        'total_amount' => $t->total_amount,
                        'completed_at' => $t->completed_at?->toIso8601String(),
                        'customer_email' => $t->customer_email,
                        'sales' => $t->sales->map(function ($s): array {
                            return [
                                'id' => $s->id,
                                'name' => $s->snapshot['name'] ?? $s->purchasable?->name ?? 'Unknown',
                                'quantity' => $s->quantity,
                                'subtotal' => $s->subtotal,
                                'ticket_type' => $s->ticket_type,
                            ];
                        })->all(),
                    ];
                })->all();
        }

        $sellables = $this->getSellables();

        $allShifts = OfficeShift::with(['starter', 'workers.user'])
            ->latest('started_at')
            ->paginate(10);

        return Inertia::render('backstage/office/index', [
            'current_shift' => $currentShift ? [
                'id' => $currentShift->id,
                'started_at' => $currentShift->started_at->toIso8601String(),
                'starter' => [
                    'id' => $currentShift->starter->id,
                    'name' => $currentShift->starter->first_name.' '.$currentShift->starter->last_name,
                ],
                'workers' => $currentShift->workers->map(fn ($w) => [
                    'id' => $w->user->id,
                    'name' => $w->user->first_name.' '.$w->user->last_name,
                ]),
                'start_cash_breakdown' => $currentShift->start_cash_breakdown,
                'expected_cash_total' => $currentShift->expected_cash_total,
            ] : null,
            'last_closed_shift' => $lastClosed ? [
                'id' => $lastClosed->id,
                'started_at' => $lastClosed->started_at->toIso8601String(),
                'ended_at' => $lastClosed->ended_at->toIso8601String(),
                'starter' => [
                    'id' => $lastClosed->starter->id,
                    'name' => $lastClosed->starter->first_name.' '.$lastClosed->starter->last_name,
                ],
                'workers' => $lastClosed->workers->map(fn ($w) => [
                    'id' => $w->user->id,
                    'name' => $w->user->first_name.' '.$w->user->last_name,
                ]),
                'start_cash_breakdown' => $lastClosed->start_cash_breakdown,
                'end_of_shift_cash_breakdown' => $lastClosed->end_of_shift_cash_breakdown,
                'expected_cash_total' => $lastClosed->expected_cash_total,
                'discrepancy_amount' => $lastClosed->discrepancy_amount,
            ] : null,
            'sellables' => $sellables,
            'transactions' => $transactions,
            'all_shifts' => $allShifts,
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
            $openingFloat = array_sum(array_column((array) $breakdown, 'total'));

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
        $actualCash = array_sum(array_column((array) $endBreakdown, 'total'));
        $discrepancy = $actualCash - (float) $shift->expected_cash_total;

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
     * Reopen a closed shift.
     */
    public function reopenShift(Request $request, OfficeShift $shift): RedirectResponse
    {
        if ($shift->status !== 'closed') {
            return back()->withErrors(['shift' => 'Only closed shifts can be reopened.']);
        }

        $shift->update([
            'status' => 'open',
            'ended_by' => null,
            'ended_at' => null,
            'end_of_shift_cash_breakdown' => null,
            'discrepancy_amount' => null,
        ]);

        return back()->with('success', 'Shift reopened successfully.');
    }

    /**
     * Add a worker to the current shift.
     */
    public function addWorker(Request $request, OfficeShift $shift): RedirectResponse
    {
        $request->validate(['user_id' => 'required|string|exists:users,id']);

        if ($shift->status !== 'open') {
            return back()->withErrors(['shift' => 'Cannot modify workers on a closed shift.']);
        }

        if (!$shift->workers()->where('user_id', $request->user_id)->exists()) {
            $shift->workers()->create([
                'user_id' => $request->user_id,
                'role' => 'worker',
            ]);
        }

        return back()->with('success', 'Worker added to shift.');
    }

    /**
     * Remove a worker from the current shift.
     */
    public function removeWorker(Request $request, OfficeShift $shift, string $userId): RedirectResponse
    {
        if ($shift->status !== 'open') {
            return back()->withErrors(['shift' => 'Cannot modify workers on a closed shift.']);
        }

        $shift->workers()->where('user_id', $userId)->delete();

        return back()->with('success', 'Worker removed from shift.');
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
        $saleLines = array_map(function (array $line): SaleLinePayload {
            // Server-side price validation
            if ($line['purchasable_id'] !== 'custom') {
                $sellableClass = $line['purchasable_type'] === 'App\\Models\\Event' ? \App\Models\Event::class : \App\Models\Product::class;
                $sellable = $sellableClass::find($line['purchasable_id']);
                if ($sellable) {
                    $expectedPrice = $sellable->price;
                    if (($line['ticket_type'] ?? 'regular') === 'with_membership' && $sellable->price_with_membership !== null) {
                        $expectedPrice = $sellable->price_with_membership;
                    } elseif (($line['ticket_type'] ?? 'regular') === 'regular' && $sellable->price_without_membership !== null) {
                        $expectedPrice = $sellable->price_without_membership;
                    }
                    
                    if (abs((float) $line['unit_price'] - (float) $expectedPrice) > 0.01 && !$sellable->variable_amount) {
                        abort(422, "Price mismatch for {$sellable->name}. Expected {$expectedPrice}, got {$line['unit_price']}.");
                    }
                }
            }

            return new SaleLinePayload(
                purchasableId: $line['purchasable_id'],
                purchasableType: $line['purchasable_type'],
                unitPrice: (float) $line['unit_price'],
                quantity: (int) $line['quantity'],
                subtotal: (float) $line['subtotal'],
                ticketType: $line['ticket_type'] ?? 'regular',
                variantId: $line['variant_id'] ?? null,
                snapshot: $line['snapshot'] ?? null,
                discountCodeUsed: $line['discount_code_used'] ?? null,
            );
        }, (array) $request->input('lines', []));

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

        DB::transaction(function () use ($transaction) {
            // Reverse the cash expected total if it was a cash transaction
            if ($transaction->payment_method === 'pos_cash') {
                $shift = $transaction->officeShift;
                if ($shift?->status === 'open') {
                    $cashNet = (float) $transaction->cash_tendered_amount - (float) $transaction->cash_change_amount;
                    $shift->decrement('expected_cash_total', $cashNet);
                }
            }

            // Remove related records to completely wipe the trail
            \App\Models\FinancialLedgerEntry::where('transaction_id', $transaction->id)->delete();

            foreach ($transaction->sales as $sale) {
                \App\Models\InventoryMovement::where('sale_id', $sale->id)->delete();
                $sale->delete();
            }

            $transaction->delete();
        });

        return back()->with('success', 'Sale completely removed and trail wiped.');
    }

    /**
     * Show a specific office shift.
     */
    public function show(OfficeShift $shift): Response
    {
        $shift->load(['starter', 'ender', 'workers.user']);

        $transactions = Transaction::with('sales.purchasable')
            ->where('office_shift_id', $shift->id)
            ->latest('completed_at')
            ->get()
            ->map(function (Transaction $t): array {
                return [
                    'id' => $t->id,
                    'channel' => $t->channel,
                    'status' => $t->status,
                    'payment_method' => $t->payment_method,
                    'total_amount' => $t->total_amount,
                    'completed_at' => $t->completed_at?->toIso8601String(),
                    'customer_email' => $t->customer_email,
                    'sales' => $t->sales->map(function ($s): array {
                        return [
                            'id' => $s->id,
                            'name' => $s->snapshot['name'] ?? $s->purchasable?->name ?? 'Unknown',
                            'quantity' => $s->quantity,
                            'subtotal' => $s->subtotal,
                            'ticket_type' => $s->ticket_type,
                        ];
                    })->all(),
                ];
            })->all();

        return Inertia::render('backstage/office/show', [
            'shift' => [
                'id' => $shift->id,
                'started_at' => $shift->started_at->toIso8601String(),
                'ended_at' => $shift->ended_at?->toIso8601String(),
                'status' => $shift->status,
                'starter' => [
                    'id' => $shift->starter->id,
                    'name' => $shift->starter->first_name.' '.$shift->starter->last_name,
                    'role' => 'Started by',
                ],
                'ender' => $shift->ender ? [
                    'id' => $shift->ender->id,
                    'name' => $shift->ender->first_name.' '.$shift->ender->last_name,
                ] : null,
                'workers' => $shift->workers->map(fn ($w) => [
                    'id' => $w->user->id,
                    'name' => $w->user->first_name.' '.$w->user->last_name,
                    'role' => $w->role,
                    'system_role' => $w->user->role,
                ]),
                'start_cash_breakdown' => $shift->start_cash_breakdown,
                'end_of_shift_cash_breakdown' => $shift->end_of_shift_cash_breakdown,
                'expected_cash_total' => $shift->expected_cash_total,
                'discrepancy_amount' => $shift->discrepancy_amount,
                'notes' => $shift->notes,
            ],
            'transactions' => $transactions,
            'sellables' => $this->getSellables(),
            'all_users' => User::orderBy('first_name')->get()->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->first_name.' '.$u->last_name,
                'title' => $u->role,
            ]),
        ]);
    }

    private function getSellables()
    {
        $cutoff = now()->subDays(2);

        $filter = function ($query) use ($cutoff) {
            $query->whereNull('end_sell_date')
                  ->orWhere('end_sell_date', '>=', $cutoff);
        };

        return collect()
            ->merge(Product::where($filter)->get()->map(function ($p) { $p->sellable_type = 'product'; return $p; }))
            ->merge(Event::where($filter)->get()->map(function ($e) { $e->sellable_type = 'event'; return $e; }))
            ->sortBy(function ($s) {
                if ($s->sellable_type === 'product') {
                    return '0_' . $s->name;
                }
                return '1_' . ($s->start_sell_date ? $s->start_sell_date->timestamp : 0);
            })
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'type' => get_class($s),
                    'name' => $s->getName(),
                    'description' => $s->getDescription(),
                    'price' => $s->getPrice(),
                    'price_with_membership' => $s->price_with_membership,
                    'price_without_membership' => $s->price_without_membership,
                    'variable_amount' => $s->variable_amount,
                    'is_variant_based' => $s->is_variant_based,
                    'variants' => $s->variants,
                    'start_sell_date' => $s->start_sell_date?->toIso8601String(),
                    'end_sell_date' => $s->end_sell_date?->toIso8601String(),
                ];
            })
            ->values();
    }
}
