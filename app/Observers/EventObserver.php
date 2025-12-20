<?php

namespace App\Observers;

use App\Models\Event;
use App\Models\OfficeShiftSale;
use App\Models\OfficeShift;

class EventObserver
{
    public function updated(Event $event): void
    {
        // Build the fields to propagate (exclude price_with_card / price_without_card changes from affecting past sales)
        $fields = [
            'name' => $event->name,
            'description' => $event->description,
            'event_date' => $event->event_date ? $event->event_date->toDateTimeString() : null,
            'start_sell_date' => $event->start_sell_date ? $event->start_sell_date->toDateTimeString() : null,
            'end_sell_date' => $event->end_sell_date ? $event->end_sell_date->toDateTimeString() : null,
        ];

        $sales = OfficeShiftSale::where('event_id', $event->id)->get();
        foreach ($sales as $sale) {
            $snapshot = is_array($sale->snapshot) ? $sale->snapshot : [];
            // preserve any price stored on the snapshot
            $preservedPrice = $snapshot['price'] ?? null;
            // merge only non-null fields to avoid wiping existing snapshot values
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

            // Also update OfficeShift JSON sales array
            $office = OfficeShift::find($sale->office_shift_id);
            if ($office && is_array($office->sales)) {
                $changed = false;
                $arr = $office->sales;
                foreach ($arr as &$entry) {
                    if (isset($entry['id']) && $entry['id'] == $sale->id) {
                        // only overwrite with non-null source values
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
