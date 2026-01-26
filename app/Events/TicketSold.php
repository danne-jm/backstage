<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketSold implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $eventId;

    public $ticket;

    /**
     * Create a new event instance.
     */
    public function __construct($eventId, $ticket)
    {
        $this->eventId = $eventId;
        $this->ticket = $ticket;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tickets.{$this->eventId}"),
        ];
    }
}
