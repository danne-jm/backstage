<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Services\Mail\SmtpEmailTransport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendOrderConfirmationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900]; // 1m, 5m, 15m

    public function __construct(public Transaction $transaction) {}

    public function handle(SmtpEmailTransport $transport): void
    {
        // 1. Validate email exists
        if (! $this->transaction->customer_email) {
            return; // Cannot send to empty email
        }

        // 2. Render HTML view
        /** @var view-string $viewName */
        $viewName = 'emails.order_confirmation';
        $htmlBody = view($viewName, ['transaction' => $this->transaction])->render();
        $subject = 'Your Order Confirmation #'.$this->transaction->id;

        // 3. Send using the SMTP Adapter
        $success = $transport->send(
            to: $this->transaction->customer_email,
            subject: $subject,
            htmlBody: $htmlBody
        );

        if (! $success) {
            $this->fail(new \Exception("Failed to send order confirmation to {$this->transaction->customer_email}"));
        }
    }
}
