<?php

namespace App\Services;

use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\SellableVariant;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
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
     * Finds all stray OnlineSales with no office_shift_id and claims them for the given shift.
     * No date filtering — orphaned online sales simply claim the first shift that becomes live.
     * Does NOT create OfficeShiftSale records — online sales stay in their own pipeline.
     */
    public function claimStrayOnlineSales(OfficeShift $shift): void
    {
        OnlineSale::whereNull('office_shift_id')
            ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
            ->update(['office_shift_id' => $shift->id]);
    }

    /**
     * Verify and lock stock for the sellable (and variant, if applicable).
     *
     * Uses pessimistic locking (lockForUpdate) within the enclosing DB transaction.
     * The OfficeShiftSale record is created by the caller *after* this returns, so
     * we check existing_sold + 1 <= quantity (the new sale is not yet in the DB).
     *
     * @return array{resolved_variant: SellableVariant|null}
     *
     * @throws ValidationException
     */
    protected function deductStock(?string $productId, ?string $eventId, ?string $ticketType, array $details): array
    {
        $resolvedVariant = null;

        if ($productId) {
            $product = Product::lockForUpdate()->find($productId);

            if ($product) {
                if ($product->is_variant_based) {
                    $variantId = $details['variant_id'] ?? null;
                    $options = $details['options'] ?? null;

                    if ($variantId) {
                        $resolvedVariant = SellableVariant::lockForUpdate()->find($variantId);
                    } elseif (!empty($options)) {
                        $resolvedVariant = $this->resolveVariant($product, $options);
                        if ($resolvedVariant) {
                            $resolvedVariant = SellableVariant::lockForUpdate()->find($resolvedVariant->id);
                        }
                    }

                    if (!$resolvedVariant) {
                        throw ValidationException::withMessages(['items' => "{$product->name} requires you to select an option."]);
                    }

                    if ($resolvedVariant->quantity !== null && $resolvedVariant->computedSoldCount() + 1 > $resolvedVariant->quantity) {
                        throw ValidationException::withMessages(['stock' => "Selected variant for {$product->name} is sold out."]);
                    }
                } elseif (!empty($details['options'])) {
                    throw ValidationException::withMessages(['items' => "The configuration for {$product->name} has changed. Please re-select the item."]);
                }

                if (!$product->unlimited_quantity && $product->quantity !== null
                    && $product->computedSoldCount() + 1 > $product->quantity) {
                    throw ValidationException::withMessages(['stock' => 'Product sold out.']);
                }
            }
        }

        if ($eventId) {
            $event = Event::lockForUpdate()->find($eventId);

            if ($event) {
                $ticketTypeKey = $ticketType ? strtolower($ticketType) : null;

                if ($event->is_variant_based) {
                    $variantId = $details['variant_id'] ?? null;
                    $options = $details['options'] ?? null;

                    if ($variantId) {
                        $resolvedVariant = SellableVariant::lockForUpdate()->find($variantId);
                    } elseif (!empty($options)) {
                        $resolvedVariant = $this->resolveVariant($event, $options);
                        if ($resolvedVariant) {
                            $resolvedVariant = SellableVariant::lockForUpdate()->find($resolvedVariant->id);
                        }
                    }

                    if (!$resolvedVariant) {
                        throw ValidationException::withMessages(['items' => "{$event->name} requires you to select an option."]);
                    }

                    if ($resolvedVariant->quantity !== null && $resolvedVariant->computedSoldCount() + 1 > $resolvedVariant->quantity) {
                        throw ValidationException::withMessages(['stock' => "Selected variant for {$event->name} is sold out."]);
                    }
                } elseif (!empty($details['options'])) {
                    throw ValidationException::withMessages(['items' => "The configuration for {$event->name} has changed. Please re-select the item."]);
                }

                if ($ticketTypeKey === 'with_card') {
                    if (!$event->unlimited_quantity_with_card && $event->quantity_with_card !== null
                        && $event->computedSoldWithCard() + 1 > $event->quantity_with_card) {
                        throw ValidationException::withMessages(['stock' => 'Event tickets sold out.']);
                    }
                } elseif ($event->variable_amount) {
                    if (!$event->unlimited_quantity_without_card && $event->quantity_without_card !== null
                        && $event->computedSoldWithoutCard() + 1 > $event->quantity_without_card) {
                        throw ValidationException::withMessages(['stock' => 'Event tickets sold out.']);
                    }
                } else {
                    $qty = $event->quantity;
                    if (!$event->unlimited_quantity && $qty !== null
                        && $event->computedSoldWithoutCard() + 1 > $qty) {
                        throw ValidationException::withMessages(['stock' => 'Event tickets sold out.']);
                    }
                }
            }
        }

        // Bust the shop listing and item detail caches so stock changes are visible.
        Cache::forget('shop_index');
        if ($productId) {
            Cache::forget("shop_item_product_{$productId}");
        }
        if ($eventId) {
            Cache::forget("shop_item_event_{$eventId}");
        }

        return ['resolved_variant' => $resolvedVariant];
    }

    /**
     * Restore stock after a deleted office sale.
     *
     * With live-counted stock, deleting the OfficeShiftSale record is sufficient —
     * the count automatically decreases. This method just busts the cache.
     */
    public function restoreStock(OfficeShiftSale $sale): void
    {
        Cache::forget('shop_index');
        if ($sale->product_id) {
            Cache::forget("shop_item_product_{$sale->product_id}");
        }
        if ($sale->event_id) {
            Cache::forget("shop_item_event_{$sale->event_id}");
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

        ksort($options);
        $targetKey = serialize($options);

        return $sellable->variants->first(function (SellableVariant $v) use ($targetKey): bool {
            $vOpts = $v->options;
            ksort($vOpts);
            return serialize($vOpts) === $targetKey;
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
