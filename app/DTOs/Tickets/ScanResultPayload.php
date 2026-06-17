<?php

namespace App\DTOs\Tickets;

readonly class ScanResultPayload
{
    public function __construct(
        public bool $success,
        public string $message,
        public ?\App\Models\Ticket $ticket = null
    ) {}
}
