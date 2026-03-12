<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\sellables\Product;
use App\Models\sellables\Event;
use App\Models\OfficeShift;
use App\Models\OfficeShiftWorker;
use App\Models\OfficeShiftSale;
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
            $previousSalesQuery = OfficeShiftSale::where('office_shift_id', $lastShift->id)
                ->with(['product', 'event'])
                ->orderByDesc('sold_at')
                ->get();
            $previousSales = OfficeShiftSaleResource::collection($previousSalesQuery)->resolve();
        }

        $allShifts = OfficeShiftResource::collection(
            OfficeShift::with(['workers.user'])
                ->orderBy('started_at', 'desc')
                ->get()
        )->resolve();

        $products = Product::with('variants')->get();
        $events = Event::with('variants')->get();

        $sellables = collect($products)->map(fn($p) => (new ProductResource($p))->resolve())
            ->concat(collect($events)->map(fn($e) => (new EventResource($e))->resolve()))
            ->sortBy('name')
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
        $office = OfficeShift::with(['workers.user', 'sales.product', 'sales.event'])->findOrFail($id);

        $staff = User::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email', 'role']);
        $staffNodes = $staff->map(fn($u) => [
            'id' => $u->id,
            'name' => $u->first_name . ' ' . $u->last_name,
            'email' => $u->email,
            'role' => $u->role,
        ]);

        $products = Product::with('variants')->get();
        $events = Event::with('variants')->get();

        $sellables = collect($products)->map(fn($p) => (new ProductResource($p))->resolve())
            ->concat(collect($events)->map(fn($e) => (new EventResource($e))->resolve()))
            ->sortBy('name')
            ->values()
            ->all();

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
        }

        return redirect()->route('office.show', $office->id);
    }

    public function removeWorker(Request $request, OfficeShift $office)
    {
        $request->validate(['user_id' => 'required']);

        OfficeShiftWorker::where('office_shift_id', $office->id)
            ->where('user_id', $request->user_id)
            ->delete();

        return redirect()->route('office.show', $office->id);
    }

    public function recordSale(Request $request, OfficeShift $office)
    {
        $data = $request->validate([
            'product_id' => ['nullable'],
            'item_type' => ['nullable', 'string'],
            'method' => ['required', 'in:cash,card'],
            'amount' => ['required', 'numeric'],
            'description' => ['nullable', 'string'],
            'ticket_type' => ['nullable', 'string', 'in:with_card,without_card'],
            'variant_id' => ['nullable', 'string'],
            'breakdown' => ['nullable', 'array'],
        ]);

        $this->officeService->recordSale($office, $data);

        return redirect()->route('office.show', $office->id);
    }

    public function removeSale(Request $request, OfficeShift $office)
    {
        $validated = $request->validate(['sale_id' => 'required']);

        $this->officeService->removeSale($office, $validated['sale_id']);

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
}

