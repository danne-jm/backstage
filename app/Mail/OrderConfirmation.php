<?php

namespace App\Mail;

use App\Models\OnlineTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public OnlineTransaction $transaction;

    public function __construct(OnlineTransaction $transaction)
    {
        $this->transaction = $transaction->loadMissing('sales.product', 'sales.event');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Confirmation - ' . $this->transaction->id,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.orders.confirmation',
        );
    }

    public function attachments(): array
    {
        return [];
    }

    public function failed(\Throwable $exception): void
    {
        $this->transaction->update(['mail_success' => false]);
    }
}
