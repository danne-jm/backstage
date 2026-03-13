<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when a ticket is sold
 * Broadcasts to ticket scanner listeners
 */
class TicketSold implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $eventId;
    public Ticket $ticket;

    /**
     * Create a new event instance
     */
    public function __construct(string $eventId, Ticket $ticket)
    {
        $this->eventId = $eventId;
        $this->ticket = $ticket;
    }

    /**
     * Get the channels the event should broadcast on
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tickets.{$this->eventId}"),
        ];
    }

    /**
     * Get the data to broadcast
     */
    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->ticket_code,
            'email' => $this->ticket->email,
            'first_name' => $this->ticket->first_name,
            'last_name' => $this->ticket->last_name,
        ];
    }
}
