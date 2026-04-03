<?php

namespace App\Console\Commands;

use App\Models\OfficeShift;
use App\Models\OfficeShiftSale;
use App\Models\OnlineTransaction;
use App\Services\FinancialLedgerService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class LedgerBackfill extends Command
{
    protected $signature = 'ledger:backfill
                            {--online : Backfill online completed transactions}
                            {--office : Backfill office shift sales}
                            {--from= : ISO date/time lower bound for created_at}
                            {--chunk=500 : Chunk size}
                            {--dry-run : Report candidates without writing}';

    protected $description = 'Backfill financial ledger entries from historical online transactions and office sales.';

    public function __construct(protected FinancialLedgerService $ledger)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $doOnline = (bool) $this->option('online');
        $doOffice = (bool) $this->option('office');

        if (!$doOnline && !$doOffice) {
            $doOnline = true;
            $doOffice = true;
        }

    $fromRaw = $this->option('from');
    $from = $fromRaw ? Carbon::parse($fromRaw) : null;
        $chunk = max(1, (int) $this->option('chunk'));
        $dryRun = (bool) $this->option('dry-run');

        $onlineCount = 0;
        $officeCount = 0;

        if ($doOnline) {
            $query = OnlineTransaction::query()
                ->where('payment_status', 'completed')
                ->whereHas('sales')
                ->orderBy('created_at');

            if ($from) {
                $query->where('created_at', '>=', $from);
            }

            $query->chunk($chunk, function ($transactions) use (&$onlineCount, $dryRun) {
                foreach ($transactions as $transaction) {
                    $onlineCount++;

                    if ($dryRun) {
                        continue;
                    }

                    $this->ledger->recordOnlineTransactionCompleted($transaction);
                }
            });
        }

        if ($doOffice) {
            $query = OfficeShiftSale::query()
                ->whereNotNull('office_shift_id')
                ->orderBy('created_at');

            if ($from) {
                $query->where('created_at', '>=', $from);
            }

            $query->chunk($chunk, function ($sales) use (&$officeCount, $dryRun) {
                foreach ($sales as $sale) {
                    $officeCount++;

                    if ($dryRun) {
                        continue;
                    }

                    $shift = OfficeShift::find($sale->office_shift_id);
                    if (!$shift) {
                        continue;
                    }

                    $this->ledger->recordOfficeSale($sale, $shift);
                }
            });
        }

        $mode = $dryRun ? 'DRY-RUN' : 'APPLIED';
        $this->info("[{$mode}] Online candidates: {$onlineCount}");
        $this->info("[{$mode}] Office candidates: {$officeCount}");

        return self::SUCCESS;
    }
}
