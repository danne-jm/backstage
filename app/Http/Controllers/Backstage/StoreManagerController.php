<?php

namespace App\Http\Controllers\Backstage;
use App\Http\Controllers\Controller;

use App\Models\FinancialLedgerEntry;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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
            ->map(fn($p) => [
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
                'variants' => $p->variants->map(fn($v) => [
                    'id' => $v->id,
                    'options' => $v->options,
                    'quantity' => $v->quantity,
                    'sold_count' => $v->computedSoldCount(),
                ]),
            ]);

        $events = Event::with(['responsibleUser', 'variants'])
            ->withCount(['sales', 'onlineSales'])
            ->orderBy('event_date', 'asc')
            ->get()
            ->map(fn($e) => [
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
                'remaining_with_card' => $e->computedRemainingWithCard(),
                'remaining_without_card' => $e->computedRemainingWithoutCard(),
                'responsibleUser' => $e->responsibleUser ? [
                    'id' => $e->responsibleUser->id,
                    'name' => trim(($e->responsibleUser->first_name ?? '') . ' ' . ($e->responsibleUser->last_name ?? '')),
                ] : null,
                'google_spreadsheet_id' => $e->google_spreadsheet_id,
                'is_online_sellable' => $e->is_online_sellable,
                'responsible_user_id' => $e->responsible_user_id,
                'image' => $e->image,
                'images_list' => $e->images_list,
                'variants_config' => $e->variants_config,
                'instagram_link' => $e->instagram_link,
                'notes' => $e->notes,
                'variants' => $e->variants->map(fn($v) => [
                    'id' => $v->id,
                    'options' => $v->options,
                    'quantity' => $v->quantity,
                    'sold_count' => $v->computedSoldCount(),
                ]),
            ]);

        // Determine time period for sales filter
        $period = $request->query('period', '14days');
        $lastClosedShift = OfficeShift::where('status', 'closed')
            ->orderBy('ended_at', 'desc')
            ->first();

        $from = match ($period) {
            '24hours' => now()->subHours(24),
            '7days' => now()->subDays(7),
            'month' => now()->subDays(30),
            'lastShift' => $lastClosedShift?->ended_at ?? now()->subDays(14),
            default => now()->subDays(14),
        };

        $page = max(1, (int) $request->query('page', 1));
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
            + Event::where('is_online_sellable', true)->count();

        $boardUsers = User::orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email'])
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')),
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

    public function allSales(Request $request): \Inertia\Response
    {
        $fromDate = $request->query('from_date', now()->subDays(28)->format('Y-m-d'));
        $toDate = $request->query('to_date', now()->format('Y-m-d'));
        $method = $request->query('method', 'all'); // all | cash | card | online

        $from = Carbon::parse($fromDate)->startOfDay();
        $to = Carbon::parse($toDate)->endOfDay();

        $items = collect();

        // ── Online sales ──────────────────────────────────────────────────
        if ($method === 'all' || $method === 'online') {
            // Reuse OnlineSaleResource so this page doesn't reinvent the
            // online sale shape. We include the transaction relation here so
            // confirmation URL / mail status metadata is available.
            $onlineItems = \App\Http\Resources\OnlineSaleResource::collection(
                OnlineSale::with(['product', 'event', 'transaction'])
                    ->whereBetween('sold_at', [$from, $to])
                    ->whereHas('transaction', fn ($q) => $q->whereIn('payment_status', ['pending', 'completed']))
                    ->get()
            )->resolve();

            $items = $items->concat($onlineItems);
        }

        // ── Office shift sales ────────────────────────────────────────────
        // Keep this in sync with OfficeShiftSaleResource so the semantics
        // (custom flag, ticket type, expected amount, etc.) remain aligned
        // across /office and /store-manager/all-sales views.
        if ($method !== 'online') {
            $query = OfficeShiftSale::with(['product', 'event'])
                ->whereBetween('sold_at', [$from, $to])
                ->where(function ($q) {
                    // Exclude POS records that are actually representing online sales
                    // to avoid duplicates in the All Sales log.
                    $q->whereNull('snapshot->online_sale_id')
                        ->orWhere('snapshot->online_sale_id', '');
                });
            if ($method !== 'all') {
                $query->where('method', $method);
            }

            $officeItems = $query->get()->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->product?->name ?? $s->event?->name ?? ($s->description ?? 'Unknown'),
                'method' => $s->method ?? 'cash',
                'amount' => (float) $s->amount,
                'expected_amount' => (float) ($s->snapshot['price'] ?? $s->amount),
                'breakdown' => $s->breakdown,
                'ticket_type' => $s->snapshot['ticket_type'] ?? null,
                'variant_options' => $s->snapshot['options'] ?? $s->snapshot['variant_options'] ?? null,
                'description' => $s->description,
                // Reuse the same definition as OfficeShiftSaleResource
                'is_custom' => $s->description !== null && $s->description !== 'Quick Sale',
                'sold_at' => $s->sold_at?->toIso8601String(),
            ]);

            $items = $items->concat($officeItems);
        }

        $storeUrl = rtrim((string) config('services.store.app_url', ''), '/');

        if ($storeUrl === '') {
            $storeDomain = trim((string) config('services.store.domain', 'store.localhost'));
            $storeUrl = $request->getScheme() . '://' . $storeDomain;

            if ($request->getPort() && !str_contains($storeDomain, ':')) {
                $storeUrl .= ':' . $request->getPort();
            }
        }

        return Inertia::render('store-manager/all-sales', [
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'method' => $method,
            ],
            'sales' => $items->sortByDesc('sold_at')->values(),
            'storeUrl' => $storeUrl,
        ]);
    }

    public function accounting(Request $request): \Inertia\Response
    {
        $fromDate = $request->query('from_date', now()->subDays(28)->format('Y-m-d'));
        $toDate = $request->query('to_date', now()->format('Y-m-d'));

        if (!Schema::hasTable('financial_ledger_entries')) {
            return Inertia::render('store-manager/accounting', [
                'filters' => [
                    'from_date' => $fromDate,
                    'to_date' => $toDate,
                ],
                'summary' => [
                    'total_credit' => 0,
                    'total_debit' => 0,
                    'net' => 0,
                    'entries_count' => 0,
                ],
                'breakdowns' => [
                    'channels' => [],
                    'payment_methods' => [],
                    'entry_types' => [],
                ],
                'daily' => [],
                'entries' => [],
                'setupRequired' => true,
            ]);
        }

        $from = Carbon::parse($fromDate)->startOfDay();
        $to = Carbon::parse($toDate)->endOfDay();

        $baseQuery = FinancialLedgerEntry::query()
            ->whereBetween('occurred_at', [$from, $to]);

        $totalCredits = (float) (clone $baseQuery)
            ->where('direction', 'credit')
            ->sum('amount');

        $totalDebits = (float) (clone $baseQuery)
            ->where('direction', 'debit')
            ->sum('amount');

        $entriesCount = (int) (clone $baseQuery)->count();

        $byChannelRaw = (clone $baseQuery)
            ->selectRaw('COALESCE(channel, ?) as bucket, direction, SUM(amount) as total, COUNT(*) as entry_count', ['unknown'])
            ->groupBy('bucket', 'direction')
            ->orderBy('bucket')
            ->get();

        $byPaymentMethodRaw = (clone $baseQuery)
            ->selectRaw('COALESCE(payment_method, ?) as bucket, direction, SUM(amount) as total, COUNT(*) as entry_count', ['unknown'])
            ->groupBy('bucket', 'direction')
            ->orderBy('bucket')
            ->get();

        $byEntryTypeRaw = (clone $baseQuery)
            ->selectRaw('entry_type as bucket, direction, SUM(amount) as total, COUNT(*) as entry_count')
            ->groupBy('entry_type', 'direction')
            ->orderBy('entry_type')
            ->get();

        $dailyRaw = (clone $baseQuery)
            ->selectRaw('DATE(occurred_at) as day, direction, SUM(amount) as total')
            ->groupBy('day', 'direction')
            ->orderBy('day')
            ->get();

        $toBreakdown = function ($rows) {
            return collect($rows)
                ->groupBy('bucket')
                ->map(function ($group, $bucket) {
                    $credit = (float) ($group->firstWhere('direction', 'credit')->total ?? 0);
                    $debit = (float) ($group->firstWhere('direction', 'debit')->total ?? 0);
                    $count = (int) $group->sum('entry_count');

                    return [
                        'label' => (string) $bucket,
                        'credit' => $credit,
                        'debit' => $debit,
                        'net' => $credit - $debit,
                        'count' => $count,
                    ];
                })
                ->sortByDesc('net')
                ->values();
        };

        $channelBreakdown = $toBreakdown($byChannelRaw);
        $paymentMethodBreakdown = $toBreakdown($byPaymentMethodRaw);
        $entryTypeBreakdown = $toBreakdown($byEntryTypeRaw);

        $daily = collect($dailyRaw)
            ->groupBy('day')
            ->map(function ($group, $day) {
                $credit = (float) ($group->firstWhere('direction', 'credit')->total ?? 0);
                $debit = (float) ($group->firstWhere('direction', 'debit')->total ?? 0);

                return [
                    'day' => $day,
                    'credit' => $credit,
                    'debit' => $debit,
                    'net' => $credit - $debit,
                ];
            })
            ->values();

        $entries = (clone $baseQuery)
            ->orderByDesc('occurred_at')
            ->limit(500)
            ->get([
                'id',
                'entry_type',
                'direction',
                'amount',
                'currency',
                'channel',
                'payment_method',
                'source_type',
                'source_reference',
                'idempotency_key',
                'occurred_at',
                'metadata',
            ])
            ->map(fn(FinancialLedgerEntry $e) => [
                'id' => $e->id,
                'entry_type' => $e->entry_type,
                'direction' => $e->direction,
                'amount' => (float) $e->amount,
                'currency' => $e->currency,
                'channel' => $e->channel,
                'payment_method' => $e->payment_method,
                'source_type' => $e->source_type,
                'source_reference' => $e->source_reference,
                'idempotency_key' => $e->idempotency_key,
                'occurred_at' => $e->occurred_at?->toIso8601String(),
                'metadata' => $e->metadata,
            ])
            ->values();

        return Inertia::render('store-manager/accounting', [
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
            'summary' => [
                'total_credit' => $totalCredits,
                'total_debit' => $totalDebits,
                'net' => $totalCredits - $totalDebits,
                'entries_count' => $entriesCount,
            ],
            'breakdowns' => [
                'channels' => $channelBreakdown,
                'payment_methods' => $paymentMethodBreakdown,
                'entry_types' => $entryTypeBreakdown,
            ],
            'daily' => $daily,
            'entries' => $entries,
            'setupRequired' => false,
        ]);
    }
}
