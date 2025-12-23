<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OfficeShiftWorker;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OfficeController extends Controller
{
    public function index(Request $request)
    {
        // Load active shift with relations to prevent N+1 issues
        $activeShift = OfficeShift::with(['workers.user'])
            ->where('status', 'open')
            ->orderBy('started_at', 'desc')
            ->first();

        $lastShift = OfficeShift::with(['workers.user', 'sales'])
            ->where('status', 'closed')
            ->orderBy('ended_at', 'desc')
            ->first();

        // Prepare products/events list
        $products = Product::orderBy('name')->get();

        // FIX 1: Include events with NULL end_sell_date (indefinite sales)
        $events = Event::where(function ($query) {
            $query->where('end_sell_date', '>=', now())
                ->orWhereNull('end_sell_date');
        })
            ->orderBy('event_date', 'asc')
            ->get();

        $sellables = collect([]);
        foreach ($products as $product) {
            $sellables->push([
                'id' => 'product_'.$product->id,
                'type' => 'product',
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
            ]);
        }
        foreach ($events as $event) {
            $sellables->push([
                'id' => 'event_'.$event->id,
                'type' => 'event',
                'name' => $event->name,
                'description' => $event->description,
                'event_date' => $event->event_date,
                'start_sell_date' => $event->start_sell_date,
                'end_sell_date' => $event->end_sell_date,
                'price_with_card' => $event->price_with_card,
                'price_without_card' => $event->price_without_card,
            ]);
        }

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
        }

        $pastShifts = OfficeShift::whereNotNull('ended_at')
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
            ]);

        return Inertia::render('office', [
            'activeShift' => $activeData,
            'lastShift' => $lastShiftData,
            'products' => $products,
            'sellables' => $sellables,
            'pastShifts' => $pastShifts,
            'denominations' => OfficeShift::DENOMINATIONS,
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

        $products = Product::orderBy('name')->get();
        // Same FIX for events query here
        $events = Event::where(function ($query) {
            $query->where('end_sell_date', '>=', now())
                ->orWhereNull('end_sell_date');
        })
            ->orderBy('event_date', 'asc')
            ->get();

        $sellables = collect([]);
        foreach ($products as $p) {
            $sellables->push(['id' => 'product_'.$p->id, 'actual_id' => $p->id, 'type' => 'product', 'name' => $p->name, 'price' => $p->price]);
        }
        foreach ($events as $e) {
            $sellables->push(['id' => 'event_'.$e->id, 'actual_id' => $e->id, 'type' => 'event', 'name' => $e->name, 'price_with_card' => $e->price_with_card, 'price_without_card' => $e->price_without_card]);
        }

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
            // Ensure ID is present in the object fed to the frontend
            $snap['id'] = $sale->id;

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

        $shift = OfficeShift::create([
            'started_by' => $user->id,
            'started_at' => now(),
            'status' => 'open',
            'cash_total' => 0,
            'card_total' => 0,
            // Initialize totals to prevent null issues later
            'total_cash' => 0,
            'total_card' => 0,
            'start_cash' => 0,
            'start_card' => 0,
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
        // FIX 2: Relaxed validation and explicit casting for the DB
        $data = $request->validate([
            'product_id' => ['nullable'], // Removed 'integer' to allow flexibility
            'item_type' => ['nullable', 'string'],
            'method' => ['required', 'in:cash,card'],
            'amount' => ['required', 'numeric'],
            'description' => ['nullable', 'string'],
            'ticket_type' => ['nullable', 'string'],
            'ticket_label' => ['nullable', 'string'],
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
                $itemName = $event->name;
                $itemDescription = $event->description;
                $eventId = $event->id;
            }
        } elseif ($itemType === 'product' && ! empty($data['product_id'])) {
            $product = Product::find($data['product_id']);
            if ($product) {
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
            'sold_at' => now()->toDateTimeString(),
            'created_at' => now()->toDateTimeString(),
            'ticket_type' => $data['ticket_type'] ?? null,
            'ticket_label' => $data['ticket_label'] ?? null,
        ];

        // Ensure database write happens safely
        $sale = OfficeShiftSale::create([
            'office_shift_id' => $office->id,
            'product_id' => $productId,
            'event_id' => $eventId,
            'method' => $data['method'],
            'amount' => $data['amount'],
            'description' => $data['description'] ?? $itemDescription,
            'sold_by' => Auth::id(), // Ensure this is the ID as expected by standard foreign keys
            'sold_at' => now(),
            'snapshot' => $snapshot,
        ]);

        // 3. Update Shift Totals
        if ($data['method'] === 'cash') {
            $office->increment('cash_total', $data['amount']);
        } else {
            $office->increment('card_total', $data['amount']);
        }

        $office->refresh();
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
            $office->cash_breakdown = $cleanBreakdown;
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
        $office->update([
            'ended_at' => now(),
            'status' => 'closed',
            'notes' => $request->input('notes'),
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
        return redirect()->route('office.show', $office);
    }
}
