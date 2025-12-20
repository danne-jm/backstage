<?php

namespace App\Http\Controllers;

use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OfficeController extends Controller
{
    public function index(Request $request)
    {
        // Overview dashboard: shows last shift info, products, and active shift status
        $activeShift = OfficeShift::where('status', 'open')->orderBy('started_at', 'desc')->first();
        $lastShift = OfficeShift::where('status', 'closed')->orderBy('ended_at', 'desc')->first();

        // Get both products and upcoming events for sellable items
        $products = Product::orderBy('name')->get();
        $events = \App\Models\Event::where('end_sell_date', '>=', now())
            ->orderBy('event_date', 'asc')
            ->get();

        // Combine products and events for the sellables list
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

        // Augment active shift with basic info if it exists
        $activeData = null;
        if ($activeShift) {
            $activeData = [
                'id' => $activeShift->id,
                'started_at' => $activeShift->started_at,
                'workers' => $activeShift->workers ?? [],
            ];
        }

        // Augment last shift with all details
        $lastShiftData = null;
        if ($lastShift) {
            $lastShiftData = [
                'id' => $lastShift->id,
                'started_at' => $lastShift->started_at,
                'ended_at' => $lastShift->ended_at,
                'workers' => $lastShift->workers ?? [],
                'sales' => $lastShift->sales ?? [],
                'start_cash' => $lastShift->start_cash ?? 0,
                'start_card' => $lastShift->start_card ?? 0,
                'total_cash' => $lastShift->total_cash ?? 0,
                'total_card' => $lastShift->total_card ?? 0,
            ];
        }

        // List of past (closed) shifts for the overview (most recent first)
        $pastShiftsQuery = OfficeShift::whereNotNull('ended_at')->orderBy('ended_at', 'desc')->get();
        $pastShifts = $pastShiftsQuery->map(function ($s) {
            return [
                'id' => $s->id,
                'started_at' => $s->started_at,
                'ended_at' => $s->ended_at,
                'workers' => $s->workers ?? [],
                'total_cash' => $s->total_cash ?? ($s->start_cash + ($s->cash_total ?? 0)),
                'total_card' => $s->total_card ?? ($s->start_card + ($s->card_total ?? 0)),
            ];
        })->toArray();

        return Inertia::render('office', [
            'activeShift' => $activeData,
            'lastShift' => $lastShiftData,
            'products' => $products,
            'sellables' => $sellables,
            'pastShifts' => $pastShifts,
        ]);
    }

    /**
     * Permanently delete an office shift and its related JSON snapshot.
     */
    public function destroy(OfficeShift $office)
    {
        // NOTE: this will also remove any OfficeShiftSale records if foreign keys are configured
        $office->delete();

        return redirect()->route('office');
    }

    public function show(OfficeShift $office)
    {
        // Active shift management page: shows workers, sales, revenue tracking
        // List all users as available staff
        $staffCollection = User::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'role', 'email']);

        $staff = $staffCollection->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
                'role' => $u->role ?? null,
                'email' => $u->email ?? null,
            ];
        })->toArray();

        // Get both products and upcoming events
        $products = Product::orderBy('name')->get();
        $events = \App\Models\Event::where('end_sell_date', '>=', now())
            ->orderBy('event_date', 'asc')
            ->get();

        // Combine products and events for sellables dropdown
        $sellables = collect([]);
        foreach ($products as $product) {
            $sellables->push([
                'id' => 'product_'.$product->id,
                'actual_id' => $product->id,
                'type' => 'product',
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
            ]);
        }
        foreach ($events as $event) {
            $sellables->push([
                'id' => 'event_'.$event->id,
                'actual_id' => $event->id,
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

        $previousShift = OfficeShift::where('status', 'closed')->orderBy('ended_at', 'desc')->first();

        $previousTotals = ['cash' => 0, 'card' => 0, 'combined' => 0];
        if ($previousShift) {
            // Use total_cash/total_card which includes start amounts + live revenue from previous shift
            $previousTotals['cash'] = $previousShift->total_cash ?? $previousShift->cash_total;
            $previousTotals['card'] = $previousShift->total_card ?? $previousShift->card_total;
            $previousTotals['combined'] = $previousTotals['cash'] + $previousTotals['card'];
        }

        // Augment active shift data with started_by email and ensure workers/sales arrays exist
        $startedByEmail = null;
        if ($office->started_by) {
            $u = User::find($office->started_by);
            $startedByEmail = $u ? $u->email : null;
        }

        $activeArray = $office->toArray();
        $activeArray['started_by_email'] = $startedByEmail;
        $activeArray['workers'] = $activeArray['workers'] ?? [];
        $activeArray['sales'] = $activeArray['sales'] ?? [];

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
        // Prevent starting a new shift when one is already open
        $open = OfficeShift::where('status', 'open')->exists();
        if ($open) {
            return redirect()->route('office')->withErrors(['shift' => 'A shift is already open']);
        }

        $user = Auth::user();

        $starter = [
            'id' => $user->id ?? null,
            'name' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
            'role' => $user->role ?? null,
            'email' => $user->email ?? null,
        ];

        $shift = OfficeShift::create([
            'started_by' => $user->id ?? null,
            'started_at' => now(),
            'status' => 'open',
            'workers' => [$starter],
            'sales' => [],
        ]);

        return redirect()->route('office.show', $shift);
    }

    public function addWorker(Request $request, OfficeShift $office)
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['nullable', 'string'],
        ]);

        $user = User::find($request->input('user_id'));
        if (! $user) {
            return redirect()->route('office.show', $office)->withErrors(['user' => 'User not found']);
        }

        $workers = $office->workers ?? [];

        // Prevent duplicates: remove existing entry for this user if present
        $workers = array_values(array_filter($workers, function ($w) use ($user) {
            return ! isset($w['id']) || $w['id'] !== $user->id;
        }));

        // Prepend new worker so they appear at the top
        array_unshift($workers, [
            'id' => $user->id,
            'name' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
            'role' => $request->input('role') ?? $user->role ?? null,
            'email' => $user->email ?? null,
        ]);

        $office->workers = $workers;
        $office->save();

        return redirect()->route('office.show', $office);
    }

    public function recordSale(Request $request, OfficeShift $office)
    {
        $data = $request->validate([
            'product_id' => ['nullable', 'integer'],
            'item_type' => ['nullable', 'string', 'in:product,event,custom'],
            'method' => ['required', 'string'],
            'amount' => ['required', 'numeric'],
            'description' => ['nullable', 'string'],
            'ticket_type' => ['nullable', 'string', 'in:with_card,without_card'],
            'ticket_label' => ['nullable', 'string'],
        ]);

        $method = strtolower($data['method']);
        if (! in_array($method, ['cash', 'card'], true)) {
            return redirect()->route('office.show', $office)->withErrors(['method' => 'Invalid payment method']);
        }

        // Check if it's a product, event, or custom sale
        $itemType = $data['item_type'] ?? 'product';
    $itemName = null;
    $itemPrice = null;
    $itemDescription = null;

        if ($itemType === 'custom') {
            // Custom sale: use description as name
            $itemName = 'Custom Sale';
            $itemPrice = $data['amount'];
            $itemDescription = $data['description'] ?? null;
        } elseif ($itemType === 'event') {
            $event = \App\Models\Event::find($data['product_id']);
            $itemName = $event ? $event->name : null;
            $itemPrice = $event ? $data['amount'] : null; // Use the selected price (with/without card)
            $itemDescription = $event ? ($event->description ?? null) : ($data['description'] ?? null);
        } else {
            $product = Product::find($data['product_id']);
            $itemName = $product ? $product->name : null;
            $itemPrice = $product ? $product->price : null;
            $itemDescription = $product ? ($product->description ?? null) : ($data['description'] ?? null);
        }

        // Persist sale: for events we store event_id, for products we store product_id, for custom we store null
        $user = Auth::user();

        $salePayload = [
            'office_shift_id' => $office->id,
            'method' => $method,
            'amount' => $data['amount'],
            // Persist a human-readable description: prefer explicit custom description, otherwise use product/event description when available
            'description' => $data['description'] ?? $itemDescription ?? null,
            'sold_by' => $user ? $user->id : null,
            'sold_at' => now(),
        ];

        if ($itemType === 'custom') {
            // Custom sale: no product or event reference
            $salePayload['product_id'] = null;
            $salePayload['event_id'] = null;
        } elseif ($itemType === 'event') {
            // store event reference and leave product_id null
            $salePayload['event_id'] = $data['product_id'];
            $salePayload['product_id'] = null;
        } else {
            $salePayload['product_id'] = $data['product_id'];
            $salePayload['event_id'] = null;
        }

        // Build snapshot entry for persistence on both the sale record and the office JSON
        $sales = $office->sales ?? [];
        $snapshot = [
            // id will be added after creating the sale record
            'item_type' => $itemType,
            'name' => $itemName,
            'price' => $itemPrice,
            'method' => $method,
            'amount' => $data['amount'],
            // snapshot description: prefer explicit description from request, otherwise use product/event description
            'description' => $data['description'] ?? $itemDescription ?? null,
            // include both id and email for ease on the frontend
            'sold_by_id' => $user ? $user->id : null,
            'sold_by' => $user ? ($user->email ?? null) : null,
            'sold_at' => now()->toDateTimeString(),
            'created_at' => now()->toDateTimeString(),
        ];

        if ($itemType === 'custom') {
            $snapshot['product_id'] = null;
            $snapshot['event_id'] = null;
        } elseif ($itemType === 'event') {
            $snapshot['event_id'] = $data['product_id'];
            if (isset($data['ticket_type'])) {
                $snapshot['ticket_type'] = $data['ticket_type'];
            }
            if (isset($data['ticket_label'])) {
                $snapshot['ticket_label'] = $data['ticket_label'];
            }
        } else {
            $snapshot['product_id'] = $data['product_id'];
        }

        // persist sale with snapshot
        $salePayload['snapshot'] = $snapshot;
        $sale = OfficeShiftSale::create($salePayload);

        // ensure snapshot has the sale id for the office JSON
        $snapshot['id'] = $sale->id;
        array_unshift($sales, $snapshot);

        $office->sales = $sales;
        $office->save();

        // update shift totals and calculate total money (start + live)
        if ($method === 'cash') {
            $office->increment('cash_total', $data['amount']);
            $office->refresh();
            $office->total_cash = $office->start_cash + $office->cash_total;
        } else {
            $office->increment('card_total', $data['amount']);
            $office->refresh();
            $office->total_card = $office->start_card + $office->card_total;
        }
        $office->save();

        return redirect()->route('office.show', $office);
    }

    public function removeWorker(Request $request, OfficeShift $office)
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $userId = $request->input('user_id');
        $workers = $office->workers ?? [];

        $workers = array_values(array_filter($workers, function ($w) use ($userId) {
            return ! isset($w['id']) || $w['id'] != $userId;
        }));

        $office->workers = $workers;
        $office->save();

        return redirect()->route('office.show', $office);
    }

    public function updateStartTotals(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'cash' => ['required', 'numeric', 'min:0'],
            'card' => ['required', 'numeric', 'min:0'],
        ]);

        $office->start_cash = $validated['cash'];
        $office->start_card = $validated['card'];

        // Recalculate total money (start + live)
        $office->total_cash = $validated['cash'] + $office->cash_total;
        $office->total_card = $validated['card'] + $office->card_total;

        $office->save();

        return redirect()->route('office.show', $office);
    }

    /**
     * Accept a breakdown of denominations and persist it. Depending on the "target"
     * parameter this will update either the start_cash (and start_cash_breakdown) or
     * the general cash_breakdown column. Returned redirect goes back to the office show view.
     */
    public function updateCashBreakdown(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'target' => ['required', 'string', 'in:start,current'],
            'breakdown' => ['required', 'array'],
        ]);

        $allowedKeys = ['50', '20', '10', '5', '2', '1', '0_50', '0_20', '0_10', 'token'];

        $breakdown = [];
        foreach ($allowedKeys as $k) {
            $breakdown[$k] = intval($request->input("breakdown.$k", 0));
            if ($breakdown[$k] < 0) {
                $breakdown[$k] = 0;
            }
        }

        // compute total in euros (tokens counted separately as 0 value)
        $total = 0.0;
        $values = [
            '50' => 50.0,
            '20' => 20.0,
            '10' => 10.0,
            '5' => 5.0,
            '2' => 2.0,
            '1' => 1.0,
            '0_50' => 0.5,
            '0_20' => 0.2,
            '0_10' => 0.1,
            'token' => 0.0,
        ];

        foreach ($values as $k => $v) {
            $total += ($breakdown[$k] ?? 0) * $v;
        }

        if ($validated['target'] === 'start') {
            $office->start_cash = round($total, 2);
            $office->start_cash_breakdown = $breakdown;
            $office->total_cash = $office->start_cash + ($office->cash_total ?? 0);
        } else {
            $office->cash_breakdown = $breakdown;
        }

        $office->save();

        return redirect()->route('office.show', $office);
    }

    public function removeSale(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'sale_id' => ['required', 'integer'],
        ]);

        $saleId = $validated['sale_id'];

        // Find and delete the sale record
        $sale = OfficeShiftSale::where('office_shift_id', $office->id)
            ->where('id', $saleId)
            ->first();

        if ($sale) {
            // Decrement the shift totals
            if (strtolower($sale->method) === 'cash') {
                $office->decrement('cash_total', $sale->amount);
            } else {
                $office->decrement('card_total', $sale->amount);
            }
            // Refresh to pick up updated cash_total/card_total from the DB
            $office->refresh();

            // Remove from the sales JSON array (do this after refresh so we don't overwrite changes)
            $sales = $office->sales ?? [];
            $sales = array_values(array_filter($sales, function ($s) use ($saleId) {
                return ! isset($s['id']) || $s['id'] != $saleId;
            }));
            $office->sales = $sales;

            // Recalculate total money (start + live) after removal
            $office->total_cash = $office->start_cash + ($office->cash_total ?? 0);
            $office->total_card = $office->start_card + ($office->card_total ?? 0);

            $office->save();

            // Delete the sale record
            $sale->delete();
        }

        // Return an Inertia-friendly redirect so Inertia router requests can follow the
        // response and update props correctly. This avoids the "plain JSON response"
        // Inertia modal while keeping the persistence fixes above.
        return redirect()->route('office.show', $office);
    }

    /**
     * Update an existing sale's amount/description. Adjusts shift totals and the JSON snapshot.
     */
    public function updateSale(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'sale_id' => ['required', 'integer'],
            'amount' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            // optional breakdown when editing a cash sale (denomination counts)
            'breakdown' => ['nullable', 'array'],
        ]);

        $sale = OfficeShiftSale::where('office_shift_id', $office->id)
            ->where('id', $validated['sale_id'])
            ->first();

        if (! $sale) {
            return redirect()->route('office.show', $office)->withErrors(['sale' => 'Sale not found']);
        }

        $oldAmount = $sale->amount ?? 0;
        $newAmount = $validated['amount'];

        // Adjust shift totals depending on method
        if (strtolower($sale->method) === 'cash') {
            // decrement old, increment new
            $office->decrement('cash_total', $oldAmount);
            $office->increment('cash_total', $newAmount);
            $office->refresh();
            $office->total_cash = $office->start_cash + ($office->cash_total ?? 0);
        } else {
            $office->decrement('card_total', $oldAmount);
            $office->increment('card_total', $newAmount);
            $office->refresh();
            $office->total_card = $office->start_card + ($office->card_total ?? 0);
        }

        // Update sale record
        $sale->amount = $newAmount;
        if (array_key_exists('description', $validated)) {
            $sale->description = $validated['description'];
        }

        // keep snapshot in sync for non-price fields and amount
        $snapshot = $sale->snapshot ?? [];
        $snapshot['amount'] = $newAmount;
        if (array_key_exists('description', $validated)) {
            $snapshot['description'] = $validated['description'];
        }

        // If a breakdown is provided for a cash sale, apply the diff to the
        // office's cash_breakdown so aggregated counts remain accurate.
        if (strtolower($sale->method) === 'cash' && isset($validated['breakdown']) && is_array($validated['breakdown'])) {
            $allowedKeys = ['50', '20', '10', '5', '2', '1', '0_50', '0_20', '0_10', 'token'];

            // normalize incoming breakdown
            $newBreakdown = [];
            foreach ($allowedKeys as $k) {
                $newBreakdown[$k] = intval($validated['breakdown'][$k] ?? 0);
                if ($newBreakdown[$k] < 0) {
                    $newBreakdown[$k] = 0;
                }
            }

            // old breakdown from the sale snapshot
            $oldBreakdown = [];
            if (! empty($snapshot['breakdown']) && is_array($snapshot['breakdown'])) {
                foreach ($allowedKeys as $k) {
                    $oldBreakdown[$k] = intval($snapshot['breakdown'][$k] ?? 0);
                }
            } else {
                foreach ($allowedKeys as $k) {
                    $oldBreakdown[$k] = 0;
                }
            }

            // compute diff (new - old) and apply to office cash_breakdown
            $officeBreakdown = $office->cash_breakdown ?? [];
            foreach ($allowedKeys as $k) {
                $officeBreakdown[$k] = intval($officeBreakdown[$k] ?? 0) + ($newBreakdown[$k] - $oldBreakdown[$k]);
                if ($officeBreakdown[$k] < 0) {
                    // never allow negative counts
                    $officeBreakdown[$k] = 0;
                }
            }

            $office->cash_breakdown = $officeBreakdown;

            // persist the new breakdown on the snapshot so future edits can diff
            $snapshot['breakdown'] = $newBreakdown;
        }

        $sale->snapshot = $snapshot;
        $sale->save();

        // Update snapshot in office->sales JSON array
        $sales = $office->sales ?? [];
        foreach ($sales as &$s) {
            if (isset($s['id']) && $s['id'] == $sale->id) {
                $s['amount'] = $newAmount;
                if (array_key_exists('description', $validated)) {
                    $s['description'] = $validated['description'];
                }
                break;
            }
        }
        $office->sales = $sales;
        $office->save();

        return redirect()->route('office.show', $office);
    }

    public function end(Request $request, OfficeShift $office)
    {
        $data = $request->validate([
            'cash_total' => ['nullable', 'numeric'],
            'card_total' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $office->update([
            'cash_total' => $data['cash_total'] ?? $office->cash_total,
            'card_total' => $data['card_total'] ?? $office->card_total,
            'ended_at' => now(),
            'status' => 'closed',
            'notes' => $data['notes'] ?? $office->notes,
        ]);

        return redirect()->route('office');
    }

    /**
     * Reopen a previously closed office shift.
     */
    public function reopen(Request $request, OfficeShift $office)
    {
        // Only allow reopening if the shift is currently closed
        if ($office->status !== 'closed') {
            return redirect()->route('office.show', $office);
        }

        $office->update([
            'status' => 'open',
            'ended_at' => null,
        ]);

        return redirect()->route('office.show', $office);
    }
}
