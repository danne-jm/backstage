<?php

namespace App\Actions\Catalog;

use App\DTOs\Catalog\EventPayload;
use App\Models\Event;
use Illuminate\Support\Facades\DB;

class SaveEventAction
{
    public function handle(EventPayload $payload, ?Event $event = null): Event
    {
        return DB::transaction(function () use ($payload, $event) {
            $event = $event ?? new Event;

            $event->fill([
                'name' => $payload->name,
                'description' => $payload->description,
                'event_date' => $payload->eventDate,
                'start_sell_date' => $payload->startSellDate,
                'end_sell_date' => $payload->endSellDate,
                'is_online_sellable' => $payload->isOnlineSellable,
                'hide_until_sale' => $payload->hideUntilSale,

                'price_without_membership' => $payload->priceWithoutMembership,
                'price_with_membership' => $payload->priceWithMembership,
                'variable_amount' => $payload->variableAmount,

                'unlimited_quantity' => $payload->unlimitedQuantity,
                'quantity' => $payload->quantity,
                'unlimited_quantity_with_membership' => $payload->unlimitedQuantityWithMembership,
                'quantity_with_membership' => $payload->quantityWithMembership,
                'unlimited_quantity_without_membership' => $payload->unlimitedQuantityWithoutMembership,
                'quantity_without_membership' => $payload->quantityWithoutMembership,

                'is_variant_based' => $payload->isVariantBased,
                'variants_config' => $payload->variantsConfig,

                'google_spreadsheet_id' => $payload->googleSpreadsheetId,
                'google_sheet_name' => $payload->googleSheetName,
                'attendee_filter_config' => $payload->attendeeFilterConfig,

                'responsible_user_ids' => $payload->responsibleUserIds,
            ]);

            $event->save();

            $event->syncVariants();

            return $event;
        });
    }
}
