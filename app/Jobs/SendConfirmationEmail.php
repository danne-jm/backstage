<?php

namespace App\Jobs;

use App\Mail\OrderConfirmation;
use App\Models\OnlineTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendConfirmationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(
        public readonly string $transactionId,
    ) {
        $this->queue = 'confirmations';
    }

    public function handle(): void
    {
        $transaction = OnlineTransaction::with('sales.product', 'sales.event')
            ->find($this->transactionId);

        if (!$transaction) {
            Log::warning('SendConfirmationEmail: transaction not found', ['id' => $this->transactionId]);
            return;
        }

        if ($transaction->mail_success) {
            // Already sent by a previous attempt — skip to stay idempotent.
            return;
        }

        Mail::to($transaction->email)->sendNow(new OrderConfirmation($transaction));

        $transaction->update(['mail_success' => true]);

        Log::info('SendConfirmationEmail: sent', ['transaction_id' => $this->transactionId]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SendConfirmationEmail: all retries exhausted', [
            'transaction_id' => $this->transactionId,
            'error' => $exception->getMessage(),
        ]);

        OnlineTransaction::where('id', $this->transactionId)
            ->update(['mail_success' => false]);
    }
}
