<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;

class StoreManagerController extends Controller
{
    /**
     * Return sellables (products + upcoming events) for the Store Manager page.
     */
    public function data(Request $request)
    {
        $now = now();

        // Cache for 30 seconds to prevent DB stampede from store displays


            $products = Product::with('variants')->orderBy('name')->get()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'type' => 'product',
                    'name' => $p->name,
                    'description' => $p->description,
                    'price' => $p->price,
                    'quantity' => $p->quantity,
                    'unlimited_quantity' => (bool) ($p->unlimited_quantity ?? false),
                    'variable_amount' => $p->variable_amount,
                    'quantity_with_card' => $p->quantity_with_card,
                    'unlimited_quantity_with_card' => (bool) ($p->unlimited_quantity_with_card ?? false),
                    'quantity_without_card' => $p->quantity_without_card,
                    'unlimited_quantity_without_card' => (bool) ($p->unlimited_quantity_without_card ?? false),
                    'remaining' => $p->remaining,
                    'remaining_with_card' => $p->remaining_with_card,
                    'remaining_without_card' => $p->remaining_without_card,
                    'is_online_sellable' => $p->is_online_sellable,
                    // New fields for Sellables UI
                    'images_list' => $p->images_list,
                    'variants_config' => $p->variants_config,
                    'instagram_link' => $p->instagram_link,
                    'variants' => $p->variants->map(fn ($v) => [
                        'id' => $v->id,
                        'options' => $v->options,
                        'quantity' => $v->quantity,
                        'sold_count' => $v->sold_count,
                    ]),
                ];
            });

            $events = Event::with(['responsibleUser', 'variants'])
                ->where('event_date', '>=', $now)
                ->orderBy('event_date', 'asc')
                ->get()
                ->map(function ($e) {
                    return [
                        'id' => $e->id,
                        'type' => 'event',
                        'name' => $e->name,
                        'description' => $e->description,
                        'event_date' => $e->event_date,
                        'start_sell_date' => $e->start_sell_date,
                        'end_sell_date' => $e->end_sell_date,
                        'price_with_card' => $e->price_with_card,
                        'price_without_card' => $e->price_without_card,
                        'quantity' => $e->quantity,
                        'unlimited_quantity' => (bool) ($e->unlimited_quantity ?? false),
                        'variable_amount' => $e->variable_amount,
                        'quantity_with_card' => $e->quantity_with_card,
                        'unlimited_quantity_with_card' => (bool) ($e->unlimited_quantity_with_card ?? false),
                        'quantity_without_card' => $e->quantity_without_card,
                        'unlimited_quantity_without_card' => (bool) ($e->unlimited_quantity_without_card ?? false),
                        'remaining' => $e->remaining,
                        'remaining_with_card' => $e->remaining_with_card,
                        'remaining_without_card' => $e->remaining_without_card,
                        'responsibleUser' => $e->responsibleUser,
                        'google_spreadsheet_id' => $e->google_spreadsheet_id,
                        'is_online_sellable' => $e->is_online_sellable,
                        'responsible_user_id' => $e->responsible_user_id,
                        // New fields for Sellables UI
                        'images_list' => $e->images_list,
                        'variants_config' => $e->variants_config,
                        'instagram_link' => $e->instagram_link,
                        'variants' => $e->variants->map(fn ($v) => [
                            'id' => $v->id, // ULID
                            'options' => $v->options,
                            'quantity' => $v->quantity,
                            'sold_count' => $v->sold_count,
                        ]),
                    ];
                });

            // Determine time period for sales filter
            $period = $request->query('period', '14days');
            $lastClosedShift = OfficeShift::where('status', 'closed')
                ->orderBy('ended_at', 'desc')
                ->first();

            switch ($period) {
                case '24hours':
                    $from = now()->subHours(24);
                    break;
                case '7days':
                    $from = now()->subDays(7);
                    break;
                case 'month':
                    $from = now()->subDays(30);
                    break;
                case 'lastShift':
                    $from = $lastClosedShift?->ended_at ?? now()->subDays(14);
                    break;
                case '14days':
                default:
                    $from = now()->subDays(14);
                    break;
            }

            $page = max(1, (int) $request->query('page', 1));
            $pageSize = max(1, min(1000, (int) $request->query('pageSize', 100)));

            $baseQuery = OnlineSale::with(['product', 'event'])
                ->whereHas('transaction', function ($q) {
                    $q->where('payment_status', 'completed');
                })
                ->where('sold_at', '>=', $from);

            $onlineSalesTotal = (int) $baseQuery->count();

            $onlineSales = $baseQuery
                ->orderBy('sold_at', 'desc')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();

            // Fetch office shift sales for the same period
            $officeSales = OfficeShiftSale::with(['product', 'event'])
                ->where('sold_at', '>=', $from)
                ->orderBy('sold_at', 'desc')
                ->get();

            $onlineSellablesCount = Product::where('is_online_sellable', true)->count() + Event::where('is_online_sellable', true)
                ->where('event_date', '>=', $now)
                ->where(function ($query) use ($now) {
                    $query->whereNull('end_sell_date')
                        ->orWhere('end_sell_date', '>=', $now);
                })
                ->count();

            $boardUsers = User::where('permissions', 'like', '%board%')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'email'])
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
                    'email' => $u->email,
                ]);

            return [
                'products' => $products,
                'events' => $events,
                'onlineSales' => $onlineSales,
                'officeSales' => $officeSales,
                'onlineSalesTotal' => $onlineSalesTotal,
                'onlineSellablesCount' => $onlineSellablesCount,
                'boardUsers' => $boardUsers,
                'lastClosedShiftDate' => $lastClosedShift?->ended_at?->toIso8601String(),
            ];


    }
}
