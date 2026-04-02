<?php

namespace App\Mail;

use App\Models\OnlineTransaction;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class OrderConfirmation extends Mailable
{
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
}
