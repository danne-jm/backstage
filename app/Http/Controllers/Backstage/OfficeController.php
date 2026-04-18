<?php

namespace App\Http\Controllers\Backstage;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\sellables\Product;
use App\Models\sellables\Event;
use App\Models\OfficeShift;
use App\Models\OfficeShiftWorker;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\OfficeShiftResource;
use App\Http\Resources\OfficeShiftSaleResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\EventResource;

class OfficeController extends Controller
{
    protected \App\Services\OfficeService $officeService;

    public function __construct(\App\Services\OfficeService $officeService)
    {
        $this->officeService = $officeService;
    }

    public function index()
    {
        $activeShift = OfficeShift::with(['workers.user'])
            ->where('status', 'open')
            ->orderBy('started_at', 'desc')
            ->first();

        $lastShift = OfficeShift::with(['workers.user'])
            ->where('status', 'closed')
            ->orderBy('ended_at', 'desc')
            ->first();

        $previousSales = [];
        if ($lastShift) {
            $shiftEnd = $lastShift->ended_at ?? now();

            // POS Sales
            $posSales = OfficeShiftSale::where('office_shift_id', $lastShift->id)
                ->with(['product', 'event', 'soldBy'])
                ->get();

            // Online Sales explicitly assigned OR window fallback
            $idsAssigned = OnlineSale::where('office_shift_id', $lastShift->id)
                ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
                ->pluck('id');
            $idsDuring = OnlineSale::where('sold_at', '>=', $lastShift->started_at)
                ->where('sold_at', '<=', $shiftEnd)
                ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
                ->pluck('id');

            $onlineSales = OnlineSale::with(['product', 'event', 'transaction'])
                ->whereIn('id', $idsAssigned->merge($idsDuring)->unique()->values())
                ->get();

            $previousSales = OfficeShiftSaleResource::collection($posSales)
                ->resolve();

            $previousSales = array_merge(
                $previousSales,
                \App\Http\Resources\OnlineSaleResource::collection($onlineSales)->resolve()
            );

            // Sort merged sales by time descending
            usort($previousSales, function ($a, $b) {
                return (new \DateTime($b['sold_at'])) <=> (new \DateTime($a['sold_at']));
            });
        }

        $shifts = OfficeShift::with(['workers.user'])
            ->orderBy('started_at', 'desc')
            ->get();

        // For the overview table, include online card revenue in the
        // card/total figures so they match the detailed shift view.
        $allShifts = $shifts->map(function (OfficeShift $shift) {
            // Ensure open shifts claim their orphans for accuracy in the overview
            if ($shift->status === 'open') {
                $this->officeService->claimStrayOnlineSales($shift);
            }

            $data = (new OfficeShiftResource($shift))->resolve();
            return $data;
        })->values()->all();

        $products = Product::with(['variants', 'media'])->get();
        $events = Event::with(['variants', 'media'])->get();

        $sellables = collect($products)->map(fn($p) => \App\DTOs\Office\PosSellableDTO::fromProduct($p))
            ->concat(collect($events)->map(fn($e) => \App\DTOs\Office\PosSellableDTO::fromEvent($e)))
            ->sortBy([
                ['type', 'desc'],
                ['start_sell_date', 'asc'],
            ])
            ->values()
            ->all();

        return Inertia::render('office/office', [
            'activeShift' => $activeShift ? (new OfficeShiftResource($activeShift))->resolve() : null,
            'lastShift' => $lastShift ? (new OfficeShiftResource($lastShift))->resolve() : null,
            'previousSales' => $previousSales,
            'allShifts' => $allShifts,
            'sellables' => $sellables,
        ]);
    }

    public function start(Request $request)
    {
        if (OfficeShift::where('status', 'open')->exists()) {
            return redirect()->route('office')->withErrors(['shift' => 'A shift is already open']);
        }

        $shift = $this->officeService->startShift(Auth::user());

        return redirect()->route('office.show', $shift->id);
    }

    public function show($id)
    {
        $office = OfficeShift::with(['workers.user', 'sales.product', 'sales.event', 'sales.soldBy'])->findOrFail($id);

        $staff = User::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email', 'role']);
        $staffNodes = $staff->map(fn($u) => [
            'id' => $u->id,
            'name' => $u->first_name . ' ' . $u->last_name,
            'email' => $u->email,
            'role' => $u->role,
        ]);

        $products = Product::with(['variants', 'media'])->get();
        $events = Event::with(['variants', 'media'])->get();

        $sellables = collect($products)->map(fn($p) => \App\DTOs\Office\PosSellableDTO::fromProduct($p))
            ->concat(collect($events)->map(fn($e) => \App\DTOs\Office\PosSellableDTO::fromEvent($e)))
            ->sortBy([
                ['type', 'desc'],
                ['start_sell_date', 'asc'],
            ])
            ->values()
            ->all();

        $shiftEnd = $office->ended_at ?? now();

        // For open shifts, permanently stamp any unclaimed online sales with this shift's ID
        if ($office->status === 'open') {
            $this->officeService->claimStrayOnlineSales($office);
        }

        // Show online sales either explicitly assigned to this shift OR sold within the shift window
        $idsAssigned = \App\Models\OnlineSale::where('office_shift_id', $office->id)
            ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
            ->pluck('id');
        $idsDuring = \App\Models\OnlineSale::where('sold_at', '>=', $office->started_at)
            ->where('sold_at', '<=', $shiftEnd)
            ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
            ->pluck('id');

        $onlineSalesQuery = \App\Models\OnlineSale::with(['product', 'event', 'transaction'])
            ->whereIn('id', $idsAssigned->merge($idsDuring)->unique()->values())
            ->orderByDesc('sold_at');

        // Use OnlineSaleResource so the online sale shape stays consistent
        // across Office and Store Manager views.
        $onlineSales = \App\Http\Resources\OnlineSaleResource::collection(
            $onlineSalesQuery->get()
        )->resolve();

        return Inertia::render('office/office-shift', [
            'shiftId' => $id,
            'activeShift' => (new OfficeShiftResource($office))->resolve(),
            'workers' => $office->workers->map(fn($w) => [
                'id' => $w->user->id,
                'name' => $w->user->first_name . ' ' . $w->user->last_name,
                'role' => $w->role,
                'email' => $w->user->email,
            ]),
            'sales' => OfficeShiftSaleResource::collection($office->sales->sortByDesc('created_at'))->resolve(),
            'onlineSales' => $onlineSales,
            'sellables' => $sellables,
            'staff' => $staffNodes,
        ]);
    }

