<?php

namespace App\Http\Controllers\Backstage;
use App\Http\Controllers\Controller;

use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreManagerController extends Controller
{
    /**
     * Return sellables (products + upcoming events) and sales data for the Store Manager page.
     */
    public function data(Request $request): array
    {
        $now = now();

        $products = Product::with('variants')
            ->withCount(['sales', 'onlineSales'])
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
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
                'remaining' => $p->quantity !== null ? max(0, $p->quantity - ($p->sales_count + $p->online_sales_count)) : null,
                'remaining_with_card' => null,
                'remaining_without_card' => null,
                'is_online_sellable' => $p->is_online_sellable,
                'image' => $p->image,
                'images_list' => $p->images_list,
                'variants_config' => $p->variants_config,
                'instagram_link' => $p->instagram_link,
                'variants' => $p->variants->map(fn ($v) => [
                    'id' => $v->id,
                    'options' => $v->options,
                    'quantity' => $v->quantity,
                    'sold_count' => $v->sold_count,
                ]),
            ]);

        $events = Event::with(['responsibleUser', 'variants'])
            ->withCount(['sales', 'onlineSales'])
            ->where('event_date', '>=', $now)
            ->orderBy('event_date', 'asc')
            ->get()
            ->map(fn ($e) => [
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
                'remaining' => $e->quantity !== null ? max(0, $e->quantity - ($e->sales_count + $e->online_sales_count)) : null,
                'remaining_with_card' => $e->quantity_with_card !== null ? max(0, $e->quantity_with_card - ($e->sold_count_with_card ?? 0)) : null,
                'remaining_without_card' => $e->quantity_without_card !== null ? max(0, $e->quantity_without_card - ($e->sold_count_without_card ?? 0)) : null,
                'responsibleUser' => $e->responsibleUser,
                'google_spreadsheet_id' => $e->google_spreadsheet_id,
                'is_online_sellable' => $e->is_online_sellable,
                'responsible_user_id' => $e->responsible_user_id,
                'image' => $e->image,
                'images_list' => $e->images_list,
                'variants_config' => $e->variants_config,
                'instagram_link' => $e->instagram_link,
                'notes' => $e->notes,
                'variants' => $e->variants->map(fn ($v) => [
                    'id' => $v->id,
                    'options' => $v->options,
                    'quantity' => $v->quantity,
                    'sold_count' => $v->sold_count,
                ]),
            ]);

        // Determine time period for sales filter
        $period = $request->query('period', '14days');
        $lastClosedShift = OfficeShift::where('status', 'closed')
            ->orderBy('ended_at', 'desc')
            ->first();

        $from = match ($period) {
            '24hours' => now()->subHours(24),
            '7days'   => now()->subDays(7),
            'month'   => now()->subDays(30),
            'lastShift' => $lastClosedShift?->ended_at ?? now()->subDays(14),
            default   => now()->subDays(14),
        };

        $page     = max(1, (int) $request->query('page', 1));
        $pageSize = max(1, min(1000, (int) $request->query('pageSize', 100)));

        $baseQuery = OnlineSale::with(['product', 'event'])
            ->where('sold_at', '>=', $from);

        $onlineSalesTotal = (int) $baseQuery->count();

        $onlineSales = $baseQuery
            ->orderBy('sold_at', 'desc')
            ->skip(($page - 1) * $pageSize)
            ->take($pageSize)
            ->get();

        $officeSales = OfficeShiftSale::with(['product', 'event'])
            ->where('sold_at', '>=', $from)
            ->orderBy('sold_at', 'desc')
            ->get();

        $onlineSellablesCount = Product::where('is_online_sellable', true)->count()
            + Event::where('is_online_sellable', true)
            ->where('event_date', '>=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('end_sell_date')
                    ->orWhere('end_sell_date', '>=', $now);
            })
            ->count();

        $boardUsers = User::orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email'])
            ->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
                'email' => $u->email,
            ]);

        return [
            'products'            => $products,
            'events'              => $events,
            'onlineSales'         => $onlineSales,
            'officeSales'         => $officeSales,
            'onlineSalesTotal'    => $onlineSalesTotal,
            'onlineSellablesCount' => $onlineSellablesCount,
            'boardUsers'          => $boardUsers,
            'lastClosedShiftDate' => $lastClosedShift?->ended_at?->toIso8601String(),
        ];
    }

    public function allSales(Request $request): \Inertia\Response
    {
        $fromDate = $request->query('from_date', now()->subDays(7)->format('Y-m-d'));
        $toDate   = $request->query('to_date', now()->format('Y-m-d'));
        $method   = $request->query('method', 'all'); // all | cash | card | online

        $from = Carbon::parse($fromDate)->startOfDay();
        $to   = Carbon::parse($toDate)->endOfDay();

        $items = collect();

        // ── Online sales ──────────────────────────────────────────────────
        if ($method === 'all' || $method === 'online') {
            $onlineItems = OnlineSale::with(['product', 'event', 'transaction'])
                ->whereBetween('sold_at', [$from, $to])
                ->get()
                ->map(fn ($s) => [
                    'id'                    => $s->id,
                    'name'                  => $s->product?->name ?? $s->event?->name ?? 'Unknown',
                    'method'                => 'online',
                    'amount'                => (float) $s->amount,
                    'ticket_type'           => $s->ticket_type,
                    'variant_opts'          => $s->details['options'] ?? null,
                    'code_used'             => ($s->ticket_type === 'with_card') ? ($s->details['code_used'] ?? null) : null,
                    'reference_id'          => $s->reference_id,
                    'sold_at'               => $s->sold_at?->toIso8601String(),
                    'online_transaction_id' => $s->online_transaction_id,
                    'transaction_ref'       => $s->transaction?->reference_id,
                    'email'                 => $s->transaction?->email,
                    'mail_success'          => $s->transaction?->mail_success,
                ]);
            $items = $items->concat($onlineItems);
        }

        // ── Office shift sales ────────────────────────────────────────────
        if ($method !== 'online') {
            $query = OfficeShiftSale::with(['product', 'event'])
                ->whereBetween('sold_at', [$from, $to]);
            if ($method !== 'all') {
                $query->where('method', $method);
            }
            $officeItems = $query->get()->map(fn ($s) => [
                'id'           => $s->id,
                'name'         => $s->product?->name ?? $s->event?->name ?? ($s->description ?? 'Unknown'),
                'method'       => $s->method ?? 'cash',
                'amount'       => (float) $s->amount,
                'ticket_type'  => $s->snapshot['ticket_type'] ?? null,
                'variant_opts' => $s->snapshot['options'] ?? $s->snapshot['variant_options'] ?? null,
                'description'  => $s->description,
                'sold_at'      => $s->sold_at?->toIso8601String(),
            ]);
            $items = $items->concat($officeItems);
        }

        $storeUrl = rtrim(
            env('STORE_APP_URL', 'http://'.env('STORE_DOMAIN', 'store.localhost').':'.
                (parse_url(env('APP_URL', 'http://localhost:8000'), PHP_URL_PORT) ?? 80)),
            '/'
        );

        return Inertia::render('store-manager/all-sales', [
            'filters' => [
                'from_date' => $fromDate,
                'to_date'   => $toDate,
                'method'    => $method,
            ],
            'sales'    => $items->sortByDesc('sold_at')->values(),
            'storeUrl' => $storeUrl,
        ]);
    }
}
