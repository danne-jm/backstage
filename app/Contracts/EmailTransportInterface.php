<?php

namespace App\Contracts;

interface EmailTransportInterface
{
    /**
     * Send an email using the underlying transport.
     *
     * @param  string  $to  Recipient email address
     * @param  string  $subject  Email subject
     * @param  string  $htmlBody  Rendered HTML content
     * @param  array<int, mixed>  $attachments  Array of attachment paths or raw data
     * @return bool True if successfully dispatched to the provider
     */
    public function send(string $to, string $subject, string $htmlBody, array $attachments = []): bool;
}
