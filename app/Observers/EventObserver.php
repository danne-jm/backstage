<?php

namespace App\Observers;

use App\Models\Event;
use App\Models\EventAttendee;
use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EventObserver
{
    public function created(Event $event): void
    {
        // Create a table in the attendees database for this event
        $tableName = EventAttendee::generateTableName($event);

        Schema::connection('attendees')->create($tableName, function ($table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('nationality')->nullable();
            $table->boolean('esn_card')->default(false);
            $table->string('email');
            $table->timestamps();
        });

        // Populate with dummy data
        $dummyData = [
            ['first_name' => 'Daniel', 'last_name' => 'Meyer', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
            ['first_name' => 'Daniel', 'last_name' => 'Mevo', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
            ['first_name' => 'Daniel', 'last_name' => 'Meyer', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
            ['first_name' => 'Daniel', 'last_name' => 'Ahmad', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
            ['first_name' => 'Daniel', 'last_name' => 'Meyer', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
        ];

        foreach ($dummyData as $data) {
            DB::connection('attendees')->table($tableName)->insert(array_merge($data, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function deleted(Event $event): void
    {
        // Drop the attendees table for this event
        $tableName = EventAttendee::generateTableName($event);

        if (Schema::connection('attendees')->hasTable($tableName)) {
            Schema::connection('attendees')->drop($tableName);
        }
    }

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
