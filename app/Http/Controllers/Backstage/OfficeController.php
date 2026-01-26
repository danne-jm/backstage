<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OfficeShiftWorker;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OfficeController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(Request $request)
    {
        $cacheKey = 'office_dashboard_index';

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 10, function () {
            // Load active shift with relations to prevent N+1 issues
            $activeShift = OfficeShift::with(['workers.user'])
                ->where('status', 'open')
                ->orderBy('started_at', 'desc')
                ->first();

            $lastShift = OfficeShift::with(['workers.user', 'sales.product', 'sales.event'])
                ->where('status', 'closed')
                ->orderBy('ended_at', 'desc')
                ->first();

            $sellables = $this->inventoryService->getAllSellables();
            $products = Product::withCount(['sales', 'onlineSales'])->orderBy('name')->get();

            // Format Active Shift for Frontend
            $activeData = null;
            if ($activeShift) {
                $activeData = $activeShift->toArray();
                // Map workers relation to simple array for frontend
                $activeData['workers'] = $activeShift->workers->map(fn ($w) => [
                    'id' => $w->user->id,
                    'name' => $w->user->name,
                    'role' => $w->role,
                    'email' => $w->user->email,
                ]);
            }

            // Format Last Shift for Frontend
            $lastShiftData = null;
            if ($lastShift) {
                $lastShiftData = $lastShift->toArray();
                $lastShiftData['workers'] = $lastShift->workers->map(fn ($w) => [
                    'id' => $w->user->id,
                    'name' => $w->user->name,
                    'role' => $w->role,
                ]);
                $lastShiftData['sales'] = $lastShift->sales->map(function ($sale) {
                    $snap = $sale->snapshot ?? [];
                    $snap['id'] = $sale->id;
                    $snap['breakdown'] = $sale->breakdown; // Add breakdown to the response

                    return $snap;
                })->sortByDesc('created_at')->values()->all();
            }

            $pastShifts = OfficeShift::with(['workers.user'])
                ->whereNotNull('ended_at')
                ->orderBy('ended_at', 'desc')
                ->limit(10)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'started_at' => $s->started_at,
                    'ended_at' => $s->ended_at,
                    'status' => $s->status,
                    'total_cash' => $s->total_cash,
                    'total_card' => $s->total_card,
                    'workers' => $s->workers->map(fn ($w) => [
                        'id' => $w->user->id,
                        'name' => $w->user->name,
                    ]),
                ]);

            $staffCollection = User::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'role', 'email']);
            $staff = $staffCollection->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->role,
                'email' => $u->email,
            ])->toArray();

            return [
                'activeShift' => $activeData,
                'lastShift' => $lastShiftData,
                'products' => $products,
                'sellables' => $sellables,
                'pastShifts' => $pastShifts,
                'denominations' => OfficeShift::DENOMINATIONS,
                'staff' => $staff,
            ];
        });

        return Inertia::render('Backstage/office', $data);
    }

    public function show(OfficeShift $office)
    {
        // Eager load everything needed
        $office->load(['workers.user', 'sales.product', 'sales.event', 'sales']);

        $staffCollection = User::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'role', 'email']);
        $staff = $staffCollection->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'role' => $u->role,
            'email' => $u->email,
        ])->toArray();

        $sellables = $this->inventoryService->getAllSellables();
        $products = Product::withCount(['sales', 'onlineSales'])->orderBy('name')->get();

        // Calculate previous shift totals
        $previousShift = OfficeShift::where('status', 'closed')->where('id', '<', $office->id)->orderBy('id', 'desc')->first();
        $previousTotals = [
            'cash' => $previousShift ? ($previousShift->total_cash) : 0,
            'card' => $previousShift ? ($previousShift->total_card) : 0,
            'combined' => 0,
        ];
        $previousTotals['combined'] = $previousTotals['cash'] + $previousTotals['card'];

        // Format current shift data for frontend
        $activeArray = $office->toArray();

        // Transform Workers Relation -> Frontend Array
        $activeArray['workers'] = $office->workers->map(fn ($w) => [
            'id' => $w->user->id,
            'name' => $w->user->name,
            'role' => $w->role,
            'email' => $w->user->email,
        ])->values()->all();

        // Transform Sales Relation -> Frontend Array (retaining snapshot data usually preferred for receipts)
        $officeSales = $office->sales->map(function ($sale) {
            $snap = $sale->snapshot ?? [];
            $snap['id'] = $sale->id;
            $snap['breakdown'] = $sale->breakdown;
            $snap['source'] = 'office'; // Mark as office sale

            return $snap;
        });

        // Get store OnlineSales since the last closed shift (sales without an OfficeShiftSale link)
        // We find the last closed shift's ended_at to determine the cutoff time
        $lastClosedShift = OfficeShift::where('status', 'closed')
            ->orderBy('ended_at', 'desc')
            ->first();

        $storeOnlineSalesQuery = \App\Models\OnlineSale::with(['product', 'event', 'transaction'])
            ->whereDoesntHave('transaction', function ($query) {
                // Only include online sales from store (those with a transaction)
            })
            ->orWhereHas('transaction'); // Sales with a transaction are from the store

        // Actually, let's query for OnlineSales that have a transaction (store purchases)
        // and were created after the last closed shift
        $storeOnlineSales = \App\Models\OnlineSale::with(['product', 'event'])
            ->whereNotNull('online_transaction_id') // Has a transaction = came from store
            ->when($lastClosedShift, function ($query) use ($lastClosedShift) {
                $query->where('sold_at', '>', $lastClosedShift->ended_at);
            })
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => 'online-'.$sale->id,
                    'item_type' => $sale->product_id ? 'product' : 'event',
                    'name' => $sale->product?->name ?? $sale->event?->name ?? 'Unknown Item',
                    'price' => $sale->amount,
                    'method' => 'card',
                    'amount' => $sale->amount,
                    'sold_by' => 'Store - SumUp',
                    'sold_at' => $sale->sold_at?->toIso8601String(),
                    'created_at' => $sale->created_at?->toIso8601String(),
                    'ticket_type' => $sale->ticket_type,
                    'ticket_label' => $sale->ticket_type === 'with_card' ? 'With ESNcard' : ($sale->ticket_type === 'without_card' ? 'Without ESNcard' : null),
                    'source' => 'store',
                    'reference_id' => $sale->reference_id,
                    'description' => 'Online Sale #'.$sale->reference_id,
                    'breakdown' => null,
                ];
            });

        // Merge office sales and store online sales, then sort by created_at desc
        $allSales = $officeSales->concat($storeOnlineSales)
            ->sortByDesc('created_at')
            ->values()
            ->all();

        $activeArray['sales'] = $allSales;

        // Calculate store card total to include in the display
        $storeCardTotal = $storeOnlineSales->sum('amount');
        $activeArray['store_card_total'] = $storeCardTotal;

        if ($office->started_by) {
            $u = User::find($office->started_by);
            $activeArray['started_by_email'] = $u ? $u->email : null;
        }

        return Inertia::render('Backstage/office-shift', [
            'staff' => $staff,
            'products' => $products,
            'sellables' => $sellables,
            'activeShift' => $activeArray,
            'previousTotals' => $previousTotals,
        ]);
    }

    public function start(Request $request)
    {
        if (OfficeShift::where('status', 'open')->exists()) {
            return redirect()->route('office')->withErrors(['shift' => 'A shift is already open']);
        }

        $user = Auth::user();

        // Find the last closed shift to carry over its totals
        $lastShift = OfficeShift::where('status', 'closed')
            ->orderBy('ended_at', 'desc')
            ->first();

        $startCash = $lastShift ? $lastShift->total_cash : 0;
        $startCard = $lastShift ? $lastShift->total_card : 0;
        $startCashBreakdown = $lastShift ? $lastShift->end_of_shift_cash_breakdown : null;

        $shift = OfficeShift::create([
            'started_by' => $user->id,
            'started_at' => now(),
            'status' => 'open',
            'cash_total' => 0, // This is for sales during this shift
            'card_total' => 0, // This is for sales during this shift
            'start_cash' => $startCash,
            'start_card' => $startCard,
            'start_cash_breakdown' => $startCashBreakdown,
            // Initialize total_ fields with the starting amounts
            'total_cash' => $startCash,
            'total_card' => $startCard,
        ]);

        // Add the starter as a worker immediately via relation
        OfficeShiftWorker::create([
            'office_shift_id' => $shift->id,
            'user_id' => $user->id,
            'role' => $user->role ?? 'staff',
        ]);

        return redirect()->route('office.show', $shift);
    }

    public function addWorker(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['nullable', 'string'],
        ]);

        // Check if already exists
        $exists = OfficeShiftWorker::where('office_shift_id', $office->id)
            ->where('user_id', $validated['user_id'])
            ->exists();

        if (! $exists) {
            $user = User::find($validated['user_id']);
            OfficeShiftWorker::create([
                'office_shift_id' => $office->id,
                'user_id' => $validated['user_id'],
                'role' => $validated['role'] ?? $user->role ?? 'staff',
            ]);
        }

        return redirect()->route('office.show', $office);
    }

    public function removeWorker(Request $request, OfficeShift $office)
    {
        $request->validate(['user_id' => 'required']);

        OfficeShiftWorker::where('office_shift_id', $office->id)
            ->where('user_id', $request->user_id)
            ->delete();

        return redirect()->route('office.show', $office);
    }

    public function recordSale(Request $request, OfficeShift $office)
    {
        $data = $request->validate([
            'product_id' => ['nullable'],
            'item_type' => ['nullable', 'string'],
            'method' => ['required', 'in:cash,card'],
            'amount' => ['required', 'numeric'],
            'description' => ['nullable', 'string'],
            'ticket_type' => ['nullable', 'string'],
            'ticket_label' => ['nullable', 'string'],
            'breakdown' => ['nullable', 'array'],
            'is_manual_entry' => ['nullable', 'boolean'],
        ]);

        $itemType = $data['item_type'] ?? 'product';
        $isManualEntry = $data['is_manual_entry'] ?? false;
        $itemName = 'Custom Sale';
        $itemPrice = $data['amount'];
        $itemDescription = $data['description'] ?? null;
        $eventId = null;
        $productId = null;

        if ($itemType === 'event' && ! empty($data['product_id'])) {
            $event = Event::find($data['product_id']);
            if ($event) {
                if ($event->variable_amount) {
                    $ticketType = $data['ticket_type'] ?? null;
                    if ($ticketType === 'with_card' && $event->remaining_with_card === 0) {
                        if (request()->wantsJson()) {
                            return response()->json(['errors' => ['stock' => ['Tickets with ESNcard for this event are sold out.']]], 422);
                        }

                        return redirect()->back()->withErrors(['sold_out' => 'Tickets with ESNcard for this event are sold out.']);
                    }
                    if ($ticketType === 'without_card' && $event->remaining_without_card === 0) {
                        if (request()->wantsJson()) {
                            return response()->json(['errors' => ['stock' => ['Tickets without ESNcard for this event are sold out.']]], 422);
                        }

                        return redirect()->back()->withErrors(['sold_out' => 'Tickets without ESNcard for this event are sold out.']);
                    }
                } else { // Not variable amount
                    if ($event->remaining === 0) {
                        if (request()->wantsJson()) {
                            return response()->json(['errors' => ['stock' => ['This event is sold out.']]], 422);
                        }

                        return redirect()->back()->withErrors(['sold_out' => 'This event is sold out.']);
                    }
                }

                $itemName = $event->name;
                $itemDescription = $event->description;
                $eventId = $event->id;
            }
        } elseif ($itemType === 'product' && ! empty($data['product_id'])) {
            $product = Product::find($data['product_id']);
            if ($product) {
                if ($product->remaining === 0) {
                    if (request()->wantsJson()) {
                        return response()->json(['errors' => ['stock' => ['This product is sold out.']]], 422);
                    }

                    return redirect()->back()->withErrors(['sold_out' => 'This product is sold out.']);
                }
                $itemName = $product->name;
                $itemDescription = $product->description;
                $productId = $product->id;
            }
        }

        $snapshot = [
            'item_type' => $itemType,
            'name' => $itemName,
            'price' => $itemPrice,
            'method' => $data['method'],
            'amount' => $data['amount'],
            'description' => $data['description'] ?? '',
            'sold_by' => ($itemType === 'custom' || $isManualEntry) ? 'Custom - '.(Auth::user()->name ?? 'unknown') : (Auth::user()->name ?? 'unknown'),
            'sold_at' => now()->toIso8601String(),
            'created_at' => now()->toIso8601String(),
            'ticket_type' => $data['ticket_type'] ?? null,
            'ticket_label' => $data['ticket_label'] ?? null,
            'is_manual_entry' => $isManualEntry,
        ];

        $saleBreakdown = ($data['method'] === 'cash' && isset($data['breakdown'])) ? $data['breakdown'] : null;

        $sale = OfficeShiftSale::create([
            'office_shift_id' => $office->id,
            'product_id' => $productId,
            'event_id' => $eventId,
            'method' => $data['method'],
            'amount' => $data['amount'],
            'description' => $data['description'] ?? '',
            'sold_by' => Auth::id(),
            'sold_at' => now(),
            'snapshot' => $snapshot,
            'breakdown' => $saleBreakdown,
        ]);

        if ($data['method'] === 'cash') {
            $office->increment('cash_total', $data['amount']);
            if ($saleBreakdown) {
                $office->cash_breakdown = OfficeShift::mergeBreakdowns($office->cash_breakdown, $saleBreakdown);
                $office->save();
            }
        } else {
            $office->increment('card_total', $data['amount']);
        }

        $this->recalculateTotals($office);

        // Dispatch realtime event for office page listeners
        \App\Events\OfficeSaleCreated::dispatch($office->id, $sale);

        // Dispatch inventory update event if stock was affected
        if ($productId) {
            $product = Product::find($productId);
            if ($product) {
                \App\Events\InventoryUpdated::dispatch($product->id, 'product', $product->remaining);
            }
        } elseif ($eventId) {
            $event = Event::find($eventId);
            if ($event) {
                \App\Events\InventoryUpdated::dispatch($event->id, 'event', $event->remaining, $event->remaining_with_card, $event->remaining_without_card);
            }
        }

        return redirect()->route('office.show', $office);
    }

    public function removeSale(Request $request, OfficeShift $office)
    {
        $validated = $request->validate(['sale_id' => 'required']);

        $sale = OfficeShiftSale::where('office_shift_id', $office->id)
            ->where('id', $validated['sale_id'])
            ->first();

        if ($sale) {
            // For manual card entries, also delete the corresponding OnlineSale if it exists
            if ($sale->method === 'card' && isset($sale->snapshot['is_manual_entry']) && $sale->snapshot['is_manual_entry']) {
                // Try to find and delete the corresponding OnlineSale
                // Match by amount, product_id/event_id, and sold_at time (within a small window)
                $onlineSale = \App\Models\OnlineSale::where('amount', $sale->amount)
                    ->when($sale->product_id, fn ($q) => $q->where('product_id', $sale->product_id))
                    ->when($sale->event_id, fn ($q) => $q->where('event_id', $sale->event_id))
                    ->whereBetween('sold_at', [
                        $sale->sold_at->subSeconds(5),
                        $sale->sold_at->addSeconds(5),
                    ])
                    ->first();

                if ($onlineSale) {
                    $onlineSale->delete();
                }
            }

            // Revert totals
            if ($sale->method === 'cash') {
                $office->decrement('cash_total', $sale->amount);
            } else {
                $office->decrement('card_total', $sale->amount);
            }

            $sale->delete();

            $office->refresh();
            $this->recalculateTotals($office);
        }

        return redirect()->route('office.show', $office);
    }

    public function updateStartTotals(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'cash' => ['required', 'numeric', 'min:0'],
            'card' => ['required', 'numeric', 'min:0'],
        ]);

        $office->update([
            'start_cash' => $validated['cash'],
            'start_card' => $validated['card'],
        ]);

        $this->recalculateTotals($office);

        return redirect()->route('office.show', $office);
    }

    public function updateCashBreakdown(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'target' => ['nullable', 'string', 'in:start,current'],
            'breakdown' => ['required', 'array'],
        ]);

        // FIX 3: Robustly read breakdown input from nested array or flat
        $inputBreakdown = $request->input('breakdown');

        $cleanBreakdown = [];
        foreach (OfficeShift::DENOMINATIONS as $k) {
            $val = $inputBreakdown[$k] ?? 0;
            $cleanBreakdown[$k] = max(0, intval($val));
        }

        $total = $office->totalFromBreakdown($cleanBreakdown);

        if (($validated['target'] ?? 'current') === 'start') {
            $office->start_cash = round($total, 2);
            $office->start_cash_breakdown = $cleanBreakdown;
        } else {
            // BUG FIX: Merge the new breakdown with the existing one instead of overwriting.
            $office->cash_breakdown = OfficeShift::mergeBreakdowns(
                $office->cash_breakdown,
                $cleanBreakdown
            );
        }

        // Force explicit save of JSON columns
        $office->save();

        $this->recalculateTotals($office);

        return redirect()->route('office.show', $office);
    }

    protected function recalculateTotals(OfficeShift $office)
    {
        $office->refresh(); // Ensure we have latest data
        $office->total_cash = ($office->start_cash ?? 0) + ($office->cash_total ?? 0);
        $office->total_card = ($office->start_card ?? 0) + ($office->card_total ?? 0);
        $office->save();
    }

    public function destroy(OfficeShift $office)
    {
        $office->delete();

        return redirect()->route('office');
    }

    public function end(Request $request, OfficeShift $office)
    {
        // 1. Identify OnlineSales that occurred during this shift (since last closed shift)
        $lastClosedShift = OfficeShift::where('status', 'closed')
            ->where('id', '!=', $office->id)
            ->orderBy('ended_at', 'desc')
            ->first();

        $fromDate = $lastClosedShift ? $lastClosedShift->ended_at : $office->started_at;

        // Fetch online sales that happened in this window
        // (Where transaction exists = came from store)
        $onlineSales = \App\Models\OnlineSale::with(['product', 'event'])
            ->whereNotNull('online_transaction_id')
            ->where('sold_at', '>', $fromDate)
            ->where('sold_at', '<=', now())
            ->get();

        foreach ($onlineSales as $onlineSale) {
            // Avoid duplicates: Check if we already created a sale for this online_sale_id
            $exists = OfficeShiftSale::where('office_shift_id', $office->id)
                ->whereJsonContains('snapshot->online_sale_id', $onlineSale->id)
                ->exists();

            if (! $exists) {
                // Create OfficeShiftSale
                $itemType = $onlineSale->product_id ? 'product' : 'event';
                $name = $onlineSale->product?->name ?? $onlineSale->event?->name ?? 'Unknown Item';
                $description = 'Online Sale #'.$onlineSale->reference_id;

                $snapshot = [
                    'item_type' => $itemType,
                    'name' => $name,
                    'price' => $onlineSale->amount,
                    'method' => 'card',
                    'amount' => $onlineSale->amount,
                    'description' => $description,
                    // Use a special indicator for sold_by so it displays correctly
                    'sold_by' => 'Store - SumUp',
                    'sold_at' => $onlineSale->sold_at->toIso8601String(),
                    'created_at' => $onlineSale->created_at->toIso8601String(),
                    'ticket_type' => $onlineSale->ticket_type,
                    'source' => 'store', // Important for filtering/display
                    'online_sale_id' => $onlineSale->id,
                    'reference_id' => $onlineSale->reference_id,
                ];

                OfficeShiftSale::create([
                    'office_shift_id' => $office->id,
                    'product_id' => $onlineSale->product_id,
                    'event_id' => $onlineSale->event_id,
                    'method' => 'card', // Online is always card/digital money
                    'amount' => $onlineSale->amount,
                    'description' => $description,
                    // Assign to the user closing the shift, or the starter?
                    // We'll use the current user (closer) as the 'record creator',
                    // but the snapshot 'sold_by' handles the display name.
                    'sold_by' => Auth::id() ?? $office->started_by,
                    'sold_at' => $onlineSale->sold_at,
                    'snapshot' => $snapshot,
                    'breakdown' => null,
                ]);

                // Increment card total for the shift
                $office->increment('card_total', $onlineSale->amount);
            }
        }

        // Recalculate totals after adding online sales
        $this->recalculateTotals($office);

        $finalBreakdown = OfficeShift::mergeBreakdowns(
            $office->start_cash_breakdown,
            $office->cash_breakdown
        );

        $office->update([
            'ended_at' => now(),
            'status' => 'closed',
            'notes' => $request->input('notes'),
            'end_of_shift_cash_breakdown' => $finalBreakdown,
        ]);

        return redirect()->route('office');
    }

    public function reopen(Request $request, OfficeShift $office)
    {
        $office->update(['status' => 'open', 'ended_at' => null]);

        return redirect()->route('office.show', $office);
    }

    public function updateSale(Request $request, OfficeShift $office)
    {
        if ($office->status === 'closed') {
            return redirect()->back()->withErrors(['shift' => 'Cannot update a sale on a closed shift.']);
        }

        $validated = $request->validate([
            'sale_id' => ['required', 'exists:office_shift_sales,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'breakdown' => ['required', 'array'],
        ]);

        $sale = OfficeShiftSale::find($validated['sale_id']);

        if (! $sale || $sale->office_shift_id !== $office->id) {
            return redirect()->back()->withErrors(['sale' => 'Sale not found in this shift.']);
        }

        $originalAmount = $sale->amount;
        $newAmount = $validated['amount'];
        $amountDifference = $newAmount - $originalAmount;

        $sale->amount = $newAmount;
        $sale->breakdown = $validated['breakdown'];
        $sale->snapshot = array_merge($sale->snapshot, ['amount' => $newAmount]);
        $sale->save();

        $office->cash_total += $amountDifference;

        $allCashSales = $office->sales()->where('method', 'cash')->get();
        $newShiftBreakdown = [];
        foreach ($allCashSales as $cashSale) {
            if ($cashSale->breakdown) {
                $newShiftBreakdown = OfficeShift::mergeBreakdowns($newShiftBreakdown, $cashSale->breakdown);
            }
        }
        $office->cash_breakdown = $newShiftBreakdown;

        $office->save();

        $this->recalculateTotals($office);

        return redirect()->route('office.show', $office);
    }
}
