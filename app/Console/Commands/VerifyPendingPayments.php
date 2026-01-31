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
    protected $signature = 'payments:verify-pending {--min-age=5 : Minimum age in minutes for stale transactions}';

    /**
     * The console command description.
     *
     * IMPORTANT: This command reconciles "stale" pending transactions by checking their status with SumUp.
     * Side effect: Stock is held for 15 minutes (default) before being released if payment fails.
     * During high-demand events, this may cause temporary "phantom sold out" situations.
     * Decrease --min-age for faster stock release, but ensure it's >5 minutes to avoid checking active payments.
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

        // Count total stale transactions first
        $totalStale = OnlineTransaction::where('payment_status', PaymentResult::STATUS_PENDING)
            ->where('created_at', '<', now()->subMinutes($minAgeMinutes))
            ->whereNotNull('external_payment_id')
            ->count();

        if ($totalStale === 0) {
            $this->info('No stale pending transactions found.');

            return self::SUCCESS;
        }

        $this->info("Found {$totalStale} stale pending transaction(s).");

        $successCount = 0;
        $failedCount = 0;
        $stillPendingCount = 0;

        // Process in chunks to avoid RAM exhaustion on Raspberry Pi (bot attack protection)
        OnlineTransaction::with('sales')
            ->where('payment_status', PaymentResult::STATUS_PENDING)
            ->where('created_at', '<', now()->subMinutes($minAgeMinutes))
            ->whereNotNull('external_payment_id')
            ->chunk(100, function ($staleTransactions) use ($gateway, &$successCount, &$failedCount, &$stillPendingCount) {
                foreach ($staleTransactions as $transaction) {
                    $this->line("Verifying transaction {$transaction->reference_id} (#{$transaction->id})...");

                    try {
                        // Call the payment gateway to verify the actual payment status
                        $result = $gateway->verifyPayment($transaction->external_payment_id, $transaction);

                        if ($result->isSuccessful()) {
                            // Recovered a valid sale that was just slow to update
                            $this->info('  ✓ Transaction confirmed as PAID.');
                            $successCount++;
                        } elseif ($result->isFailed()) {
                            // Confirmed failure
                            $this->error('  ✗ Transaction failed or expired.');
                            $failedCount++;
                            $this->releaseStock($transaction);
                        } else {
                            // SumUp still says PENDING, but our local timeout (5min) has passed.
                            // We treat this as ABANDONED/EXPIRED.
                            $this->warn('  ⚠ Transaction still pending at gateway. Expiring locally due to timeout.');

                            $transaction->update(['payment_status' => PaymentResult::STATUS_FAILED]);
                            $this->releaseStock($transaction);
                            $failedCount++; // Count as failed/expired

                            Log::info('Payment reconciliation: Force-expired stale pending transaction', [
                                'transaction_id' => $transaction->id,
                                'age_minutes' => $transaction->created_at->diffInMinutes(now()),
                            ]);
                        }
                    } catch (\Exception $e) {
                        $this->error("  ✗ Exception occurred: {$e->getMessage()}");
                        Log::error('Payment reconciliation: Exception during verification', [
                            'transaction_id' => $transaction->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });

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
            'total_checked' => $totalStale,
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
