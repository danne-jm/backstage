<?php

namespace App\DTOs\Tickets;

use App\Models\Ticket;

readonly class ScanResultPayload
{
    public function __construct(
        public bool $success,
        public string $message,
        public ?Ticket $ticket = null
    ) {}
}
