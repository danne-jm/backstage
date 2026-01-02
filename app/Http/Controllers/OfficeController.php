<?php

namespace App\Http\Controllers;

use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OfficeShiftWorker;
use App\Models\Event;
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

        return Inertia::render('office', [
            'activeShift' => $activeData,
            'lastShift' => $lastShiftData,
            'products' => $products,
            'sellables' => $sellables,
            'pastShifts' => $pastShifts,
            'denominations' => OfficeShift::DENOMINATIONS,
            'staff' => $staff,
        ]);
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
        $activeArray['sales'] = $office->sales->map(function ($sale) {
            $snap = $sale->snapshot ?? [];
            $snap['id'] = $sale->id;
            $snap['breakdown'] = $sale->breakdown;

            return $snap;
        })->sortByDesc('created_at')->values()->all();

        if ($office->started_by) {
            $u = User::find($office->started_by);
            $activeArray['started_by_email'] = $u ? $u->email : null;
        }

        return Inertia::render('office-shift', [
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
        ]);

        $itemType = $data['item_type'] ?? 'product';
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
            'description' => $data['description'] ?? $itemDescription,
            'sold_by' => Auth::user()->email ?? 'unknown',
            'sold_at' => now()->toIso8601String(),
            'created_at' => now()->toIso8601String(),
            'ticket_type' => $data['ticket_type'] ?? null,
            'ticket_label' => $data['ticket_label'] ?? null,
        ];

        $saleBreakdown = ($data['method'] === 'cash' && isset($data['breakdown'])) ? $data['breakdown'] : null;

        $sale = OfficeShiftSale::create([
            'office_shift_id' => $office->id,
            'product_id' => $productId,
            'event_id' => $eventId,
            'method' => $data['method'],
            'amount' => $data['amount'],
            'description' => $data['description'] ?? $itemDescription,
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

        return redirect()->route('office.show', $office);
    }

    public function removeSale(Request $request, OfficeShift $office)
    {
        $validated = $request->validate(['sale_id' => 'required']);

        $sale = OfficeShiftSale::where('office_shift_id', $office->id)
            ->where('id', $validated['sale_id'])
            ->first();

        if ($sale) {
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
