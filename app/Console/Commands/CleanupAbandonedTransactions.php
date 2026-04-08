<?php

namespace App\Console\Commands;

use App\Services\CheckoutService;
use App\Services\FinancialLedgerService;
use App\Models\OnlineTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanupAbandonedTransactions extends Command
{
    protected $signature = 'transactions:cleanup-abandoned
                            {--minutes=30 : Fail transactions pending longer than this many minutes}
                            {--dry-run : Report without making any changes}';

    protected $description = 'Fail pending transactions older than the threshold and revert their stock and discount usages.';

    public function __construct(
        protected CheckoutService $checkoutService,
        protected FinancialLedgerService $financialLedgerService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $minutes   = (int) $this->option('minutes');
        $isDryRun  = (bool) $this->option('dry-run');
        $threshold = now()->subMinutes($minutes);

        $transactions = OnlineTransaction::with(['sales', 'discountUsages'])
            ->where('payment_status', 'pending')
            ->where('created_at', '<', $threshold)
            ->get();

        if ($transactions->isEmpty()) {
            $this->info('No abandoned transactions found.');

            return self::SUCCESS;
        }

        $this->info("Found {$transactions->count()} abandoned transaction(s) older than {$minutes} minute(s).");

        foreach ($transactions as $transaction) {
            if ($isDryRun) {
                $this->line("  [dry-run] Would fail: {$transaction->reference_id} (created {$transaction->created_at})");
                continue;
            }

            try {
                DB::transaction(function () use ($transaction) {
                    $this->checkoutService->revertStockForTransaction($transaction);
                    $this->checkoutService->revertDiscountUsagesForTransaction($transaction);
                    // Record compensating ledger entries (no-op when no completion entry exists)
                    $this->financialLedgerService->recordOnlineTransactionReversal($transaction, 'abandoned');
                    // Use atomic WHERE condition to prevent double-cancellation on concurrent runs
                    OnlineTransaction::where('id', $transaction->id)
                        ->where('payment_status', 'pending')
                        ->update(['payment_status' => 'failed']);
                });

                $this->line("  Failed and reverted: {$transaction->reference_id}");
            } catch (\Throwable $e) {
                Log::error('Failed to process abandoned transaction cleanup', [
                    'transaction_id' => $transaction->id,
                    'error'          => $e->getMessage(),
                ]);
                $this->error("  Failed: {$transaction->reference_id} — {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}
