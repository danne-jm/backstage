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

                        if (! $isUnlimited) {
                            if ($qtyNumber <= 0 && $qtyVal !== null) {
                                // Double check against sold_count if quantity exists
                                // Note: For products, we use the un-suffixed 'sold_count'
                                $sold = $product->sold_count ?? 0;
                                if (($qtyNumber - $sold) <= 0) {
                                    throw ValidationException::withMessages(['stock' => 'This product is sold out.']);
                                }
                            }
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

                    if (! $isUnlimited) {
                        $soldCount = 0;
                        if ($ticketTypeKey === 'with_card') {
                            $soldCount = $event->sold_count_with_card ?? 0;
                        } else {
                            $soldCount = $event->sold_count_without_card ?? 0;
                        }

                        if ($qtyVal !== null && ($qtyNumber - $soldCount) <= 0) {
                            throw ValidationException::withMessages(['stock' => 'This event is sold out.']);
                        }
                    }
                }
            }

            // Create online sale
            $sale = OnlineSale::create([
                'product_id' => $productId,
                'event_id' => $eventId,
                'method' => $method,
                'amount' => $amount,
                'ticket_type' => $ticketType,
                'details' => $details,
                'sold_at' => $data['sold_at'] ?? now(),
            ]);

            // Increment sold counts instead of decrementing quantity
            if ($productId) {
                // Products -> increment 'sold_count'
                // We do NOT check logic here because we just updated stock; this is the 'Act' part.
                // However, since we are inside a transaction, we accept the small race risk here for POS
                // or we could use the same safe update logic as OnlinePaymentController?
                // For POS, we'll keep it simple: just increment.
                Product::where('id', $productId)->increment('sold_count');
            }

            if ($eventId) {
                // Events -> increment appropriate sold_count column
                $fieldToIncrement = 'sold_count_without_card';
                if ($ticketType && $ticketType === 'with_card') {
                    $fieldToIncrement = 'sold_count_with_card';
                }
                
                Event::where('id', $eventId)->increment($fieldToIncrement);
            }

            // If office_shift_id present, also create an OfficeShiftSale so the sale appears in the shift log
            if (! empty($data['office_shift_id'])) {
                $office = OfficeShift::find($data['office_shift_id']);
                if ($office) {
                    // Determine item type - treat manual entries as custom
                    $isManualEntry = $data['is_manual_entry'] ?? false;
                    $itemType = $productId ? 'product' : ($eventId ? 'event' : 'custom');

                    // Default sold_by in the snapshot to the provided sold_by_name, or to 'SumUp' for card sales. 'unknown' if no user context.
                    $defaultSoldBy = $data['sold_by_name'] ?? null;
                    if (! $defaultSoldBy) {
                        $defaultSoldBy = ($method === 'card') ? 'SumUp' : (Auth::user()->name ?? 'unknown');
                    }

                    // For custom sales OR manual entries, prefix with "Custom - "
                    if (($itemType === 'custom' || $isManualEntry) && $defaultSoldBy && $defaultSoldBy !== 'SumUp') {
                        $defaultSoldBy = 'Custom - '.$defaultSoldBy;
                    }

                    $snapshot = array_merge([
                        'item_type' => $itemType,
                        'name' => $data['name'] ?? ($productId ? optional(Product::find($productId))->name : optional(Event::find($eventId))->name),
                        'price' => $data['price'] ?? $amount,
                        'method' => $method,
                        'amount' => $amount,
                        'description' => $data['description'] ?? '',
                        'sold_by' => $defaultSoldBy,
                        'sold_at' => $data['sold_at'] ?? now()->toDateTimeString(),
                        'ticket_type' => $ticketType ?? null,
                        'ticket_label' => $data['ticket_label'] ?? null,
                        'is_manual_entry' => $isManualEntry,
                    ], $details ?: []);

                    $oss = OfficeShiftSale::create([
                        'office_shift_id' => $office->id,
                        'product_id' => $productId,
                        'event_id' => $eventId,
                        'method' => $method,
                        'amount' => $amount,
                        'description' => $data['description'] ?? '',
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
