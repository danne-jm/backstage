<?php

namespace App\Console\Commands;

use App\Services\CheckoutService;
use App\Models\OnlineTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanupAbandonedTransactions extends Command
{
    protected $signature = 'transactions:cleanup-abandoned
                            {--hours=2 : Cancel transactions pending longer than this many hours}
                            {--dry-run : Report without making any changes}';

    protected $description = 'Cancel pending transactions older than the threshold and revert their stock and discount usages.';

    public function __construct(protected CheckoutService $checkoutService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $hours     = (int) $this->option('hours');
        $isDryRun  = (bool) $this->option('dry-run');
        $threshold = now()->subHours($hours);

        $transactions = OnlineTransaction::with(['sales', 'discountUsages'])
            ->where('payment_status', 'pending')
            ->where('created_at', '<', $threshold)
            ->get();

        if ($transactions->isEmpty()) {
            $this->info('No abandoned transactions found.');

            return self::SUCCESS;
        }

        $this->info("Found {$transactions->count()} abandoned transaction(s) older than {$hours} hour(s).");

        foreach ($transactions as $transaction) {
            if ($isDryRun) {
                $this->line("  [dry-run] Would cancel: {$transaction->reference_id} (created {$transaction->created_at})");
                continue;
            }

            try {
                DB::transaction(function () use ($transaction) {
                    $this->checkoutService->revertStockForTransaction($transaction);
                    $this->checkoutService->revertDiscountUsagesForTransaction($transaction);
                    // Use atomic condition to avoid double-cancellation in concurrent runs
                    OnlineTransaction::where('id', $transaction->id)
                        ->where('payment_status', 'pending')
                        ->update(['payment_status' => 'cancelled']);
                });

                $this->line("  Cancelled: {$transaction->reference_id}");
            } catch (\Throwable $e) {
                Log::error('Failed to cancel abandoned transaction', [
                    'transaction_id' => $transaction->id,
                    'error'          => $e->getMessage(),
                ]);
                $this->error("  Failed: {$transaction->reference_id} — {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}
