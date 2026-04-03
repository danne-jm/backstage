<?php

namespace App\Services;

use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\SellableVariant;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(protected FinancialLedgerService $financialLedgerService)
    {
    }

    /**
     * Record a sale from the Office/POS.
     * Handles atomic stock deduction, OfficeShiftSale creation, and shift total updates.
     */
    public function recordOfficeSale(OfficeShift $shift, array $data): OfficeShiftSale
    {
        return DB::transaction(function () use ($shift, $data) {
            $productId = $data['product_id'] ?? null;
            $eventId = $data['event_id'] ?? null;

            // Normalize options into details
            $details = [];
            if (isset($data['options'])) {
                $details['options'] = $data['options'];
            }

            if (isset($data['variant_id'])) {
                $details['variant_id'] = $data['variant_id'];
            }

            // Atomic stock deduction
            $stockResult = $this->deductStock(
                $productId,
                $eventId,
                $data['ticket_type'] ?? null,
                $details
            );
            $resolvedVariant = $stockResult['resolved_variant'] ?? null;

            if (!isset($data['price'])) {
                $data['price'] = $data['amount'] ?? 0;
            }

            if (($data['method'] ?? 'cash') === 'cash' && isset($data['breakdown'])) {
                $data['amount'] = $shift->totalFromBreakdown($data['breakdown']);
            }

            // Create the OfficeShiftSale record
            $sale = $this->createOfficeShiftSale($shift, $data, null, $resolvedVariant);

            // Update shift totals
            if (($data['method'] ?? 'cash') === 'cash') {
                $shift->increment('cash_total', $data['amount']);
                if (!empty($data['breakdown'])) {
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
            $shift->total_cash = (float) (($shift->start_cash ?? 0) + ($shift->cash_total ?? 0));
            $shift->total_card = (float) (($shift->start_card ?? 0) + ($shift->card_total ?? 0));
            $shift->save();

            $this->financialLedgerService->recordOfficeSale($sale, $shift);

            return $sale;
        });
    }

    /**
     * Create an online sale and adjust sellable quantities.
     * Optionally attach to an office shift when sold from the POS via a card terminal.
     *
     * @todo Implement when online sales are introduced.
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

            // Atomic stock deduction
            $stockResult = $this->deductStock($productId, $eventId, $ticketType, $details);
            $resolvedVariant = $stockResult['resolved_variant'] ?? null;

            $sale = OnlineSale::create([
                'product_id' => $productId,
                'event_id' => $eventId,
                'method' => $method,
                'amount' => $amount,
                'ticket_type' => $ticketType,
                'details' => $details,
                'sold_at' => $data['sold_at'] ?? now(),
            ]);

            // If sold from a POS terminal, also log it as an OfficeShiftSale
            if (!empty($data['office_shift_id'])) {
                $shift = OfficeShift::find($data['office_shift_id']);
                if ($shift) {
                    $this->createOfficeShiftSale($shift, $data, $sale->id, $resolvedVariant);
                }
            }

            return $sale;
        });
    }

    /**
     * Finds stray OnlineSales with no office_shift_id and stamps them with the given shift.
     * Does NOT create OfficeShiftSale records — online sales stay in their own pipeline.
     */
    public function claimStrayOnlineSales(OfficeShift $shift): void
    {
        $amount = OnlineSale::whereNull('office_shift_id')->sum('amount');

        if ($amount > 0) {
            OnlineSale::whereNull('office_shift_id')->update(['office_shift_id' => $shift->id]);
        }
    }

    /**
     * Validate stock and atomically decrement the sold count on the sellable (and variant, if applicable).
     *
     * @return array{resolved_variant: SellableVariant|null}
     *
     * @throws ValidationException
     */
    protected function deductStock(?string $productId, ?string $eventId, ?string $ticketType, array $details): array
    {
        $resolvedVariant = null;

        if ($productId) {
            $product = Product::find($productId);

            if ($product) {
                if ($product->is_variant_based) {
                    $variantId = $details['variant_id'] ?? null;
                    $options = $details['options'] ?? null;

                    if ($variantId) {
                        $resolvedVariant = SellableVariant::find($variantId);
                    } elseif (!empty($options)) {
                        $resolvedVariant = $this->resolveVariant($product, $options);
                    }

                    if (!$resolvedVariant) {
                        throw ValidationException::withMessages(['items' => "{$product->name} requires you to select an option."]);
                    }

                    if ($resolvedVariant->quantity !== null && ($resolvedVariant->quantity - $resolvedVariant->sold_count) <= 0) {
                        throw ValidationException::withMessages(['stock' => "Selected variant for {$product->name} is sold out."]);
                    }
                } elseif (!empty($details['options'])) {
                    throw ValidationException::withMessages(['items' => "The configuration for {$product->name} has changed. Please re-select the item."]);
                }

                $updated = Product::where('id', $productId)
                    ->whereRaw('(unlimited_quantity = 1 OR quantity IS NULL OR sold_count + 1 <= quantity)')
                    ->increment('sold_count');

                if (!$updated) {
                    throw ValidationException::withMessages(['stock' => 'Product sold out.']);
                }
            }
        }

        if ($eventId) {
            $event = Event::find($eventId);

            if ($event) {
                $ticketTypeKey = $ticketType ? strtolower($ticketType) : null;

                if ($event->is_variant_based) {
                    $variantId = $details['variant_id'] ?? null;
                    $options = $details['options'] ?? null;

                    if ($variantId) {
                        $resolvedVariant = SellableVariant::find($variantId);
                    } elseif (!empty($options)) {
                        $resolvedVariant = $this->resolveVariant($event, $options);
                    }

                    if (!$resolvedVariant) {
                        throw ValidationException::withMessages(['items' => "{$event->name} requires you to select an option."]);
                    }

                    if ($resolvedVariant->quantity !== null && ($resolvedVariant->quantity - $resolvedVariant->sold_count) <= 0) {
                        throw ValidationException::withMessages(['stock' => "Selected variant for {$event->name} is sold out."]);
                    }
                } elseif (!empty($details['options'])) {
                    throw ValidationException::withMessages(['items' => "The configuration for {$event->name} has changed. Please re-select the item."]);
                }

                if ($ticketTypeKey === 'with_card') {
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

                if (!$updated) {
                    throw ValidationException::withMessages(['stock' => 'Event tickets sold out.']);
                }
            }
        }

        if ($resolvedVariant) {
            $updated = SellableVariant::where('id', $resolvedVariant->id)
                ->whereRaw('(quantity IS NULL OR sold_count + 1 <= quantity)')
                ->increment('sold_count');

            if (!$updated) {
                throw ValidationException::withMessages(['stock' => 'Variant selection sold out.']);
            }
        }

        return ['resolved_variant' => $resolvedVariant];
    }

    /**
     * Restore stock for a deleted sale.
     * Decrements the sold_count on the cellable and variant where applicable.
     */
    public function restoreStock(OfficeShiftSale $sale): void
    {
        $productId = $sale->product_id;
        $eventId = $sale->event_id;
        $ticketType = $sale->snapshot['ticket_type'] ?? null;
        $variantId = $sale->snapshot['variant_id'] ?? null;

        if ($productId) {
            Product::where('id', $productId)
                ->where('sold_count', '>', 0)
                ->decrement('sold_count');
        }

        if ($eventId) {
            $ticketTypeKey = $ticketType ? strtolower($ticketType) : null;
            if ($ticketTypeKey === 'with_card') {
                Event::where('id', $eventId)
                    ->where('sold_count_with_card', '>', 0)
                    ->decrement('sold_count_with_card');
            } else {
                Event::where('id', $eventId)
                    ->where('sold_count_without_card', '>', 0)
                    ->decrement('sold_count_without_card');
            }
        }

        if ($variantId) {
            SellableVariant::where('id', $variantId)
                ->where('sold_count', '>', 0)
                ->decrement('sold_count');
        }
    }

    /**
     * Create and persist an OfficeShiftSale record with a full snapshot.
     *
     * @param  string|null  $onlineSaleId  When set, this sale originated from the online store.
     */
    protected function createOfficeShiftSale(
        OfficeShift $shift,
        array $data,
        ?string $onlineSaleId = null,
        ?SellableVariant $resolvedVariant = null
    ): OfficeShiftSale {
        $productId = $data['product_id'] ?? null;
        $eventId = $data['event_id'] ?? null;
        $method = $data['method'] ?? 'card';
        $amount = $data['amount'] ?? 0;
        $ticketType = $data['ticket_type'] ?? null;
        $isManualEntry = $data['is_manual_entry'] ?? false;

        $details = $data['details'] ?? [];
        if (isset($data['options'])) {
            $details['options'] = $data['options'];
        }

        $itemType = $productId ? 'product' : ($eventId ? 'event' : 'custom');

        // Resolve sold_by label
        $soldByName = $data['sold_by_name'] ?? null;
        if (!$soldByName) {
            if ($onlineSaleId) {
                $soldByName = ($method === 'card') ? 'SumUp' : (Auth::user()?->name ?? 'unknown');
            } else {
                $soldByName = Auth::user()?->name ?? 'unknown';
            }
        }

        if (($itemType === 'custom' || $isManualEntry) && $soldByName && $soldByName !== 'SumUp') {
            if (!str_starts_with($soldByName, 'Custom - ')) {
                $soldByName = 'Custom - ' . $soldByName;
            }
        }

        $snapshot = array_merge([
            'item_type' => $itemType,
            'name' => $data['name'] ?? (
                $productId
                ? optional(Product::find($productId))->name
                : optional(Event::find($eventId))->name
            ),
            'price' => $data['price'] ?? $amount,
            'method' => $method,
            'amount' => $amount,
            'description' => ($data['description'] !== null && $data['description'] !== '') ? $data['description'] : null,
            'sold_by' => $soldByName,
            'sold_at' => isset($data['sold_at']) ? (string) $data['sold_at'] : now()->toDateTimeString(),
            'ticket_type' => $ticketType,
            'ticket_label' => $data['ticket_label'] ?? null,
            'is_manual_entry' => $isManualEntry,
            'variant_id' => $resolvedVariant?->id,
            'variant_options' => $resolvedVariant?->options,
            'online_sale_id' => $onlineSaleId,
        ], $details ?: []);

        return OfficeShiftSale::create([
            'office_shift_id' => $shift->id,
            'product_id' => $productId,
            'event_id' => $eventId,
            'method' => $method,
            'amount' => $amount,
            'description' => ($data['description'] !== null && $data['description'] !== '') ? $data['description'] : null,
            'sold_by' => array_key_exists('sold_by', $data) ? $data['sold_by'] : Auth::id(),
            'sold_at' => $data['sold_at'] ?? now(),
            'snapshot' => $snapshot,
            'breakdown' => $data['breakdown'] ?? null,
        ]);
    }

    /**
     * Find the variant on a sellable whose options match the given array.
     */
    protected function resolveVariant(mixed $sellable, array $options): ?SellableVariant
    {
        if (empty($options) || !is_array($options)) {
            return null;
        }

        return $sellable->variants->first(function (SellableVariant $v) use ($options): bool {
            $vOpts = $v->options;

            if (count($vOpts) !== count($options)) {
                return false;
            }

            foreach ($options as $key => $val) {
                if (!isset($vOpts[$key]) || $vOpts[$key] != $val) {
                    return false;
                }
            }

            return true;
        });
    }

    /** Public wrapper around resolveVariant for external callers (e.g. CheckoutService). */
    public function resolveVariantPublic(mixed $sellable, array $options): ?SellableVariant
    {
        return $this->resolveVariant($sellable, $options);
    }

    /** Public wrapper around createOfficeShiftSale for external callers (e.g. CheckoutService). */
    public function createOfficeShiftSalePublic(
        OfficeShift $shift,
        array $data,
        ?string $onlineSaleId = null,
        ?SellableVariant $resolvedVariant = null
    ): OfficeShiftSale {
        return $this->createOfficeShiftSale($shift, $data, $onlineSaleId, $resolvedVariant);
    }
}
