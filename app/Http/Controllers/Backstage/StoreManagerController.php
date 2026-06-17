<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\FinancialLedgerEntry;
use App\Models\Product;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreManagerController extends Controller
{
    /**
     * High-level overview: online orders, recent transactions, revenue summary.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('backstage/store-manager/index', [
            'recent_transactions' => Inertia::defer(fn () => Transaction::with('sales.purchasable')
                ->where('channel', 'online')
                ->whereIn('status', ['completed', 'refunded'])
                ->latest('completed_at')
                ->limit(50)
                ->get()
                ->map(fn (Transaction $t) => [
                    'id' => $t->id,
                    'status' => $t->status,
                    'customer_email' => $t->customer_email,
                    'payment_method' => $t->payment_method,
                    'total_amount' => $t->total_amount,
                    'discount_total' => $t->discount_total,
                    'completed_at' => $t->completed_at?->toIso8601String(),
                    'items' => $t->sales->map(fn ($s) => [
                        'name' => $s->snapshot['name'] ?? $s->purchasable?->getName(),
                        'quantity' => $s->quantity,
                        'subtotal' => $s->subtotal,
                        'ticket_type' => $s->ticket_type,
                    ]),
                ])),

            'summary' => Inertia::defer(fn () => [
                'total_revenue' => (float) FinancialLedgerEntry::where('direction', 'credit')
                    ->where('channel', 'online')
                    ->sum('amount'),
                'completed_orders' => Transaction::where('channel', 'online')
                    ->where('status', 'completed')
                    ->count(),
                'refunded_orders' => Transaction::where('channel', 'online')
                    ->where('status', 'refunded')
                    ->count(),
                'pending_orders' => Transaction::where('channel', 'online')
                    ->where('status', 'pending')
                    ->count(),
            ]),
        ]);
    }

    /**
     * Detail view for a single online transaction / order.
     */
    public function show(Transaction $transaction): Response
    {
        $transaction->load('sales.purchasable', 'sales.variant');

        return Inertia::render('backstage/store-manager/show', [
            'transaction' => [
                'id' => $transaction->id,
                'channel' => $transaction->channel,
                'status' => $transaction->status,
                'customer_email' => $transaction->customer_email,
                'payment_method' => $transaction->payment_method,
                'external_payment_id' => $transaction->external_payment_id,
                'total_amount' => $transaction->total_amount,
                'discount_total' => $transaction->discount_total,
                'completed_at' => $transaction->completed_at?->toIso8601String(),
                'created_at' => $transaction->created_at->toIso8601String(),
                'sales' => $transaction->sales->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->snapshot['name'] ?? $s->purchasable?->getName(),
                    'unit_price' => $s->unit_price,
                    'quantity' => $s->quantity,
                    'subtotal' => $s->subtotal,
                    'ticket_type' => $s->ticket_type,
                    'discount_code_used' => $s->discount_code_used,
                    'variant' => $s->variant ? [
                        'id' => $s->variant->id,
                        'options' => $s->variant->options,
                    ] : null,
                    'snapshot' => $s->snapshot,
                ]),
            ],
        ]);
    }

    /**
     * List all events with live stock info — for the store manager's stock view.
     */
    public function stock(): Response
    {
        $events = Event::orderByDesc('event_date')->get()->map(fn (Event $event) => [
            'id' => $event->id,
            'name' => $event->name,
            'event_date' => $event->event_date?->toIso8601String(),
            'variable_amount' => $event->variable_amount,
            'universal_stock' => $event->unlimited_quantity ? null : [
                'remaining' => $event->getRemainingStock(),
                'base' => $event->getBaseQuantity(),
                'sold' => $event->getSoldCount(),
            ],
            'membership_stock' => $event->variable_amount ? [
                'remaining' => $event->getRemainingStock('with_membership'),
                'base' => $event->getBaseQuantity('with_membership'),
                'sold' => $event->getSoldCount('with_membership'),
            ] : null,
            'regular_stock' => $event->variable_amount ? [
                'remaining' => $event->getRemainingStock('regular'),
                'base' => $event->getBaseQuantity('regular'),
                'sold' => $event->getSoldCount('regular'),
            ] : null,
        ]);

        $products = Product::orderBy('name')->get()->map(fn (Product $product) => [
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'variable_amount' => $product->variable_amount,
            'universal_stock' => $product->unlimited_quantity ? null : [
                'remaining' => $product->getRemainingStock(),
                'base' => $product->getBaseQuantity(),
                'sold' => $product->getSoldCount(),
            ],
        ]);

        return Inertia::render('backstage/store-manager/stock', [
            'events' => $events,
            'products' => $products,
        ]);
    }
}
