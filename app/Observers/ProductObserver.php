<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\OfficeShiftSale;
use App\Models\OfficeShift;

class ProductObserver
{
    public function updated(Product $product): void
    {
        // Build the fields we want to propagate to sales snapshots (exclude price)
        $fields = [
            'name' => $product->name,
            'description' => $product->description,
            'type' => $product->type ?? null,
        ];

        // Update all related OfficeShiftSale records
        $sales = OfficeShiftSale::where('product_id', $product->id)->get();
        foreach ($sales as $sale) {
            $snapshot = is_array($sale->snapshot) ? $sale->snapshot : [];
            // preserve existing price in snapshot
            $preservedPrice = $snapshot['price'] ?? null;
            // merge only non-null fields so we don't wipe existing snapshot values
            foreach ($fields as $k => $v) {
                if ($v !== null) {
                    $snapshot[$k] = $v;
                }
            }
            if ($preservedPrice !== null) {
                $snapshot['price'] = $preservedPrice;
            }
            $sale->snapshot = $snapshot;
            $sale->save();

            // Also update the OfficeShift JSON snapshot for the containing shift if present
            $office = OfficeShift::find($sale->office_shift_id);
            if ($office && is_array($office->sales)) {
                $changed = false;
                $arr = $office->sales;
                foreach ($arr as &$entry) {
                    if (isset($entry['id']) && $entry['id'] == $sale->id) {
                        // only apply non-null values
                        foreach ($fields as $k => $v) {
                            if ($v !== null) {
                                $entry[$k] = $v;
                            }
                        }
                        if (isset($snapshot['price'])) {
                            $entry['price'] = $snapshot['price'];
                        }
                        $changed = true;
                        break;
                    }
                }
                if ($changed) {
                    $office->sales = $arr;
                    $office->save();
                }
            }
        }
    }
}
