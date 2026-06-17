<?php

namespace App\Events;

use App\Models\Event;
use App\Models\Product;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SellableUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sellable;

    /**
     * Create a new event instance.
     *
     * @param  Product|Event  $model
     */
    public function __construct($model)
    {
        $this->sellable = $this->formatSellable($model);
    }

    protected function formatSellable($model)
    {
        if ($model instanceof Product) {
            return [
                'id' => $model->id,
                'type' => 'product',
                'name' => $model->name,
                'description' => $model->description,
                'price' => $model->price,
                'quantity' => $model->quantity,
                'unlimited_quantity' => (bool) ($model->unlimited_quantity ?? false),
                'variable_amount' => $model->variable_amount,
                'quantity_with_card' => $model->quantity_with_card,
                'unlimited_quantity_with_card' => (bool) ($model->unlimited_quantity_with_card ?? false),
                'quantity_without_card' => $model->quantity_without_card,
                'unlimited_quantity_without_card' => (bool) ($model->unlimited_quantity_without_card ?? false),
                'remaining' => $model->remaining,
                'remaining_with_card' => $model->remaining_with_card,
                'remaining_without_card' => $model->remaining_without_card,
                'is_online_sellable' => $model->is_online_sellable,
                'images_list' => $model->images_list,
                'variants_config' => $model->variants_config,
                'instagram_link' => $model->instagram_link,
                'variants' => $model->variants->map(fn ($v) => [
                    'id' => $v->id,
                    'options' => $v->options,
                    'quantity' => $v->quantity,
                    'sold_count' => $v->sold_count,
                ]),
            ];
        } elseif ($model instanceof Event) {
            return [
                'id' => $model->id,
                'type' => 'event',
                'name' => $model->name,
                'description' => $model->description,
                'event_date' => $model->event_date,
                'start_sell_date' => $model->start_sell_date,
                'end_sell_date' => $model->end_sell_date,
                'price_with_card' => $model->price_with_card,
                'price_without_card' => $model->price_without_card,
                'quantity' => $model->quantity,
                'unlimited_quantity' => (bool) ($model->unlimited_quantity ?? false),
                'variable_amount' => $model->variable_amount,
                'quantity_with_card' => $model->quantity_with_card,
                'unlimited_quantity_with_card' => (bool) ($model->unlimited_quantity_with_card ?? false),
                'quantity_without_card' => $model->quantity_without_card,
                'unlimited_quantity_without_card' => (bool) ($model->unlimited_quantity_without_card ?? false),
                'remaining' => $model->remaining,
                'remaining_with_card' => $model->remaining_with_card,
                'remaining_without_card' => $model->remaining_without_card,
                'responsibleUser' => $model->responsibleUser,
                'google_spreadsheet_id' => $model->google_spreadsheet_id,
                'is_online_sellable' => $model->is_online_sellable,
                'responsible_user_id' => $model->responsible_user_id,
                'images_list' => $model->images_list,
                'variants_config' => $model->variants_config,
                'instagram_link' => $model->instagram_link,
                'variants' => $model->variants->map(fn ($v) => [
                    'id' => $v->id, // ULID
                    'options' => $v->options,
                    'quantity' => $v->quantity,
                    'sold_count' => $v->sold_count,
                ]),
            ];
        }

        return $model;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('store-stats'),
        ];
    }
}
