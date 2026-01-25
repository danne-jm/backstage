<?php

namespace App\Console\Commands;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\Event;
use App\Models\OnlineTransaction;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class VerifyPendingPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:verify-pending {--min-age=15 : Minimum age in minutes for stale transactions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check status of stale pending transactions and reconcile with payment gateway';

    /**
     * Execute the console command.
     */
    public function handle(PaymentGatewayInterface $gateway): int
    {
        $minAgeMinutes = (int) $this->option('min-age');

        $this->info("Checking for pending transactions older than {$minAgeMinutes} minutes...");

        // Find transactions pending for > min-age minutes with an external payment ID
        $staleTransactions = OnlineTransaction::with('sales')
            ->where('payment_status', PaymentResult::STATUS_PENDING)
            ->where('created_at', '<', now()->subMinutes($minAgeMinutes))
            ->whereNotNull('external_payment_id')
            ->get();

        if ($staleTransactions->isEmpty()) {
            $this->info('No stale pending transactions found.');

            return self::SUCCESS;
        }

        $this->info("Found {$staleTransactions->count()} stale pending transaction(s).");

        $successCount = 0;
        $failedCount = 0;
        $stillPendingCount = 0;

        foreach ($staleTransactions as $transaction) {
            $this->line("Verifying transaction {$transaction->reference_id} (#{$transaction->id})...");

            try {
                // Call the payment gateway to verify the actual payment status
                $result = $gateway->verifyPayment($transaction->external_payment_id, $transaction);

                if ($result->isSuccessful()) {
                    $this->info('  ✓ Transaction confirmed as PAID.');
                    $successCount++;

                    // Note: The gateway's verifyPayment method automatically updates the DB status to COMPLETED
                    // You may want to trigger confirmation emails here if needed
                    // $this->sendConfirmationEmail($transaction);
                } elseif ($result->isFailed()) {
                    $this->error('  ✗ Transaction failed or expired.');
                    $failedCount++;

                    // Release stock that was reserved by this failed transaction
                    $this->releaseStock($transaction);

                    Log::warning('Payment reconciliation: Transaction marked as failed', [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference_id,
                        'external_payment_id' => $transaction->external_payment_id,
                        'reason' => $result->message,
                    ]);
                } else {
                    $this->warn('  ⚠ Transaction still pending.');
                    $stillPendingCount++;
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Exception occurred: {$e->getMessage()}");

                Log::error('Payment reconciliation: Exception during verification', [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $this->newLine();
        $this->info('Reconciliation complete:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Confirmed as Paid', $successCount],
                ['Failed/Expired', $failedCount],
                ['Still Pending', $stillPendingCount],
            ]
        );

        Log::info('Payment reconciliation completed', [
            'total_checked' => $staleTransactions->count(),
            'confirmed' => $successCount,
            'failed' => $failedCount,
            'still_pending' => $stillPendingCount,
        ]);

        return self::SUCCESS;
    }

    /**
     * Release stock for a failed transaction.
     */
    protected function releaseStock(OnlineTransaction $transaction): void
    {
        foreach ($transaction->sales as $sale) {
            if ($sale->event_id) {
                if ($sale->ticket_type === 'with_card') {
                    Event::where('id', $sale->event_id)->decrement('sold_count_with_card');
                } else {
                    Event::where('id', $sale->event_id)->decrement('sold_count_without_card');
                }
            }

            if ($sale->product_id) {
                Product::where('id', $sale->product_id)->decrement('sold_count');
            }
        }

        Log::info('Stock released for failed transaction', [
            'transaction_id' => $transaction->id,
            'sales_count' => $transaction->sales->count(),
        ]);
    }
}
