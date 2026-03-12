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

    public function __construct(
        public readonly string $sellableId,
        public readonly string $type,
        public readonly int $remaining,
        public readonly ?int $remainingWithCard = null,
        public readonly ?int $remainingWithoutCard = null,
        public readonly ?array $payload = null,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('inventory'),
        ];
    }
}
