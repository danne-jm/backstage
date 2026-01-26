<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sellableId;

    public $type;

    public $remaining;

    public $remainingWithCard;

    public $remainingWithoutCard;

    /**
     * Create a new event instance.
     */
    public function __construct($sellableId, $type, $remaining, $remainingWithCard = null, $remainingWithoutCard = null)
    {
        $this->sellableId = $sellableId;
        $this->type = $type;
        $this->remaining = $remaining;
        $this->remainingWithCard = $remainingWithCard;
        $this->remainingWithoutCard = $remainingWithoutCard;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('inventory'),
        ];
    }
}