    public function end(Request $request, OfficeShift $office)
    {
        $this->officeService->endShift($office, $request->input('notes'), Auth::user());

        return redirect()->route('office');
    }

    public function reopen(Request $request, OfficeShift $office)
    {
        if ($office->status !== 'closed') {
            return redirect()->back();
        }

        if (OfficeShift::where('status', 'open')->exists()) {
            return redirect()->back()->withErrors(['shift' => 'A shift is already open']);
        }

        $office->update([
            'status' => 'open',
            'ended_at' => null,
            'end_of_shift_cash_breakdown' => null,
        ]);

        return redirect()->back();
    }

    public function addWorker(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['nullable', 'string'],
        ]);

        $exists = OfficeShiftWorker::where('office_shift_id', $office->id)
            ->where('user_id', $validated['user_id'])
            ->exists();

        if (!$exists) {
            $user = User::find($validated['user_id']);
            OfficeShiftWorker::create([
                'office_shift_id' => $office->id,
                'user_id' => $validated['user_id'],
                'role' => $validated['role'] ?? $user->role ?? 'staff',
            ]);

            activity('office')
                ->causedBy(Auth::user())
                ->performedOn($office)
                ->withProperties(['worker_name' => $user->first_name . ' ' . $user->last_name, 'worker_email' => $user->email, 'role' => $validated['role'] ?? $user->role ?? 'staff'])
                ->log('worker added to shift');
        }

        return redirect()->route('office.show', $office->id);
    }

    public function removeWorker(Request $request, OfficeShift $office)
    {
        $request->validate(['user_id' => 'required']);

        $worker = User::find($request->user_id);

        OfficeShiftWorker::where('office_shift_id', $office->id)
            ->where('user_id', $request->user_id)
            ->delete();

        activity('office')
            ->causedBy(Auth::user())
            ->performedOn($office)
            ->withProperties(['worker_name' => $worker ? $worker->first_name . ' ' . $worker->last_name : $request->user_id, 'worker_email' => $worker?->email])
            ->log('worker removed from shift');

        return redirect()->route('office.show', $office->id);
    }

    public function recordSale(\App\Http\Requests\Backstage\RecordOfficeSaleRequest $request, OfficeShift $office)
    {
        $data = $request->validated();

        // The frontend now cleanly sends 'item_id' and 'item_type'.
        if (($data['item_type'] ?? null) === 'event') {
            $data['event_id'] = $data['item_id'];
            $data['product_id'] = null;
        } else {
            $data['product_id'] = $data['item_id'];
            $data['event_id'] = null;
        }

        // Treat an explicit 'Quick Sale' description the same as no description.
        if (($data['description'] ?? null) === 'Quick Sale') {
            $data['description'] = null;
        }

        $this->officeService->recordSale($office, $data);

        activity('office')
            ->causedBy(Auth::user())
            ->performedOn($office)
            ->withProperties(['item_type' => $data['item_type'] ?? 'product', 'item_id' => $data['item_id'] ?? null, 'amount' => $data['amount'] ?? null, 'method' => $data['method'] ?? null])
            ->log('sale recorded');

        return redirect()->route('office.show', $office->id);
    }

    public function removeSale(Request $request, OfficeShift $office)
    {
        $validated = $request->validate(['sale_id' => 'required']);

        $this->officeService->removeSale($office, $validated['sale_id']);

        activity('office')
            ->causedBy(Auth::user())
            ->performedOn($office)
            ->withProperties(['sale_id' => $validated['sale_id']])
            ->log('sale removed');

        return redirect()->route('office.show', $office->id);
    }

    public function updateCashBreakdown(Request $request, OfficeShift $office)
    {
        $data = $request->validate([
            'target' => ['nullable', 'string', 'in:start,current'],
            'breakdown' => ['required', 'array'],
        ]);

        $this->officeService->updateCashBreakdown($office, $data);

        return redirect()->route('office.show', $office->id);
    }

    public function updateStartTotals(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'cash' => ['required', 'numeric'],
            'card' => ['required', 'numeric'],
        ]);

        $this->officeService->updateStartTotals($office, (float) $validated['cash'], (float) $validated['card']);

        return redirect()->route('office.show', $office->id);
    }

    public function updateSaleBreakdown(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'sale_id' => ['required'],
            'breakdown' => ['required', 'array'],
        ]);

        $this->officeService->updateSaleBreakdown($office, $validated['sale_id'], $validated['breakdown']);

        return redirect()->route('office.show', $office->id);
    }

    public function updateSaleVariant(Request $request, OfficeShift $office)
    {
        $validated = $request->validate([
            'sale_id' => ['required'],
            'variant_id' => ['required', 'string'],
        ]);

        $this->officeService->updateSaleVariant($office, $validated['sale_id'], $validated['variant_id']);

        return redirect()->route('office.show', $office->id);
    }
}

