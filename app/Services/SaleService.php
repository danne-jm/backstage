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
            $resolvedVariant = null;

            $details = $data['details'] ?? [];

            // --- Sold-out / stock checks and Atomic Updates ---
            $stockResult = $this->deductStock($productId, $eventId, $ticketType, $details);
            $resolvedVariant = $stockResult['resolved_variant'] ?? null;

            // Create online sale
            $sale = OnlineSale::create([
                'product_id' => $productId,
                'event_id' => $eventId,
                'method' => $method,
                'amount' => $amount,
                'ticket_type' => $ticketType,
                'details' => $details,
                'sold_at' => $data['sold_at'] ?? now(),
                'sold_by' => $data['sold_by'] ?? null,
            ]);

            // If office_shift_id present, also create an OfficeShiftSale so the sale appears in the shift log
            if (! empty($data['office_shift_id'])) {
                $office = OfficeShift::find($data['office_shift_id']);
                if ($office) {
                    $this->createOfficeShiftSale($office, $data, $sale->id, $resolvedVariant);
                }
            }

            return $sale;
        });
    }

    /**
     * Record a sale from the Office/POS.
     * Guaranteed atomic stock updates.
     */
    public function recordOfficeSale(OfficeShift $shift, array $data): OfficeShiftSale
    {
        return DB::transaction(function () use ($shift, $data) {
            $productId = $data['product_id'] ?? null;
            $eventId = $data['event_id'] ?? null;
            
            // Normalize inputs
            $details = [];
            if (isset($data['options'])) {
                $details['options'] = $data['options'];
            }
            
            // Atomic Stock Deduction
            $stockResult = $this->deductStock(
                $productId, 
                $eventId, 
                $data['ticket_type'] ?? null, 
                $details
            );
            $resolvedVariant = $stockResult['resolved_variant'] ?? null;

            // Create the OfficeShiftSale
            $sale = $this->createOfficeShiftSale($shift, $data, null, $resolvedVariant);

            // Update Shift Totals
            if (($data['method'] ?? 'cash') === 'cash') {
                $shift->increment('cash_total', $data['amount']);
                if (! empty($data['breakdown'])) {
                    $shift->cash_breakdown = OfficeShift::mergeBreakdowns(
                        $shift->cash_breakdown, 
                        $data['breakdown']
                    );
                    $shift->save();
                }
            } else {
                $shift->increment('card_total', $data['amount']);
            }
            
            // Recalculate helper totals
            $shift->refresh();
            $shift->total_cash = ($shift->start_cash ?? 0) + ($shift->cash_total ?? 0);
            $shift->total_card = ($shift->start_card ?? 0) + ($shift->card_total ?? 0);
            $shift->save();

            return $sale;
        });
    }

    /**
     * Shared logic to validate and atomically decrement stock.
     */
    protected function deductStock($productId, $eventId, $ticketType, $details)
    {
        $resolvedVariant = null;

        if ($productId) {
            $product = Product::find($productId);
            if ($product) {
                // Variant Check
                if ($product->is_variant_based) {
                    $options = $details['options'] ?? null;
                    if (empty($options)) {
                        throw ValidationException::withMessages(['items' => "{$product->name} requires you to select an option."]);
                    }
                    $resolvedVariant = $this->resolveVariant($product, $options);
                    if (! $resolvedVariant) {
                        throw ValidationException::withMessages(['stock' => "Variant not available for {$product->name}."]);
                    }
                    if ($resolvedVariant->quantity !== null && ($resolvedVariant->quantity - $resolvedVariant->sold_count) <= 0) {
                        throw ValidationException::withMessages(['stock' => "Selected variant for {$product->name} is sold out."]);
                    }
                } elseif (! empty($details['options'])) {
                    throw ValidationException::withMessages(['items' => "The configuration for {$product->name} has changed. Please re-select the item."]);
                }
                
                // Atomic Increment
                $updated = Product::where('id', $productId)
                    ->whereRaw('(unlimited_quantity = 1 OR quantity IS NULL OR sold_count + 1 <= quantity)')
                    ->increment('sold_count');
                
                if (! $updated) {
                    throw ValidationException::withMessages(['stock' => 'Product sold out.']);
                }
            }
        }

        if ($eventId) {
            $event = Event::find($eventId);
            if ($event) {
                $ticketTypeKey = $ticketType ? strtolower($ticketType) : null;
                
                 // Variant Check for Events (if applicable)
                if ($event->is_variant_based) {
                     $options = $details['options'] ?? null;
                     if (empty($options)) {
                         throw ValidationException::withMessages(['items' => "{$event->name} requires you to select an option."]);
                     }
                     $resolvedVariant = $this->resolveVariant($event, $options);
                     if (! $resolvedVariant) {
                         throw ValidationException::withMessages(['stock' => "Variant not available for {$event->name}."]);
                     }
                     if ($resolvedVariant->quantity !== null && ($resolvedVariant->quantity - $resolvedVariant->sold_count) <= 0) {
                         throw ValidationException::withMessages(['stock' => "Selected variant for {$event->name} is sold out."]);
                     }
                } elseif (! empty($details['options'])) {
                    throw ValidationException::withMessages(['items' => "The configuration for {$event->name} has changed. Please re-select the item."]);
                }

                // Atomic Increment
                if ($ticketTypeKey && $ticketTypeKey === 'with_card') {
                    $updated = Event::where('id', $eventId)
                        ->whereRaw('(unlimited_quantity_with_card = 1 OR quantity_with_card IS NULL OR sold_count_with_card + 1 <= quantity_with_card)')
                        ->increment('sold_count_with_card');
                } else {
                    $limitCol = $event->variable_amount ? 'quantity_without_card' : 'quantity';
                    $unlimitedCol = $event->variable_amount ? 'unlimited_quantity_without_card' : 'unlimited_quantity';
                    
                    $updated = Event::where('id', $eventId)
                        ->whereRaw("({$unlimitedCol} = 1 OR {$limitCol} IS NULL OR sold_count_without_card + 1 <= {$limitCol})")
                        ->increment('sold_count_without_card');
                }

                if (! $updated) {
                    throw ValidationException::withMessages(['stock' => 'Event tickets sold out.']);
                }
            }
        }

        // Increment Variant Sold Count ATOMICALLY
        if ($resolvedVariant) {
            $updated = $resolvedVariant->where('id', $resolvedVariant->id)
                ->whereRaw('(quantity IS NULL OR sold_count + 1 <= quantity)')
                ->increment('sold_count');

            if (! $updated) {
                throw ValidationException::withMessages(['stock' => 'Variant selection sold out.']);
            }
        }

        return ['resolved_variant' => $resolvedVariant];
    }

    /**
     * Create OfficeShiftSale record.
     */
    protected function createOfficeShiftSale($office, $data, $onlineSaleId = null, $resolvedVariant = null)
    {
        $productId = $data['product_id'] ?? null;
        $eventId = $data['event_id'] ?? null;
        $method = $data['method'] ?? 'card';
        $amount = $data['amount'] ?? 0;
        $ticketType = $data['ticket_type'] ?? null;
        $isManualEntry = $data['is_manual_entry'] ?? false;
        $details = $data['details'] ?? [];
        if (isset($data['options'])) {
            $details['options'] = $data['options']; // Normalize
        }

        // Determine item type
        $itemType = $productId ? 'product' : ($eventId ? 'event' : 'custom');

        // Default sold_by
        $defaultSoldBy = $data['sold_by_name'] ?? null;
        if (! $defaultSoldBy) {
            if ($onlineSaleId) {
                // Online/Store Sale (usually SumUp)
                $defaultSoldBy = ($method === 'card') ? 'SumUp' : (Auth::user()->name ?? 'unknown');
            } else {
                // Office/POS Sale (Staff)
                $defaultSoldBy = Auth::user()->name ?? 'unknown';
            }
        }

        if (($itemType === 'custom' || $isManualEntry) && $defaultSoldBy && $defaultSoldBy !== 'SumUp') {
             // For consistency with old controller logic
             if (strpos($defaultSoldBy, 'Custom - ') !== 0) {
                 $defaultSoldBy = 'Custom - '.$defaultSoldBy;
             }
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
            'variant_id' => $resolvedVariant ? $resolvedVariant->id : null,
            'variant_options' => $resolvedVariant ? $resolvedVariant->options : null,
            'online_sale_id' => $onlineSaleId,
        ], $details ?: []);

        return OfficeShiftSale::create([
            'office_shift_id' => $office->id,
            'product_id' => $productId,
            'event_id' => $eventId,
            'method' => $method,
            'amount' => $amount,
            'description' => $data['description'] ?? '',
            'sold_by' => $data['sold_by'] ?? Auth::id(),
            'sold_at' => $data['sold_at'] ?? now(),
            'snapshot' => $snapshot,
            'breakdown' => $data['breakdown'] ?? null,
        ]);
    }

    protected function resolveVariant($entity, $options)
    {
        if (! $options || ! is_array($options)) {
            return null;
        }

        return $entity->variants->first(function ($v) use ($options) {
            $vOpts = $v->options;
            // Compare arrays (assuming normalized keys/values or just loose comparison)
            // Stricter comparison:
            if (count($vOpts) != count($options)) {
                return false;
            }
            foreach ($options as $key => $val) {
                if (! isset($vOpts[$key]) || $vOpts[$key] != $val) {
                    return false;
                }
            }

            return true;
        });
    }
}
