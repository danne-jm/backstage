<?php

namespace App\Services;

use App\Models\Event;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    /**
     * Create an online sale and adjust product/event quantities. Optionally attach to an office shift.
     * Returns the created OnlineSale instance.
     */
    public function createOnlineSale(array $data): OnlineSale
    {
        return DB::transaction(function () use ($data) {
            $productId = $data['product_id'] ?? null;
            $eventId = $data['event_id'] ?? null;
            $method = $data['method'] ?? 'card';
            $amount = $data['amount'] ?? 0;
            $ticketType = $data['ticket_type'] ?? null;

            $details = $data['details'] ?? [];

            // --- Sold-out / stock checks ---
            // For products and events we pick the most-specific quantity field for the sale
            // (e.g. quantity_with_card / quantity_without_card when applicable) and ensure
            // the item is not sold out before creating the sale. If the corresponding
            // unlimited flag is set we allow the sale even if quantity is null/0.

            if ($productId) {
                $product = Product::find($productId);
                if ($product) {
                    $methodIsCard = strtolower($method) === 'card';

                    // Choose preferred quantity field based on payment method when available
                    $quantityField = null;
                    $unlimitedField = null;

                    if ($methodIsCard && (! is_null($product->quantity_with_card) || $product->unlimited_quantity_with_card)) {
                        $quantityField = 'quantity_with_card';
                        $unlimitedField = 'unlimited_quantity_with_card';
                    }

                    if (! $quantityField && (! is_null($product->quantity) || $product->unlimited_quantity)) {
                        $quantityField = 'quantity';
                        $unlimitedField = 'unlimited_quantity';
                    }

                    if ($quantityField) {
                        $isUnlimited = (bool) ($product->{$unlimitedField} ?? false);
                        $qtyVal = $product->{$quantityField};
                        $qtyNumber = is_null($qtyVal) ? 0 : intval($qtyVal);

                        if (! $isUnlimited && $qtyNumber <= 0) {
                            throw ValidationException::withMessages(['stock' => 'This product is sold out.']);
                        }
                    }
                }
            }

            if ($eventId) {
                $event = Event::find($eventId);
                if ($event) {
                    $ticketTypeKey = $ticketType ? strtolower($ticketType) : null;

                    // variable_amount means per-ticket quantities may exist
                    if ($ticketTypeKey && $event->variable_amount) {
                        if ($ticketTypeKey === 'with_card') {
                            $quantityField = 'quantity_with_card';
                            $unlimitedField = 'unlimited_quantity_with_card';
                        } else {
                            $quantityField = 'quantity_without_card';
                            $unlimitedField = 'unlimited_quantity_without_card';
                        }
                    } else {
                        $quantityField = 'quantity';
                        $unlimitedField = 'unlimited_quantity';
                    }

                    $isUnlimited = (bool) ($event->{$unlimitedField} ?? false);
                    $qtyVal = $event->{$quantityField} ?? null;
                    $qtyNumber = is_null($qtyVal) ? 0 : intval($qtyVal);

                    if (! $isUnlimited && $qtyNumber <= 0) {
                        throw ValidationException::withMessages(['stock' => 'This event is sold out.']);
                    }
                }
            }

            // Create online sale
            $sale = OnlineSale::create([
                'product_id' => $productId,
                'event_id' => $eventId,
                'method' => $method,
                'amount' => $amount,
                'details' => $details,
                'sold_at' => $data['sold_at'] ?? now(),
            ]);

            // Adjust quantities directly on the product/event so existing remaining getters (which
            // subtract OfficeShiftSale counts from the stored quantity) will reflect online sales.
            if ($productId) {
                $product = Product::find($productId);
                if ($product) {
                    // Atomic Decrement Logic
                    // Prefer quantity_with_card if unlimited_quantity_with_card is FALSE and quantity_with_card is NOT NULL
                    // (Note: if unlimited is TRUE, we do nothing)

                    if ($product->unlimited_quantity_with_card === false && ! is_null($product->quantity_with_card)) {
                        // We must conditionally decrement only if we are aiming for the 'with_card' stock.
                        // Wait, the logic above was: if (!empty(qty_card) OR unlimited_card === false).
                        // Let's replicate strict logic but atomically.
                        
                        // "If product has per-card quantities, prefer decrementing quantity_with_card when present"
                        // The original logic checked `!empty($product->quantity_with_card)`.
                        // Since we are in a transaction, we can use the instance we have, BUT to be safe against races,
                        // we should fire a query builder update.
                        
                        Product::where('id', $productId)->update([
                            'quantity_with_card' => DB::raw('GREATEST(0, quantity_with_card - 1)')
                        ]);
                    } else {
                        // Fallback: decrement main quantity if present and not unlimited
                        if (! $product->unlimited_quantity && ! is_null($product->quantity)) {
                            Product::where('id', $productId)->update([
                                'quantity' => DB::raw('GREATEST(0, quantity - 1)')
                            ]);
                        }
                    }
                }
            }

            if ($eventId) {
                $event = Event::find($eventId);
                if ($event) {
                    if ($ticketType && $event->variable_amount) {
                         // Variable amount event
                        if ($ticketType === 'with_card') {
                            if (! $event->unlimited_quantity_with_card && ! is_null($event->quantity_with_card)) {
                                Event::where('id', $eventId)->update([
                                    'quantity_with_card' => DB::raw('GREATEST(0, quantity_with_card - 1)')
                                ]);
                            }
                        } else {
                            if (! $event->unlimited_quantity_without_card && ! is_null($event->quantity_without_card)) {
                                Event::where('id', $eventId)->update([
                                    'quantity_without_card' => DB::raw('GREATEST(0, quantity_without_card - 1)')
                                ]);
                            }
                        }
                    } else {
                        // Non-variable amount: decrement main quantity
                        if (! $event->unlimited_quantity && ! is_null($event->quantity)) {
                            Event::where('id', $eventId)->update([
                                'quantity' => DB::raw('GREATEST(0, quantity - 1)')
                            ]);
                        }
                    }
                }
            }

            // If office_shift_id present, also create an OfficeShiftSale so the sale appears in the shift log
            if (! empty($data['office_shift_id'])) {
                $office = OfficeShift::find($data['office_shift_id']);
                if ($office) {
                    // Default sold_by in the snapshot to the provided sold_by_email, or to 'SumUp' for card sales. 'unknown' if no user context.
                    $defaultSoldBy = $data['sold_by_email'] ?? null;
                    if (! $defaultSoldBy) {
                        $defaultSoldBy = ($method === 'card') ? 'SumUp' : (Auth::user()->email ?? 'unknown');
                    }

                    $snapshot = array_merge([
                        'item_type' => $productId ? 'product' : ($eventId ? 'event' : 'custom'),
                        'name' => $data['name'] ?? ($productId ? optional(Product::find($productId))->name : optional(Event::find($eventId))->name),
                        'price' => $data['price'] ?? $amount,
                        'method' => $method,
                        'amount' => $amount,
                        'sold_by' => $defaultSoldBy,
                        'sold_at' => $data['sold_at'] ?? now()->toDateTimeString(),
                        'ticket_type' => $ticketType ?? null,
                        'ticket_label' => $data['ticket_label'] ?? null,
                    ], $details ?: []);

                    $oss = OfficeShiftSale::create([
                        'office_shift_id' => $office->id,
                        'product_id' => $productId,
                        'event_id' => $eventId,
                        'method' => $method,
                        'amount' => $amount,
                        'description' => $data['description'] ?? null,
                        'sold_by' => $data['sold_by'] ?? null,
                        'sold_at' => $data['sold_at'] ?? now(),
                        'snapshot' => $snapshot,
                        'breakdown' => null,
                    ]);

                    if ($method === 'cash') {
                        $office->increment('cash_total', $amount);
                    } else {
                        $office->increment('card_total', $amount);
                    }

                    // Recalculate totals
                    $office->refresh();
                    $office->total_cash = ($office->start_cash ?? 0) + ($office->cash_total ?? 0);
                    $office->total_card = ($office->start_card ?? 0) + ($office->card_total ?? 0);
                    $office->save();
                }
            }

            return $sale;
        });
    }
}
